import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const originalReplace = Router.prototype.replace
const originalPush = Router.prototype.push
Router.prototype.replace = function replace (location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalReplace.call(this, location, onResolve, onReject)
  }
  return originalReplace.call(this, location).catch(err => {
    if (err && err.name !== 'NavigationDuplicated' && !err.message.includes('Avoided redundant navigation to current location')) {
      throw err
    }
  })
}
Router.prototype.push = function push (location, onResolve, onReject) {
  if (onResolve || onReject) {
    return originalPush.call(this, location, onResolve, onReject)
  }
  return originalPush.call(this, location).catch(err => {
    if (err && err.name !== 'NavigationDuplicated' && !err.message.includes('Avoided redundant navigation to current location')) {
      throw err
    }
  })
}

const router = new Router({
  mode: 'hash',
  scrollBehavior: () => ({ y: 0 }),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home')
    },
    {
      path: '/data',
      name: 'data',
      component: () => import('@/views/DataView')
    },
    {
      path: '/uuid-import/:uuid',
      name: 'uuid-import',
      component: () => import('@/views/UuidImport')
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('@/views/Timeline')
    },
    {
      path: '/heatmap',
      name: 'heatmap',
      component: () => import('@/views/Heatmap')
    },
    {
      path: '/scatter',
      name: 'scatter',
      component: () => import('@/views/ScatterChart')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/Stats')
    },
    {
      path: '/locations',
      name: 'location-map',
      component: () => import('@/views/LocationMap')
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/Setup')
    },
    {
      path: '/setup-survey',
      name: 'setup-survey',
      component: () => import('@/views/SetupSurvey')
    },
    {
      path: '/share',
      name: 'share',
      component: () => import('@/views/Share')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings')
    },
    {
      path: '/export',
      name: 'export',
      component: () => import('@/views/Export')
    },
    {
      path: '/import',
      name: 'import',
      component: () => import('@/views/DataImport')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/About')
    }
  ]
})

export default router
