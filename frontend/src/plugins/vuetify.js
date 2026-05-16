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
          accent: '#818CF8',        // Lighter indigo for accents
          info: '#3B82F6',         // Soft blue
          warning: '#F59E0B',      // Warm amber
          error: '#EF4444',        // Gentle red
          success: '#10B981',      // Matching secondary
          background: '#F8FAFC',   // Peaceful background
          surface: '#FFFFFF',      // White surfaces
          'on-background': '#1E293B',
          'on-surface': '#1E293B',
        }
      }
    }
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none; font-weight: 500;',
      rounded: 'pill',
      elevation: 0,
    },
    VCard: {
      elevation: 0,
      rounded: 'xl',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
    },
    VAlert: {
      rounded: 'lg',
      elevation: 0,
      variant: 'tonal',
    },
    VChip: {
      rounded: 'pill',
      elevation: 0,
    },
    VProgressLinear: {
      height: 3,
      rounded: true,
    },
    VDialog: {
      rounded: 'xl',
      elevation: 0,
    },
    VTable: {
      class: 'calm-table',
    },
    VTab: {
      rounded: 'pill',
    },
    VTabs: {
      color: 'primary',
    },
  },
})