import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { 
        path: '', 
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue') 
      },
      {
        path: '/orders',
        name: 'orders',
        component: () => import('pages/OrdersPage.vue')
      },
      {
        path: '/products',
        name: 'products',
        component: () => import('pages/ProductsPage.vue')
      },
      {
        path: '/customers',
        name: 'customers',
        component: () => import('pages/IndexPage.vue') // Placeholder for now
      },
      {
        path: '/analytics',
        name: 'analytics',
        component: () => import('pages/IndexPage.vue') // Placeholder for now
      },
      {
        path: '/settings',
        name: 'settings',
        component: () => import('pages/IndexPage.vue') // Placeholder for now
      }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
