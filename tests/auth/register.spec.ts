import { test, expect } from '../../fixtures'
import { fakeUser }     from '../../utils/faker'

test.describe('Register — TH', () => {
  test('สมัครสมาชิกสำเร็จ', async ({ memberRegisterPage, page, t }) => {
    const user = fakeUser()

    await memberRegisterPage.goto('th')

    await memberRegisterPage.registerTemplateOne({
      username: user.username,
      phone:    user.phone,
      password: user.password,
    })
  })
})

test.describe('Register — EN', () => {
  test('register success', async ({ memberRegisterPage, page, t }) => {
    const user = fakeUser()

    await memberRegisterPage.goto('en')   // → /en/register
    // t() อ่าน URL ตอนนี้ → lang = "en" → ได้ข้อความอังกฤษ

    await memberRegisterPage.registerTemplateOne({
      username: user.username,
      phone:    user.phone,
      password: user.password,
    })   
 })

})