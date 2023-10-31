const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
  if (req.method === "POST") {
    // Check if the request's content-type is multipart/form-data
    const contentType = req.headers["content-type"];
    if (contentType && contentType.includes("multipart/form-data")) {
      // Create a boundary string to split the form data
      const boundary = contentType.split("; ")[1].split("=")[1];

      let data = [];
      req.on("data", (chunk) => {
        data.push(chunk);
      });

      req.on("end", () => {
        const formData = Buffer.concat(data);
        const boundaryIndex = formData.indexOf(`--${boundary}`);
        if (boundaryIndex !== -1) {
          // Split the form data into parts based on the boundary
          const parts = formData
            .slice(boundaryIndex + boundary.length + 2)
            .toString()
            .split(`--${boundary}`);

          // Process each part
          parts.forEach((part) => {
            if (!part.includes('filename="')) {
              // This is a field (not a file)
              const fieldData = part.split("\r\n\r\n")[1];
              // Do something with the field data
              console.log(fieldData);
            } else {
              // This is a file
              const filename = /filename="([^"]+)"/.exec(part)[1];
              const fileData = part.split("\r\n\r\n")[1];

              // Save the file to the server
              const filePath = path.join(__dirname, "uploads", filename);
              fs.writeFile(filePath, fileData, (err) => {
                if (err) {
                  console.error(err);
                  res.writeHead(500, { "Content-Type": "text/plain" });
                  res.end("File upload failed");
                } else {
                  res.writeHead(200, { "Content-Type": "text/plain" });
                  res.end("File upload successful");
                }
              });
            }
          });
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Invalid multipart form data");
        }
      });
    } else {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Unsupported content type");
    }
  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
  }
});

const port = 5000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
