const fs = require("node:fs");
const path = require("node:path");

const OUTPUT_PATH = path.resolve(__dirname, "../../RP/ui/insight_waila_visuals.json");
const UPDATE_STRING = "ds:insight:waila_visuals:";
const HEADER_LENGTH = 8;
const FEED_SLOT_LENGTH = 65;
const INVENTORY_SLOT_LENGTH = 78;
const FEED_SLOT_COUNT = 28;
const INVENTORY_SLOT_COUNT = 14;
const AUX_OFFSET = 1_000_000_000;

function prefix(end, property = "#visual_payload") {
  return `(%.${end}s * ${property})`;
}

function slice(start, end, property = "#visual_payload") {
  if (start === 0) return `(${prefix(end, property)})`;
  return `((${prefix(end, property)} - ${prefix(start, property)}))`;
}

function numericSlice(start, end) {
  return `(${slice(start, end)} * 1)`;
}

function slotDefinition(kind, index, start, includeAmount) {
  const mode = numericSlice(start, start + 1);
  const feedSlot = kind === "feed";
  const textureStart = feedSlot ? start + 1 : start + 11;
  const textureEnd = feedSlot ? start + 65 : start + 75;
  const texture = `(${slice(textureStart, textureEnd)} - '~')`;
  const controls = [];

  if (!feedSlot) {
    const aux = `(${numericSlice(start + 1, start + 11)} - ${AUX_OFFSET})`;
    controls.push({
      aux_item: {
        type: "custom",
        renderer: "inventory_item_renderer",
        size: [14, 14],
        anchor_from: "center",
        anchor_to: "center",
        property_bag: { "#item_id_aux": 0 },
        bindings: [
          {
            binding_type: "view",
            source_control_name: "visual_data",
            source_property_name: aux,
            target_property_name: "#item_id_aux",
            binding_condition: "always",
          },
          {
            binding_type: "view",
            source_control_name: "visual_data",
            source_property_name: `(${mode} = 1)`,
            target_property_name: "#visible",
            binding_condition: "always",
          },
        ],
      },
    });
  }

  controls.push({
      texture_item: {
        type: "image",
        texture: "textures/items/apple",
        size: [14, 14],
        anchor_from: "center",
        anchor_to: "center",
        keep_ratio: true,
        bindings: [
          {
            binding_type: "view",
            source_control_name: "visual_data",
            source_property_name: texture,
            target_property_name: "#texture",
            binding_condition: "always",
          },
          {
            binding_type: "view",
            source_control_name: "visual_data",
            source_property_name: `(${mode} = 2)`,
            target_property_name: "#visible",
            binding_condition: "always",
          },
        ],
      },
  });

  if (includeAmount) {
    const amount = numericSlice(start + 75, start + 78);
    controls.push({
      amount: {
        type: "label",
        text: "#amount",
        localize: false,
        shadow: true,
        font_scale_factor: 0.65,
        text_alignment: "right",
        anchor_from: "bottom_right",
        anchor_to: "bottom_right",
        offset: [-1, 1],
        size: [14, 8],
        layer: 10,
        bindings: [
          {
            binding_type: "view",
            source_control_name: "visual_data",
            source_property_name: amount,
            target_property_name: "#amount",
            binding_condition: "always",
          },
          {
            binding_type: "view",
            source_control_name: "visual_data",
            source_property_name: `(${amount} > 1)`,
            target_property_name: "#visible",
            binding_condition: "always",
          },
        ],
      },
    });
  }

  return {
    type: "panel",
    size: [15, 15],
    anchor_from: "top_left",
    anchor_to: "top_left",
    offset: [0, 0],
    controls,
    bindings: [
      {
        binding_type: "view",
        source_control_name: "visual_data",
        source_property_name: `(${mode} > 0)`,
        target_property_name: "#visible",
        binding_condition: "always",
      },
    ],
  };
}

function grid(kind, count, countProperty, columns) {
  const rowCount = Math.ceil(count / columns);
  return {
    type: "stack_panel",
    orientation: "vertical",
    size: ["100%c", "100%c"],
    controls: Array.from({ length: rowCount }, (_, row) => ({
      [`${kind}_row_${row}`]: {
        type: "stack_panel",
        orientation: "horizontal",
        size: ["100%c", 15],
        controls: Array.from(
          { length: Math.min(columns, count - row * columns) },
          (_, column) => {
            const index = row * columns + column;
            return {
              [`${kind}_slot_${index}@insight_waila_visuals.${kind}_slot_${index}`]: {},
            };
          },
        ),
        bindings: [
          {
            binding_type: "view",
            source_control_name: "visual_data",
            source_property_name: `(${countProperty} > ${row * columns})`,
            target_property_name: "#visible",
            binding_condition: "always",
          },
        ],
      },
    })),
  };
}

function section(title, countProperty, gridControl) {
  return {
    type: "stack_panel",
    orientation: "vertical",
    size: ["100%c", "100%c"],
    controls: [
      {
        heading: {
          type: "label",
          text: title,
          localize: false,
          shadow: true,
          font_scale_factor: 0.75,
          color: [0.78, 0.78, 0.78],
          size: ["default", 10],
        },
      },
      gridControl,
    ],
    bindings: [
      {
        binding_type: "view",
        source_control_name: "visual_data",
        source_property_name: `(${countProperty} > 0)`,
        target_property_name: "#visible",
        binding_condition: "always",
      },
    ],
  };
}

const ui = {
  namespace: "insight_waila_visuals",
  visual_sections: {
    type: "stack_panel",
    orientation: "vertical",
    size: ["100%c", "100%c"],
    controls: [
      {
        visual_data: {
          "$update_string": UPDATE_STRING,
          type: "panel",
          size: [0, 0],
          property_bag: {
            "#stored_visual_text": "",
            "#visual_payload": "",
            "#feed_count": 0,
            "#inventory_count": 0,
            "#feed_overflow": 0,
            "#inventory_overflow": 0,
          },
          bindings: [
            { binding_name: "#hud_title_text_string" },
            {
              binding_name: "#hud_title_text_string",
              binding_name_override: "#stored_visual_text",
              binding_condition: "visibility_changed",
            },
            {
              binding_type: "view",
              source_property_name: "(#stored_visual_text - $update_string)",
              target_property_name: "#visual_payload",
              binding_condition: "always",
            },
            ...[
              ["#feed_count", 0, 2],
              ["#inventory_count", 2, 4],
              ["#feed_overflow", 4, 6],
              ["#inventory_overflow", 6, 8],
            ].map(([target, start, end]) => ({
              binding_type: "view",
              source_property_name: numericSlice(start, end),
              target_property_name: target,
              binding_condition: "always",
            })),
            {
              binding_type: "view",
              source_property_name: "(not (#hud_title_text_string = #stored_visual_text) and not ((#hud_title_text_string - $update_string) = #hud_title_text_string))",
              target_property_name: "#visible",
            },
          ],
        },
      },
      {
        feed_section: section(
          "Tame / Feed",
          "#feed_count",
          { feed_grid: grid("feed", FEED_SLOT_COUNT, "#feed_count", 14) },
        ),
      },
      {
        inventory_section: section(
          "Contents",
          "#inventory_count",
          {
            inventory_grid: grid(
              "inventory",
              INVENTORY_SLOT_COUNT,
              "#inventory_count",
              7,
            ),
          },
        ),
      },
    ],
  },
};

let feedStart = HEADER_LENGTH;
for (let index = 0; index < FEED_SLOT_COUNT; index += 1) {
  ui[`feed_slot_${index}`] = slotDefinition("feed", index, feedStart, false);
  feedStart += FEED_SLOT_LENGTH;
}

let inventoryStart = HEADER_LENGTH + FEED_SLOT_COUNT * FEED_SLOT_LENGTH;
for (let index = 0; index < INVENTORY_SLOT_COUNT; index += 1) {
  ui[`inventory_slot_${index}`] = slotDefinition(
    "inventory",
    index,
    inventoryStart,
    true,
  );
  inventoryStart += INVENTORY_SLOT_LENGTH;
}

fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(ui, null, 2)}\n`, "utf8");
console.log(`Generated ${path.relative(process.cwd(), OUTPUT_PATH)}.`);
