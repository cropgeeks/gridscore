import Vue from 'vue'
import App from '@/App.vue'
import {
  BadgePlugin,
  LayoutPlugin,
  ModalPlugin,
  DropdownPlugin,
  BVModalPlugin,
  NavbarPlugin,
  TableLitePlugin,
  TableSimplePlugin,
  CollapsePlugin,
  ImagePlugin,
  ButtonPlugin,
  ButtonGroupPlugin,
  FormPlugin,
  FormCheckboxPlugin,
  FormDatepickerPlugin,
  FormInputPlugin,
  FormGroupPlugin,
  FormTextareaPlugin,
  FormRadioPlugin,
  FormFilePlugin,
  CardPlugin,
  TabsPlugin,
  ListGroupPlugin,
  FormSelectPlugin,
  InputGroupPlugin,
  TooltipPlugin,
  PopoverPlugin,
  SpinnerPlugin,
  ProgressPlugin,
  JumbotronPlugin,
  SidebarPlugin,
  EmbedPlugin
} from 'bootstrap-vue'

import router from '@/router'
import store from '@/store'
import mixin from '@/mixin'
import { i18n } from '@/plugins/i18n.js'
import './registerServiceWorker'

import { Icon } from 'leaflet'

require('es6-promise/auto')

delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

Vue.config.productionTip = false

Vue.use(BadgePlugin)
Vue.use(ImagePlugin)
Vue.use(LayoutPlugin)
Vue.use(ModalPlugin)
Vue.use(TabsPlugin)
Vue.use(CardPlugin)
Vue.use(DropdownPlugin)
Vue.use(BVModalPlugin)
Vue.use(CollapsePlugin)
Vue.use(NavbarPlugin)
Vue.use(TableLitePlugin)
Vue.use(TableSimplePlugin)
Vue.use(EmbedPlugin)
Vue.use(ButtonPlugin)
Vue.use(ButtonGroupPlugin)
Vue.use(FormPlugin)
Vue.use(FormInputPlugin)
Vue.use(FormCheckboxPlugin)
Vue.use(FormRadioPlugin)
Vue.use(FormDatepickerPlugin)
Vue.use(FormGroupPlugin)
Vue.use(FormTextareaPlugin)
Vue.use(FormFilePlugin)
Vue.use(ListGroupPlugin)
Vue.use(SidebarPlugin)
Vue.use(FormSelectPlugin)
Vue.use(InputGroupPlugin)
Vue.use(TooltipPlugin)
Vue.use(PopoverPlugin)
Vue.use(SpinnerPlugin)
Vue.use(JumbotronPlugin)
Vue.use(ProgressPlugin)
Vue.mixin(mixin)

// Set base URL based on environment
let baseUrl = './api/'

if (process.env.VUE_APP_BASE_URL) {
  baseUrl = process.env.VUE_APP_BASE_URL
}

store.commit('ON_SERVER_URL_CHANGED', baseUrl)

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
