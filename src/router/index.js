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
      path: '/overtime',
      name: 'over-time',
      component: () => import('@/views/OverTime.vue')
    },
    {
      path: '/heatmap',
      name: 'heatmap',
      component: () => import('@/views/Heatmap.vue')
    }
  ]
})

export default router
