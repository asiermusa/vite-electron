import {
  createApp
} from 'vue'
import App from './App.vue'

import router from './router'
import store from './store'

import './assets/styles.css';

// Vuetify
import 'vuetify/styles'
import {
  createVuetify
} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

import interceptors from './vue-plugins/interceptors'
interceptors();

const vuetify = createVuetify({
  components,
  directives,
})

createApp(App).use(router).use(store).use(vuetify).mount('#app');