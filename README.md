# ARMS Music — Eleventy Ecommerce

Migración del sitio monolítico `index.html` a **Eleventy (11ty)** con arquitectura modular.

## Estructura del proyecto

```
arms-music/
├── .eleventy.js              ← Configuración de Eleventy
├── package.json
├── src/
│   ├── _includes/
│   │   └── base.njk          ← Layout raíz (navbar, carrito drawer, footer, scripts)
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css      ← Todo el CSS extraído del monolítico
│   │   └── js/
│   │       ├── carrito.js    ← Lógica de carrito (estado, stock, drawer, animaciones)
│   │       └── checkout.js   ← Formulario, envío a Google Sheets, municipios GT
│   ├── favicon.svg           ← (copiar desde el proyecto original)
│   ├── logo-navbar.svg       ← (copiar desde el proyecto original)
│   ├── logo-footer.svg       ← (copiar desde el proyecto original)
│   └── index.njk             ← Página principal (hero + secciones de productos)
└── _site/                    ← Output generado (no commitear)
```

## Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Servidor local con hot-reload
npm start          # → http://localhost:8080

# Build para producción
npm run build      # → carpeta _site/
```

## Assets estáticos (copiar manualmente)

Antes de hacer el primer build, copiar estos archivos desde el proyecto original:
- `favicon.svg` → `src/favicon.svg`
- `logo-navbar.svg` → `src/logo-navbar.svg`
- `logo-footer.svg` → `src/logo-footer.svg`

## Separación de responsabilidades

| Archivo | Responsabilidad |
|---------|-----------------|
| `base.njk` | Navbar, drawer del carrito, footer, WhatsApp, toast, bottom nav mobile |
| `main.css` | Variables CSS, tipografía, navbar, cards, botones, animaciones, cat-tabs, search panel |
| `carrito.js` | Estado localStorage, stock, drawer, agregar/quitar, variantes, hero slider, observers |
| `checkout.js` | Formulario de pedido, validación, Google Sheets, WhatsApp, municipios GT, búsqueda+precio |
| `index.njk` | Contenido: hero, tabs de categorías, secciones de productos, nosotros, contacto |

## Google Apps Script

La URL del endpoint está en `carrito.js`:
```
const SHEETS_URL = 'https://script.google.com/macros/s/.../exec';
```

## Deploy en Cloudflare Pages

1. Push a GitHub (sin `_site/` y `node_modules/`)
2. Conectar repo en Cloudflare Pages
3. Build command: `npm run build`
4. Output directory: `_site`
