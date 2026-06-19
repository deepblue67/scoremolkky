const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const bundledNodeModules = path.join(
  process.env.USERPROFILE || '',
  '.cache',
  'codex-runtimes',
  'codex-primary-runtime',
  'dependencies',
  'node',
  'node_modules'
);

if (fs.existsSync(bundledNodeModules)) {
  process.env.NODE_PATH = [
    process.env.NODE_PATH,
    bundledNodeModules,
    path.join(bundledNodeModules, '.pnpm', 'node_modules'),
  ].filter(Boolean).join(path.delimiter);
  Module._initPaths();
}

const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.png': 'image/png',
    '.ttf': 'font/ttf',
  }[ext] || 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.resolve(ROOT, `.${pathname}`);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType(filePath),
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function closeServer(server) {
  await new Promise(resolve => server.close(resolve));
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    html: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  assert.ok(metrics.body <= metrics.viewport + 1, `${label}: body horizontal overflow`);
  assert.ok(metrics.html <= metrics.viewport + 1, `${label}: html horizontal overflow`);
}

async function assertTouchTargets(page, label) {
  const failures = await page.evaluate(() => {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      '[role="button"]',
      '[role="switch"]',
    ].join(',');
    const seen = new Set();
    return Array.from(document.querySelectorAll(selectors))
      .filter(el => {
        if (seen.has(el)) return false;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== 'hidden' &&
          style.display !== 'none';
      })
      .map(el => {
        const rect = el.getBoundingClientRect();
        return {
          label: el.getAttribute('aria-label') || el.textContent.trim().replace(/\s+/g, ' ').slice(0, 60),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter(item => item.width < 44 || item.height < 44);
  });
  assert.deepEqual(failures, [], `${label}: touch targets below 44px`);
}

async function assertVisibleFocus(page) {
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    const style = getComputedStyle(el);
    return {
      tag: el.tagName,
      text: el.textContent.trim().slice(0, 40),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });
  const hasOutline = focus.outlineStyle !== 'none' && parseFloat(focus.outlineWidth) > 0;
  const hasShadow = focus.boxShadow && focus.boxShadow !== 'none';
  assert.ok(hasOutline || hasShadow, `Focused element has no visible focus: ${JSON.stringify(focus)}`);
}

async function assertPrimaryHomeActionsVisible(page) {
  const failures = await page.evaluate(() => {
    const viewportHeight = window.innerHeight;
    return Array.from(document.querySelectorAll('button'))
      .filter(el => /Nouvelle Partie|Historique|Réglages|RÃ©glages/i.test(el.textContent))
      .map(el => {
        const rect = el.getBoundingClientRect();
        return {
          label: el.textContent.trim().replace(/\s+/g, ' '),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
        };
      })
      .filter(item => item.top < 0 || item.bottom > viewportHeight + 1);
  });
  assert.deepEqual(failures, [], 'home: primary actions should be visible without scrolling');
}

async function seedHistory(page) {
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('molky_history_v2', JSON.stringify([{
      id: 1,
      date: Date.now(),
      label: 'Audit mobile',
      duration: 300000,
      targetScore: 50,
      winner: 'Alpha',
      winnerColor: '#E74C3C',
      teams: [
        { name: 'Alpha', color: '#E74C3C', score: 50, totalThrows: 5, totalScore: 50, maxThrow: 12, overflows: 0, misses: 0 },
        { name: 'Beta', color: '#3498DB', score: 32, totalThrows: 5, totalScore: 32, maxThrow: 10, overflows: 1, misses: 1 },
      ],
    }]));
  });
}

async function auditHomeAndSetup(page, baseUrl) {
  await page.goto(`${baseUrl}/index.html?a11y=${Date.now()}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('h1');
  await assertNoHorizontalOverflow(page, 'home');
  await assertTouchTargets(page, 'home');
  await assertPrimaryHomeActionsVisible(page);
  await assertVisibleFocus(page);

  await page.getByRole('button', { name: /Nouvelle partie/i }).click();
  await page.getByLabel('Nom de la partie').fill('Audit mobile');
  await page.getByLabel("Nom de l'équipe 1").fill('Alpha');
  await page.getByLabel("Nom de l'équipe 2").fill('Beta');
  await assertNoHorizontalOverflow(page, 'setup');
  await assertTouchTargets(page, 'setup');

  await page.getByRole('button', { name: /Démarrer/i }).click();
  await page.getByText('Tour de Alpha', { exact: false }).waitFor();
  await assertNoHorizontalOverflow(page, 'game');
  await assertTouchTargets(page, 'game');
}

async function auditHistoryKeyboard(page, baseUrl) {
  await page.goto(`${baseUrl}/index.html?history=${Date.now()}`);
  await seedHistory(page);
  await page.reload();
  await page.getByRole('button', { name: /Historique/i }).click();
  await page.getByText('Audit mobile', { exact: true }).waitFor();
  await assertNoHorizontalOverflow(page, 'history');
  await assertTouchTargets(page, 'history');

  await page.getByRole('button', { name: /Audit mobile, gagnée par Alpha/i }).focus();
  await page.keyboard.press('Enter');
  await page.getByText('Détail partie', { exact: false }).waitFor();
}

async function main() {
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 320, height: 568 },
      isMobile: true,
      hasTouch: true,
      serviceWorkers: 'allow',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);

    await auditHomeAndSetup(page, baseUrl);
    await auditHistoryKeyboard(page, baseUrl);

    console.log('Mobile accessibility tests passed');
  } finally {
    await browser.close().catch(() => {});
    await closeServer(server).catch(() => {});
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
