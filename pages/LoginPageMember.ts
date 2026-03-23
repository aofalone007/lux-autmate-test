import { Page, expect, Locator } from '@playwright/test';

export class LoginPageMember {
  readonly page: Page;

  // ─── Locators ────────────────────────────────────────────────────────────
  readonly usernameInput:  Locator;
  readonly phoneInput:     Locator;
  readonly passwordInput:  Locator;
  readonly submitButton:   Locator;
  readonly modalBody:      Locator;
  readonly modalCloseBtn:  Locator;
  readonly modalCloseBtnX: Locator;
  readonly tooltipTitle:   Locator;
  readonly tooltipNextBtn: Locator;
  readonly tooltipSkipBtn: Locator;


  constructor(page: Page) {
    this.page            = page;
    this.usernameInput   = page.locator('[data-testid="login-username-input"][type="text"]');
    this.phoneInput      = page.locator('[data-testid="login-username-input"][type="tel"]');
    this.passwordInput   = page.locator('[data-testid="login-password-input"]');
    this.submitButton    = page.locator('[data-testid="login-submit-button"]');
    this.modalBody       = page.locator('#modal-popup___BV_modal_body_');
    this.modalCloseBtn   = page.locator('[data-testid="close-button"]');
    this.modalCloseBtnX  = page.locator('#modal-popup___BV_modal_body_ .close-btn-x');
    this.tooltipTitle    = page.locator('.tour-tooltip__title');
    this.tooltipNextBtn  = page.locator('.tour-tooltip__btn--next');
    this.tooltipSkipBtn = page.locator('.tour-tooltip__btn--skip');
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  async goto(locale: 'th' | 'en' = 'en') {
    await this.page.goto(`/${locale}/login`);
    await this.page.waitForLoadState('networkidle', { timeout: 60_000 });
 
    await this.page.waitForSelector(
      '[data-testid="login-username-input"]',
      { state: 'visible', timeout: 15000 }
    );
  }

  // ─── Login ───────────────────────────────────────────────────────────────────
 
  async login(identifier: string, password: string) {
    const usernameVisible = await this.usernameInput
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true).catch(() => false);
 
    const phoneVisible = await this.phoneInput
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true).catch(() => false);
 
    if (usernameVisible) {
      await this.usernameInput.fill(identifier);
    } else if (phoneVisible) {
      await this.phoneInput.fill(identifier);
    } else {
      throw new Error('No visible login input found (type="tel" or type="text")');
    }
 
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
  
// ─── Allow button ────────────────────────────────────────────────────────────
 
  async dismissAllowIfVisible() {
    const allowBtn = this.page.locator('button.btn-allow');
    const visible  = await allowBtn.isVisible().catch(() => false);
    if (!visible) return;
    console.log('🔔 Allow button — dismissing...');
    await this._clickWithFallback(allowBtn);
    await allowBtn.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
 
  // ─── Modal ───────────────────────────────────────────────────────────────────
 
  async closeModalIfVisible() {
    try {
      await this.modalBody.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      return; // ไม่มี modal
    }
 
    console.log('📢 Modal visible — closing...');
 
    // กด Allow ก่อนถ้ามี popup ทับ
    await this.dismissAllowIfVisible();
 
    // ลอง close ด้วย 4 วิธี ตามลำดับ
    const closed = await this._tryCloseModal();
    if (closed) {
      console.log('✅ Modal closed');
    } else {
      console.warn('⚠️  Modal could not be closed — continuing anyway');
    }
  }
 
  private async _tryCloseModal(): Promise<boolean> {
 
    // Strategy 1: data-testid close button — normal click
    const closeBtnVisible = await this.modalCloseBtn.isVisible().catch(() => false);
    if (closeBtnVisible) {
      await this._clickWithFallback(this.modalCloseBtn);
      if (await this._waitModalHidden()) return true;
    }
 
    // Strategy 2: X icon — click with fallback
    const xBtnVisible = await this.modalCloseBtnX.isVisible().catch(() => false);
    if (xBtnVisible) {
      await this._clickWithFallback(this.modalCloseBtnX);
      if (await this._waitModalHidden()) return true;
    }
 
    // Strategy 3: Escape key
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    if (await this._waitModalHidden(1000)) return true;
 
    // Strategy 4: คลิกนอก modal (backdrop)
    await this.page.mouse.click(10, 10);
    await this.page.waitForTimeout(500);
    if (await this._waitModalHidden(1000)) return true;
 
    // Strategy 5: ซ่อน modal ผ่าน JS โดยตรง (nuclear option)
    await this.page.evaluate(() => {
      const modal = document.getElementById('modal-popup___BV_modal_body_');
      if (modal) {
        // trigger Vue's hide event
        modal.dispatchEvent(new Event('hide', { bubbles: true }));
        // หา parent modal และซ่อน
        const parent = modal.closest('.modal');
        if (parent) (parent as HTMLElement).style.display = 'none';
      }
    });
    await this.page.waitForTimeout(300);
    if (await this._waitModalHidden(1000)) return true;
 
    return false;
  }
 
  // ─── Click helpers ───────────────────────────────────────────────────────────
 
  /**
   * ลอง click → force click → dispatchEvent ตามลำดับ
   */
  private async _clickWithFallback(locator: Locator) {
    // 1. Normal click
    try {
      await locator.click({ timeout: 2000 });
      return;
    } catch { /* try next */ }
 
    // 2. Force click (ข้าม actionability check)
    try {
      await locator.click({ force: true, timeout: 2000 });
      return;
    } catch { /* try next */ }
 
    // 3. dispatchEvent (inject event ตรงที่ element)
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
 
  // ─── Tooltip ─────────────────────────────────────────────────────────────────
 
  async verifyTooltipWelcomeName(expectedUsername: string): Promise<string> {
    await this.tooltipTitle.waitFor({ state: 'visible', timeout: 5000 });
    const fullText = await this.tooltipTitle.textContent();
    const name     = fullText?.split(',')[1]?.trim() ?? '';
    expect(name).toBe(expectedUsername);
    return name;
  }
 
  async closeTooltip() {
    const skipBtn     = this.page.locator('.tour-tooltip__btn--skip');
    const skipVisible = await skipBtn.isVisible().catch(() => false);
 
    if (skipVisible) {
      await skipBtn.click();
      await this.tooltipTitle.waitFor({ state: 'hidden', timeout: 5000 });
      return;
    }
 
    for (let step = 0; step < 10; step++) {
      const tooltipVisible = await this.tooltipTitle.isVisible().catch(() => false);
      if (!tooltipVisible) break;
      const nextVisible = await this.tooltipNextBtn.isVisible().catch(() => false);
      if (!nextVisible) break;
      await this.tooltipNextBtn.click();
      await this.page.waitForTimeout(500);
    }
  }
 
  // ─── Assertions ──────────────────────────────────────────────────────────────
 
  async displayUserLoginSuccess(displayUsername: string): Promise<Locator> {
    const userSpan = this.page.locator(`span:has-text("${displayUsername}")`);
    await expect(userSpan).toBeVisible();
    return userSpan;
  }
 
  async expectLoginPageVisible() {
    await expect(this.usernameInput.or(this.phoneInput)).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}