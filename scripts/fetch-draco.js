const https = require("https");
const fs = require("fs");
const path = require("path");

// Versioned decoder path - change if needed
const BASE = "https://www.gstatic.com/draco/versioned/decoders/1.4.3/";
const files = [
  "draco_decoder.js",
  "draco_decoder.wasm",
  "draco_wasm_wrapper.js",
];

const outDir = path.join(__dirname, "..", "public", "draco");
fs.mkdirSync(outDir, { recursive: true });

function download(file) {
  const url = BASE + file;
  const dest = path.join(outDir, file);
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(`Failed to download ${url} - status ${res.statusCode}`),
          );
          return;
        }
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          console.log("Saved", dest);
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

(async () => {
  try {
    for (const f of files) {
      console.log("Downloading", f);
      await download(f);
    }
    console.log("All DRACO files downloaded to", outDir);
  } catch (err) {
    console.error("Download failed:", err.message);
    process.exit(1);
  }
})();
