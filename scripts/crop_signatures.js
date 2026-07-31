const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function run() {
  const imgPath = "C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\b12d4979-b617-4180-8688-b54af12a8bb8\\media__1785493451582.png";
  const outputDir = path.join(__dirname, "..", "public");

  console.log("Reading image...");
  const image = await Jimp.read(imgPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  console.log(`Dimensions: ${width}x${height}`);

  // Helper to process half
  async function processHalf(startX, endX, filename) {
    const half = image.clone().crop({
      x: startX,
      y: 0,
      w: endX - startX,
      h: height
    });

    // Make background transparent
    half.scan(0, 0, half.bitmap.width, half.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      if (r > 240 && g > 240 && b > 240) {
        this.bitmap.data[idx + 3] = 0; // alpha = 0
      }
    });

    half.autocrop();

    const destPath = path.join(outputDir, filename);
    await half.write(destPath);
    console.log(`Saved: ${destPath}`);
  }

  // Left half (Chairman)
  await processHalf(0, Math.floor(width / 2), "chairman_signature.png");
  // Right half (Director)
  await processHalf(Math.floor(width / 2), width, "director_signature.png");
}

run().catch(console.error);
