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
        playgroundPdfme: process.env.NODE_ENV === 'production' ? app.get('domain') + app.get('apiPath') + '/playground' : app.get('playgroundPdfmeUrl')
      }
      if (process.env.BUILD_NUMBER) {
        response.buildNumber = process.env.BUILD_NUMBER
      }
      res.json(response)
    })
    // Create KDK base services
    await app.configure(kdkCore)
    // Create the default users
    await createDefaultUsers.call(app)
  } catch (error) {
    app.logger.error(error.message)
  }
}
