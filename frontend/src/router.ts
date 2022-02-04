
import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import ImportStart from './views/import/ImportStart.vue'
import ImportStaged from './views/import/ImportStaged.vue'
import ImportFinished from './views/import/ImportFinished.vue'
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
        },
        {
            path: '/import/finished/:id',
            component: ImportFinished
        }
    ], // short for `routes: routes`
})

router.afterEach((to, from) => {
    console.log(`navigated from ${from.fullPath} -> ${to.fullPath}`)
})