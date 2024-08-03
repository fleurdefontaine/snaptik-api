const SnapTikClient = require('./src/index');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  fg: {
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadFile(url, filename, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await axios({ url, method: 'GET', responseType: 'stream', timeout: 10000 });
      const writer = fs.createWriteStream(filename);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      return filename;
    } catch (error) {
      console.error(`${colors.fg.yellow}Attempt ${i + 1} failed: ${error.message}${colors.reset}`);
      if (i === attempts - 1) throw error;
      await delay(1000);
    }
  }
}

async function retry(sources, baseName, extension) {
  const downloadDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);
  for (const [index, url] of sources.entries()) {
    const filename = path.join(downloadDir, `${baseName}_${index + 1}${extension}`);
    try {
      console.log(`${colors.fg.cyan}Attempting to download: ${colors.fg.yellow}${url}${colors.reset}`);
      const downloadedFile = await downloadFile(url, filename);
      console.log(`${colors.fg.green}Download successful: ${colors.fg.yellow}${downloadedFile}${colors.reset}`);
      return downloadedFile;
    } catch (error) {
      console.error(`${colors.fg.red}Failed to download from ${url}: ${error.message}${colors.reset}`);
    }
  }
  throw new Error('All download attempts failed');
}

async function processSlideshow(photos) {
  console.log(`${colors.fg.yellow}Slideshow with ${photos.length} photos.${colors.reset}`);
  rl.question(`${colors.fg.cyan}Enter number of photos to download (1-${photos.length}): ${colors.reset}`, async (answer) => {
    const count = parseInt(answer, 10) || photos.length;
    if (count < 1 || count > photos.length) {
      console.log(`${colors.fg.red}Invalid input. Downloading all photos.${colors.reset}`);
    }
    
    let successCount = 0;
    for (let i = 0; i < count; i++) {
      const photo = photos[i];
      const baseName = `slideshow_${Date.now()}_${i + 1}`;
      try {
        const urls = photo.sources.map((resource) => resource.url);
        const downloadedFile = await retry(urls, baseName, '.jpg');
        console.log(`${colors.fg.green}${colors.bright}Photo ${i + 1} downloaded as: ${colors.fg.yellow}${downloadedFile}${colors.reset}`);
        successCount++;
      } catch (error) {
        console.error(`${colors.fg.red}Error downloading photo ${i + 1}: ${error.message}${colors.reset}`);
      }
    }
    console.log(`${colors.fg.cyan}Download complete. ${successCount}/${count} photos downloaded.${colors.reset}`);
    rl.close();
  });
}

rl.question(`${colors.fg.cyan}Enter TikTok URL: ${colors.reset}`, async (url) => {
  try {
    const client = new SnapTikClient()
    const result = await client.process(url)
    
    if (result.type === 'video' && result.data.sources && result.data.sources.length > 0) {
      const baseName = `tiktok_video_${Date.now()}`
      const downloadedFile = await retry(result.data.sources, baseName, '.mp4')
      console.log(`${colors.fg.green}${colors.bright}Video successfully downloaded and saved as: ${colors.fg.yellow}${downloadedFile}${colors.reset}`)
      rl.close()
    } else if (result.type === 'slideshow' && result.data.photos && result.data.photos.length > 0) {
      await processSlideshow(result.data.photos)
    } else {
      console.log(`${colors.fg.yellow}No video or photo sources found to download.${colors.reset}`)
      rl.close()
    }
  } catch (error) {
    console.error(`${colors.fg.red}${colors.bright}Error processing or downloading TikTok content:${colors.reset}`, error)
    rl.close()
  }
})
