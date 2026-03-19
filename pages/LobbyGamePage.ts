import { Page, Locator } from '@playwright/test';

export interface GameResult {
  index:         number;
  gameName:      string;
  provider:      string;
  status:        'success' | 'error';
  errorMessage?: string;
  traceId?:      string;
  gameUrl?:      string;
}

export const PROVIDERS: Record<string, string> = {
  JILI:     'jili:0eb3bf56-b68a-11ec-ad96-96fadad72b89',
  PLAYNGO:  'playngo:YOUR-ID-HERE',
  BNG:      'bng:YOUR-ID-HERE',
  INOUT:    'zgmulti_inout:3251b2ae-dfcf-11f0-9c57-06f3ddf48b9d',
  SLOTMILL: 'slotmill:YOUR-ID-HERE',
  FACHAI:   'fachai:YOUR-ID-HERE',
  SPRIBE:   'spribe:YOUR-ID-HERE',
};

export class LobbyPage {
  readonly page:           Page;
  readonly gameCards:      Locator;
  readonly modalBody:      Locator;
  readonly modalCloseBtn:  Locator;
  readonly modalCloseBtnX: Locator;
  readonly allowBtn:       Locator;

  constructor(page: Page) {
    this.page            = page;
    this.gameCards       = page.locator('div.section-game > div.mx-0 > div.game-item');
    this.modalBody       = page.locator('#modal-popup___BV_modal_body_');
    this.modalCloseBtn   = page.locator('[data-testid="close-button"]');
    this.modalCloseBtnX  = page.locator('#modal-popup___BV_modal_body_ .close-btn-x');
    this.allowBtn        = page.locator('button.btn-allow');

  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async goto() {
    await this.page.goto('/en/lobby?category_name=all_game');
    await this.page.waitForLoadState('networkidle');
    await this.closeModalIfVisible();
  }

   // ─── Allow button ────────────────────────────────────────────────────────────
 
  async dismissAllowIfVisible() {
    const visible = await this.allowBtn.isVisible().catch(() => false);
    if (!visible) return;
    console.log('🔔 Allow — dismissing...');
    await this._clickWithFallback(this.allowBtn);
    await this.allowBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
 
  // ─── Modal ───────────────────────────────────────────────────────────────────
 
  async closeModalIfVisible() {
    try {
      await this.modalBody.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      return;
    }
 
    console.log('📢 Modal — closing...');
    await this.dismissAllowIfVisible();
 
    // Strategy 1: data-testid close button
    const closeBtnVisible = await this.modalCloseBtn.isVisible().catch(() => false);
    if (closeBtnVisible) {
      await this._clickWithFallback(this.modalCloseBtn);
      if (await this._waitModalHidden()) { console.log('✅ Modal closed'); return; }
    }
 
    // Strategy 2: X icon
    const xBtnVisible = await this.modalCloseBtnX.isVisible().catch(() => false);
    if (xBtnVisible) {
      await this._clickWithFallback(this.modalCloseBtnX);
      if (await this._waitModalHidden()) { console.log('✅ Modal closed'); return; }
    }
 
    // Strategy 3: Escape
    await this.page.keyboard.press('Escape');
    if (await this._waitModalHidden(1000)) { console.log('✅ Modal closed (Escape)'); return; }
 
    // Strategy 4: Click backdrop
    await this.page.mouse.click(10, 10);
    if (await this._waitModalHidden(1000)) { console.log('✅ Modal closed (backdrop)'); return; }
 
    // Strategy 5: JS nuclear option
    await this.page.evaluate(() => {
      const modal = document.getElementById('modal-popup___BV_modal_body_');
      if (modal) {
        modal.dispatchEvent(new Event('hide', { bubbles: true }));
        const parent = modal.closest('.modal');
        if (parent) (parent as HTMLElement).style.display = 'none';
      }
    });
    await this._waitModalHidden(1000);
    console.log('⚠️  Modal force-hidden via JS');
  }
 
  // ─── Provider ───────────────────────────────────────────────────────────────
 
  async selectProvider(providerId: string): Promise<void> {
    const card = this.page.locator(`[id="${providerId}"]`);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await this.page.waitForLoadState('networkidle');
    await this.gameCards.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.closeModalIfVisible();
    console.log(`\n📦 Provider selected: ${providerId}`);
  }
 
  // ─── Games ──────────────────────────────────────────────────────────────────
 
  async getGameCount(): Promise<number> {
    try {
      await this.gameCards.first().waitFor({ state: 'visible', timeout: 10000 });
      const count = await this.gameCards.count();
      console.log(`📋 Found ${count} games`);
      return count;
    } catch {
      console.warn('⚠️  No games found');
      return 0;
    }
  }
 
  async getGameName(index: number): Promise<string> {
    const card = this.gameCards.nth(index);
    return (
      (await card.getAttribute('data-game-name'))?.trim()                                    ??
      (await card.getAttribute('aria-label'))?.trim()                                        ??
      (await card.locator('.game-name, .game-title, p, span').first().textContent())?.trim() ??
      `Game_${index}`
    );
  }
 
  // ─── Hover → Play ────────────────────────────────────────────────────────────
 
  async hoverAndPlayGame(index: number): Promise<void> {
    const card = this.gameCards.nth(index);
    await card.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
    await this.dismissAllowIfVisible();
    await card.hover();
    await this.page.waitForTimeout(300);
 
    // Play button scoped ใน card
    const playBtnInCard = card.getByRole('button', { name: 'Play' });
    try {
      await playBtnInCard.waitFor({ state: 'visible', timeout: 3000 });
      await this._clickWithFallback(playBtnInCard);
      return;
    } catch { /* fallback */ }
 
    // Play button ใน page scope
    const playBtnInPage = this.page.getByRole('button', { name: 'Play' });
    try {
      await playBtnInPage.waitFor({ state: 'visible', timeout: 3000 });
      await this._clickWithFallback(playBtnInPage);
      return;
    } catch { /* fallback */ }
 
    // Alt selectors
    const altBtn = card.locator('.btn-play, [class*="play"], [data-testid*="play"]');
    try {
      await altBtn.first().waitFor({ state: 'visible', timeout: 2000 });
      await this._clickWithFallback(altBtn.first());
      return;
    } catch { /* skip */ }
 
    throw new Error(`SKIP: Play button not found for game index ${index}`);
  }
 
  // ─── Click helpers ───────────────────────────────────────────────────────────
 
  private async _clickWithFallback(locator: Locator) {
    try {
      await locator.click({ timeout: 2000 });
      return;
    } catch { /* try next */ }
 
    try {
      await locator.click({ force: true, timeout: 2000 });
      return;
    } catch { /* try next */ }
 
    await locator.dispatchEvent('click');
  }
 
  private async _waitModalHidden(timeout = 3000): Promise<boolean> {
    try {
      await this.modalBody.waitFor({ state: 'hidden', timeout });
      return true;
    } catch {
      return false;
    }
  }
}