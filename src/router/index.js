import {
  createRouter,
  createWebHashHistory
} from 'vue-router'

import store from '../store'

import Settings from '@/components/Settings.vue'
import USBReader from '@/components/USBReader.vue'
import ReadDelayReader from '@/components/ReadDelayReader.vue'

import Inventory from '@/components/Inventory.vue'
import Runners from '@/components/Runners.vue'
import Login from '@/components/Login.vue'
import Admin from '@/components/Admin.vue'
import Splits from '@/components/Splits.vue'
import Percents from '@/components/Percents.vue'
import Otp from '@/components/Otp.vue'

// ROUTER
const routes = [{
    path: '/',
    component: Login,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/home',
    component: Inventory,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/percents',
    component: Percents,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/settings',
    component: Settings,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/usb-reader',
    component: USBReader,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/read-delay',
    component: ReadDelayReader,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/runners',
    component: Runners,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/otp',
    component: Otp,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/splits',
    component: Splits,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
    }
  }
]





const router = createRouter({
  history: createWebHashHistory(),
  routes,
})


router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    let auth = store.state._auth;

    console.log('router', auth)

    if (!auth) {
      next({
        path: '/'
      })
    } else {
      next()
    }
  } else {
    next() // make sure to always call next()!
  }
});

export default router;