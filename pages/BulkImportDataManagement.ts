import { Page, expect } from '@playwright/test';
import { locales } from '../locales';


export class BulkImportDataManagementPage {
  constructor(private page: Page) {}

  async getCurrentLanguage(): Promise<'EN' | 'TH'> {
  if (await this.page.locator('button:has-text("Eng")').isVisible()) {
    return 'EN';
  }

  if (await this.page.locator('button:has-text("Thailand")').isVisible()) {
    return 'TH';
  }

  throw new Error('Cannot detect language');
}
  async goto() {
    const lang = await this.getCurrentLanguage();
    const locale = locales[lang];
    await this.page.getByText(locale.menu.bulkImport, { exact: true }).click();
    await this.page.getByText(locale.menu.importData, { exact: true }).click();
  }

  async expectOnBulkImportDataManagementPage() {
    await expect(this.page).toHaveURL(/bulk_import_data\/import-data/);
  }

  async expectSelectionExampleFile() {
    const lang = await this.getCurrentLanguage();
    const locale = locales[lang];
    await expect(this.page.getByText(locale.menu.importData, { exact: true })).toBeVisible();
  }
  
}