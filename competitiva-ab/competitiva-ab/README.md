# Competitiva AB ⚽

App de gestión de la competitiva semanal del equipo de fútbol.

---

## 🚀 Cómo publicarla (sin conocimientos técnicos)

### Paso 1 — Sube el código a GitHub

1. Ve a [github.com](https://github.com) y crea una cuenta gratuita si no tienes
2. Haz clic en **"New repository"** (botón verde arriba a la derecha)
3. Ponle nombre: `competitiva-ab` → clic en **"Create repository"**
4. En la siguiente pantalla, clic en **"uploading an existing file"**
5. Arrastra TODA la carpeta del proyecto y sube los archivos
6. Clic en **"Commit changes"**

### Paso 2 — Despliega en Vercel (gratis)

1. Ve a [vercel.com](https://vercel.com) y regístrate con tu cuenta de GitHub
2. Clic en **"Add New Project"**
3. Selecciona el repositorio `competitiva-ab`
4. Vercel detecta automáticamente que es un proyecto Vite → clic en **"Deploy"**
5. En 1-2 minutos tendrás tu URL pública: `https://competitiva-ab.vercel.app`

✅ Cada vez que subas cambios a GitHub, Vercel actualiza la app automáticamente.

---

## 💻 Cómo instalarla como app de escritorio (sin instalar nada)

Una vez publicada en Vercel, puedes instalarla como app nativa en tu ordenador:

### En Chrome / Edge:
1. Abre tu URL de Vercel en el navegador
2. En la barra de direcciones verás un icono de **"Instalar"** (⊕ o pantalla con flecha)
3. Haz clic → **"Instalar"**
4. La app aparece en tu escritorio y en el menú de aplicaciones
5. Se abre sin barra del navegador, como una app nativa

### En Safari (Mac):
1. Abre tu URL
2. Menú **Compartir** → **"Añadir al Dock"**

---

## 🛠️ Desarrollo local (opcional)

Si tienes Node.js instalado puedes correrla localmente:

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador.

---

## 📁 Estructura del proyecto

```
competitiva-ab/
├── src/
│   ├── main.jsx        # Punto de entrada React
│   └── App.jsx         # App completa
├── public/
│   ├── manifest.json   # Config PWA (instalable)
│   ├── icon.svg        # Icono app
│   ├── icon-192.png    # Icono PWA pequeño
│   └── icon-512.png    # Icono PWA grande
├── index.html          # HTML base
├── vite.config.js      # Config Vite
├── package.json        # Dependencias
└── vercel.json         # Config deploy
```
