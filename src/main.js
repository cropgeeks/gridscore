import Vue from 'vue'
import App from '@/App.vue'
import {
  LayoutPlugin,
  ModalPlugin,
  DropdownPlugin,
  BVModalPlugin,
  NavbarPlugin,
  TablePlugin,
  ButtonPlugin,
  ButtonGroupPlugin,
  FormPlugin,
  FormCheckboxPlugin,
  FormInputPlugin,
  FormGroupPlugin,
  FormTextareaPlugin,
  FormFilePlugin,
  ListGroupPlugin,
  FormSelectPlugin,
  InputGroupPlugin
} from 'bootstrap-vue'

import router from '@/router'
import store from '@/store'
import mixin from '@/mixin'
import { i18n } from '@/plugins/i18n.js'
import './registerServiceWorker'

Vue.config.productionTip = false

Vue.use(LayoutPlugin)
Vue.use(ModalPlugin)
Vue.use(DropdownPlugin)
Vue.use(BVModalPlugin)
Vue.use(NavbarPlugin)
Vue.use(TablePlugin)
Vue.use(ButtonPlugin)
Vue.use(ButtonGroupPlugin)
Vue.use(FormPlugin)
Vue.use(FormInputPlugin)
Vue.use(FormCheckboxPlugin)
Vue.use(FormGroupPlugin)
Vue.use(FormTextareaPlugin)
Vue.use(FormFilePlugin)
Vue.use(ListGroupPlugin)
Vue.use(FormSelectPlugin)
Vue.use(InputGroupPlugin)
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
