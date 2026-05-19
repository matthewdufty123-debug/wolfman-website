const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

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
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) {
    process.env[key] = val;
  }
}

const SOURCE_DIR = 'D:\\Projects\\20260518 Landrover Discovery Sale';
const OUTPUT_PATH = path.join(__dirname, '..', 'app', 'car', 'image-urls.json');

function cleanFilename(name) {
  const ext = path.extname(name); // .jpg
  const base = path.basename(name, ext);
  return base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-')          // spaces to hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '')         // trim leading/trailing hyphens
    + ext.toLowerCase();
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN not found in environment');
    process.exit(1);
  }

  const files = fs.readdirSync(SOURCE_DIR)
    .filter(f => f.toLowerCase().endsWith('.jpg'))
    .sort();

  console.log(`Found ${files.length} JPG files to upload\n`);

  const mapping = {};

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const cleanName = cleanFilename(file);
    const blobPath = `car/${cleanName}`;

    const fileBuffer = fs.readFileSync(filePath);

    console.log(`Uploading: ${file} -> ${blobPath}`);
    const blob = await put(blobPath, fileBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    mapping[file] = blob.url;
    console.log(`  -> ${blob.url}`);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2));
  console.log(`\nDone! Mapping saved to ${OUTPUT_PATH}`);
  console.log(JSON.stringify(mapping, null, 2));
}

main().catch(err => {
  console.error('Upload failed:', err);
  process.exit(1);
});
