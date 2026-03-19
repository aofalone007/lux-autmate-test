// fixtures/index.ts
import { test as base }   from '@playwright/test'
import { MemberRegisterPage } from '../pages/MemberRegisterPage'

// import ตรงๆ แทน index.ts ก่อน เพื่อ isolate ปัญหา
import { register as enRegister } from '../locales/en/register'
import { register as thRegister } from '../locales/th/register'
import { menu as enMenu }         from '../locales/en/menu'
import { menu as thMenu }         from '../locales/th/menu'

const translations = {
  en: { ...enRegister, ...enMenu },
  th: { ...thRegister, ...thMenu },
}

console.log('translations.en:', translations.en)
console.log('translations.th:', translations.th)

type Fixtures = {
  t:                  (key: string) => string
  memberRegisterPage: MemberRegisterPage
}

export const test = base.extend<Fixtures>({
  t: async ({ page }, use) => {
    const t = (key: string): string => {
      const url   = page.url()
      const match = url.match(/\/(th|en)\//)
      const lang  = (match?.[1] ?? 'en') as keyof typeof translations
      const dict  = translations[lang] ?? translations.en
      return (dict as Record<string, string>)[key] ?? key
    }
    await use(t)
  },

  memberRegisterPage: async ({ page, t }, use) => {
    await use(new MemberRegisterPage(page, t))
  },
})

export { expect } from '@playwright/test'