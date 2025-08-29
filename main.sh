php -S 127.0.0.1:8080 > /dev/null 2>&1 &
sleep 3
cloudflared tunnel --url http://127.0.0.1:8080
