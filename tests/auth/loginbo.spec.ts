import { test, expect } from '@playwright/test';
import { LoginPageBo } from '../../pages/LoginPageBo';

  test('TC login Success', async ({ page }) => {
    const loginPage = new LoginPageBo(page);
    await loginPage.goto();
    await loginPage.login('aofaof', 'Aa123456');
    await loginPage.waitForLoad();
    await loginPage.expectLoginSuccess();
  });

  test('TC login Failed', async ({ page }) => {
    const loginPage = new LoginPageBo(page);
    await loginPage.goto();
    await loginPage.login('adsdsds', 'Aa123456');
    await loginPage.expectLoginFailed();
  });