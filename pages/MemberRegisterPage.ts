import { expect, Page } from '@playwright/test'
import { BasePage } from './basePage'

export class MemberRegisterPage extends BasePage {
  constructor(page: Page, t: (key: string) => string) {
    super(page, t)
  }

  async goto(locale: 'th' | 'en' = 'th') {
    await this.page.goto(`/${locale}/register`)
  }

  async closeModalIfVisible() {
    const modal = this.page.locator('#modal-popup___BV_modal_body_')

    try {
      await modal.waitFor({ state: 'visible', timeout: 3000 })
    } catch {
      return
    }

    const closeBtn = this.page.locator('#modal-popup___BV_modal_body_ .close-btn-x')
    await closeBtn.click()
    await modal.waitFor({ state: 'hidden', timeout: 5000 })
  }

  async fillUsername(username: string) {
    const field = this.inputByLabel('username_label')
    const isVisible = await field.isVisible()
    if (isVisible) await field.fill(username)
  }

  async fillPhone(phone: string) {
  // ✅ phone มี placeholder จริง
  await this.page
    .locator('input[type="text"]:near(p:has-text("เช่น 0712 234567"))')
    .first()
    .fill(phone)
  }

  async fillPassword(password: string) {
    // ✅ ใช้ p label — ไม่มี placeholder
    await this.page
      .locator('input[type="password"]:near(p:has-text("รหัสผ่าน"))')
      .first()
      .fill(password)
  }

  async fillConfirmPassword(password: string) {
  // ✅ p label ยืนยันรหัสผ่าน
  await this.page
    .locator('input[type="password"]:near(p:has-text("ยืนยันรหัสผ่าน"))')
    .first()
    .fill(password)
}

  async checkTerms() {
   await this.page.locator('#privacy_policy').check();
  }

  async submit() {
    await this.page
      .getByRole('button', { name: this.t('signup_button') })
      .click()
  }

  async showModalSuccess() {
    await this.page.waitForTimeout(1000)   // ✅ รอให้ modal แสดงผล
    const modal = this.page.getByRole('dialog', { name: this.t('modal_success_title') })
    await expect(modal).toBeVisible()
  }

  // template: มี username
  async registerTemplateOne(user: {
    username?: string
    phone: string
    password: string
  }) {
    await this.closeModalIfVisible()
    if (user.username) await this.fillUsername(user.username)
    await this.fillPhone(user.phone)
    await this.fillPassword(user.password)
    await this.fillConfirmPassword(user.password)
    await this.checkTerms()
    await this.submit()
    await this.showModalSuccess()
  }
}