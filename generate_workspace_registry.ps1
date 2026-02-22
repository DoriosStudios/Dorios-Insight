$ErrorActionPreference = 'SilentlyContinue'

function Collect-IdentifiersFromText($raw, $set) {
    if ([string]::IsNullOrWhiteSpace($raw)) { return }

    $pattern = '"identifier"\s*:\s*"([^"]+)"'
    $matches = [regex]::Matches($raw, $pattern)
    foreach ($m in $matches) {
        $id = [string]$m.Groups[1].Value
        $id = $id.Trim().ToLower()
        if ($id -match '^[a-z0-9_.-]+:[a-z0-9_./-]+$' -and -not $id.StartsWith('minecraft:')) {
            $set.Add($id) | Out-Null
        }
    }
}

$addons = @(
    @{ key = 'utilitycraft_ascendant_technology'; name = 'UtilityCraft: Ascendant Technology'; type = 'expansion'; namespace = 'utilitycraft'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Ascendant Technology\BP' },
    @{ key = 'dorios_atelier'; name = 'Dorios'' Atelier'; type = 'addon'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios'' Atelier\Data' },
    @{ key = 'dorios_chests'; name = 'Dorios'' Chests'; type = 'addon'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios'' Chests\BP' },
    @{ key = 'dorios_enchants'; name = 'Dorios'' Enchants'; type = 'addon'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios'' Enchants\BP' },
    @{ key = 'dorios_insight'; name = 'Dorios'' Insight'; type = 'core'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios'' Insight\BP' },
    @{ key = 'dorios_rpg_core'; name = 'Dorios RPG Core'; type = 'core'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-RPG-Core\BP' },
    @{ key = 'dorios_trinkets'; name = 'Dorios Trinkets'; type = 'addon'; namespace = 'dorios'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios-Trinkets\BP' },
    @{ key = 'utilitycraft_core'; name = 'UtilityCraft'; type = 'core'; namespace = 'utilitycraft'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft\BP' },
    @{ key = 'utilitycraft_energy_amplified'; name = 'UtilityCraft: Energy Amplified'; type = 'expansion'; namespace = 'utilitycraft'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft-Energy-Amplified\BP' },
    @{ key = 'utilitycraft_heavy_machinery'; name = 'UtilityCraft: Heavy Machinery'; type = 'expansion'; namespace = 'utilitycraft'; root = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\UtilityCraft-Heavy-Machinery\BP' }
)

$result = @()
foreach ($addon in $addons) {
    if (-not (Test-Path -LiteralPath $addon.root)) { continue }

    $idSet = New-Object 'System.Collections.Generic.HashSet[string]'
    $jsonFiles = Get-ChildItem -LiteralPath $addon.root -Recurse -File -Filter *.json |
        Where-Object {
            $_.FullName -notlike '*\builds\*' -and
            $_.FullName -notlike '*\worlds\*' -and
            $_.FullName -notlike '*\Upcoming\*' -and
            $_.FullName -notlike '*\node_modules\*'
        }

    foreach ($file in $jsonFiles) {
        $raw = Get-Content -LiteralPath $file.FullName -Raw
        if (-not $raw) { continue }

        Collect-IdentifiersFromText $raw $idSet
    }

    $content = @($idSet | Sort-Object)
    $result += [PSCustomObject]@{
        key       = $addon.key
        name      = $addon.name
        type      = $addon.type
        namespace = $addon.namespace
        content   = $content
    }
}

$json = $result | ConvertTo-Json -Depth 8
$outFile = 'c:\Users\Usuário\AppData\Local\com.bridge.dev\bridge\projects\Dorios'' Insight\BP\scripts\display\workspaceRegistry.js'
$fileContent = @"
export const WorkspaceAddonContentRegistry = Object.freeze($json);
"@
Set-Content -LiteralPath $outFile -Value $fileContent -Encoding UTF8

$result | ForEach-Object { "{0}: {1} identifiers" -f $_.key, $_.content.Count } | Out-String