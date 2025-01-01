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
  theme: {
    defaultTheme: 'light', // Set the default theme (light or dark)
    themes: {
      light: {
        colors: {
          primary: '#009FE3', // Your desired primary color
          secondary: '#b0bec5',
          accent: '#8c9eff',
          error: '#b71c1c',
        },
      },
      dark: {
        colors: {
          primary: '#1e88e5', // Primary color for dark theme
        },
      },
    },
  },
})

createApp(App).use(router).use(store).use(vuetify).mount('#app');