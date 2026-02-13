import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { RedeemManagementPage } from '../../pages/RedeemManagementPage';

test.describe('Redeem Free Spins / Chip List Tests', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('aofaof', 'Aa123456');
    await loginPage.waitForLoad();
    await loginPage.expectLoginSuccess();
  });

  test('TC Search Found Data', async ({ page }) => {
    const redeemManagementPage = new RedeemManagementPage(page);
    await redeemManagementPage.goto();
    await redeemManagementPage.expectOnRedeemManagementPage();
    await redeemManagementPage.expectFreeSpinsChipListTableVisible();
  });

  test('TC Verify Header ', async ({ page }) => {

  });
});