Write-Host "======================================"
Write-Host "Starting FocusForge"
Write-Host "======================================"

$services = @("api-gateway", "user-service", "habit-service", "analytics-service", "ai-service", "frontend")

Write-Host "`n[1/2] Installing dependencies if needed..."
foreach ($service in $services) {
    if (-Not (Test-Path ".\$service\node_modules")) {
        Write-Host "Installing dependencies for $service..." -ForegroundColor Yellow
        Set-Location -Path ".\$service"
        npm install
        Set-Location -Path ".."
    } else {
        Write-Host "Dependencies for $service already installed." -ForegroundColor Green
    }
}

Write-Host "`n[2/2] Starting all services in new windows..."
# Backend services
Start-Process powershell -ArgumentList "-NoExit -Command `"cd api-gateway; npm start`""
Start-Process powershell -ArgumentList "-NoExit -Command `"cd user-service; npm start`""
Start-Process powershell -ArgumentList "-NoExit -Command `"cd habit-service; npm start`""
Start-Process powershell -ArgumentList "-NoExit -Command `"cd analytics-service; npm start`""
Start-Process powershell -ArgumentList "-NoExit -Command `"cd ai-service; npm start`""

# Frontend
Start-Process powershell -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

Write-Host "`nAll services have been launched in separate PowerShell windows!" -ForegroundColor Green
Write-Host "You can view the frontend at http://localhost:5173"
Write-Host "Note: To shut down the app, simply close the 6 popup terminal windows."
