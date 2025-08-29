@echo off
echo Opening port 8080 in Windows Firewall...
netsh advfirewall firewall add rule name="Python Server Port 8080" dir=in action=allow protocol=TCP localport=8080
echo Firewall rule added successfully.
pause
