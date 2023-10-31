import http.server
import traceback
import os

class PanicRecoveryHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        try:
            super().do_GET()
        except Exception as e:
            # Log the error and stack trace
            print(f"Panic recovered: {str(e)}")
            traceback.print_exc()

            # Determine the environment (e.g., from an environment variable)
            environment = os.environ.get("ENVIRONMENT", "development")

            self.send_response(500)
            self.send_header("Content-type", "text/html")
            self.end_headers()

            if environment == "production":
                # In production, render an error message
                self.wfile.write(b"Something went wrong")
            else:
                # In development, render the stack trace
                self.wfile.write(b"<pre>")
                traceback.print_exc(file=self.wfile)
                self.wfile.write(b"</pre>")

def run(server_class=http.server.HTTPServer, handler_class=PanicRecoveryHandler, port=8000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Server is running on port {port}")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
