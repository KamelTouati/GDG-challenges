```markdown
# Sitemap Builder Server

This is a simple sitemap builder server that generates a sitemap for a given website URL. It prevents infinite loops caused by cycles on the website by keeping track of visited URLs. The server is built using Python and Flask.

## Features

- Generates sitemaps in XML format.
- Handles cyclic website structures.
- Lightweight and easy to set up.

## Requirements

- Python 3
- Flask
- BeautifulSoup
- Requests

## Installation

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/KamelTouati/Site-Map-Builder-Challenge.git
   cd sitemap-builder-server
   ```

2. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:

   ```bash
   python sitemap_builder.py
   ```

The server should now be running locally.

## Usage

To generate a sitemap for a website, send a POST request to the `/generate_sitemap` endpoint with the website URL as JSON data.

Example using `curl`:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"url": "http://www.example.com"}' http://localhost:5000/generate_sitemap
```

The server will return the sitemap in XML format as a response.

## Acknowledgments

- [Flask](https://flask.palletsprojects.com/)
- [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [Requests](https://docs.python-requests.org/en/latest/)