import sys
import os
import socketserver
import http.server

os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 3000
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
