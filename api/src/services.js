import path from 'path'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import kdkCore, { createDefaultUsers } from '@kalisio/kdk/core.api.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async function () {
  const app = this

  // Set up our plugin services
  try {
    const packageInfo = fs.readJsonSync(path.join(__dirname, '../../package.json'))
    app.use(app.get('apiPath') + '/capabilities', (req, res, next) => {
      const response = {
        name: 'print',
        domain: app.get('domain'),
        version: packageInfo.version,
        playgroundPdfme: app.get('playgroundPdfmeUrl')
      }
      if (process.env.BUILD_NUMBER) {
        response.buildNumber = process.env.BUILD_NUMBER
      }
      res.json(response)
    })
    await app.configure(kdkCore)
  } catch (error) {
    app.logger.error(error.message)
  }

  // Create the default users
  // Do not use exposed passwords on staging/prod environments
  if (!process.env.NODE_APP_INSTANCE) {
    await createDefaultUsers.call(app)
  }
}
