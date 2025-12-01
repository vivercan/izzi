# Script PowerShell para corregir el servidor WideTech GPS

Write-Host "🚀 FIX WIDETECH GPS - CORRECCIÓN AUTOMÁTICA" -ForegroundColor Cyan
Write-Host ""

$serverFile = "supabase/functions/server/index.tsx"

if (-not (Test-Path $serverFile)) {
    Write-Host "❌ ERROR: No se encontró el archivo $serverFile" -ForegroundColor Red
    Write-Host "   Asegúrate de estar en la carpeta raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Archivo encontrado: $serverFile" -ForegroundColor Green

# Leer contenido
$content = Get-Content $serverFile -Raw

# Reemplazar el bloque problemático
$oldBlock = @"
        console.log(`[WIDETECH] 📄 Response (primeros 500 chars): `$`{responseText.substring(0, 500)}`);
        
        // Parsear XML para extraer todos los valores necesarios
        const latMatch = responseText.match(/<Latitude>([-\\d.]+)<\\/Latitude>/);
        const lngMatch = responseText.match(/<Longitude>([-\\d.]+)<\\/Longitude>/);
        const speedMatch = responseText.match(/<Speed>([\\d.]+)<\\/Speed>/);
        const headingMatch = responseText.match(/<Heading>([^<]+)<\\/Heading>/);
        const locationMatch = responseText.match(/<Location><!\\[CDATA\\[([^\\]]+)\\]\\]><\\/Location>/);
        const dateTimeMatch = responseText.match(/<DateTimeGPS>([^<]+)<\\/DateTimeGPS>/);
        const odometerMatch = responseText.match(/<Odometer>([\\d.]+)<\\/Odometer>/);
        const ignitionMatch = responseText.match(/<Ignition>([01])<\\/Ignition>/);
"@

$newBlock = @"
        console.log(`[WIDETECH] 📄 XML completo placa `$`{placa}:`, responseText);
        
        // Validar código de status (100 = OK en WideTech)
        const codeMatch = responseText.match(/<code>(\d+)<\/code>/);
        const statusCode = codeMatch ? parseInt(codeMatch[1]) : 0;
        console.log(`[WIDETECH] Status code: `$`{statusCode} (esperado: 100)`);
        
        // Parsear XML para extraer todos los valores necesarios
        const latMatch = responseText.match(/<Latitude>([-\d.]+)<\/Latitude>/);
        const lngMatch = responseText.match(/<Longitude>([-\d.]+)<\/Longitude>/);
        const speedMatch = responseText.match(/<Speed>([\d.]+)<\/Speed>/);
        const headingMatch = responseText.match(/<Heading>([^<]+)<\/Heading>/);
        const locationMatch = responseText.match(/<Location><!\[CDATA\[([^\]]+)\]\]><\/Location>/);
        const dateTimeMatch = responseText.match(/<DateTimeGPS>([^<]+)<\/DateTimeGPS>/);
        const odometerMatch = responseText.match(/<Odometer>([\d.]+)<\/Odometer>/);
        const ignitionMatch = responseText.match(/<Ignition>([01])<\/Ignition>/);
        const altitudMatch = responseText.match(/<Altitud>([\d.]+)<\/Altitud>/);
        
        console.log(`[WIDETECH] Parsing: Lat=`$`{latMatch?.[1]}, Lng=`$`{lngMatch?.[1]}, Speed=`$`{speedMatch?.[1]}`);
"@

if ($content -match [regex]::Escape($oldBlock)) {
    Write-Host "✅ Bloque encontrado, aplicando corrección..." -ForegroundColor Green
    $content = $content -replace [regex]::Escape($oldBlock), $newBlock
    
    # Guardar archivo
    Set-Content -Path $serverFile -Value $content -Encoding UTF8
    
    Write-Host "✅ Archivo corregido exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Ahora ejecuta:" -ForegroundColor Cyan
    Write-Host "   git add ." -ForegroundColor Yellow
    Write-Host "   git commit -m 'Fix: WideTech GPS parsing'" -ForegroundColor Yellow
    Write-Host "   git push origin main" -ForegroundColor Yellow
} else {
    Write-Host "❌ No se encontró el bloque a reemplazar" -ForegroundColor Red
    Write-Host "   El archivo puede estar ya corregido o tener cambios" -ForegroundColor Yellow
}
