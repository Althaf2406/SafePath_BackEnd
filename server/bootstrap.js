/**
 * SafePath Bootstrap Installer
 * Downloads missing npm packages directly from the npm registry
 * using only Node.js built-ins (https + zlib + tar via child_process).
 * Run with: /Users/student/Library/Caches/ms-playwright-go/1.57.0/node bootstrap.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const zlib = require('zlib');

const NODE_MODULES = path.join(__dirname, 'node_modules');

// Packages to install: [name, version]
const PACKAGES = [
  ['bcryptjs',     '2.4.3'],
  ['jsonwebtoken', '9.0.2'],
  ['jws',          '3.2.2'],
  ['jwa',          '1.4.1'],
  ['safe-buffer',  '5.2.1'],
  ['ecdsa-sig-formatter', '1.0.11'],
  ['geolib',       '3.3.4'],
];

function download(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          makeRequest(res.headers.location);
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    makeRequest(url);
  });
}

async function installPackage(name, version) {
  const destDir = path.join(NODE_MODULES, name);
  if (fs.existsSync(destDir)) {
    console.log(`  ✓ ${name}@${version} already installed`);
    return;
  }

  console.log(`  ↓ Downloading ${name}@${version}...`);
  const url = `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`;
  const tgzBuffer = await download(url);

  // Write tgz to tmp
  const tmpFile = path.join(__dirname, `_tmp_${name}.tgz`);
  fs.writeFileSync(tmpFile, tgzBuffer);

  // Extract: tar strips the leading "package/" directory from npm tarballs
  fs.mkdirSync(destDir, { recursive: true });
  execSync(`tar -xzf "${tmpFile}" -C "${destDir}" --strip-components=1`);
  fs.unlinkSync(tmpFile);

  console.log(`  ✓ ${name}@${version} installed`);
}

async function main() {
  console.log('\n🚀 SafePath Bootstrap Installer\n');
  fs.mkdirSync(NODE_MODULES, { recursive: true });

  for (const [name, version] of PACKAGES) {
    try {
      await installPackage(name, version);
    } catch (err) {
      console.error(`  ✗ Failed to install ${name}: ${err.message}`);
    }
  }

  console.log('\n✅ Done! Starting server...\n');

  // Start the server using the same node binary
  const { spawn } = require('child_process');
  const server = spawn(process.execPath, ['src/server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  server.on('exit', (code) => process.exit(code));
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
