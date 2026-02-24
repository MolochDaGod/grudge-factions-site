const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// === CONFIG ===
const INSTANCE_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME,
  'curseforge', 'minecraft', 'Instances', 'Grudge Factions'
);
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'downloads');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'GrudgeFactions.zip');

// Folders to include as overrides (player needs these custom configs)
const OVERRIDE_FOLDERS = [
  'config',
  'defaultconfigs',
  'kubejs',
  'scripts',
  'datapacks',
  'resourcepacks',
  'fancymenu_data',
];

async function main() {
  console.log('=== Grudge Factions Modpack Exporter ===\n');

  // Read instance data
  const instanceFile = path.join(INSTANCE_PATH, 'minecraftinstance.json');
  if (!fs.existsSync(instanceFile)) {
    console.error(`ERROR: Cannot find ${instanceFile}`);
    process.exit(1);
  }

  console.log(`Reading instance from: ${INSTANCE_PATH}`);
  const instance = JSON.parse(fs.readFileSync(instanceFile, 'utf-8'));

  // Extract mod list from installed addons
  const addons = instance.installedAddons || [];
  const files = addons
    .filter(a => a.installedFile && a.addonID && a.isEnabled !== false)
    .map(a => ({
      projectID: a.addonID,
      fileID: a.installedFile.id,
      required: true,
    }));

  console.log(`Found ${files.length} mods to include`);

  // Build CurseForge manifest
  const manifest = {
    minecraft: {
      version: instance.gameVersion || '1.20.1',
      modLoaders: [
        {
          id: instance.baseModLoader?.name || 'forge-47.4.0',
          primary: true,
        },
      ],
    },
    manifestType: 'minecraftModpack',
    manifestVersion: 1,
    name: instance.name || 'Grudge Factions',
    version: '1.0.0',
    author: 'GrudgeFactions',
    files,
    overrides: 'overrides',
  };

  // Ensure output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Create zip
  console.log(`\nCreating modpack zip: ${OUTPUT_FILE}`);
  const output = fs.createWriteStream(OUTPUT_FILE);
  const archive = archiver('zip', { zlib: { level: 9 } });

  const done = new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
  });

  archive.pipe(output);

  // Add manifest
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

  // Add override folders
  for (const folder of OVERRIDE_FOLDERS) {
    const folderPath = path.join(INSTANCE_PATH, folder);
    if (fs.existsSync(folderPath)) {
      console.log(`  + overrides/${folder}/`);
      archive.directory(folderPath, `overrides/${folder}`);
    } else {
      console.log(`  - skipping ${folder}/ (not found)`);
    }
  }

  // Add servers.dat so the server is pre-configured
  const serversDat = path.join(INSTANCE_PATH, 'servers.dat');
  if (fs.existsSync(serversDat)) {
    console.log('  + overrides/servers.dat');
    archive.file(serversDat, { name: 'overrides/servers.dat' });
  }

  // Add options.txt for keybinds
  const optionsTxt = path.join(INSTANCE_PATH, 'options.txt');
  if (fs.existsSync(optionsTxt)) {
    console.log('  + overrides/options.txt');
    archive.file(optionsTxt, { name: 'overrides/options.txt' });
  }

  await archive.finalize();
  await done;

  const stats = fs.statSync(OUTPUT_FILE);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`\nDone! Modpack zip: ${sizeMB} MB`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
