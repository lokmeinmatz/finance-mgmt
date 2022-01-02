
import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import ImportStart from './views/ImportStart.vue'

export const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: Home
        },
        {
            path: '/import',
            component: ImportStart
        }
    ], // short for `routes: routes`
  })