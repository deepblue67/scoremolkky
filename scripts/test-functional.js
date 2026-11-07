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
  if (options.gameLabel) {
    await page.getByLabel('Nom de la partie').fill(options.gameLabel);
  }
  await page.getByLabel("Nom de l'équipe 1").fill('Alpha');
  await page.getByLabel("Nom de l'équipe 2").fill('Beta');
  if (options.extraTeams) {
    for (let i = 0; i < options.extraTeams.length; i += 1) {
      await page.getByRole('button', { name: /Ajouter une/i }).click();
      const teamNumber = i + 3;
      await page.getByLabel(new RegExp(`Nom de l'.*quipe ${teamNumber}`)).fill(options.extraTeams[i]);
    }
  }
  if (options.moveBetaFirst) {
    await page.getByRole('button', { name: /Monter Beta/i }).click();
  }
  if (options.targetScore) {
    await page.getByRole('button', { name: String(options.targetScore), exact: false }).click();
  }
  if (options.missLimit) {
    await page.getByRole('button', { name: new RegExp(`^${options.missLimit} \\(`) }).click();
  }
  if (options.overflowGrace) {
    await page.getByRole('button', { name: new RegExp(`\\+${options.overflowGrace} essai`) }).click();
  }
  await page.getByRole('button', { name: /Démarrer/i }).click();
  await page.getByText('Tour de', { exact: false }).waitFor();
}

async function testSetupLabelAndTeamOrder(page, baseUrl) {
  await startGame(page, baseUrl, {
    gameLabel: 'Finale barbecue',
    moveBetaFirst: true,
  });

  await page.getByText('Tour de Beta', { exact: false }).waitFor();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('molky_current_game_v2')));
  assert.equal(saved.gameLabel, 'Finale barbecue');
  assert.deepEqual(saved.teams.map(team => team.name), ['Beta', 'Alpha']);
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

async function testCurrentMatchHistory(page, baseUrl) {
  await startGame(page, baseUrl);

  await playSinglePin(page, 7);
  await missThrow(page);
  await playSinglePin(page, 1);

  await page.getByRole('button', { name: /historique des coups/i }).click();
  const sheet = page.getByRole('dialog', { name: /Coups joués/i });
  await sheet.waitFor();
  await sheet.getByText('Round 1', { exact: true }).waitFor();
  await sheet.getByText('Round 2', { exact: true }).waitFor();
  const roundTitles = await page.locator('.match-history-round-title').allTextContents();
  assert.deepEqual(roundTitles.map(text => text.trim()), ['Round 1', 'Round 2']);
  await sheet.getByText('+7', { exact: true }).waitFor();
  await sheet.getByText('Raté', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Fermer l'historique des coups/i }).click();
}

async function testScoreboardShowsAllTeams(page, baseUrl) {
  await startGame(page, baseUrl, {
    extraTeams: ['Gamma', 'Delta', 'Epsilon', 'Zeta'],
  });

  // Les 6 équipes sont visibles en même temps, sans défilement.
  const metrics = await page.evaluate(() => {
    const board = document.querySelector('.scoreboard');
    const cards = Array.from(document.querySelectorAll('.team-score-card')).map(card => card.getBoundingClientRect());
    return {
      count: cards.length,
      allInside: cards.every(r => r.left >= 0 && r.right <= window.innerWidth && r.top >= 0 && r.bottom <= window.innerHeight),
      scrolls: board.scrollWidth > board.clientWidth + 1 || board.scrollHeight > board.clientHeight + 1,
      minWidth: Math.round(Math.min(...cards.map(r => r.width))),
    };
  });

  assert.equal(metrics.count, 6);
  assert.ok(metrics.allInside, `toutes les équipes doivent être visibles : ${JSON.stringify(metrics)}`);
  assert.ok(!metrics.scrolls, `le tableau ne doit pas défiler : ${JSON.stringify(metrics)}`);
  assert.ok(metrics.minWidth >= 150, `tuiles trop étroites : ${JSON.stringify(metrics)}`);
}

async function assertScore(page, teamName, score) {
  const scoreText = await page.locator('.team-score-card', { hasText: teamName }).first().locator('.team-score-current-value').textContent();
  assert.equal(scoreText.trim(), score);
}

async function testWinAndHistory(page, baseUrl) {
  await startGame(page, baseUrl, { targetScore: 30, gameLabel: 'Match du soir' });

  await playSinglePin(page, 12);
  await missThrow(page);
  await playSinglePin(page, 12);
  await missThrow(page);
  await playSinglePin(page, 6);

  await page.getByText('Victoire', { exact: false }).waitFor();
  await page.getByText('Alpha', { exact: false }).first().waitFor();
  const throwsStat = await page.locator('.stat', { hasText: 'Lancers' }).locator('.stat-value').textContent();
  assert.equal(throwsStat.trim(), '3');

  await page.getByRole('button', { name: /Accueil/i }).click();
  await page.getByRole('button', { name: /Historique/i }).click();
  await page.getByText('Alpha', { exact: false }).first().waitFor();
  await page.getByText('Match du soir', { exact: true }).waitFor();
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

  // L'aperçu tient compte de l'essai de grâce : le score resterait à 28.
  await selectPin(page, 5);
  assert.equal((await page.locator('.score-col-value.overflow').textContent()).trim(), '28');
  await validateThrow(page);
  await closeEventPopup(page);
  await assertScore(page, 'Alpha', '28');

  await advanceOtherTeamWithOnePoint(page);
  await playSinglePin(page, 5);
  await closeEventPopup(page);
  // Cible 30 : on retombe à la moitié de la cible.
  await assertScore(page, 'Alpha', '15');
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

async function openSetup(page, baseUrl) {
  await page.goto(`${baseUrl}/index.html?setup=${Date.now()}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('h1');
  await clickText(page, 'Nouvelle partie');
}

async function testHandicapClampedWhenTargetChanges(page, baseUrl) {
  await openSetup(page, baseUrl);
  const plus = page.getByRole('button', { name: /Augmenter le handicap de Équipe 1/i });
  for (let i = 0; i < 12; i += 1) {
    if (await plus.isDisabled()) break;
    await plus.click();
  }
  assert.ok(await plus.isDisabled(), 'le bouton + doit être bloqué au maximum');
  await page.getByText('+45 pts', { exact: true }).waitFor();
  await page.getByRole('button', { name: '30', exact: true }).click();
  await page.getByText('+25 pts', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Démarrer/i }).click();
  await assertScore(page, 'Équipe 1', '25');
}

async function testUniqueColorsAndNames(page, baseUrl) {
  await openSetup(page, baseUrl);
  await page.getByRole('button', { name: /Ajouter une/i }).click();
  await page.getByRole('button', { name: /Supprimer Équipe 2/i }).click();
  await page.getByRole('button', { name: /Ajouter une/i }).click();
  const colors = await page.locator('.team-color-dot').evaluateAll(dots => dots.map(dot => getComputedStyle(dot).backgroundColor));
  assert.equal(new Set(colors).size, colors.length, `couleurs en double : ${colors.join(', ')}`);

  await page.getByLabel("Nom de l'équipe 1").fill('Alpha');
  await page.getByLabel("Nom de l'équipe 2").fill(' alpha ');
  await page.getByRole('alert').waitFor();
  assert.ok(await page.getByRole('button', { name: /Démarrer/i }).isDisabled(), 'deux noms identiques doivent bloquer le démarrage');
  await page.getByLabel("Nom de l'équipe 2").fill('Beta');
  assert.ok(await page.getByRole('button', { name: /Démarrer/i }).isEnabled());
}

async function testPauseKeepsGameAndRestartKeepsHandicap(page, baseUrl) {
  await openSetup(page, baseUrl);
  await page.getByLabel("Nom de l'équipe 1").fill('Alpha');
  await page.getByLabel("Nom de l'équipe 2").fill('Beta');
  await page.getByRole('button', { name: /Augmenter le handicap de Beta/i }).click();
  await page.getByRole('button', { name: /Démarrer/i }).click();
  await assertScore(page, 'Beta', '5');

  await playSinglePin(page, 9);
  await page.getByRole('button', { name: /pause/i }).click();
  await page.getByRole('button', { name: /Retour à l'accueil/i }).click();
  await page.getByText('Partie en cours', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Reprendre la partie en cours/i }).click();
  await page.getByText('Tour de Beta', { exact: false }).waitFor();
  await assertScore(page, 'Alpha', '9');

  await page.getByRole('button', { name: /pause/i }).click();
  await page.getByRole('button', { name: /Recommencer la partie/i }).click();
  await page.getByText('Tour de Alpha', { exact: false }).waitFor();
  await assertScore(page, 'Alpha', '0');
  await assertScore(page, 'Beta', '5');

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: /pause/i }).click();
  await page.getByRole('button', { name: /Abandonner la partie/i }).click();
  await page.waitForSelector('h1');
  assert.equal(await page.evaluate(() => localStorage.getItem('molky_current_game_v2')), null);
}

async function testEndgameHelpAndLastChance(page, baseUrl) {
  await startGame(page, baseUrl, { targetScore: 30, missLimit: 2 });
  await playSinglePin(page, 12);
  await missThrow(page);
  await playSinglePin(page, 12);
  // Beta n'a plus qu'un raté avant l'élimination.
  await page.getByText('Dernier essai', { exact: true }).waitFor();
  await page.getByText("élimine l'équipe", { exact: true }).waitFor();
  await playSinglePin(page, 1);
  // Alpha : 24 points, il faut 6.
  await page.getByText('Il faut 6', { exact: true }).waitFor();
  const help = await page.evaluate(() => ({
    target: Array.from(document.querySelectorAll('.pin-btn.is-target')).map(el => el.textContent.trim()),
    over: document.querySelectorAll('.pin-btn.is-over').length,
  }));
  assert.deepEqual(help.target, ['6']);
  assert.equal(help.over, 6);
}

async function testPlayersRotationAndMemory(page, baseUrl) {
  await openSetup(page, baseUrl);
  await page.getByLabel("Nom de l'équipe 1").fill('Enfants');
  await page.getByLabel("Nom de l'équipe 2").fill('Papa');
  await page.getByLabel('Ajouter un joueur à Enfants').fill('Léo');
  await page.getByLabel('Ajouter un joueur à Enfants').press('Enter');
  await page.getByLabel('Ajouter un joueur à Enfants').fill('Emma');
  await page.getByRole('button', { name: /Démarrer/i }).click();
  await page.locator('.turn-player', { hasText: 'Léo' }).waitFor();
  await playSinglePin(page, 3);
  await missThrow(page);
  await page.locator('.turn-player', { hasText: 'Emma' }).waitFor();

  // La configuration suivante reprend équipes et joueurs.
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: /pause/i }).click();
  await page.getByRole('button', { name: /Abandonner la partie/i }).click();
  await clickText(page, 'Nouvelle partie');
  assert.equal(await page.getByLabel("Nom de l'équipe 1").inputValue(), 'Enfants');
  await page.locator('.player-chip', { hasText: 'Emma' }).waitFor();
  await page.getByRole('button', { name: /Remettre les réglages par défaut/i }).click();
  assert.equal(await page.getByLabel("Nom de l'équipe 1").inputValue(), 'Équipe 1');
  assert.equal(await page.locator('.player-chip').count(), 0);
}

async function testMatchTwoWinningManches(page, baseUrl) {
  await openSetup(page, baseUrl);
  await page.getByLabel("Nom de l'équipe 1").fill('Alpha');
  await page.getByLabel("Nom de l'équipe 2").fill('Beta');
  await page.getByRole('button', { name: '30', exact: true }).click();
  await page.getByRole('button', { name: '2 manches gagnantes' }).click();
  await page.getByRole('button', { name: /Démarrer/i }).click();

  async function alphaWinsFromStart(alphaFirst) {
    const betaPlays = () => playSinglePin(page, 1);
    if (!alphaFirst) await betaPlays();
    await playSinglePin(page, 12);
    await betaPlays();
    await playSinglePin(page, 12);
    await betaPlays();
    await playSinglePin(page, 6);
  }

  await alphaWinsFromStart(true);
  await page.getByText('Manche 1 gagnée', { exact: true }).waitFor();
  await page.getByRole('button', { name: /Manche 2/ }).click();
  // Le dernier du classement (Beta) commence la manche suivante.
  await page.getByText('Tour de Beta', { exact: false }).waitFor();
  await page.locator('.turn-round', { hasText: 'manche 2' }).waitFor();
  await alphaWinsFromStart(false);
  await page.getByText('Match gagné !', { exact: true }).waitFor();
  const board = await page.locator('.match-board-team', { hasText: 'Alpha' }).locator('.num').textContent();
  assert.equal(board.trim(), '2');

  await page.getByRole('button', { name: /Accueil/i }).click();
  await page.getByRole('button', { name: /Historique/i }).click();
  assert.equal(await page.locator('.history-item').count(), 2);
}

async function testSettingsFieldLayoutAndWakeLock(page, baseUrl) {
  await page.goto(`${baseUrl}/index.html?prefs=${Date.now()}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /réglages/i }).click();
  await page.getByRole('button', { name: 'Comme sur le terrain' }).click();
  await page.getByRole('button', { name: /Retour/ }).click();
  const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('molky_prefs_v1')));
  assert.equal(prefs.pinLayout, 'field');

  await clickText(page, 'Nouvelle partie');
  await page.getByRole('button', { name: /Démarrer/i }).click();
  const rows = await page.locator('.pins-grid.is-field .pins-row').evaluateAll(list => list.map(row => row.textContent.replace(/\s+/g, ' ').trim()));
  assert.deepEqual(rows, ['798', '511126', '3104', '12']);
  const wakeCalls = await page.evaluate(() => window.__wakeLockCalls || 0);
  assert.ok(wakeCalls >= 1, "l'écran doit être maintenu allumé pendant la partie");
}

async function testExportImportBetweenDevices(page, baseUrl) {
  // « Appareil A » : une partie gagnée avec des joueurs.
  await openSetup(page, baseUrl);
  await page.getByLabel("Nom de l'équipe 1").fill('Enfants');
  await page.getByLabel("Nom de l'équipe 2").fill('Papa');
  await page.getByLabel('Ajouter un joueur à Enfants').fill('Zoé');
  await page.getByRole('button', { name: '30', exact: true }).click();
  await page.getByRole('button', { name: /Démarrer/i }).click();
  await playSinglePin(page, 12);
  await missThrow(page);
  await playSinglePin(page, 12);
  await missThrow(page);
  await playSinglePin(page, 6);
  await page.getByText('Victoire', { exact: false }).waitFor();
  await page.getByRole('button', { name: /Accueil/i }).click();

  await page.getByRole('button', { name: /réglages/i }).click();
  await page.getByRole('button', { name: /Exporter mes données/ }).click();
  await page.getByText('1 partie · 2 joueurs', { exact: false }).waitFor();
  const code = await page.getByLabel("Code d'export").inputValue();
  assert.ok(code.startsWith('MOLKKY1:'));

  // « Appareil B » : tout est vide, on colle le code.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /réglages/i }).click();
  await page.getByRole('button', { name: /Importer des données/ }).click();
  await page.getByLabel('Code à importer').fill('pas un code');
  await page.getByRole('alert').waitFor();
  await page.getByLabel('Code à importer').fill(code);
  await page.locator('.fact-list li', { hasText: 'Parties' }).waitFor();
  await page.getByRole('button', { name: /Ajouter à mes parties/ }).click();
  await page.getByText('1 partie ajoutée', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Terminé' }).click();
  await page.waitForSelector('h1');
  await page.getByRole('button', { name: /historique/i }).click();
  assert.equal(await page.locator('.history-item').count(), 1);
  await page.getByRole('tab', { name: 'Statistiques' }).click();
  await page.getByRole('button', { name: 'Statistiques de Zoé' }).waitFor();
}

async function testGuide(page, baseUrl) {
  await page.goto(`${baseUrl}/index.html?guide=${Date.now()}`);
  await page.waitForSelector('h1');
  await page.getByRole('button', { name: /réglages/i }).click();
  await page.getByRole('button', { name: /Comment utiliser l'application/ }).click();
  const titles = await page.locator('.guide-title').allTextContents();
  assert.deepEqual(titles.map(t => t.replace(/^\d+/, '').trim()), [
    "Installer l'application",
    'Préparer la partie',
    'Jouer un lancer',
    'La fin de partie',
    'Victoire, revanche et matchs',
    'Historique et statistiques',
    'Réglages et sauvegarde',
  ]);
  // Les maquettes ne sont pas des boutons cliquables.
  assert.equal(await page.locator('.guide-shot button').count(), 0);
  await page.getByRole('button', { name: /Retour aux réglages/ }).click();
  await page.getByText('Sauvegarde et transfert', { exact: true }).waitFor();
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
  assert.match(await page.textContent('body'), /Mölkky/);
}

async function main() {
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: 'allow',
    });
    // Simule l'API « écran allumé » pour vérifier qu'elle est bien demandée.
    await context.addInitScript(() => {
      window.__wakeLockCalls = 0;
      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: {
          request: () => {
            window.__wakeLockCalls += 1;
            return Promise.resolve({ release: () => Promise.resolve() });
          },
        },
      });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);

    await testSetupLabelAndTeamOrder(page, baseUrl);
    await testThrowUndoAndMiss(page, baseUrl);
    await testCurrentMatchHistory(page, baseUrl);
    await testScoreboardShowsAllTeams(page, baseUrl);
    await testWinAndHistory(page, baseUrl);
    await testOverflowGraceAndPenalty(page, baseUrl);
    await testEliminationWin(page, baseUrl);
    await testHandicapClampedWhenTargetChanges(page, baseUrl);
    await testUniqueColorsAndNames(page, baseUrl);
    await testPauseKeepsGameAndRestartKeepsHandicap(page, baseUrl);
    await testEndgameHelpAndLastChance(page, baseUrl);
    await testPlayersRotationAndMemory(page, baseUrl);
    await testMatchTwoWinningManches(page, baseUrl);
    await testSettingsFieldLayoutAndWakeLock(page, baseUrl);
    await testExportImportBetweenDevices(page, baseUrl);
    await testGuide(page, baseUrl);
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
