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
import ServerWP from '@/components/ServerWP.vue'
import SystemStatus from '@/components/SystemStatus.vue'

// ROUTER
const routes = [{
    path: '/login',
    component: Login,
    meta: {
      requiresAuth: false,
    }
  },
  {
    path: '/server',
    component: ServerWP,
    meta: {
      requiresAuth: true,
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
  },
  {
    path: '/system',
    component: SystemStatus,
    meta: {
      requiresAuth: false,
    }
  }
]





const router = createRouter({
  history: createWebHashHistory(),
  routes,
})



router.beforeEach((to, from, next) => {
  // Update the store status based on route change
  store.commit("_GLOBAL_ERROR", false);
  next(); // Always call next() to proceed with the navigation
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    let auth = store.state._auth;

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