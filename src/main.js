import Vue from 'vue'
import App from '@/App.vue'
import BootstrapVue from 'bootstrap-vue'

import router from '@/router'
import store from '@/store'
import mixin from '@/mixin'
import { i18n } from '@/plugins/i18n.js'
import './registerServiceWorker'

Vue.config.productionTip = false

Vue.use(BootstrapVue)
Vue.mixin(mixin)

Vue.use({
  install: function (Vue) {
    // Make custom plotly available
    Vue.prototype.$plotly = require('@/custom-plotly')
    window.Plotly = Vue.prototype.$plotly
  }
})

new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
