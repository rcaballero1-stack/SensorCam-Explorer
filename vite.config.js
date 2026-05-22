import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  // Directori dels recursos estàtics
  publicDir: 'public',

  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Separar el codi en chunks per carregar-lo millor
        manualChunks: {
          sensors: ['./src/modules/sensors.js'],
          camera:  ['./src/modules/camera.js'],
        },
      },
    },
  },

  server: {
    // HTTPS local → necessari per a càmera i sensors
    https: true, // Canvia a true si tens certificats locals
    host: true,   // Exposa a la xarxa local (per provar al mòbil)
    port: 3000,
  },

  plugins: [
    basicSsl(), // Permet HTTPS local amb certificats auto-signats
    VitePWA({
      // 'autoUpdate' actualitza el SW automàticament en background
      registerType: 'autoUpdate',

      // Genera el SW automàticament (no cal service-worker.js manual)
      injectRegister: 'auto',

      // Configuració del manifest
      manifest: {
        name:             'SensorCam Explorer',
        short_name:       'SensorCam',
        description:      'Càmera i sensors del mòbil en una PWA',
        start_url:        '/',
        display:          'standalone',
        orientation:      'portrait',
        background_color: '#0f0f1a',
        theme_color:      '#0f0f1a',
        lang:             'ca',
        icons: [
          {
            src:     'icons/icon-192.png',
            sizes:   '192x192',
            type:    'image/png',
            purpose: 'any maskable',
          },
          {
            src:     'icons/icon-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name:        'Obrir Càmera',
            short_name:  'Càmera',
            description: 'Obre directament la càmera',
            url:         '/?tab=camera',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        screenshot: [
            {
                "src": "images/screenshot.png",
                "type": "image/png",
                "form_factor": "wide",
                "sizes": "1666x779",
                "label": "Vista de la càmera amb efectes aplicats"
            }
        ],
        categories: ['photography', 'utilities'],
      },

      // Configuració del Workbox (gestió de caché)
      workbox: {
        // Recursos a pre-cachejar (Vite els detecta automàticament)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Estratègies de caché
        runtimeCaching: [
          {
            // Google Fonts → Stale While Revalidate
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler:    'StaleWhileRevalidate',
            options: {
              cacheName:             'google-fonts-cache',
              expiration: {
                maxEntries:       20,
                maxAgeSeconds:    60 * 60 * 24 * 365, // 1 any
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Imatges locals → Cache First
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler:    'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries:    50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dies
              },
            },
          },
        ],
      },

      // Opcions del dev server per a PWA en desenvolupament
      devOptions: {
        enabled: true,
        type:    'module',
      },
    }),
  ],
});