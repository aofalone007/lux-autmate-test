import { Page, expect } from '@playwright/test';

export class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('https://dev-th.nonprod-lux.com/th/login');
  }

  async fillUsername(username: string) {
    await this.page.locator('[data-testid="login-username"]').fill(username);
  }
  async fillPhone(phone: string) {
    await this.page.locator('[data-testid="login-username"]').fill(phone);
  }
  async fillEmail(email: string) {
    await this.page.getByPlaceholder('Email').fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByPlaceholder('Password').fill(password);
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Log In' }).click();
  }

  async register(user: {
    username: string;
    email: string;
    phone: string;
    password: string;
  }) {
    await this.fillUsername(user.username);
    await this.fillEmail(user.email);
    await this.fillPhone(user.phone);
    await this.fillPassword(user.password);
    await this.submit();
  }
}
