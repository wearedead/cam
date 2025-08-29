import http.server
import socketserver
import os
import mimetypes

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Special case for index.php - serve index.html instead
        if self.path == "/index.php":
            self.path = "/index.html"
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def guess_type(self, path):
        """Guess the type of a file based on its extension."""
        base, ext = os.path.splitext(path)
        if ext == '.php':
            return 'text/html'
        return super().guess_type(path)

# Change directory to the script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create the server
Handler = MyHTTPRequestHandler
httpd = socketserver.TCPServer(("0.0.0.0", PORT), Handler)

print(f"Serving at http://localhost:{PORT}")
print(f"Open this URL on your phone (if on same network): http://172.16.10.160:{PORT}")
print("To find your IP address, run 'ipconfig' in another terminal")
print("Press Ctrl+C to stop the server")

# Start the server
httpd.serve_forever()
