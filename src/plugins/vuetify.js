/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'sercDark',
    themes: {
      sercDark: {
        dark: true,
        colors: {
          background: '#0a0b2c',
          surface: '#16184d',
          'surface-variant': '#22256c',
          primary: '#FFD200',
          'primary-darken-1': '#E5BD00',
          secondary: '#2F3191',
          'secondary-lighten-1': '#46489A',
          accent: '#FFD200',
          error: '#e11d48',
          info: '#3b82f6',
          success: '#00A651',
          warning: '#FFD200',
        },
      },
    },
  },
})
