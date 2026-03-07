import Vue from 'vue'

import 'normalize.css'
import ElementUI from 'element-ui'
import SvgIcon from 'vue-svgicon'

import '@/styles/element-variables.scss'
import '@/styles/index.scss'

import { initTheme } from '@/utils/theme'

// 初始化主题
initTheme()

import App from '@/App.vue'
import store from '@/store'
import router from '@/router'
import '@/icons/components/index'
import '@/permission'
import waves from '@/directive/waves' // waves directive

Vue.use(ElementUI)
Vue.use(SvgIcon, {
  tagName: 'svg-icon',
  defaultWidth: '1em',
  defaultHeight: '1em'
})

// 注册waves指令
Vue.directive('waves', waves)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount('#app')
