const fs = require('fs');
const path = require('path');
const { put, del, list } = require('@vercel/blob');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  let val = trimmed.slice(eqIdx + 1);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) {
    process.env[key] = val;
  }
}

const SOURCE_DIR = 'D:\\Projects\\20260518 Landrover Discovery Sale\\Web_Images';
const OUTPUT_PATH = path.join(__dirname, '..', 'app', 'car', 'image-urls.json');

function cleanFilename(name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  return base
    .replace(/^Web\s+/i, '')       // strip "Web " prefix
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // remove special chars
    .replace(/\s+/g, '-')          // spaces to hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '')         // trim leading/trailing hyphens
    + '.jpg';                      // always .jpg
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN not found in environment');
    process.exit(1);
  }

  // Step 1: Delete all existing car/* blobs
  console.log('=== DELETING OLD CAR BLOBS ===\n');
  let cursor;
  let deleteCount = 0;
  do {
    const result = await list({ prefix: 'car/', cursor, limit: 100 });
    if (result.blobs.length > 0) {
      for (const blob of result.blobs) {
        console.log(`  Deleting: ${blob.url}`);
        await del(blob.url);
        deleteCount++;
      }
    }
    cursor = result.cursor;
  } while (cursor);
  console.log(`\nDeleted ${deleteCount} old blobs.\n`);

  // Step 2: Upload new web-optimised images
  console.log('=== UPLOADING WEB-OPTIMISED IMAGES ===\n');
  const files = fs.readdirSync(SOURCE_DIR)
    .filter(f => /\.(jpg|jpeg|JPG|JPEG)$/i.test(f))
    .sort();

  console.log(`Found ${files.length} images to upload\n`);

  const mapping = {};

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const cleanName = cleanFilename(file);
    const blobPath = `car/${cleanName}`;

    const fileBuffer = fs.readFileSync(filePath);
    const sizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);

    console.log(`Uploading: ${file} (${sizeMB}MB) -> ${blobPath}`);
    const blob = await put(blobPath, fileBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    mapping[file] = blob.url;
    console.log(`  -> ${blob.url}`);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2));
  console.log(`\nDone! ${files.length} images uploaded.`);
  console.log(`Mapping saved to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
