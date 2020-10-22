import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

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
      path: '/locations',
      name: 'location-map',
      component: () => import('@/views/LocationMap')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/About')
    }
  ]
})

export default router
