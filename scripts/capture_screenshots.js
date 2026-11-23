const fs = require('fs');
const path = require('path');
const http = require('http');

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  const puppeteer = require(path.join(__dirname, '../frontend/node_modules/puppeteer'));
  const outDir = path.join(__dirname, '../docs/screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Get creator token
  const creatorAuth = await postJson('http://127.0.0.1:8000/api/v1/auth/login', {
    email: 'alice@chainproof.io',
    password: 'SecurePassword123!',
  });
  console.log('Alice auth token acquired:', !!creatorAuth.access_token);

  // 2. Get admin token
  const adminAuth = await postJson('http://127.0.0.1:8000/api/v1/auth/login', {
    email: 'admin@chainproof.io',
    password: 'SecurePassword123!',
  });
  console.log('Admin auth token acquired:', !!adminAuth.access_token);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();

  // 1. Landing Page
  console.log('1. Capturing Landing Page...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '01_landing_page.png') });

  // 2. Set Alice auth token in localStorage
  await page.evaluate((auth) => {
    localStorage.setItem('chainproof_token', auth.access_token);
    localStorage.setItem(
      'chainproof_user',
      JSON.stringify({
        user_id: auth.user_id,
        email: auth.email,
        full_name: auth.full_name || 'Alice Vance',
        role: auth.role,
        account_status: 'ACTIVE',
      })
    );
  }, creatorAuth);

  // 3. Dashboard
  console.log('2. Capturing Dashboard...');
  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '02_dashboard.png') });

  // 4. Asset Registration
  console.log('3. Capturing Asset Registration...');
  await page.goto('http://127.0.0.1:5173/assets/new', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '03_asset_registration.png') });

  // 5. Asset Details
  console.log('4. Capturing Asset Details...');
  await page.goto('http://127.0.0.1:5173/assets/ast-8f4b2c1e-001', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '04_asset_details.png') });

  // 6. Verification Page
  console.log('5. Capturing Verification Page...');
  await page.goto('http://127.0.0.1:5173/verify', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '05_verification.png') });

  // 7. Analytics
  console.log('6. Capturing Analytics...');
  await page.goto('http://127.0.0.1:5173/analytics', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '06_analytics.png') });

  // 8. Set Admin auth token in localStorage
  console.log('7. Capturing Admin Dashboard...');
  await page.evaluate((auth) => {
    localStorage.setItem('chainproof_token', auth.access_token);
    localStorage.setItem(
      'chainproof_user',
      JSON.stringify({
        user_id: auth.user_id,
        email: auth.email,
        full_name: auth.full_name || 'Admin Root',
        role: auth.role,
        account_status: 'ACTIVE',
      })
    );
  }, adminAuth);
  await page.goto('http://127.0.0.1:5173/admin', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '07_admin_dashboard.png') });

  await browser.close();
  console.log('SUCCESS: All 7 required screenshots generated in docs/screenshots!');
}

run().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
