import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Home — Personal Blog' },
    },
    {
      path: '/posts/:slug',
      component: () => import('@/views/PostDetailView.vue'),
      meta: { title: 'Post — Personal Blog' },
    },
    {
      path: '/categories/:slug',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: 'Category — Personal Blog' },
    },
    {
      path: '/search',
      component: () => import('@/views/SearchView.vue'),
      meta: { title: 'Search — Personal Blog' },
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '404 Not Found' },
    },
  ],
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) ?? 'Personal Blog'
})

export default router
