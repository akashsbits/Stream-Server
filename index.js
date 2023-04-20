require("dotenv").config();
const express = require("express");
const fs = require("fs");

const PORT = process.env.PORT || 8000;
const app = express();

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/video", function (req, res) {
  // Get the range header, e.g. { range: 'bytes=2983042-' }
  const range = req.headers.range;

  if (!range) {
    return res.status(400).send("Requires Range header");
  }

  const videoPath = "assets/videos/sample.mp4";
  // Returns Stats object provides information about a file
  const videoStats = fs.statSync(videoPath);
  const videoSize = videoStats.size;

  const chunkSize = 1 * 1000 * 1000; // 1MB
  // Parse range e.g. 2983042
  const start = Number(range.replace(/\D/g, ""));
  // videoSize - 1 because HTTP uses zero-based indexing, the bytes in the file are indexed from 0 to videoSize - 1
  const end = Math.min(start + chunkSize, videoSize - 1);
  // Add 1 to include the last byte in the chunk, e.g. for range 0-10 add 1 to include the byte at the 10th index
  const contentLength = end - start + 1;

  // The following headers must be sent to the client
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // The HTTP 206 Partial Content
  res.writeHead(206, headers);

  // Create read stream for this particular chunk
  // "start" and "end" values to read a range of bytes from the file instead of the entire file
  const readStream = fs.createReadStream(videoPath, { start, end });

  // Piping the readable stream to the writable stream
  // the res object has a writable stream associated with its response body
  readStream.pipe(res);
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
