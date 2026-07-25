import http.server
import socketserver
import sys

# Define default port
PORT = 8000

# Override port if provided as a command-line argument
if len(sys.argv) > 1:
    try:
        PORT = int(sys.argv[1])
    except ValueError:
        print(f"Invalid port argument '{sys.argv[1]}'. Falling back to default port {PORT}.")

# Use built-in SimpleHTTPRequestHandler to serve files relative to the current directory
Handler = http.server.SimpleHTTPRequestHandler

# Create a TCPServer class that permits immediate address/port reuse
class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def main():
    try:
        with ReusableTCPServer(("0.0.0.0", PORT), Handler) as httpd:
            print(f"Serving frontend at http://0.0.0.0:{PORT}")
            print("Press Ctrl+C to stop the server.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error starting server: {e}")

if __name__ == "__main__":
    main()
