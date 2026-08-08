$secureKey = Read-Host 'OpenAI API key (input is masked)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)

try {
    $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()

    if (-not $key.StartsWith('sk-') -or $key.Length -lt 20) {
        Write-Error 'The value does not look like an OpenAI API key. Nothing was saved.'
        exit 1
    }

    $target = Join-Path $PSScriptRoot '..\.secret.local'
    [IO.File]::WriteAllText($target, "OPENAI_API_KEY=$key`n", [Text.UTF8Encoding]::new($false))
    Write-Host 'Local OpenAI key saved to functions\.secret.local.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
