// import 'whatwg-fetch'
import _ from 'lodash'
import logger from 'loglevel'
import config from 'config'
import { Notify } from 'quasar'
import appHooks from '../main.hooks'
import services from '../services'
import { initializeApi, i18n, utils as kdkCoreUtils, Store, Events, beforeGuard, authenticationGuard } from '@kalisio/kdk/core.client'

export default async ({ app }) => {
  // Initiate the client
  const api = await initializeApi()

  // Setup app hooks
  api.hooks(appHooks)

  // Then all services
  await services.call(api)

  // Initializes i18n
  await i18n.initialize(app, ['core', 'app', 'map'])

  // Register global properties to the the vue app
  app.config.globalProperties.$store = Store
  app.config.globalProperties.$events = Events
  app.config.globalProperties.$api = api
  app.config.globalProperties.$can = api.can
  app.config.globalProperties.$notify = Notify.create
  app.config.globalProperties.$tie = i18n.tie.bind(i18n)
  app.config.globalProperties.$config = function (path, defaultValue) {
    return _.get(config, path, defaultValue)
  }

  // Register global components
  app.component('KAction', await kdkCoreUtils.loadComponent('action/KAction'))
  app.component('KStamp', await kdkCoreUtils.loadComponent('KStamp'))
  app.component('KActivity', await kdkCoreUtils.loadComponent('KActivity'))
  app.component('KDialog', await kdkCoreUtils.loadComponent('KDialog'))

  // Register global properties
  // FIXME: This is used for testing purpose, don't know how to access this from Puppeteer otherwise
  global.$store = app.config.globalProperties.$store
  global.$layout = app.config.globalProperties.$layout
  global.$api = app.config.globalProperties.$api

  // Add global guard
  beforeGuard.registerGuard(authenticationGuard)

  // For debug purpose
  logger.debug('[KDK] is now ready:', Store.get('kdk'))
}
