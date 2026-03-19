import { Page } from '@playwright/test'

export class BasePage {
  constructor(
    protected page: Page,
    protected t: (key: string) => string
  ) {}

  // หา input ที่อยู่ใกล้ p label
    inputByLabel(key: string) {
    return this.page
      .locator(`input:near(p:has-text("${this.t(key)}"))`)
      .first()   // ✅ เอาตัวแรกที่เจอ
  }

  // หา input type text โดยเฉพาะ (ไม่รวม password)
  textInputByLabel(key: string) {
    return this.page
      .locator(`input[type="text"]:near(p:has-text("${this.t(key)}"))`)
  }

  // หา input type password โดยเฉพาะ
  passwordInputByLabel(key: string) {
    return this.page
      .locator(`input[type="password"]:near(p:has-text("${this.t(key)}"))`)
  }
}