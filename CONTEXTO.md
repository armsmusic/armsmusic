# ARMS Music — Contexto del Proyecto

Tienda de audífonos KZ y monitoreo profesional en Guatemala.
Migrada de un `index.html` monolítico a **Eleventy 11ty**.
Dark theme con Bootstrap 5.3, fuente Lexend, paleta morada (#6600FF).

---

## Comandos

```bash
npm start       # servidor local → http://localhost:8080
npm run build   # genera la carpeta _site/ para deploy
```

Para ver en celular: servir con host 0.0.0.0 y abrir http://IP-LOCAL:8080

---

## Estructura de archivos

```
arms-music/
├── .eleventy.js                  ← configuración de Eleventy
├── src/
│   ├── _includes/
│   │   └── base.njk              ← layout raíz: navbar, carrito drawer, footer, scripts
│   ├── assets/
│   │   ├── css/main.css          ← todo el CSS: variables, navbar, cards, botones, animaciones
│   │   └── js/
│   │       ├── carrito.js        ← lógica del carrito
│   │       └── checkout.js       ← formulario de pedido + buscador de productos
│   ├── favicon.svg
│   ├── logo-navbar.svg
│   ├── logo-footer.svg
│   └── index.njk                 ← página principal: hero + secciones de productos
```

---

## Dónde está cada cosa

| Qué quiero cambiar | Archivo |
|---|---|
| Agregar o editar un producto | `src/index.njk` — buscar por nombre del producto |
| Colores, tipografía, espaciado | `src/assets/css/main.css` — variables al inicio en `:root` |
| Navbar, carrito drawer, footer | `src/_includes/base.njk` |
| Lógica del carrito (agregar, quitar, stock) | `src/assets/js/carrito.js` |
| Formulario de pedido, buscador, filtro precio | `src/assets/js/checkout.js` |
| Configuración de Eleventy | `.eleventy.js` |

---

## Carrito — cómo funciona

- Estado guardado en `localStorage` con la key `arms-carrito`
- Array de objetos: `{ nombre, precio, cantidad }`
- El stock se carga desde Google Sheets al iniciar la página
- El drawer (panel lateral) se abre con `abrirCarrito()`
- Flujo: carrito → formulario → progreso → confirmación

### Constantes clave en `carrito.js`

```js
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbze1iJnwYamzr43o2tDw7D0zhM9KAzLK11WROV4C5e4p6JgTlN3O3-d06R3rhi7-EVKDg/exec';
const WA_NUMBER  = '50234646667';
```

---

## Productos — estructura de una card

Cada producto en `index.njk` sigue este patrón:

```html
<!-- dentro de <div class="row g-4" id="row-SECCION"> -->
<div class="col-lg-4 col-md-6 reveal">
  <article data-lazy-card class="card h-100 border-0 shadow-sm bg-body overflow-hidden">

    <!-- Imagen (SVG inline o <img>) -->
    <a class="d-block overflow-hidden product-img-wrap" href="#" style="height:180px;">
      <div class="w-100 h-100 d-flex align-items-center justify-content-center"
        style="background:linear-gradient(135deg,#COLOR1,#COLOR2);">
        <!-- SVG del producto aquí -->
      </div>
    </a>

    <div class="card-body">
      <!-- Nombre + precio -->
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="card-title mb-0" style="font-size:0.95rem;">NOMBRE DEL PRODUCTO</h5>
        <span class="badge bg-primary">QPRECIO</span>
        <!-- Si tiene precio tachado: -->
        <!-- <div class="price-block">
          <span class="price-original">QPRECIO_ORIGINAL</span>
          <div class="price-sale">
            <span class="badge bg-primary">QPRECIO_OFERTA</span>
            <span class="badge-discount">-X%</span>
          </div>
        </div> -->
      </div>

      <!-- Botones -->
      <div class="d-flex gap-2 mt-2">
        <a class="btn btn-sm btn-primary" href="#"><i class="fa-solid fa-eye"></i> Ver más</a>
        <button class="btn btn-sm btn-agregar"
          data-product-name="NOMBRE DEL PRODUCTO"
          onclick="agregarAlCarrito('NOMBRE DEL PRODUCTO', PRECIO, this)">
          <i class="fa-solid fa-cart-plus"></i> Agregar
        </button>
      </div>
    </div>

  </article>
</div>
```

### Producto con variantes (colores/versiones)

```html
<!-- Selector de variantes -->
<div class="d-flex flex-wrap gap-1 mb-3" id="var-NOMBRE-SIN-ESPACIOS">
  <button onclick="seleccionarVariante(this, 'NOMBRE BASE', 'Variante 1', PRECIO)" class="var-btn-active" style="...">Variante 1</button>
  <button onclick="seleccionarVariante(this, 'NOMBRE BASE', 'Variante 2', PRECIO)" style="...">Variante 2</button>
</div>

<!-- Botón agregar (el id debe coincidir con el nombre) -->
<button class="btn btn-sm btn-agregar"
  id="btn-add-NOMBRE-SIN-ESPACIOS"
  data-product-name="NOMBRE BASE - Variante 1"
  onclick="agregarAlCarrito('NOMBRE BASE - Variante 1', PRECIO, this)">
  <i class="fa-solid fa-cart-plus"></i> Agregar
</button>
```

---

## Secciones de productos

| ID de sección | Descripción |
|---|---|
| `#inears` | Audífonos In-Ear KZ y similares |
| `#monitores` | Equipos de monitoreo profesional |
| `#audio` | Audio y accesorios generales |
| `#accesorios-inears` | Accesorios para in-ears (cables, tips, estuches) |

Cada sección tiene su `<div class="row g-4" id="row-SECCION">` donde van las cards.
Las primeras 3 cards son visibles. Las adicionales llevan clase `extra-card` y `data-section="SECCION"` y empiezan ocultas (`style="display:none"`).

---

## Buscador de productos

Está en `checkout.js`. Filtra buscando dentro de `#row-SECCION > .reveal` por `.card-title` y `.card-text`. El filtro de precio lee el badge `.badge.bg-primary` o el onclick del botón agregar.

---

## Deploy

- **Cloudflare Pages**: build command `npm run build`, output `_site`
- No commitear `_site/` ni `node_modules/`
