const tours = require('../tours')

module.exports = [{
  path: '/:token?',
  name: 'index',
  component: 'Index',
  meta: { unauthenticated: true },
  children: {
    login: 'screen/KLoginScreen',
    'logout/:provider?': {
      name: 'logout',
      component: 'screen/KOAuthLogoutScreen',
      meta: { authenticated: true }
    },
    register: 'screen/KRegisterScreen',
    'send-reset-password': {
      component: 'account/KSendResetPassword'
    },
    'change-password': {
      component: 'account/KChangePassword',
      meta: { authenticated: true, unauthenticated: false }
    },
    home: {
      // The name of the route has to be set the default child
      name: '',
      component: 'app/KHome',
      meta: { authenticated: true, unauthenticated: false },
      children: {
        'default-home-view': {
          // Because this child is the default one path is empty and name is the one of the parent route
          path: '',
          name: 'home',
          redirect: { name: 'print-activity' }
        },
        print: {
          name: 'print-activity',
          component: 'PrintActivity'
        }
      }
    }
  }
},
// Always leave this as last one,
// but you can also remove it
{
  path: '/:catchAll(.*)*',
  component: 'screen/KErrorScreen'
}
]
