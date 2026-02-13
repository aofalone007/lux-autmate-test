import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/MemberRegisterPage';
import { fakeUser } from '../../utils/faker';

test.describe('Member Registration Tests', () => {
    test('TC Register New Member from Template 1 Success', async ({ page }) => {
        const registerPage = new RegisterPage(page);
        await registerPage.goto();
        const user = fakeUser();
        const expectedText = page.getByText(user.username, { exact: true });
        await registerPage.registerTemplateOne(user);
        const actualText = await expectedText.textContent();
        await expect(actualText).toBe(user.username);
    })
});