
import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import ImportStart from './views/ImportStart.vue'
import ImportStaged from './views/ImportStaged.vue'
import Overview from './views/Overview.vue'

export const router = createRouter({
    // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: Home
        },
        {
            path: '/overview',
            component: Overview
        },
        {
            path: '/import',
            component: ImportStart
        },
        {
            path: '/import/staged/:id',
            component: ImportStaged
        }
    ], // short for `routes: routes`
  })