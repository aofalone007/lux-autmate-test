import { Page, Locator } from '@playwright/test';

export interface GameError {
  message:    string;
  traceId?:   string;
  timestamp?: string;
}

export class GamePage {
  readonly page:          Page;

  // ─── SweetAlert2 error dialog (จาก DevTools) ──────────────────────────────
  readonly swal2Popup:    Locator; // container
  readonly swal2OkBtn:    Locator; // confirm button
  readonly swal2Content:  Locator; // error message text
  readonly swal2TraceId:  Locator; // TraceID line

  // ─── Legacy error dialog (fallback) ───────────────────────────────────────
  readonly legacyOkBtn:   Locator;

  constructor(page: Page) {
    this.page = page;

    // SweetAlert2 selectors
    this.swal2Popup   = page.locator('.swal2-popup.swal2-modal, .swal2-show');
    this.swal2OkBtn   = page.locator('.swal2-confirm, .swal2-actions button');
    this.swal2Content = page.locator('#swal2-content, .swal2-html-container');
    this.swal2TraceId = page.locator('#swal2-content text=/TraceID/, .swal2-html-container text=/TraceID/');

    // Legacy OK button fallback
    this.legacyOkBtn  = page.getByRole('button', { name: 'OK' });
  }

  // ─── Wait for game load or error ──────────────────────────────────────────

  async waitForLoadOrError(timeout = 8000): Promise<'loaded' | 'error'> {
    try {
      // รอ swal2 popup หรือ legacy OK button อันไหนก่อนก็ได้
      await Promise.race([
        this.swal2Popup.waitFor({ state: 'visible', timeout }),
        this.swal2OkBtn.waitFor({ state: 'visible', timeout }),
        this.legacyOkBtn.waitFor({ state: 'visible', timeout }),
      ]);
      return 'error'; // ❌ เจอ error dialog = FAIL
    } catch {
      return 'loaded'; // ✅ ไม่เจอ error dialog = PASS
    }
  }

  // ─── Extract error details ─────────────────────────────────────────────────

  async getErrorDetails(): Promise<GameError> {
    // ดึง message จาก swal2 content ก่อน
    const message = await this.swal2Content
      .textContent()
      .catch(() => null)
      ?? await this.page
        .locator('p, .error-message')
        .filter({ hasNotText: 'TraceID' })
        .first()
        .textContent()
        .catch(() => 'Unknown error');

    // ดึง TraceID
    const pageText  = await this.page.locator('body').textContent().catch(() => '');
    const traceId   = pageText?.match(/TraceID\s*[:\s]+([a-f0-9\-]{36})/i)?.[1];
    const timestamp = pageText?.match(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/)?.[0];

    return {
      message:   message?.replace(/TraceID.*/s, '').trim() ?? 'Unknown error',
      traceId,
      timestamp,
    };
  }
}