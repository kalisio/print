/* eslint-disable no-unused-expressions */
import { core } from './kdk/index.mjs'

const suite = 'app'

describe(suite, () => {
  let runner
  let page
  const user = {
    email: 'kalisio@kalisio.xyz',
    password: 'Pass;word1'
  }

  before(async () => {
    runner = new core.Runner(suite, {
      appName: 'print',
      browser: {
        slowMo: 1
      },
      lang: 'fr'
    })
    page = await runner.start()
  })

  it('login', async () => {
    await core.login(page, user)
  })

  it('logout', async () => {
    await core.logout(page)
  })

  after(async () => {
    await runner.stop()
  })
})
