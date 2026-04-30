import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distBusiness = path.join(projectRoot, 'dist-business');
const distAdmin = path.join(projectRoot, 'dist-admin');
const publicDir = path.join(projectRoot, 'public');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function main() {
  try {
    console.log('Merging build outputs...\n');

    if (!fs.existsSync(distBusiness)) throw new Error(`Business build directory not found: ${distBusiness}`);
    if (!fs.existsSync(distAdmin)) throw new Error(`Admin build directory not found: ${distAdmin}`);

    console.log('1. Copying admin.html as admin/index.html...');
    const adminHtmlSrc = path.join(distAdmin, 'admin.html');
    const adminDir = path.join(distBusiness, 'admin');
    const adminIndexDest = path.join(adminDir, 'index.html');

    // Ensure admin directory exists
    if (!fs.existsSync(adminDir)) {
      fs.mkdirSync(adminDir, { recursive: true });
    }

    if (fs.existsSync(adminHtmlSrc)) {
      fs.copyFileSync(adminHtmlSrc, adminIndexDest);
      console.log(`  ✓ Copied to admin/index.html\n`);
    }

    console.log('2. Copying admin assets...');
    const adminAssetsDir = path.join(distBusiness, 'admin', 'assets');
    const adminAssetsSrc = path.join(distAdmin, 'assets');
    if (fs.existsSync(adminAssetsSrc)) {
      // Only clear assets, not the entire admin directory (which now contains index.html)
      if (fs.existsSync(adminAssetsDir)) {
        fs.rmSync(adminAssetsDir, { recursive: true });
      }
      fs.mkdirSync(adminAssetsDir, { recursive: true });
      copyDirRecursive(adminAssetsSrc, adminAssetsDir);
      console.log(`  ✓ Copied\n`);
    }

    console.log('3. Copying router.html...');
    const routerHtmlSrc = path.join(publicDir, 'router.html');
    const routerHtmlDest = path.join(distBusiness, 'router.html');
    if (fs.existsSync(routerHtmlSrc)) {
      fs.copyFileSync(routerHtmlSrc, routerHtmlDest);
      console.log(`  ✓ Copied\n`);
    }

    console.log('4. Verifying output structure...');
    const expectedFiles = ['business.html', 'admin/index.html', 'router.html', 'index.html'];
    const expectedDirs = ['assets', 'admin/assets'];

    for (const file of expectedFiles) {
      const filePath = path.join(distBusiness, file);
      console.log(`  ${fs.existsSync(filePath) ? '✓' : '✗'} ${file}`);
    }
    for (const dir of expectedDirs) {
      const dirPath = path.join(distBusiness, dir);
      console.log(`  ${fs.existsSync(dirPath) ? '✓' : '✗'} ${dir}/`);
    }

    console.log('\nBuild merge completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

main();
