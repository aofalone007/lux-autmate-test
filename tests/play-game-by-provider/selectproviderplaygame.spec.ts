import { test, expect, BrowserContext, Page } from '@playwright/test';
import { LoginPageMember }                     from '../../pages/LoginPageMember';
import { LobbyPage, GameResult }    from '../../pages/LobbyGamePage';
import { GamePage }                            from '../../pages/GamePage';
import { PROVIDER_LIST }                       from '../test-data/providers';

const CREDENTIALS = {
  username: '0668854456',
  password: 'test123123',
};

const TIMING = {
  errorDialogTimeout: 6_000,  
  newTabTimeout:      10_000,
  betweenGames:       500,
};

// ─── Helper ───────────────────────────────────────────────────────────────────

async function testGameInNewTab(
  context:      BrowserContext,
  lobbyPage:    LobbyPage,
  getLobbyPage: () => Page,
  gameIndex:    number,
  gameName:     string,
  providerName: string,
): Promise<GameResult> {

  try {
    // รอ new tab เปิดพร้อมกับ click play
    const [newTab] = await Promise.all([
      context.waitForEvent('page', { timeout: TIMING.newTabTimeout }),
      lobbyPage.hoverAndPlayGame(gameIndex),
    ]);

    await newTab.waitForLoadState('domcontentloaded').catch(() => {});

    const gamePage = new GamePage(newTab);

    // ─── เงื่อนไข pass/fail ─────────────────────────────────────────────────
    // รอ errorDialogTimeout ms
    //   → ถ้าเจอ error dialog = FAIL
    //   → ถ้าหมดเวลาโดยไม่เจอ error dialog = PASS
    const outcome = await gamePage.waitForLoadOrError(TIMING.errorDialogTimeout);

    let result: GameResult;

    if (outcome === 'error') {
      // ❌ FAIL — เจอ Internal Server Error dialog
      const err = await gamePage.getErrorDetails();
      result = {
        index:        gameIndex,
        gameName,
        provider:     providerName,
        status:       'error',
        errorMessage: err.message,
        traceId:      err.traceId,
        gameUrl:      newTab.url(),
      };
      console.log(`  ❌ FAIL [${gameIndex + 1}] ${gameName}`);
      console.log(`         Error   : ${err.message}`);
      console.log(`         TraceID : ${err.traceId ?? 'N/A'}`);
      console.log(`         URL     : ${newTab.url()}`);
    } else {
      // ✅ PASS — ไม่เจอ error dialog ภายใน timeout
      result = {
        index:    gameIndex,
        gameName,
        provider: providerName,
        status:   'success',
        gameUrl:  newTab.url(),
      };
      console.log(`  ✅ PASS [${gameIndex + 1}] ${gameName}`);
    }

    await newTab.close();
    try { await getLobbyPage().bringToFront(); } catch { }

    return result;

  } catch (e: any) {
    const reason = e?.message ?? 'Unknown';
    console.warn(`  ⏭️  SKIP [${gameIndex + 1}] ${gameName} — ${reason}`);
    try { await getLobbyPage().bringToFront(); } catch { }

    return {
      index:        gameIndex,
      gameName,
      provider:     providerName,
      status:       'error',
      errorMessage: `SKIPPED: ${reason}`,
    };
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function runProviderTest(
  page:         Page,
  context:      BrowserContext,
  providerName: string,
  providerId:   string,
) {
  const results: GameResult[] = [];

  // 1. Login
  console.log('\n══════════════════════════════════════════');
  console.log(`🔐 Login → ${providerName}`);
  console.log('══════════════════════════════════════════');
  const loginPage = new LoginPageMember(page);
  await loginPage.goto('en');
  await loginPage.closeModalIfVisible();
  await loginPage.login(CREDENTIALS.username, CREDENTIALS.password);
  await loginPage.closeTooltip().catch(() => {});

  // 2. Lobby
  const lobbyPage = new LobbyPage(page);
  await lobbyPage.goto();

  // 3. Select provider
  await lobbyPage.selectProvider(providerId);

  // 4. Count + names
  const gameCount = await lobbyPage.getGameCount();
  if (gameCount === 0) { console.warn('⚠️  No games'); return; }

  const gameNames: string[] = [];
  for (let i = 0; i < gameCount; i++) {
    gameNames.push(await lobbyPage.getGameName(i));
  }

  const estMin = Math.ceil((gameCount * (TIMING.errorDialogTimeout + TIMING.betweenGames)) / 60000);
  console.log(`\n▶ ${gameCount} games — est. ~${estMin} min\n`);
  console.log('Condition: ✅ PASS = no error dialog | ❌ FAIL = Internal Server Error dialog\n');

  // 5. Loop
  for (let i = 0; i < gameCount; i++) {
    console.log(`[${i + 1}/${gameCount}] ${gameNames[i]}`);

    const result = await testGameInNewTab(
      context,
      lobbyPage,
      () => context.pages().find(p => p.url().includes('/games?')) ?? page,
      i,
      gameNames[i],
      providerName,
    );

    results.push(result);

    const current = context.pages().find(p => p.url().includes('/games?')) ?? page;
    await current.waitForTimeout(TIMING.betweenGames).catch(() => {});
  }

  // 6. Summary
  const passed  = results.filter(r => r.status === 'success');
  const errored = results.filter(r => r.status === 'error' && !r.errorMessage?.startsWith('SKIPPED'));
  const skipped = results.filter(r => r.errorMessage?.startsWith('SKIPPED'));

  console.log('\n══════════════════════════════════════════');
  console.log(`📊 RESULT — ${providerName}`);
  console.log(`   Total        : ${results.length}`);
  console.log(`   ✅ PASS      : ${passed.length}  (no error dialog)`);
  console.log(`   ❌ FAIL      : ${errored.length}  (Internal Server Error)`);
  console.log(`   ⏭️  SKIPPED   : ${skipped.length}  (play button not found)`);
  console.log('══════════════════════════════════════════');

  if (errored.length > 0) {
    console.log('\n❌ Failed games (Internal Server Error):');
    errored.forEach((r, n) => {
      console.log(`  ${n + 1}. ${r.gameName}`);
      console.log(`     Error   : ${r.errorMessage}`);
      console.log(`     TraceID : ${r.traceId ?? 'N/A'}`);
      console.log(`     URL     : ${r.gameUrl}`);
    });
  }

  // 7. Report
  await test.info().attach(`${providerName}-results.json`, {
    body: Buffer.from(JSON.stringify({
      provider:   providerName,
      condition:  'PASS = no error dialog | FAIL = Internal Server Error dialog',
      total:      results.length,
      passed:     passed.length,
      failed:     errored.length,
      skipped:    skipped.length,
      games:      results,
    }, null, 2)),
    contentType: 'application/json',
  });

  // 8. Fail test ถ้ามี game ที่เจอ Internal Server Error
  expect(
    errored,
    `\n${errored.length} game(s) showed "Internal Server Error":\n` +
    errored.map(r =>
      `  • ${r.gameName}\n` +
      `    TraceID : ${r.traceId ?? 'N/A'}\n` +
      `    URL     : ${r.gameUrl}`
    ).join('\n')
  ).toHaveLength(0);

  expect(errored).toHaveLength(0)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const PER_PROVIDER_TIMEOUT = 30 * 60 * 1000; // 30 min

test.describe('Game Functional Test — All Providers', () => {

  for (const provider of PROVIDER_LIST) {
    test(`${provider.name} — play all games`, async ({ page, context }) => {
      test.setTimeout(PER_PROVIDER_TIMEOUT);
      await runProviderTest(page, context, provider.name, provider.id);
    });
  }

});