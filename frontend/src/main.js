/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'
import router from '@/router'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Composables
import { createApp } from 'vue'

// Styles
import 'unfonts.css'
import './assets/main.css'


// Create Pinia with persistence
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

registerPlugins(app)

app.use(router)
    .use(pinia)
    .mount('#app')
