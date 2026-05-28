import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
 
export default defineConfig({
 publicDir: 'public',
 
 build: {
   outDir: 'dist',
   sourcemap: true,
   rollupOptions: {
       output: {
           // Separar el codi en chunks segons la teva nova estructura modular
           manualChunks(id) {
               if (id.includes('src/modules/map.js')) {
                   return 'map';
               }
               if (id.includes('src/modules/camera.js')) {
                   return 'camera';
               }
               if (id.includes('src/modules/history.js')) {
                   return 'history';
               }
           },
       }
   },
 },
 
 server: {
   https: true,
   host: true,
   port: 3000,
 },
 
 plugins: [
   basicSsl(),
   VitePWA({
     registerType: 'autoUpdate',
     injectRegister: 'auto',
 
     manifest: {
       name:             'ParkFinder - On he aparcat?',
       short_name:       'ParkFinder',
       description:      'Desa on has aparcat el teu cotxe amb foto i mapa',
       start_url:        '/',
       display:          'standalone',
       orientation:      'portrait',
       background_color: '#0a0a0f',
       theme_color:      '#0a0a0f',
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
           name:        'Guardar aparcament',
           short_name:  'Aparcar',
           description: 'Guarda ràpidament on has aparcat',
           url:         '/?tab=map',
           icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
         },
       ],
       categories: ['navigation', 'utilities', 'travel'],
     },
 
     workbox: {
       globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
       runtimeCaching: [
         {
           urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
           handler:    'StaleWhileRevalidate',
           options: {
             cacheName: 'google-fonts-cache',
             expiration: {
               maxEntries:    20,
               maxAgeSeconds: 60 * 60 * 24 * 365,
             },
             cacheableResponse: { statuses: [0, 200] },
           },
         },
         {
           // Cache natiu de les teves de rajoles d'OpenStreetMap (indispensable offline)
           urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
           handler:    'CacheFirst',
           options: {
             cacheName: 'osm-tiles-cache',
             expiration: {
               maxEntries:    200,
               maxAgeSeconds: 60 * 60 * 24 * 7, // 1 setmana
             },
             cacheableResponse: { statuses: [0, 200] },
           },
         },
         {
           // Cache de geolocalització a la xarxa
           urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\/.*/i,
           handler:    'NetworkFirst',
           options: {
             cacheName: 'nominatim-cache',
             expiration: {
               maxEntries:    50,
               maxAgeSeconds: 60 * 60 * 24,
             },
             cacheableResponse: { statuses: [0, 200] },
           },
         },
       ],
     },
 
     devOptions: {
       enabled: true,
       type:    'module',
     },
   }),
 ],
});
