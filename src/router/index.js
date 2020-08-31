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
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('@/views/Timeline.vue')
    },
    {
      path: '/heatmap',
      name: 'heatmap',
      component: () => import('@/views/Heatmap.vue')
    },
    {
      path: '/locations',
      name: 'location-map',
      component: () => import('@/views/LocationMap.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/About.vue')
    }
  ]
})

export default router
