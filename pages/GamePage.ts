import { Page, Locator } from '@playwright/test';

export interface GameError {
  message:    string;
  traceId?:   string;
  timestamp?: string;
}

export class GamePage {
  readonly page:           Page;
  readonly errorOkBtn:     Locator;
  readonly errorTitle:     Locator;

  constructor(page: Page) {
    this.page        = page;
    // Error dialog จาก screenshot: มี title "Error" และ button "OK"
    this.errorOkBtn  = page.getByRole('button', { name: 'OK' });
    this.errorTitle  = page.locator('text=Error').first();
  }

  /**
   * รอ 8 วินาที
   * - ถ้าเจอ dialog "Error / Internal Server Error / OK" → return 'error'
   * - ถ้าไม่เจอ → return 'loaded' (pass)
   */
  async waitForLoadOrError(timeout = 8000): Promise<'loaded' | 'error'> {
    try {
      await this.errorOkBtn.waitFor({ state: 'visible', timeout });
      return 'error';   // ❌ เจอ error dialog = fail
    } catch {
      return 'loaded';  // ✅ ไม่เจอ error dialog = pass
    }
  }

  async getErrorDetails(): Promise<GameError> {
    const message = await this.page
      .locator('p, .error-message')
      .filter({ hasNotText: 'TraceID' })
      .first()
      .textContent()
      .catch(() => 'Unknown error');

    const traceRow  = await this.page.locator('text=/TraceID/').textContent().catch(() => '');
    const traceId   = traceRow?.match(/TraceID\s*:\s*([a-f0-9\-]+)/i)?.[1];
    const timestamp = traceRow?.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/)?.[0];

    return {
      message:   message?.trim() ?? 'Unknown error',
      traceId,
      timestamp,
    };
  }
}