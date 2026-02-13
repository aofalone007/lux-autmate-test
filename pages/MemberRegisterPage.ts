import { Page } from '@playwright/test';

export class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('https://dev-th.nonprod-lux.com/th/login');
  }

  async signup() {
    await this.page.getByRole('link', { name: 'Sign Up' }).click();
  }

  async fillUsername(username: string) {
    await this.page.locator('[data-testid="username"]').fill(username);
  }

  async fillPhone(phone: string) {
    await this.page.locator('[data-testid="phone"]').fill(phone);
  }

  async fillPassword(password: string) {
    await this.page.getByPlaceholder('Password').fill(password);
  }

  async fillConfirmPassword(confirmPassword: string) {
    await this.page.getByPlaceholder('Confirm Password').fill(confirmPassword);
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Sign Up' }).click();
  }

  async registerTemplateOne(user: {
    username: string;
    password: string;
  }) {
    await this.signup();
    await this.fillUsername(user.username);
    await this.fillPassword(user.password);
    await this.fillConfirmPassword(user.password);
    await this.submit();
  }

  async registerTemplateTwo(user: {
    phone: string;
    password: string;
  }) {
    await this.signup();
    await this.fillPhone(user.phone);
    await this.fillPassword(user.password);
    await this.fillConfirmPassword(user.password);
    await this.submit();
  }
}