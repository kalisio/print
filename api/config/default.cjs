var path = require('path')
var fs = require('fs')
var winston = require('winston')
var containerized = require('containerized')()

const serverPort = process.env.PORT || 8081
// Required to know webpack port so that in dev we can build correct URLs
const clientPort = process.env.CLIENT_PORT || 8080
const API_PREFIX = '/api'
let domain
// If we build a specific staging instance
if (process.env.NODE_APP_INSTANCE === 'dev') {
  domain = 'https://print.dev.kalisio.xyz'
} else if (process.env.NODE_APP_INSTANCE === 'test') {
  domain = 'https://print.test.kalisio.xyz'
} else if (process.env.NODE_APP_INSTANCE === 'prod') {
  domain = 'https://print.kalisio.xyz'
} else {
  // Otherwise we are on a developer machine
  if (process.env.NODE_ENV === 'development') {
    domain = 'http://localhost:' + clientPort
  } else {
    domain = 'http://localhost:' + serverPort
  }
}
// Override defaults if env provided
if (process.env.SUBDOMAIN) {
  domain = 'https://print.' + process.env.SUBDOMAIN
}

// Keycloak base url
const keycloakBaseUrl = process.env.KEYCLOAK_URL ?
  `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect` :
  'https://keycloak.portal.kalisio.com/realms/Kalisio/protocol/openid-connect'

module.exports = {
  // Proxy your API if using any.
  // Also see /build/script.dev.js and search for "proxy api requests"
  // https://github.com/chimurai/http-proxy-middleware
  proxyTable: {},
  domain,
  host: process.env.HOSTNAME || 'localhost',
  port: serverPort,
  distPath: fs.existsSync(path.join(__dirname, '../../dist/pwa')) ? path.join(__dirname, '../../dist/pwa') : path.join(__dirname, '../../dist/spa'),
  playgroundPdfmeUrl: process.env.PLAYGROUND_PDFME_URL,
  /* To enable HTTPS
  https: {
    key: path.join(__dirname, 'server.key'),
    cert: path.join(__dirname, 'server.crt'),
    port: process.env.HTTPS_PORT || 8084
  },
  */
  apiPath: API_PREFIX,
  paginate: {
    default: 10,
    max: 50
  },
  authentication: {
    secret: process.env.APP_SECRET || 'my secret',
    path: API_PREFIX + '/authentication',
    service: API_PREFIX + '/users',
    entity: 'user',
    authStrategies: [
      'jwt',
      'local'
    ],
    local: {
      usernameField: 'email',
      passwordField: 'password'
    },
    jwtOptions: {
      header: {
        typ: 'access' // See https://tools.ietf.org/html/rfc7519#section-5.1
      },
      audience: process.env.SUBDOMAIN || 'kalisio', // The resource server where the token is processed
      issuer: 'kalisio', // The issuing server, application or resource
      algorithm: 'HS256', // See https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
      expiresIn: '1d'
    },
    oauth: {
      redirect: domain,
      defaults: {
        origin: domain
      },
      keycloak: (process.env.KEYCLOAK_CLIENT_ID ? {
        key: process.env.KEYCLOAK_CLIENT_ID,
        secret: process.env.KEYCLOAK_CLIENT_SECRET,
        oauth: 2,
        scope: ['openid'],
        authorize_url: `${keycloakBaseUrl}/auth`,
        access_url: `${keycloakBaseUrl}/token`,
        profile_url: `${keycloakBaseUrl}/userinfo`,
        logout_url: `${keycloakBaseUrl}/logout`,
        nonce: true
      } : undefined)
    },
    passwordPolicy: {
      minLength: 8,
      maxLength: 128,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
      prohibited: fs.readFileSync(path.join(__dirname, '10k_most_common_passwords.txt')).toString().split('\n'),
      history: 5
    },
    defaultUsers: [
      {
        email: 'kalisio@kalisio.xyz',
        password: 'Pass;word1',
        /*
        device: {
          registrationId: 'xxx',
          number: '+xxx',
          platform: 'ANDROID'
        }
        */
        name: 'Kalisio'
      }
    ],
    // Required for OAuth2 to work correctly
    cookie: {
      enabled: true,
      name: 'feathers-jwt',
      httpOnly: false,
      secure: (process.env.NODE_ENV === 'development' ? false : true)
    }
  },
  authorisation: {
    cache: {
      maxUsers: 1000
    }
  },
  logs: {
    Console: {
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level: (process.env.NODE_ENV === 'development' ? 'verbose' : 'info')
    },
    DailyRotateFile: {
      format: winston.format.json(),
      dirname: path.join(__dirname, '..', 'logs'),
      filename: 'print-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'
    }
  },
  db: {
    adapter: 'mongodb',
    url: process.env.DB_URL || (containerized ? 'mongodb://mongodb:27017/print' : 'mongodb://127.0.0.1:27017/print')
  }
}
