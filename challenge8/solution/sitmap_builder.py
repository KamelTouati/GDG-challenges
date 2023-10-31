from http.server import BaseHTTPRequestHandler, HTTPServer
from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin
import json

class SitemapBuilderServer(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        website_url = data.get('url')

        if not website_url:
            self.send_response(400)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write('Error: Invalid URL or missing URL in JSON data'.encode('utf-8'))
            return

        sitemap = self.generate_sitemap(website_url)
        self.send_response(200)
        self.send_header('Content-type', 'application/xml')
        self.end_headers()
        self.wfile.write(sitemap.encode('utf-8'))

    def get_links(self, url):
        try:
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            links = [link.get('href') for link in soup.find_all('a')]
            return links
        except Exception as e:
            return []

    def generate_sitemap(self, url):
        visited_urls = set()
        visited_urls.add(url)
        links_to_visit = [url]
        sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

        while links_to_visit:
            current_url = links_to_visit.pop()
            links = self.get_links(current_url)

            for link in links:
                full_url = urljoin(current_url, link)

                if full_url not in visited_urls:
                    sitemap += f'<url>\n<loc>{full_url}</loc>\n</url>\n'
                    visited_urls.add(full_url)
                    links_to_visit.append(full_url)

        sitemap += '</urlset>'
        return sitemap

def run_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, SitemapBuilderServer)
    print('Sitemap builder server is running on port 8000...')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
