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

async function clickText(page, text) {
  await page.getByText(text, { exact: false }).first().click();
}

async function startGame(page, baseUrl, options = {}) {
  await page.goto(`${baseUrl}/index.html?test=${Date.now()}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('h1');

  await clickText(page, 'Nouvelle partie');
  await page.getByLabel("Nom de l'équipe 1").fill('Alpha');
  await page.getByLabel("Nom de l'équipe 2").fill('Beta');
  if (options.targetScore) {
    await page.getByRole('button', { name: String(options.targetScore), exact: false }).click();
  }
  if (options.missLimit) {
    await page.getByRole('button', { name: new RegExp(`^${options.missLimit}\\b`) }).click();
  }
  if (options.overflowGrace) {
    await page.getByRole('button', { name: new RegExp(`\\+${options.overflowGrace} essai`) }).click();
  }
  await page.getByRole('button', { name: /Démarrer/i }).click();
  await page.getByText('Tour de', { exact: false }).waitFor();
}

async function selectPin(page, pin) {
  await page.getByRole('button', { name: `Quille ${pin}`, exact: true }).click();
}

async function validateThrow(page) {
  await page.getByRole('button', { name: /Valider le lancer sélectionné/i }).click();
}

async function missThrow(page) {
  await page.getByRole('button', { name: /lancer raté/i }).click();
}

async function closeEventPopup(page) {
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: /OK/i }).click();
}

async function playSinglePin(page, pin) {
  await selectPin(page, pin);
  await validateThrow(page);
}

async function advanceOtherTeamWithOnePoint(page) {
  await playSinglePin(page, 1);
}

async function testThrowUndoAndMiss(page, baseUrl) {
  await startGame(page, baseUrl);

  await selectPin(page, 2);
  await validateThrow(page);
  await page.getByText('Tour de Beta', { exact: false }).waitFor();
  await assertScore(page, 'Alpha', '2');

  await page.getByRole('button', { name: /Annuler le dernier lancer/i }).click();
  await page.getByText('Tour de Alpha', { exact: false }).waitFor();
  await assertScore(page, 'Alpha', '0');

  await missThrow(page);
  await page.getByText('Tour de Beta', { exact: false }).waitFor();
}

async function assertScore(page, teamName, score) {
  const scoreText = await page.locator('.team-score-card', { hasText: teamName }).first().locator('.team-score-value').textContent();
  assert.equal(scoreText.trim(), score);
}

async function testWinAndHistory(page, baseUrl) {
  await startGame(page, baseUrl, { targetScore: 30 });

  await playSinglePin(page, 12);
  await missThrow(page);
  await playSinglePin(page, 12);
  await missThrow(page);
  await playSinglePin(page, 6);

  await page.getByText('Victoire', { exact: false }).waitFor();
  await page.getByText('Alpha', { exact: false }).first().waitFor();
  const victoryText = await page.textContent('body');
  assert.match(victoryText, /Lancers\s*3/i);

  await page.getByRole('button', { name: /Accueil/i }).click();
  await page.getByRole('button', { name: /Historique/i }).click();
  await page.getByText('Alpha', { exact: false }).first().waitFor();
}

async function testOverflowGraceAndPenalty(page, baseUrl) {
  await startGame(page, baseUrl, {
    targetScore: 30,
    missLimit: 4,
    overflowGrace: 1,
  });

  await playSinglePin(page, 12);
  await advanceOtherTeamWithOnePoint(page);
  await playSinglePin(page, 12);
  await advanceOtherTeamWithOnePoint(page);
  await playSinglePin(page, 4);
  await advanceOtherTeamWithOnePoint(page);
  await assertScore(page, 'Alpha', '28');

  await playSinglePin(page, 5);
  await closeEventPopup(page);
  await assertScore(page, 'Alpha', '28');

  await advanceOtherTeamWithOnePoint(page);
  await playSinglePin(page, 5);
  await closeEventPopup(page);
  await assertScore(page, 'Alpha', '25');
}

async function testEliminationWin(page, baseUrl) {
  await startGame(page, baseUrl, { missLimit: 2 });

  await playSinglePin(page, 1);
  await missThrow(page);
  await playSinglePin(page, 1);
  await missThrow(page);

  await closeEventPopup(page);
  await page.getByText('Victoire', { exact: false }).waitFor();
  await page.getByText('Alpha', { exact: false }).first().waitFor();
}

async function testOfflineReload(page, baseUrl, server) {
  await page.goto(`${baseUrl}/index.html?offline=${Date.now()}`);
  await page.waitForSelector('h1');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    await reg.update();
  });
  await page.reload();
  await page.waitForSelector('h1');
  await closeServer(server);

  await page.reload();
  await page.waitForSelector('h1');
  assert.equal(await page.title(), 'Mölkky Score');
  assert.match(await page.textContent('body'), /MÖLKKY/);
}

async function main() {
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: 'allow',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);

    await testThrowUndoAndMiss(page, baseUrl);
    await testWinAndHistory(page, baseUrl);
    await testOverflowGraceAndPenalty(page, baseUrl);
    await testEliminationWin(page, baseUrl);
    await testOfflineReload(page, baseUrl, server);

    console.log('Functional tests passed');
  } finally {
    await browser.close().catch(() => {});
    if (server.listening) await closeServer(server).catch(() => {});
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
