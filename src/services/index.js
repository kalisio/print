import logger from 'loglevel'
import kdkCore from '@kalisio/kdk/core.client'

export default async function () {
  const api = this

  // Set up our plugin services
  try {
    await api.configure(kdkCore)
  } catch (error) {
    logger.error(error.message)
  }
}
