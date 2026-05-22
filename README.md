# PAS 1: Inicialitzar el projecte

Aquest pas només l'heu de fer quan creeu el vostre projecte des de 0.
En aquest cas concret, el projecte ja existeix, podeu passar al PAS 2.

## Crear projecte amb Vite
```bash
npm create vite@latest sensorCam-explorer -- --template vanilla

cd sensorCam-explorer

## Instal·lar dependències
npm install

## Instal·lar plugin PWA per a Vite
npm install -D vite-plugin-pwa @vitejs/plugin-basic-ssl
```

# PAS 2: Executar el projecte

## Mode desenvolupament (amb HMR)

```bash
npm run dev

# La terminal mostrarà:
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.x.x:5173/  ← Per al mòbil!
```

> ⚠️ **Important**: La càmera i els sensors requereixen HTTPS. En mode dev, Vite serveix en HTTP però la majoria de navegadors moderns permeten localhost i la IP de xarxa local. Si tens problemes, pots afegir HTTPS:

```javascript
// vite.config.js → server
server: {
  https: true, // Genera certificat auto-signat
  host: true,
}
```

# PAS 3: Build i deploy

```bash
# Generar el build optimitzat
npm run build

# Previsualitzar el build (amb host per al mòbil)
npm run preview

# El build genera a /dist:
# dist/
# ├── index.html
# ├── assets/
# │   ├── index-[hash].js    ← Bundle optimitzat
# │   └── index-[hash].css   ← CSS minificat
# ├── sw.js                  ← Service Worker generat per Workbox
# └── manifest.webmanifest   ← Manifest generat pel plugin
```

### Deploy a Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir dist
```

### Deploy a Vercel

```bash
npm install -g vercel
vercel --prod
```

---

## Resum de l'arquitectura amb Vite

```text
main.js
  ├── ui.js        → Tabs + Toasts + Status badge
  ├── camera.js    → Càmera + Canvas effects + HUD
  ├── sensors.js   → Acceleròmetre + Orientació + Shake
  └── gallery.js   → Galeria + Modal + Download

Comunicació entre mòduls:
  sensors.js → camera.js   via updateCameraAccel()
  camera.js  → gallery.js  via CustomEvent('photo:captured')
  sensors.js → camera.js   via CustomEvent('sensor:shake')
```

|Característica Vite|Benefici|
|---|---|
|**HMR** (Hot Module Replacement)|Canvis en temps real sense recarregar|
|**`vite-plugin-pwa`**|SW + Manifest generats automàticament|
|**ES Modules natius**|Codi modular sense bundler manual|
|**Build optimitzat**|Tree-shaking + minificació automàtica|
|**Workbox integrat**|Estratègies de caché avançades sense configuració|
