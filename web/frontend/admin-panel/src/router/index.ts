import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true, title: 'Login — Admin' },
    },
    {
      path: '/',
      redirect: '/dashboard',
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, title: 'Dashboard — Admin' },
    },
    {
      path: '/posts',
      component: () => import('@/views/posts/PostListView.vue'),
      meta: { requiresAuth: true, title: 'Posts — Admin' },
    },
    {
      path: '/posts/create',
      component: () => import('@/views/posts/PostCreateView.vue'),
      meta: { requiresAuth: true, title: 'Create Post — Admin' },
    },
    {
      path: '/posts/:id/edit',
      component: () => import('@/views/posts/PostEditView.vue'),
      meta: { requiresAuth: true, title: 'Edit Post — Admin' },
    },
    {
      path: '/categories',
      component: () => import('@/views/categories/CategoryListView.vue'),
      meta: { requiresAuth: true, title: 'Categories — Admin' },
    },
    {
      path: '/comments',
      component: () => import('@/views/comments/CommentListView.vue'),
      meta: { requiresAuth: true, title: 'Comments — Admin' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  document.title = (to.meta.title as string) ?? 'Admin Panel'
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login'
  if (to.path === '/login' && auth.isAuthenticated) return '/dashboard'
})

export default router
