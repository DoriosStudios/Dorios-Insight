const fs = require("fs");
const path = require("path");

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const WORKSPACE_ROOT = path.resolve(PROJECT_ROOT, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "BP", "scripts", "core", "render", "generated");
const INITIAL_CUSTOM_BLOCK_RAW_ID = -9745;

function stripJsonComments(text) {
  let output = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false;
        output += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    output += char;
  }

  return output;
}

function readJson(filePath) {
  return JSON.parse(stripJsonComments(fs.readFileSync(filePath, "utf8")));
}

function walkJsonFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkJsonFiles(entryPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return files;
}

function getBehaviorPackPath(projectPath) {
  const directPath = path.join(projectPath, "BP");
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const packsPath = path.join(projectPath, "packs", "BP");
  if (fs.existsSync(packsPath)) {
    return packsPath;
  }

  return undefined;
}

function getProjectEntries() {
  return fs.readdirSync(WORKSPACE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(WORKSPACE_ROOT, entry.name),
    }))
    .map((project) => ({
      ...project,
      behaviorPackPath: getBehaviorPackPath(project.path),
    }))
    .filter((project) => project.behaviorPackPath)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getIdentifier(filePath, componentKey) {
  try {
    const data = readJson(filePath);
    const identifier = data?.[componentKey]?.description?.identifier;
    return typeof identifier === "string" && identifier.includes(":")
      ? identifier
      : undefined;
  } catch (error) {
    console.warn(`[block-render-aux] Skipping ${filePath}: ${error.message}`);
    return undefined;
  }
}

function normalizeSortPath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/_/g, "\uFFFF");
}

function getItemFileCount(projects) {
  return projects.reduce((count, project) => (
    count + walkJsonFiles(path.join(project.behaviorPackPath, "items")).length
  ), 0);
}

function getCustomBlockRecords(projects) {
  const records = [];

  for (const project of projects) {
    for (const filePath of walkJsonFiles(path.join(project.behaviorPackPath, "blocks"))) {
      const identifier = getIdentifier(filePath, "minecraft:block");
      if (!identifier || identifier.startsWith("minecraft:")) {
        continue;
      }

      records.push({
        identifier,
        projectName: project.name,
        filePath,
        sortPath: normalizeSortPath(path.relative(WORKSPACE_ROOT, filePath)),
      });
    }
  }

  return records.sort((left, right) => right.sortPath.localeCompare(left.sortPath));
}

function buildCustomBlockAuxValues(records) {
  const values = {};
  const seen = new Set();
  let rawId = INITIAL_CUSTOM_BLOCK_RAW_ID;

  for (const record of records) {
    if (seen.has(record.identifier)) {
      console.warn(`[block-render-aux] Duplicate block id ignored: ${record.identifier} (${record.projectName})`);
      continue;
    }

    seen.add(record.identifier);
    values[record.identifier] = rawId * 65536;
    rawId -= 1;
  }

  return values;
}

function writeModule(fileName, exportName, value) {
  fs.writeFileSync(
    path.join(OUTPUT_DIR, fileName),
    `export const ${exportName} = ${JSON.stringify(value, null, 2)};\n`
  );
}

function main() {
  const projects = getProjectEntries();
  const itemCount = getItemFileCount(projects);
  const customBlockRecords = getCustomBlockRecords(projects);
  const customBlockAuxValues = buildCustomBlockAuxValues(customBlockRecords);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  writeModule("auxOffset.js", "auxOffset", itemCount);
  writeModule("customBlockAuxValues.js", "customBlockAuxValues", customBlockAuxValues);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "blockRenderAuxMetadata.json"),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      workspaceRoot: WORKSPACE_ROOT,
      projectCount: projects.length,
      itemCount,
      customBlockCount: Object.keys(customBlockAuxValues).length,
      projectNames: projects.map((project) => project.name),
    }, null, 2)}\n`
  );

  console.log(`[block-render-aux] Generated ${Object.keys(customBlockAuxValues).length} custom block aux values with ${itemCount} item offset.`);
}

main();
