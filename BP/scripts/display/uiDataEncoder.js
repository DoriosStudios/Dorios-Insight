/**
 * @module uiDataEncoder
 * @description Positional data encoder for UI JSON binding consumption.
 *
 * Converts JavaScript objects into fixed-length positional strings that
 * Bedrock UI JSON can parse using:
 *   - `'%.Ns' * string` → substring extraction
 *   - Arithmetic division → field extraction from numeric blocks
 *   - String subtraction → section separation
 *
 * Encoding format per section:
 *   <delimiter><field1_padded><field2_padded>...<fieldN_padded>
 *
 * Each section begins with a 1-char delimiter (a, b, c, d, ...) so UI JSON
 * can jump to the correct segment via string subtraction.
 *
 * Fields within a section are 2-digit zero-padded integers (00–99).
 * After extracting the 8-digit numeric block (4 fields × 2 digits = 8 digits),
 * UI JSON divides by 1000000, 10000, 100, 1 with subtraction to isolate fields.
 *
 * @example
 * // Define a schema:
 * const schema = defineSchema("a", [
 *     { name: "health",     digits: 2 },
 *     { name: "hunger",     digits: 2 },
 *     { name: "armor",      digits: 2 },
 *     { name: "saturation", digits: 2 }
 * ]);
 *
 * // Encode:
 * const encoded = encodeSection(schema, { health: 20, hunger: 18, armor: 12, saturation: 5 });
 * // → "a20181205"
 *
 * @author Kauziin (Dorios Studios), Kamii
 * @version 1.0.0
 */

// ---------------------------------------------------------------------------
// Schema Definition
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} FieldDefinition
 * @property {string} name - Field name matching the data object key.
 * @property {number} digits - Number of digits (default: 2). Values are clamped to [0, 10^digits - 1].
 * @property {number} [defaultValue=0] - Default value if field is missing from data.
 */

/**
 * @typedef {Object} SectionSchema
 * @property {string} delimiter - Single-char section delimiter (a, b, c, ...).
 * @property {FieldDefinition[]} fields - Ordered field definitions.
 * @property {number} totalDigits - Precomputed total digit count for this section.
 */

/**
 * Define a section schema.
 *
 * @param {string} delimiter - Single character delimiter for this section.
 * @param {Array<{name: string, digits?: number, defaultValue?: number}>} fields
 * @returns {SectionSchema}
 */
export function defineSchema(delimiter, fields) {
    let totalDigits = 0;
    const normalizedFields = [];

    for (const field of fields) {
        const digits = Math.max(1, Math.min(8, Number(field.digits) || 2));
        normalizedFields.push({
            name: field.name,
            digits,
            defaultValue: Number(field.defaultValue) || 0,
            maxValue: Math.pow(10, digits) - 1
        });
        totalDigits += digits;
    }

    return Object.freeze({
        delimiter: String(delimiter).charAt(0),
        fields: Object.freeze(normalizedFields),
        totalDigits
    });
}

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

/**
 * Encode a data object into a positional string for a given section schema.
 *
 * @param {SectionSchema} schema - Section schema.
 * @param {Object<string, number>} data - Data object with numeric values.
 * @returns {string} Encoded string: delimiter + zero-padded fields.
 */
export function encodeSection(schema, data) {
    let result = schema.delimiter;

    for (const field of schema.fields) {
        const rawValue = data?.[field.name];
        const value = Number.isFinite(rawValue) ? rawValue : field.defaultValue;
        const clamped = Math.max(0, Math.min(field.maxValue, Math.round(value)));
        result += String(clamped).padStart(field.digits, "0");
    }

    return result;
}

/**
 * Encode multiple sections into a single concatenated string, appending
 * the channel suffix at the end.
 *
 * Final format: <section1><section2>...<sectionN><channelSuffix>
 *
 * @param {SectionSchema[]} schemas - Ordered array of section schemas.
 * @param {Object<string, number>} data - Flat data object with all field values.
 * @param {string} channelSuffix - Channel name appended at the end for routing.
 * @returns {string} Full encoded payload.
 */
export function encodePayload(schemas, data, channelSuffix) {
    let result = "";

    for (const schema of schemas) {
        result += encodeSection(schema, data);
    }

    result += channelSuffix;
    return result;
}

// ---------------------------------------------------------------------------
// UI JSON Binding Expression Generators
// ---------------------------------------------------------------------------

/**
 * Generate the UI JSON binding expressions needed to parse a section.
 *
 * This is a DOCUMENTATION/DEVELOPMENT helper — the actual expressions are
 * placed statically in the UI JSON files. But this function documents
 * exactly what expressions correspond to each field, based on the schema.
 *
 * @param {SectionSchema} schema - Section schema.
 * @param {number} sectionStartOffset - Character offset from start of stored_text
 *                                       where this section begins (including delimiter).
 * @returns {Array<{fieldName: string, expression: string, description: string}>}
 */
export function generateBindingExpressions(schema, sectionStartOffset) {
    const expressions = [];
    const sectionDataLength = schema.totalDigits; // excludes delimiter

    // Step 1: Extract the section's numeric data block.
    // UI JSON: (('%.Xs' * (#stored_text - ('%.Ys' * #stored_text))) - 'delimiter')
    // where Y = sectionStartOffset, X = Y + 1 + totalDigits
    const substringEnd = sectionStartOffset + 1 + sectionDataLength;
    const dataExtract = `(('%.${substringEnd}s' * (#stored_text - ('%.${sectionStartOffset}s' * #stored_text))) - '${schema.delimiter}')`;

    expressions.push({
        fieldName: "#data",
        expression: dataExtract,
        description: `Extract ${sectionDataLength}-digit numeric block for section '${schema.delimiter}'`
    });

    // Step 2: Extract individual fields via division + subtraction.
    let digitOffset = 0;
    const fieldNames = [];

    for (let i = 0; i < schema.fields.length; i++) {
        const field = schema.fields[i];
        const remainingDigits = sectionDataLength - digitOffset - field.digits;
        const divisor = Math.pow(10, remainingDigits);

        // First field: simple division.
        // Subsequent fields: divide, then subtract already-extracted fields.
        let expression;
        if (i === 0) {
            expression = `(#data/${divisor})`;
        } else {
            const subtractions = fieldNames.map((prevName, prevIdx) => {
                const prevField = schema.fields[prevIdx];
                const prevRemainingDigits = sectionDataLength - schema.fields.slice(0, prevIdx).reduce((s, f) => s + f.digits, 0) - prevField.digits;
                const prevMultiplier = Math.pow(10, prevRemainingDigits - remainingDigits);
                return `(${prevName} * ${prevMultiplier})`;
            }).join(" - ");
            expression = `(#data/${divisor}) - ${subtractions}`;
        }

        const targetName = `#${field.name}`;
        fieldNames.push(targetName);

        expressions.push({
            fieldName: targetName,
            expression,
            description: `${field.name}: ${field.digits} digits at offset ${digitOffset}`
        });

        digitOffset += field.digits;
    }

    return expressions;
}

/**
 * Compute the total encoded length of a payload (excluding the channel suffix).
 *
 * @param {SectionSchema[]} schemas
 * @returns {number} Total character length of all sections.
 */
export function computePayloadLength(schemas) {
    let total = 0;
    for (const schema of schemas) {
        total += 1 + schema.totalDigits; // delimiter + digits
    }
    return total;
}
