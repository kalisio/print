const leftPane = require('./kdk/panes.left')

const website = 'https://kalisio.com'

// Helper declaration
const APP_SLUG = 'print'
const API_PATH = '/api'

const LEFT_PANE = {
  content: [
    { component: 'account/KProfile', class: 'full-width' },
    leftPane.about(),
    leftPane.logout('keycloak')
  ],
  opener: true
}

module.exports = {
  appName: 'Kalisio print',
  appSlug: APP_SLUG,
  buildMode: process.env.BUILD_MODE === 'pwa' ? 'pwa' : 'spa',
  flavor: process.env.NODE_APP_INSTANCE || 'dev',
  version: require('../package.json').version,
  buildNumber: process.env.BUILD_NUMBER,
  apiPath: API_PATH,
  apiJwt: `${APP_SLUG}-jwt`,
  apiTimeout: 20000,
  transport: 'websocket', // Could be 'http' or 'websocket',
  appChangelog: 'https://kalisio.github.io/print/about/changelog.html',
  // publisher: 'Kalisio',
  // publisherContact: 'support@kalisio.com',
  // publisherWebsite: website,
  locale: {
    // If you'd like to force locale otherwise it is retrieved from browser
    // default: 'en',
    fallback: 'en'
  },
  logs: {
    level: (process.env.NODE_ENV === 'development' ? 'debug' : 'info')
  },
  storage: {
    useProxy: true
  },
  screens: {
    // header: 'screen/KScreenHeader',
    // footer: 'screen/KScreenFooter',
    // backgroundColor: '#FFF8ED',
    // textColor: 'white',
    actions: [{
      id: 'terms-policies',
      label: 'screen.TERMS_AND_POLICIES',
      dialog: {
        component: 'document/KDocument',
        url: 'kapp-terms.md'
      }
    }],
    login: {
      actions: [
        { id: 'reset-password-link', label: 'KLoginScreen.FORGOT_YOUR_PASSWORD_LABEL', route: { name: 'send-reset-password' } },
        { id: 'register-link', label: 'KLoginScreen.DONT_HAVE_AN_ACCOUNT_LABEL', route: { name: 'register' } },
        { id: 'keycloak-link', label: 'screen.LOGIN_WITH_KEYCLOAK', route: { url: '/oauth/keycloak' } }
      ]
    },
    logout: {
      actions: [
        { id: 'login-link', label: 'KLogoutScreen.LOG_IN_AGAIN_LABEL', route: { name: 'login' } }
      ]
    },
    register: {
      actions: [
        { id: 'login-link', label: 'KRegisterScreen.ALREADY_HAVE_AN_ACCOUNT_LABEL', route: { name: 'login' } }
      ]
    }
  },
  printActivity: {
    panes: {
      left: LEFT_PANE
    }
  },
  routes: require('../src/router/routes')
}
