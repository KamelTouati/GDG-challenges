/* This is a Node.js server code that handles HTTP POST requests for uploading files with 
multipart/form-data content type. It uses the http module to create an HTTP server, 
fs module to handle file operations, and path module for working with file paths. 
The server listens on port 5000.*/

/* 
Import required modules:
http: This module is used to create an HTTP server.
fs: The File System module is used for file operations.
path: The Path module is used for working with file paths.
Create an HTTP server:*/

const http = require("http");
const fs = require("fs");
const path = require("path");

/* 
The http.createServer() method is used to create an HTTP server. 
It takes a callback function with two parameters: req (the request object) and res (the response object).
*/
const server = http.createServer((req, res) => {
  /*
  Handle POST requests:
  Inside the server callback function, the code checks if the incoming request method is POST
  by examining the req.method property.
  */
  if (req.method === "POST") {
    // Check if the request's content-type is multipart/form-data

    /*
    Check the content type:
    It checks if the request's content type is multipart/form-data by inspecting the Content-Type header 
    in the req.headers. If the content type is not multipart/form-data, it returns a 400 Bad Request 
    response with an "Unsupported content type" message. 
    */

    const contentType = req.headers["content-type"];
    if (contentType && contentType.includes("multipart/form-data")) {
      // Create a boundary string to split the form data
      /*
     Parse multipart form data:
     If the content type is multipart/form-data, the server begins processing the data. 
     It extracts the boundary value from the Content-Type header, which is used to separate 
     the various parts of the multipart data.
     */
      const boundary = contentType.split("; ")[1].split("=")[1];
      /*
      Handle data chunks:
      The code listens for incoming data chunks with req.on("data", (chunk) => {}). It collects these chunks in an array data.

      Process data when request ends:
      When the request ends (req.on("end", () => {})), it concatenates all the data chunks into a single formData buffer and searches for the boundary string.
      */
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
          /* 
          Split the form data into parts:
          It splits the form data into parts using the boundary string and processes each part individually. 
          */
          parts.forEach((part) => {
            /* 
            Check if the part is a field or file:
            It checks whether each part is a field (not a file) or a file based on whether it contains 
            a filename attribute. If it's a field, it extracts the field data. If it's a file, it extracts 
            the filename and file data. 
            */
            if (!part.includes('filename="')) {
              // This is a field (not a file)
              const fieldData = part.split("\r\n\r\n")[1];
              // Do something with the field data
              console.log(fieldData);
            } else {
              // This is a file
              const filename = /filename="([^"]+)"/.exec(part)[1];
              const fileData = part.split("\r\n\r\n")[1];
              /* 
              Save uploaded files:
              For file parts, it saves the file to the server's "uploads" directory using the fs.writeFile method. 
              The file path is constructed using path.join(__dirname, "uploads", filename). 
              If there is an error during file writing, it returns a 500 Internal Server Error response.
              Otherwise, it returns a 200 OK response.
              */
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
