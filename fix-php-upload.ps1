# fix-php-upload.ps1
# Corrige el directorio temporal de PHP en Herd para permitir subida de imagenes
# Ejecutar en PowerShell: .\fix-php-upload.ps1

$phpVersiones = @("php83", "php84", "php82")

foreach ($version in $phpVersiones) {
    $ruta = "C:\Users\Usuario\.config\herd\bin\$version\php.ini"

    if (Test-Path $ruta) {
        Write-Host "Encontrado: $ruta" -ForegroundColor Cyan

        $contenido = Get-Content $ruta -Raw

        # Caso 1: la linea existe pero esta comentada
        if ($contenido -match ';upload_tmp_dir') {
            $contenido = $contenido -replace ';upload_tmp_dir\s*=.*', 'upload_tmp_dir = "C:\Windows\Temp"'
            Set-Content $ruta $contenido -Encoding UTF8
            Write-Host "  -> upload_tmp_dir activado en $version" -ForegroundColor Green
        }
        # Caso 2: la linea existe sin comentario (reemplazar el valor)
        elseif ($contenido -match 'upload_tmp_dir\s*=') {
            $contenido = $contenido -replace 'upload_tmp_dir\s*=.*', 'upload_tmp_dir = "C:\Windows\Temp"'
            Set-Content $ruta $contenido -Encoding UTF8
            Write-Host "  -> upload_tmp_dir actualizado en $version" -ForegroundColor Green
        }
        # Caso 3: no existe la linea, la agregamos
        else {
            Add-Content $ruta "`nupload_tmp_dir = `"C:\Windows\Temp`""
            Write-Host "  -> upload_tmp_dir agregado en $version" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Listo. Ahora reinicia Herd (clic derecho en el icono de la bandeja -> Quit, luego abrelo de nuevo)." -ForegroundColor Yellow
Write-Host ""
Write-Host "Verificando configuracion activa:" -ForegroundColor Cyan
php -i | Select-String "upload_tmp_dir"
