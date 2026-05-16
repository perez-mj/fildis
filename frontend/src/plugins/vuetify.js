/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#6366F1',      // Calm indigo
          secondary: '#10B981',    // Serene green
          info: '#3B82F6',         // Soft blue
          warning: '#F59E0B',      // Warm amber
          error: '#EF4444',        // Gentle red
          success: '#10B981',      // Matching secondary
          background: '#F9FAFB',   // Off-white background
          surface: '#FFFFFF',      // White surfaces
        }
      }
    }
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none;',
    },
    VCard: {
      elevation: 0,
    },
  }
})
