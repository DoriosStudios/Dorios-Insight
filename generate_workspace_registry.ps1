$ErrorActionPreference = 'SilentlyContinue'

function Collect-IdentifiersFromText($raw, $set) {
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return
    }

    $patterns = @(
        '"identifier"\s*:\s*"([^"]+)"',
        '"minecraft:identifier"\s*:\s*"([^"]+)"'
    )

    foreach ($pattern in $patterns) {
        $matches = [regex]::Matches($raw, $pattern)
        foreach ($m in $matches) {
            $id = [string]$m.Groups[1].Value
            $id = $id.Trim().ToLower()

            if ($id -match '^[a-z0-9_.-]+:[a-z0-9_./-]+$' -and -not $id.StartsWith('minecraft:')) {
                $set.Add($id) | Out-Null
            }
        }
    }
}

function Get-MappableJsonFiles($bpRoot) {
    $folders = @('blocks', 'entities', 'items')
    $files = New-Object 'System.Collections.Generic.List[System.IO.FileInfo]'

    foreach ($folder in $folders) {
        $targetPath = Join-Path $bpRoot $folder
        if (-not (Test-Path -LiteralPath $targetPath)) {
            continue
        }

        $jsonFiles = Get-ChildItem -LiteralPath $targetPath -Recurse -File -Filter *.json |
            Where-Object {
                $_.FullName -notlike '*\builds\*' -and
                $_.FullName -notlike '*\worlds\*' -and
                $_.FullName -notlike '*\Upcoming\*' -and
                $_.FullName -notlike '*\node_modules\*'
            }

        foreach ($jsonFile in $jsonFiles) {
            $files.Add($jsonFile)
        }
    }

    return $files
}

function Ensure-MainScriptImport($mainScriptPath, $importStatement) {
    if (-not (Test-Path -LiteralPath $mainScriptPath)) {
        return $false
    }

    $raw = Get-Content -LiteralPath $mainScriptPath -Raw
    if ($null -eq $raw) {
        return $false
    }

    if ($raw -match [regex]::Escape($importStatement)) {
        return $false
    }

    $trimmed = $raw.TrimEnd("`r", "`n")
    $updated = "$trimmed`r`n$importStatement`r`n"
    Set-Content -LiteralPath $mainScriptPath -Value $updated -Encoding UTF8
    return $true
}

function Build-RegistryInjectorSource($addonEntry) {
    $addonJson = $addonEntry | ConvertTo-Json -Depth 8
    $marker = "__insightNamespaceRegistry_" + $addonEntry.key

    return @"
import { system } from "@minecraft/server";

const REGISTRATION_MARKER = "$marker";
const REGISTRATION_RETRY_TICKS = 20;
const MAX_REGISTRATION_ATTEMPTS = 180;

const ADDON_CONTENT = Object.freeze($addonJson);

function tryRegisterAddonContent() {
    if (globalThis[REGISTRATION_MARKER]) {
        return true;
    }

    const api = globalThis.InsightNamespaceRegistry;
    if (!api || typeof api.registerAddonContent !== "function") {
        return false;
    }

    api.registerAddonContent(ADDON_CONTENT, false);
    globalThis[REGISTRATION_MARKER] = true;
    return true;
}

function registerAddonContentWithRetry(attempt = 0) {
    if (tryRegisterAddonContent() || attempt >= MAX_REGISTRATION_ATTEMPTS) {
        return;
    }

    system.runTimeout(() => {
        registerAddonContentWithRetry(attempt + 1);
    }, REGISTRATION_RETRY_TICKS);
}

registerAddonContentWithRetry();
"@
}

$addons = @(
    @{ key = 'utilitycraft_ascendant_technology'; name = 'UtilityCraft: Ascendant Technology'; type = 'expansion'; namespace = 'utilitycraft'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Ascendant Technology\BP'; scriptsRoot = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Ascendant Technology\BP\scripts'; mainScript = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Ascendant Technology\BP\scripts\main.js'; importStatement = "import './insight_registry_injector.generated.js'" },
    @{ key = 'dorios_atelier'; name = 'Dorios'' Atelier'; type = 'addon'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios'' Atelier\BP'; scriptsRoot = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios'' Atelier\BP\scripts'; mainScript = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios'' Atelier\BP\scripts\main.js'; importStatement = "import './insight_registry_injector.generated.js'" },
    @{ key = 'dorios_excavate'; name = 'Dorios Excavate'; type = 'addon'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-Excavate\BP'; scriptsRoot = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-Excavate\BP\scripts'; mainScript = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-Excavate\BP\scripts\main.js'; importStatement = "import 'insight_registry_injector.generated.js'" },
    @{ key = 'dorios_rpg_core'; name = 'Dorios RPG Core'; type = 'core'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-RPG-Core\BP'; scriptsRoot = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-RPG-Core\BP\scripts'; mainScript = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-RPG-Core\BP\scripts\main.js'; importStatement = "import 'insight_registry_injector.generated.js'" },
    @{ key = 'dorios_trinkets'; name = 'Dorios Trinkets'; type = 'addon'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-Trinkets\BP'; scriptsRoot = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-Trinkets\BP\scripts'; mainScript = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-Trinkets\BP\scripts\main.js'; importStatement = "import './insight_registry_injector.generated.js'" },
    @{ key = 'utilitycraft_core'; name = 'UtilityCraft'; type = 'core'; namespace = 'utilitycraft'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft\BP'; scriptsRoot = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft\BP\scripts'; mainScript = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft\BP\scripts\main.js'; importStatement = "import './insight_registry_injector.generated.js'" },
    @{ key = 'utilitycraft_energy_amplified'; name = 'UtilityCraft: Energy Amplified'; type = 'expansion'; namespace = 'utilitycraft'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft-Energy-Amplified\BP'; scriptsRoot = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft-Energy-Amplified\BP\scripts'; mainScript = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft-Energy-Amplified\BP\scripts\main.js'; importStatement = "import './insight_registry_injector.generated.js'" },
    @{ key = 'utilitycraft_heavy_machinery'; name = 'UtilityCraft: Heavy Machinery'; type = 'expansion'; namespace = 'utilitycraft'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft-Heavy-Machinery\BP'; scriptsRoot = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft-Heavy-Machinery\BP\scripts'; mainScript = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft-Heavy-Machinery\BP\scripts\main.js'; importStatement = "import './insight_registry_injector.generated.js'" }
)

$result = @()
$injectorResults = @()

foreach ($addon in $addons) {
    if (-not (Test-Path -LiteralPath $addon.root)) {
        continue
    }

    $idSet = New-Object 'System.Collections.Generic.HashSet[string]'
    $jsonFiles = Get-MappableJsonFiles $addon.root

    foreach ($file in $jsonFiles) {
        $raw = Get-Content -LiteralPath $file.FullName -Raw
        if (-not $raw) {
            continue
        }

        Collect-IdentifiersFromText $raw $idSet
    }

    $content = @($idSet | Sort-Object)
    $addonEntry = [PSCustomObject]@{
        key       = $addon.key
        name      = $addon.name
        type      = $addon.type
        namespace = $addon.namespace
        content   = $content
    }

    $result += $addonEntry

    if (Test-Path -LiteralPath $addon.scriptsRoot) {
        $injectorPath = Join-Path $addon.scriptsRoot 'insight_registry_injector.generated.js'
        $injectorSource = Build-RegistryInjectorSource $addonEntry
        Set-Content -LiteralPath $injectorPath -Value $injectorSource -Encoding UTF8

        $importAdded = Ensure-MainScriptImport $addon.mainScript $addon.importStatement

        $injectorResults += [PSCustomObject]@{
            key = $addon.key
            injector = $injectorPath
            importAdded = $importAdded
        }
    }
}

$json = $result | ConvertTo-Json -Depth 8
$outFile = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios'' Insight\BP\scripts\display\workspaceRegistry.js'
$fileContent = @"
export const WorkspaceAddonContentRegistry = Object.freeze($json);
"@
Set-Content -LiteralPath $outFile -Value $fileContent -Encoding UTF8

"Registry written to: $outFile"
$result | ForEach-Object { "{0}: {1} identifiers" -f $_.key, $_.content.Count } | Out-String

"Injectors generated:"
$injectorResults | ForEach-Object { "{0}: {1} | import added: {2}" -f $_.key, $_.injector, $_.importAdded } | Out-String