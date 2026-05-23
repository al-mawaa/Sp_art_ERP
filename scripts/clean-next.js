const fs = require("fs");
const path = require("path");

const dir = path.join(process.cwd(), ".next");

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* wait for Windows file locks to release */
  }
}

try {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 15, retryDelay: 500 });
  }
  if (fs.existsSync(dir)) {
    throw new Error("directory still present");
  }
  console.log("Removed .next");
} catch (err) {
  console.warn("Warning: could not remove .next:", err.message);
  console.warn("Stop `npm run dev` if it is running, then run `npm run build` again.");
  console.warn("Continuing with `next build` anyway…");
}
