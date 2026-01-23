$wsl_ip = (wsl hostname -I).Split(" ")[0]
Write-Host "WSL IP detected: $wsl_ip"

# Add Port Proxies
Write-Host "Adding Port Proxy for 5174..."
netsh interface portproxy add v4tov4 listenport=5174 listenaddress=0.0.0.0 connectport=5174 connectaddress=$wsl_ip

Write-Host "Adding Port Proxy for 8080..."
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=$wsl_ip

# Add Firewall Rules
Write-Host "Adding Firewall Rule for 5174..."
New-NetFirewallRule -DisplayName "GlassKeep Frontend" -Direction Inbound -LocalPort 5174 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Write-Host "Adding Firewall Rule for 8080..."
New-NetFirewallRule -DisplayName "GlassKeep API" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

Write-Host "Configuration Complete. You should be able to access the app from other devices now."
Write-Host "Frontend: http://$((Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match '^192\.168\.' } | Select-Object -First 1).IPAddress):5174"
