import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './index.css'

import TemplatesPage from './pages/TemplatesPage.vue'
import ExtractPage from './pages/ExtractPage.vue'
import GeneratePage from './pages/GeneratePage.vue'
import HistoryPage from './pages/HistoryPage.vue'
import SettingsPage from './pages/SettingsPage.vue'
import UploadPage from './pages/UploadPage.vue'
import ProfilePage from './pages/ProfilePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: TemplatesPage },
    { path: '/upload', component: UploadPage },
    { path: '/templates', component: TemplatesPage },
    { path: '/extract', component: ExtractPage },
    { path: '/generate', component: GeneratePage },
    { path: '/history', component: HistoryPage },
    { path: '/settings', component: SettingsPage },
    { path: '/profile', component: ProfilePage },
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
