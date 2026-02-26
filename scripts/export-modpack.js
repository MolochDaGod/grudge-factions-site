const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// === CONFIG ===
// Support both Windows CurseForge instance and WSL server path
const WSL_SERVER_PATH = '/home/nugye/grudge-server';
const CURSEFORGE_INSTANCE = path.join(
  process.env.USERPROFILE || process.env.HOME,
  'curseforge', 'minecraft', 'Instances', 'Grudge Factions'
);

// Auto-detect: prefer WSL server if available, fallback to CurseForge
const INSTANCE_PATH = fs.existsSync(WSL_SERVER_PATH) ? WSL_SERVER_PATH : CURSEFORGE_INSTANCE;
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

// Server-only scripts that should NOT go into the client modpack
const SERVER_ONLY_SCRIPTS = [
  'puter_bridge.js',
  'gemini_chat_bridge.js',
  'deploy_command.js',
  'racalvin_admin.js',
];

async function main() {
  console.log('=== Grudge Factions Modpack Exporter v1.1 ===\n');
  console.log(`Source: ${INSTANCE_PATH}`);

  // Detect mode
  const isWSL = INSTANCE_PATH === WSL_SERVER_PATH;
  let manifest;

  if (isWSL) {
    // Build manifest from server mods directory
    console.log('Mode: WSL Server Export\n');
    const modsDir = path.join(INSTANCE_PATH, 'mods');
    const modFiles = fs.readdirSync(modsDir).filter(f => f.endsWith('.jar'));
    console.log(`Found ${modFiles.length} mods in server`);

    manifest = {
      minecraft: { version: '1.20.1', modLoaders: [{ id: 'forge-47.4.0', primary: true }] },
      manifestType: 'minecraftModpack',
      manifestVersion: 1,
      name: 'Grudge Factions',
      version: '1.1.0',
      author: 'GrudgeFactions',
      overrides: 'overrides',
      // Note: WSL export uses overrides/mods instead of CurseForge file IDs
    };
  } else {
    // CurseForge instance mode (original behavior)
    console.log('Mode: CurseForge Instance Export\n');
    const instanceFile = path.join(INSTANCE_PATH, 'minecraftinstance.json');
    if (!fs.existsSync(instanceFile)) {
      console.error(`ERROR: Cannot find ${instanceFile}`);
      process.exit(1);
    }

    const instance = JSON.parse(fs.readFileSync(instanceFile, 'utf-8'));
    const addons = instance.installedAddons || [];
    const files = addons
      .filter(a => a.installedFile && a.addonID && a.isEnabled !== false)
      .map(a => ({ projectID: a.addonID, fileID: a.installedFile.id, required: true }));
    console.log(`Found ${files.length} mods to include`);

    manifest = {
      minecraft: {
        version: instance.gameVersion || '1.20.1',
        modLoaders: [{ id: instance.baseModLoader?.name || 'forge-47.4.0', primary: true }],
      },
      manifestType: 'minecraftModpack',
      manifestVersion: 1,
      name: instance.name || 'Grudge Factions',
      version: '1.1.0',
      author: 'GrudgeFactions',
      files,
      overrides: 'overrides',
    };
  }

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

  // Add override folders (skip server-only scripts)
  for (const folder of OVERRIDE_FOLDERS) {
    const folderPath = path.join(INSTANCE_PATH, folder);
    if (fs.existsSync(folderPath)) {
      if (folder === 'kubejs') {
        // For kubejs, add but skip server-only scripts
        console.log(`  + overrides/${folder}/ (filtering server-only scripts)`);
        archive.directory(folderPath, `overrides/${folder}`, (entry) => {
          const basename = path.basename(entry.name);
          if (SERVER_ONLY_SCRIPTS.includes(basename)) {
            console.log(`    - skipping server-only: ${basename}`);
            return false;
          }
          return entry;
        });
      } else {
        console.log(`  + overrides/${folder}/`);
        archive.directory(folderPath, `overrides/${folder}`);
      }
    } else {
      console.log(`  - skipping ${folder}/ (not found)`);
    }
  }

  // For WSL mode: also include the mods themselves
  if (isWSL) {
    const modsDir = path.join(INSTANCE_PATH, 'mods');
    console.log('  + overrides/mods/ (all server jars)');
    archive.directory(modsDir, 'overrides/mods');
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
