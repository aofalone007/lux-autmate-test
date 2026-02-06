import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('https://dev-manage.nonprod-lux.com/account/login');
  }

  async login(username: string, password: string) {
    await this.page.getByPlaceholder('Enter Username').fill(username);
    await this.page.getByPlaceholder('Enter Password').fill(password);
    await this.page.locator('button[type="submit"]').click();
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoginSuccess() {
    await this.page.waitForURL(/\/member$/, { timeout: 15000 });
    await expect(this.page).toHaveURL(/\/member$/);
  }

  async expectLoginFailed() {
    const errorMessage = this.page.locator('//*[@id="swal2-title"]');
    await expect(errorMessage).toBeVisible();
  }
}