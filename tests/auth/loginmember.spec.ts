import { test, expect } from '@playwright/test';
import { LoginPageMember } from '../../pages/LoginPageMember';
import { USERS } from '../test-data/user.ts';


test.describe('Login Member', () => {
  test('Login Member', async ({ page }) => {
    const loginPage = new LoginPageMember(page);
    await loginPage.goto('en');
    await loginPage.closeModalIfVisible();
    await loginPage.login(
      USERS.MEMBER_USERNAME.identifier,
      USERS.MEMBER_USERNAME.password
    );

    // 2. Verify tooltip name equals login username (not full "Welcome, ..." text)
    const returnedName = await loginPage.verifyTooltipWelcomeName(USERS.MEMBER_USERNAME.identifier);
    expect(returnedName).toBe(USERS.MEMBER_USERNAME.identifier); 

    // 3. Close tooltip
    await loginPage.closeTooltip();
  });

});