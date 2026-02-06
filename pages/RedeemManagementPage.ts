import { Page, expect } from '@playwright/test';

export class RedeemManagementPage {
  constructor(private page: Page) {

  }

  async goto() {
    await this.page.locator('//*[@id="side-menu"]/li[7]/a').click();
    await this.page.locator('//*[@id="side-menu"]/li[7]/ul/li[5]/a/div').click();
    await this.page.locator('//*[@id="side-menu"]/li[7]/ul/li[5]/ul/li[2]/a/div').click();
    await this.page.waitForURL(/redeem\/free_spins\/management/);
    await this.page.getByRole('button', { name: 'Search' }).click();
  }

  async expectOnRedeemManagementPage() {
    await expect(this.page).toHaveURL(/redeem\/free_spins\/management/);
  }

  async expectHeaderEn() {
    const header = this.page.locator('//*[@id="my-table"]/thead/tr/th');
    await expect(header).toBeVisible();
  }

  async expectFreeSpinsChipListTableVisible() {
    const tableBody = this.page.locator('//*[@id="my-table"]/tbody');
    const firstRow = this.page.locator('//*[@id="my-table"]/tbody/tr[1]');
    await expect(tableBody).toBeVisible();
    await this.page.waitForTimeout(2000); // Wait for table data to load
    await expect(firstRow).toBeVisible();
  }
}  