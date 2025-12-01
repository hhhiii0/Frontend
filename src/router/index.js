import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
        //新增
      {
        path: '/analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue')
      },
      // 在children数组中添加
      {
        path: '/brain-tumor',
        name: 'BrainTumorAnalysis',
        component: () => import('@/views/BrainTumorAnalysis.vue')
      },
      {
        path: '',
        redirect: '/chat'
      },
      {
        path: '/chat',
        name: 'Chat',  // 修改名称
        component: () => import('@/views/Chat.vue')  // 指向新的合并页面
      },
      // 移除图片问答路由
      {
        path: '/history',
        name: 'History',
        component: () => import('@/views/History.vue')
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router