param(
    [string]$OutputDirectory = "E:\Skate Datamine\_datamine\exports\skatepedia"
)

$ErrorActionPreference = "Stop"

$envPath = Join-Path $PSScriptRoot "..\.env.local"
$configuration = @{}
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $configuration[$Matches[1]] = $Matches[2].Trim('"')
    }
}

$supabaseUrl = $configuration["NEXT_PUBLIC_SUPABASE_URL"]
$publishableKey = $configuration["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]
if (-not $supabaseUrl -or -not $publishableKey) {
    throw "Supabase configuration is missing from .env.local."
}

$headers = @{
    apikey = $publishableKey
    Authorization = "Bearer $publishableKey"
}

$trickResponse = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/tricks?select=*&order=sort_order.asc" `
    -Headers $headers
$stickInputResponse = Invoke-RestMethod `
    -Uri "$supabaseUrl/rest/v1/stick_paths?select=*&order=slug.asc" `
    -Headers $headers

# Force Windows PowerShell's WebCmdletElementCollection through the pipeline so
# its individual JSON rows are materialized before serialization.
$tricks = @($trickResponse | ForEach-Object { $_ })
$stickInputs = @($stickInputResponse | ForEach-Object { $_ })

$exportedAt = (Get-Date).ToUniversalTime().ToString("o")
$trickExport = [ordered]@{
    schema_version = 1
    exported_at = $exportedAt
    source = "live Supabase database"
    scope = "rows readable through the public API"
    trick_count = $tricks.Count
    tricks = $tricks
}
$stickInputExport = [ordered]@{
    schema_version = 1
    exported_at = $exportedAt
    source = "public.stick_paths"
    scope = "rows readable through the public API"
    stick_input_count = $stickInputs.Count
    stick_inputs = $stickInputs
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$trickPath = Join-Path $OutputDirectory "database-tricks.json"
$stickInputPath = Join-Path $OutputDirectory "database-stick-inputs.json"

$trickExport | ConvertTo-Json -Depth 100 | Set-Content -Encoding utf8 $trickPath
$stickInputExport | ConvertTo-Json -Depth 100 | Set-Content -Encoding utf8 $stickInputPath

Write-Output "Wrote $($tricks.Count) tricks to $trickPath"
Write-Output "Wrote $($stickInputs.Count) stick inputs to $stickInputPath"
