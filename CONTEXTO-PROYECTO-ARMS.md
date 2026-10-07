# CONTEXTO — ARMS Music (armsmusic.com)

> Contexto completo del proyecto para cualquier agente de código (OpenCode +
> Qwen3.8-27B local, Claude Code, u otra IA). **Léelo entero antes de tocar
> nada.** Estado verificado contra el repo `armsmusic/armsmusic` el 2026-10-07
> (último commit: `9edcf6d NEW SKIN`, 2026-07-26).

---

## 0. INSTRUCCIONES PARA EL AGENTE (lo más importante)

1. **Esta es una migración VISUAL.** El sitio ya funciona: carrito, stock,
   checkout, pedidos, URLs. Tu trabajo es cambiar **apariencia y estructura
   visual**, nunca el funcionamiento. No toques IDs, `onclick`, `data-*`,
   filtros Nunjucks, bindings ni nombres de funciones JS salvo que el dueño lo
   pida explícitamente.
2. **Pide aprobación antes de aplicar cambios.** Explica qué vas a cambiar y
   por qué; espera el "dale".
3. **Verifica contra el código real, no de memoria.** Antes de diagnosticar un
   bug visual, lee el CSS real (`src/assets/css/arms.css`) y, si aplica, el
   CSS original del tema Impact (ver §5). Antes de decir "esta clase no
   existe", haz `grep`.
4. **Diagnostica con datos, no a ojo.** Trabajas directo sobre el repo:
   investiga tú mismo. Lee el CSS real, haz `grep` de la clase, compila
   (`npm run build`) y revisa el HTML generado en `_site/` para ver qué clases
   y estructura llegan realmente al navegador. Para medidas de layout
   (anchos, márgenes, posiciones), mídelas tú si tienes un navegador headless
   disponible (p. ej. Playwright: `getBoundingClientRect()` /
   `getComputedStyle()` sobre el servidor local). Nunca estimes píxeles o
   porcentajes desde una captura de pantalla. Al dueño pídele solo lo que no
   puedes obtener tú: confirmación visual o una captura.
5. **Un cambio visual completo va en un solo commit.** Si un `.njk` necesita
   CSS nuevo, edita `arms.css` en el mismo cambio. Nunca dejes un `.njk`
   apuntando a clases que todavía no existen.
6. **Commit antes de pasarle el problema al otro agente.** El dueño usa dos
   agentes sobre el mismo repo (OpenCode/Qwen local como principal, Claude
   Code como apoyo). El `git log` es el canal de traspaso: quien entra debe
   ver el estado real, no archivos a medio editar.
7. **Compila antes de dar algo por terminado:** `npm run build` debe terminar
   sin errores. Un `{% include %}` roto rompe todo el sitio en producción.
8. Responde **en español, directo y técnico.** El dueño (armsmusic) habla
   informal y fuerte; no adules, no rellenes. Si te equivocaste, dilo sin
   rodeos.
9. **El sitio es 95% Impact + 5% decisiones del dueño — diferencia ≠ bug.**
   Lo que el dueño decidió (su 5%) se respeta tal cual aunque difiera del
   demo. En auditorías de fidelidad: lista **todas** las diferencias medidas
   (página por página, con datos) y pregunta por cada una si se iguala a
   Impact o se respeta. Algunas son decisiones suyas; otras pueden ser bugs
   que él no conocía (ej. real 2026-10-07: header 97px vs 94px del demo, no
   era decisión suya). Solo se aplica lo que él diga explícitamente.

---

## 1. QUÉ ES EL PROYECTO

**ARMS Music** — ecommerce de audio en Guatemala: in-ears KZ/QKZ/CCA,
sistemas de monitoreo personal, amplificadores, interfaces, micrófonos,
cables y accesorios. Precios en Quetzales (GTQ). Pago contra entrega y envíos
a todo el país. Muchos pedidos entran además por WhatsApp/Messenger.

**Iniciativa actual:** migración visual del sitio al **tema Impact de
Maestrooo** (Shopify), lo más fiel posible, sobre la base Eleventy existente.
Demo de referencia: `https://impact-theme-sound.myshopify.com`.

---

## 2. ENTORNO DE DESARROLLO (desde octubre 2026)

- **SO:** Linux Mint.
- **Repo:** `armsmusic/armsmusic` (rama `main`). Es el repo de
  **producción**. El repo `armsmusic/TEST` fue el de pruebas durante la
  migración; ya se fusionó aquí y está **retirado** — no lo uses.
- **Clon local:** `~/armsmusic` (GitHub conectado por **SSH**:
  `git@github.com:armsmusic/armsmusic.git`).
- **Agentes:** OpenCode conectado a **Qwen3.8-27B** servido localmente con
  llama.cpp (`llama-server`). Claude Code como apoyo para lo que el modelo
  local no resuelva.
- **Puertos — CONFLICTO CONOCIDO:** `llama-server` usa el **8080**, que es
  también el puerto por defecto del servidor de desarrollo de Eleventy.
  Levanta el sitio en otro puerto:
  ```bash
  npx @11ty/eleventy --serve --port=8081
  ```
  (El `package.json` del repo todavía tiene `"start": "npx @11ty/eleventy
  --serve"` sin puerto; el dueño decidió no commitear el cambio de puerto
  porque es algo de su entorno local.)
- **Comandos:**
  - `npm install` — tras clonar (regenera `node_modules/`, que no está en git).
  - `npx @11ty/eleventy --serve --port=8081` — desarrollo con recarga.
  - `npm run build` — compila a `_site/` (lo mismo que hace Cloudflare).
- **`npm audit`:** quedan 13 vulnerabilidades (moderadas/altas), todas en
  dependencias internas de **Eleventy 2.x** y todas de tipo DoS por entrada
  maliciosa en el proceso de build (inexplotables aquí: las entradas son los
  propios archivos del proyecto; nada de eso llega al navegador). **NO correr
  `npm audit fix --force`**: sube a Eleventy 3 de golpe (cambio mayor). La
  migración a Eleventy 3 es un pendiente aparte (§11-H).

---

## 3. STACK Y ARQUITECTURA

- **Generador:** Eleventy **2.x** + plantillas **Nunjucks** (`.njk`).
  Configuración en `.eleventy.js` en **CommonJS** (`module.exports`) — el
  dueño prefiere CommonJS sobre ESM; mantenlo así.
- **Hosting:** Cloudflare Pages (build automático al hacer push a `main`).
- **Backend:** Cloudflare Functions en `functions/api/`:
  - `stock.js` → proxy a Google Apps Script (inventario en Google Sheets).
  - `pedido.js` → envía pedidos del checkout a Sheets.
  - La URL del Apps Script vive en el **secret `SHEETS_URL`** del dashboard de
    Cloudflare (no está en el repo, nunca se expone al frontend).
- **Producción:** `armsmusic.com` (tiene `SHEETS_URL` → stock y pedidos
  funcionan).
- **SEO:** `src/_includes/seo.njk`, `schema.njk` (JSON-LD), `sitemap.njk`,
  `robots.njk`. **El sitio tiene `noindex` activo por defecto** (§11-I).

---

## 4. DATOS — `src/_data/productos.json`

Tres claves raíz:
- **`catalogo`** — array de 57 productos. Campos: `id`, `nombre`, `precio`,
  `precioOriginal`, `descuento`, `imagenes` (array), `variantes` (nombres),
  `imagenesVariantes`, `svgTipo`, `g1`/`g2` (gradiente de fallback), campos SEO.
- **`secciones`** — mapa `seccion → [ids]` (qué producto va en qué categoría).
- **`extra`** — datos adicionales.

`.eleventy.js` cruza ambos con `resolverSeccion()` y expone a las plantillas:

| Variable | Productos |
|---|---|
| `productos.inears` | 25 |
| `productos.monitores` | 8 |
| `productos.audio` | 12 |
| `productos["accesorios-inears"]` | 12 |
| `productos["audio-sistemas"]` | 9 |
| `productos["audio-interfaces"]` | 4 |
| `productos["audio-microfonos"]` | 4 |
| `productos["audio-cables"]` | 3 |

**Filtros Nunjucks:** `productoUrl` (id → URL), `gtq` (número → "Q123"),
`urlencode`. **No existen filtros custom** tipo `selectFeatured`: para buscar
un producto por id usa `{% for p in lista %}{% if p.id == "x" %}…`.

Algunos productos están en dos secciones (p.ej. `p2-monitor-personal` en
`monitores` y `audio-sistemas`). Si concatenas secciones para una lista,
verifica que no haya duplicados o el producto se renderiza dos veces.

---

## 5. SISTEMA CSS — LEE ESTO DOS VECES

### Estado

| Archivo | Estado |
|---|---|
| **`src/assets/css/arms.css`** | ✅ **ÚNICO CSS ACTIVO** del sitio (~4,190 líneas). Sistema Impact. |
| `main.css` | 🔌 Desconectado (sistema viejo sobre Bootstrap). Sigue en el repo como referencia. |
| `categoria.css` | 🔌 Desconectado (diseño oscuro viejo). |
| `producto.css` | 🔌 Desconectado (diseño oscuro viejo; sus 22 clases se migraron a `arms.css`). |
| Bootstrap CSS/JS | 🔌 Desconectado de `base.njk`. **Excepción:** `checkout-layout.njk` todavía lo carga (§11-A). |

`base.njk` solo enlaza: Google Fonts (Lexend, Instrument Serif), Font
Awesome 6.5.2 y `arms.css`. Los CSS viejos están comentados con una nota.

Cuando un estilo "desaparece", casi siempre es porque vivía en uno de los CSS
desconectados. Búscalo ahí (`grep` en `main.css`/`categoria.css`/
`producto.css`), y **recupéralo a `arms.css` adaptado al tema claro**.

### Referencias del tema Impact
El CSS/HTML original de Impact se extrajo del demo y se guardó fuera del
repo (archivos del dueño): `theme.css` (~10,200 líneas), `theme.js`,
`index.html` (home), `Headphones.html` (página de colección = referencia de
pilares). Como no están en el repo, si los necesitas pídeselos al dueño
(o que los coloque en una carpeta de referencia fuera de `src/`, para que no
entren al build). **No reconstruyas componentes de Impact de memoria.**

### Reglas de oro (aprendidas a golpes)
1. **Variables CSS usadas pero no definidas fallan EN SILENCIO.** Ej. real: el
   grid de productos caía a 1 columna porque `--product-list-items-per-row`
   se usaba sin definir.
2. **Al portar una regla de Impact, conserva su `@media`.** Bug real: una
   regla con `min-height:300px` que en Impact vivía en
   `@media (min-width:700px)` se copió suelta y deformó el móvil.
3. **Utilidades al FINAL de `arms.css`.** Como Tailwind: las clases
   utilitarias ganan por posición en la cascada, no con `!important`.
4. **Colisión con Bootstrap:** `.rounded`, `.text-center`, `.text-start`,
   `.text-end` se prefijan como `.arms-rounded`, `.arms-text-center`, etc.
   Al pegar HTML de Impact, haz `grep -E '\b(text-start|text-center|text-end|rounded)\b'`
   (excluyendo `arms-*` y `rounded-xs/sm/lg/full`) y corrige.
5. **Nunca uses la paleta vieja de ARMS** (`#6600FF`, `--arms-purple`,
   `#c4a8ff`, dorados, fondos `#171717`) en lo migrado. Usa los colores y
   tokens reales de Impact. **Tema CLARO:** texto oscuro sobre fondo blanco.
6. **Usa los tokens del sistema**, no valores sueltos: `--spacing-0…20`,
   `--text-xs/sm/base/h0…h6`, `--rounded-xs/sm/full/button`,
   `--text-primary`, `--background`, `--text-color`, `--product-list-*`.
7. **Elementos `position:absolute/fixed` que cambian entre móvil y desktop:**
   si el móvil fija `top` y `bottom` (o `left` y `right`), el desktop debe
   poner el lado que no usa en `auto`, o el elemento se estira.
8. `<ul>` necesita `list-style:none` explícito.
9. Si un bug persiste tras un "fix correcto", busca **otra regla de igual
   especificidad ganando la cascada**, y revisa con `git diff` / `git log`
   que el cambio realmente esté aplicado (y compilado) antes de recalcular.

---

## 6. JAVASCRIPT Y WEB COMPONENTS

Cargados en `base.njk`:

| Archivo | Rol |
|---|---|
| `arms-announcement.js` | `<marquee-text>` + `HeightObserver`. **Único** dueño de `marquee-text`. |
| `arms-header.js` | `<store-header>`: sticky tras 500px (`STICKY_THRESHOLD`), transparencia condicional. |
| `safe-sticky.js` | `<safe-sticky>`: compensación de scroll para `position:sticky` (portado del `theme.js` real de Impact). Lo usa la columna de info de la página de producto (botón sticky en desktop). |
| `arms-slideshow.js` (module) | Hero/slideshow, `ScrollCarousel`, `PageDots`, prev/next buttons, `SplitLines` con Motion One. |
| `arms-home.js` (module) | Resto de Web Components del home; Motion One para reveal-on-scroll. |
| `cart-store.js` | Estado del carrito, stock (`/api/stock`), variantes (`seleccionarVariante`), `agregarAlCarrito`. |
| `cart-drawer.js` | Panel lateral del carrito (renderiza los items por JS con estilos inline). |
| `site-ui.js` | Nav drawer, bottom nav, observers, lógica muerta de `#cat-tabs-bar`. |
| `buscar.js` | Buscador. |
| `checkout-page.js` | Solo en checkout (layout propio). |

Motion One por CDN: `https://cdn.jsdelivr.net/npm/motion@12/+esm`.

**Regla crítica:** `customElements.define()` exige **una clase única por
tag**. Reusar la misma clase en dos tags lanza `NotSupportedError` y **detiene
todo el JS que viene después** (el contenido se ve, pero nada anima). Si una
sección no anima, revisa la consola buscando errores de `customElements`
primero. Solución: subclases vacías (`class X extends BaseCarousel {}`).

**Hooks JS que NO se pueden quitar del HTML** (el JS los busca):
- `.card-categoria-body` en la card → `cart-store.js` lo usa para inyectar el
  indicador de stock.
- `.btn-agregar`, `.var-btn-active`, `.stock-indicator`, `data-product-name`,
  `data-img`, `data-lazy-card`.
- En producto: `#img-principal`, `#img-track`, `#img-principal-wrap`,
  `.thumb-btn`, `.thumb-active`.
- `cart-store.js` resuelve el botón con `getElementById('btn-cat-' + nombre)`.
  **Si un mismo producto se renderiza dos veces con botones en la misma
  página, los IDs se duplican y el JS actualiza la card equivocada.** Por eso
  los carruseles usan cards simplificadas sin botones (§8).

---

## 7. ESTADO DE LA MIGRACIÓN — LO QUE YA ESTÁ HECHO

### ✅ Home — `src/index.njk` + `src/_includes/home/`
Única página con `headerTransparente: true` (header transparente sobre el
hero). Secciones, en orden: hero/slideshow, image-link-blocks,
scrolling-text, collection-list, featured-collection, impact-text,
image-with-text-overlay, media-grid, before-after-image, press, hot-spots,
impact-text-2, multiple-images-with-text, feature-chart, revealed-image,
timeline, faq, text-with-icons.

### ✅ Header — `src/_includes/header.njk`
`allow-transparency` es condicional (`{% if headerTransparente %}`). Todas las
páginas salvo el home tienen header **sólido** desde el inicio (como Impact en
colecciones).

### ✅ Card de producto — `src/_includes/card-producto.njk`
Reskin al `product-card` de Impact: fondo blanco, badge de descuento, título
bold, `price-list` con tachado, variantes compactas (3 por fila), botón
"Agregar" anclado abajo y alineado entre cards (cadena de altura:
`grid-template-rows:auto 1fr` + `margin-top:auto`), indicador de stock.
Toda la lógica intacta. Imagen vía `product-img.njk` con **hover-swap**
(segunda foto) solo si el producto tiene 2+ imágenes.

### ✅ Feedback de variante seleccionada
`.var-btn-active` (selector solo, sin exigir otra clase) → outline oscuro,
negrita, `scale(1.04)`. Funciona en cards **y** en la página de producto.

### ✅ Pilares — `src/in-ears/index.njk` y `src/audio/index.njk`
Las 6 secciones de la página de colección de Impact:
1. **collection-banner** — imagen parallax + título `h0` + producto destacado
   a la derecha (solo desktop). In-Ears: `kz-castor-pro`; Audio:
   `p2-monitor-personal`.
2. **image-link-blocks** — 4 bloques a subcategorías.
3. **main-collection** — grid `<product-list>` (2 col móvil / 3 en ≥1000px /
   4 en ≥1200px) + **bloque promo** (`product-list__promo`, ocupa 2 columnas)
   tras el 4º producto. Sin toolbar, filtros ni contador (decisión del dueño).
   El grid va directo en la sección, **sin `.container`** (metía margen extra).
4. **featured-collection** — carrusel "Los más vendidos", fondo degradado
   marrón de Impact.
5. **image-link-blocks #2** — "Explora las colecciones".
6. **text-with-icons** — garantías (envíos, pago contra entrega, WhatsApp,
   garantía).

Audio usa como grid el concat de las 4 subsecciones (20 productos).

### ✅ Subpilares (5)
`/in-ears/accesorios/`, `/audio/sistemas/`, `/audio/interfaces/`,
`/audio/microfonos/`, `/audio/cables/`. Cada `index.njk` solo define
parámetros e incluye `pilar/subpilar.njk`. Estructura: banner con destacado →
grid + promo → "Explora las colecciones" (excluye la página actual) →
garantías. **Promo inteligente:** tras el 4º producto si hay 4+, al final si
hay menos (Cables tiene 3). Promos: accesorios → "Encuentra tus In-Ears" →
`/in-ears/`; los de audio → "Audio y Accesorios" → `/audio/`.

### ✅ Página de producto — `src/_includes/producto.njk`
(Generada por `src/producto-page.njk` con paginación.) Se conservó la
estructura; se cambió layout y estilo:
- `.producto-layout` (grid 5/7 en desktop), `.producto-relacionados` (2/4 col).
- **Botón "Agregar al carrito" sticky** (ver fix `00b4bba` en §14): columna
  de info envuelta en `<safe-sticky class="producto-info">` (sticky en
  desktop ≥1000px, mecanismo de Impact) + barra fija abajo en móvil
  (`#producto-barra`, JS inline al final del include, `z-index: 1050`).
- Al final: featured-collection "Los más vendidos" (excluye el producto
  actual vía `fcExcluirId = productoActualId`) + text-with-icons.
- **Ojo:** el bucle de relacionados hace `{% set prod = rel %}` y sobrescribe
  `prod`; por eso el id de la página se captura al inicio en
  `productoActualId`. No uses `prod.id` después de ese bucle.
- `product-gallery.njk`: thumbnails con colores del sistema Impact (antes
  usaban `var(--bs-primary)` muerta).

### ✅ Imágenes
Casi todas creadas. Faltan solo 5 (§11-D).

---

## 8. PARTIALS PARAMETRIZABLES — `src/_includes/pilar/`

Componentes reutilizables: reciben su contenido vía `{% set %}` **antes** del
`{% include %}`. **Así deben escribirse todos los componentes nuevos.**

| Partial | Parámetros |
|---|---|
| `featured-collection.njk` | `fcTitulo`, `fcCarouselId` (**único por página**), `fcIds` (orden), `fcFuente` (lista donde buscar), `fcExcluirId` (opcional) |
| `text-with-icons.njk` | `twiCarouselId` (**único por página**) |
| `image-link-blocks.njk` | `ilbItems` (`{titulo,url,img}`), `ilbExcluirUrl` (opc.), `ilbTitulo` (opc., añade section-header) |
| `subpilar.njk` | `spTitulo`, `spDescripcion`, `spProductos`, `spDestacadoId`, `spBannerImg`, `spPromoTexto`, `spPromoUrl`, `spPromoCta`, `spPromoImg`, `spUrlActual`, `spTwiId` |

El featured-collection usa **cards simplificadas** (imagen, badge, título,
precio; sin variantes ni botón) para no duplicar IDs con el grid de la misma
página.

IDs de carrusel en uso: `scroll-area-pilar-inears`, `scroll-area-pilar-audio`,
`scroll-area-producto`, `carousel-twi-pilar-inears`, `carousel-twi-pilar-audio`,
`carousel-twi-producto`, `carousel-twi-sub-{accesorios,sistemas,interfaces,microfonos,cables}`.

---

## 9. STOCK Y BACKEND

- `/api/stock` devuelve el inventario; `cart-store.js` pinta el indicador
  ("Solo N disponibles", "¡Última unidad!", "Agotado") cuando quedan ≤5.
- Un **500** en `/api/stock` casi siempre es `SHEETS_URL` no configurada en
  ese entorno de Cloudflare (los secrets van por proyecto/entorno, no en git).
  En el entorno de pruebas viejo pasaba esto; en producción la variable sí
  existe. **Pendiente verificar el indicador de stock en producción** (§11-J).

---

## 10. CÓMO TRABAJA EL DUEÑO

- Prefiere **soluciones de un solo comando** sobre depuración paso a paso.
- Prefiere **documentación oficial** sobre guías de terceros.
- Quiere **confirmación de entendimiento** antes de ejecutar; si algo es
  ambiguo, pregunta (una pregunta concreta, no un cuestionario).
- Antes de editar, di **qué archivos vas a tocar y qué cambias** en cada uno;
  al terminar, resume lo hecho en una o dos líneas (el detalle queda en el
  diff del commit).
- Ediciones puntuales sobre los archivos existentes; no reescribas un archivo
  entero si el cambio es pequeño (deja el diff limpio y fácil de revisar).
- **100% fiel a Impact** en estructura: no simplificar ni inventar variantes.
  Donde el dueño decide algo distinto (ej. sin filtros), se respeta.
- Si una sección de Impact requiere una librería externa (PhotoSwipe,
  FocusTrap, etc.), **avísalo antes** de escribirla.
- Agrupa la verificación visual en ciclos de ~3 secciones, no una por una.
- Copywriting de productos (si se pide): in-ears en formato AIDA abriendo con
  el beneficio, bullets en negrita en "¿Por qué elegir?", conteo de drivers
  siempre total (ambos auriculares); accesorios/audio en formato PAS.

---

## 11. PENDIENTES (verificados en el repo, por prioridad)

### A. Componentes transversales — 🔴 lo más importante
Aparecen en todas las páginas y siguen con el **diseño oscuro viejo** o con
restos de Bootstrap. Migrarlos al estilo Impact **sin tocar su lógica JS**.

| Componente | Problemas detectados |
|---|---|
| `cart-drawer.njk` + `cart-drawer.js` | Drawer oscuro (`#171717`); el JS renderiza los items con estilos inline blancos/oscuros (8 ocurrencias); 2 clases Bootstrap (`btn btn-outline-secondary`, `btn btn-primary w-100`); animaciones `btn-adding/btn-success-anim/btn-bounce` que vivían en `main.css`. **Es el más crítico (flujo de compra).** |
| `nav-drawer.njk` | 20 estilos inline oscuros. |
| `search-panel.njk` + `buscar.js` | 3 + 12 estilos oscuros inline; paleta morada vieja en `buscar.js`; 1 clase Bootstrap. |
| `bottom-nav.njk` | 8 estilos oscuros, 1 variable `--bs-*` muerta, paleta morada vieja. |
| `floating-ui.njk` | 1 variable `--bs-*` muerta. |
| `footer.njk` | 4 clases Bootstrap. |
| `checkout.njk` + `checkout-layout.njk` + `checkout-page.js` | El layout **todavía carga Bootstrap CSS+JS** a propósito (no usa `base.njk`). Estilos oscuros y paleta vieja en `checkout-page.js`. Migrarlo implica sacarle Bootstrap. |
| `orden-confirmada.njk` | 4 clases Bootstrap. |

Método para cada uno: leer el `.njk` y su `.js` en el repo, separar **hooks JS**
(no tocar) de **clases/estilos visuales** (migrar), buscar el componente
equivalente en `theme.css` de Impact (cart-drawer, navigation-drawer,
search-drawer), proponer, aprobar, aplicar, compilar.

### B. Páginas sueltas con Bootstrap muerto — 🟠
Clases Bootstrap encontradas: `sobre-nosotros.njk` (16), `politica-envios.njk`
(12), `checkout.njk` (8), `orden-confirmada.njk` (4), `privacidad.njk` (3 + 2
variables `--bs-*`), `buscar.njk` (2). Sin Bootstrap cargado, su layout está
roto o sin estilo.

### C. Limpiar `#cat-tabs-bar` — 🟡
El HTML ya no existe en ningún `.njk`, pero queda **código muerto**:
`site-ui.js` (función `navegarSeccion`, bloque CAT TABS con `recalcTop()` y
`.navbar-floating`) y `cart-store.js` (~línea 371). Está protegido con
comprobaciones de `null`, así que no rompe nada, pero hay que eliminarlo
(decisión ya tomada). Verificar que `navegarSeccion` no se llame desde otro
lado antes de borrarla.

### D. Imágenes faltantes — 🟡 (trabajo del dueño)
- `/assets/img/home/hero-2.jpg`, `/assets/img/home/hero-3.jpg` (+ sus
  `-mobile` si se usan; hero desktop ratio 2.8:1, móvil 3:4)
- `/assets/img/home/timeline/4.webp`, `5.webp`, `6.webp`

### E. Deuda técnica: unificar partials home vs pilar — 🟡 (aprobado)
Existen dos `featured-collection` y dos `text-with-icons` (y el home tiene su
propio `image-link-blocks`): los de `home/` tienen el contenido hardcodeado;
los de `pilar/` son parametrizables. Refactor: que el home use los de
`pilar/` pasando sus parámetros y borrar los de `home/`. Resultado: un solo
componente de cada tipo para todo el sitio.

### F. Breadcrumb en subpilares — 🟢
Se perdió al pasarlos al partial `subpilar.njk`. Bueno para SEO y
navegación; añadirlo al partial (la clase `.breadcrumb-arms` ya existe en
`arms.css`).

### G. Galería de producto con zoom — 🟢
Impact usa PhotoSwipe para el zoom de la galería. Evaluar si se incorpora
(librería externa: consultar al dueño antes).

### H. Migración a Eleventy 3 — 🟢
Resuelve las 13 vulnerabilidades de `npm audit`. Es un cambio mayor: hacerlo
en una rama, mantener `.eleventy.js` en **CommonJS**, compilar y revisar todas
las páginas antes de fusionar.

### I. `noindex` — ⚠️ decisión de lanzamiento
`src/_includes/seo.njk` pone `noindex, nofollow` por defecto en todo el sitio
(comentario: "DESARROLLO: noindex activo. Cambiar a 'index, follow' el día del
launch"). El sitio está en producción pero **no indexable en Google**. La
recomendación fue mantenerlo hasta terminar lo visual (A y B). Cuando se
quite, `buscar.njk` y el checkout deben **seguir** en noindex (ya lo definen
aparte).

### J. Verificar stock en producción — 🟢
Confirmar en `armsmusic.com` que `/api/stock` responde y que el indicador de
stock bajo aparece en las cards y en la página de producto.

### K. README desactualizado — 🟢
`README.md` todavía describe la estructura vieja (`main.css`, `carrito.js`,
`checkout.js`, puerto 8080). Reescribirlo o reducirlo a un puntero a este
`AGENTS.md`.

---

## 12. GLOSARIO (vocabulario del dueño)

- **banner** — imagen grande de arriba con el título (collection-banner).
- **image-link-blocks / bloques** — rectángulos con imagen que enlazan a
  colecciones.
- **grid** — cuadrícula de cards de producto (`product-list`).
- **promo** — rectángulo publicitario **dentro** del grid (ocupa 2 columnas).
- **featured-collection / carrusel** — "Los más vendidos", horizontal, fondo
  degradado.
- **text-with-icons / garantías** — fila de beneficios con íconos.
- **card** — `card-producto.njk`.
- **pilar** — `/in-ears/`, `/audio/`. **subpilar** — sus subcategorías.

---

## 13. MAPA DE ARCHIVOS

```
armsmusic/
├── CONTEXTO-PROYECTO-ARMS.md  este documento (contexto para agentes)
├── .eleventy.js               config Eleventy (CommonJS) + resolverSeccion
├── package.json               Eleventy 2.x
├── functions/api/             stock.js, pedido.js (Cloudflare Functions)
└── src/
    ├── index.njk              HOME (headerTransparente: true)
    ├── producto-page.njk      genera cada página de producto
    ├── in-ears/index.njk      PILAR In-Ears
    ├── in-ears/accesorios/    subpilar
    ├── audio/index.njk        PILAR Audio
    ├── audio/{sistemas,interfaces,microfonos,cables}/   subpilares
    ├── checkout.njk, orden-confirmada.njk, buscar.njk,
    │   sobre-nosotros.njk, politica-envios.njk, privacidad.njk
    ├── _data/productos.json   catálogo + secciones
    ├── _data/site.json
    ├── _includes/
    │   ├── base.njk           layout raíz (enlaza SOLO arms.css)
    │   ├── checkout-layout.njk  layout aparte (aún con Bootstrap)
    │   ├── header.njk, announcement-bar.njk, footer.njk
    │   ├── nav-drawer.njk, cart-drawer.njk, search-panel.njk,
    │   │   bottom-nav.njk, floating-ui.njk          ← pendientes §11-A
    │   ├── card-producto.njk, product-img.njk, product-img-hover.njk
    │   ├── producto.njk, product-gallery.njk
    │   ├── seo.njk, schema.njk
    │   ├── pilar/             ★ partials parametrizables
    │   ├── home/              secciones del home (contenido hardcodeado)
    │   └── svgs/              ilustraciones fallback de producto
    └── assets/
        ├── css/arms.css       ★ único CSS activo
        ├── css/{main,categoria,producto}.css   desconectados (referencia)
        └── js/                ver §6
```

---

## 14. ESTADO — SESIÓN 2026-10-07 (auditoría de fidelidad + fixes)

### Fixes aplicados (commiteados en `main`)
- `00b4bba` — **Botón "Agregar al carrito" sticky** en la página de producto:
  - **Desktop (≥1000px):** mecanismo real de Impact — `safe-sticky.js` (nuevo; clase `SafeSticky` portada del `theme.js` real con su `throttle` rAF y `inView` vía IntersectionObserver) + wrapper `<safe-sticky class="producto-info">` en la columna de info + regla `position:sticky; top: calc(var(--sticky-area-height) + 20px); z-index:1` (igual a `.product-info` del demo, mismo breakpoint). La columna (y su botón) se queda fija a 117px (header 97 + 20) durante ~340px de scroll mientras pasa la galería (la galería 672px es más alta que la info 333px). `--sticky-area-height` ya era correcto: el `height-observer` local mide el header real en runtime.
  - **Móvil (<992px):** barra fija abajo con botón "Agregar al carrito" (`button--xl`, mismo tamaño que el principal) que aparece cuando el bloque de botones queda por arriba del viewport (listener de scroll con rAF — **no** IntersectionObserver: el elemento pasa de "abajo" a "arriba" sin cruzar umbral de intersección, ratio 0 en ambos lados, y el IO nunca dispara). El botón de la barra lee `data-product-name`/`data-img` del botón principal **en el momento del clic** (siempre la variante seleccionada; no se toca `cart-store.js`) y llama al `agregarAlCarrito()` existente (misma animación, mismo stock, mismo agotado — sincronizado con MutationObserver). `z-index: 1050` (cubre el bottom-nav 1020 mientras está visible; el carrito y el menú siguen en el header).
  - **Nota del demo:** el producto de referencia de la barra móvil (`mh40-wireless-paris-saint-german`, captura del dueño 2026-10-07) **fue borrado del demo** (404 + fuera de la colección; sin snapshot en Wayback) — la barra vivía en su plantilla custom, no en el `theme.css`/`theme.js` base (verificado: ni un `position:fixed;bottom` de compra en el tema). Comportamiento replicado de la captura: botón a todo lo ancho fijo abajo, encima del contenido.
- `8a5f0f0` — **Botones de producto** ("Agregar al carrito" + "Consultar por WhatsApp"): ahora usan `button button--xl` → igual al demo en los dos tamaños (móvil: h 54.4px, font 14px, pad 16/32px · desktop: h 60px, font 16px, pad 17.2/40px). Gap de `.producto-acciones` igualado a `.buy-buttons` del demo (8px móvil / 16px ≥700px). Incluye fix de bug: la segunda regla de `.button--xl` vivía **suelta sin `@media (min-width:700px)`** y aplicaba el padding de desktop a todos los tamaños (afectaba también a los CTA `--xl` del home).
- `48d429c` — **Barra de anuncio**: padding igual a Impact (10px móvil / 14px ≥700px) + `display:block` en el `height-observer` de la barra. Antes: la variable `--announcement-bar-height` quedaba en **0px** (el `height-observer` era `display:inline` sin regla) y rompía el offset de scroll y el alto del hero.
- `02770f8` — **Grid de productos**: eliminada la regla suelta `.section:has(.product-list)` que dejaba margen de 16px en TODOS los tamaños (estaba pensada solo para móvil, sin su `@media`). Ahora: 20px móvil / 48px desktop / centrado a 1600px — igual al demo en todos los tamaños.
- `617d93f` — **`<main>` anidado**: eliminado en pilares y subpilares (7 páginas con 2 landmarks `main`: el de `base.njk` + uno propio en `in-ears/index.njk`, `audio/index.njk`, `subpilar.njk`).

### Metodología de auditoría (reproducible)
- **Navegador robot:** Playwright + Chromium del sistema (el cache de Playwright iba desfasado). Setup:
  ```bash
  cd /tmp/opencode && npm init -y && npm i playwright
  # launch: chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
  ```
  `/tmp/opencode` puede borrarse: reinstalar es 1 comando. El servidor local debe correr en 8081.
- **Demo de referencia:** `https://impact-theme-sound.myshopify.com`
  - Colección (referencia de pilares): `/collections/headphones`
  - Producto: `/products/mg20-galactic-white`
- **CSS/JS reales del tema** (descargables del CDN, minificados):
  - `https://impact-theme-sound.myshopify.com/cdn/shop/t/6/assets/theme.css` (~197KB)
  - `https://impact-theme-sound.myshopify.com/cdn/shop/t/6/assets/theme.js` (~186KB)
- **Método:** HTML real de ambos (curl), inventario de componentes, medidas `getBoundingClientRect()`/`getComputedStyle()`, tokens CSS comparados, capturas antes/después. Nunca estimar píxeles a ojo.

### Verificado IGUAL al demo (2026-10-07)
Hero home (imagen 1344×640, título 60px, header transparente) · banner de colección (500px, título 80px) · grid (4 col, gap 24px, margins 48px) · barra de anuncio (39px móvil / 48px desktop) · tokens (spacing, text, rounded, container) · carrusel "más vendidos" + garantías presentes.

### Diferencias clasificadas (regla §0.9 — el dueño decide)
| # | Diferencia | Clasificación |
|---|---|---|
| 4 | Sin toolbar/filtros/contador en colecciones | 5% dueño (documentado §7) |
| 5 | Bloque promo dentro del grid (tras el 4º producto) | 5% dueño (documentado §7) |
| 6 | Página de producto simple (el demo lleva 7 secciones de marketing extra) | 5% dueño (documentado §7) |
| 7 | Cards del carrusel sin rating (4.8★) ni color swatch | 5% (el catálogo no trae esos datos) |
| 8 | Footer distinto (14 vs 18 links, 4 clases Bootstrap) | Pendiente §11-A |
| 2 | **Header 97px vs 94px** (`header__secondary-nav` 29 vs 22px, zona del badge del carrito) | ⏳ **Decisión pendiente del dueño** |
| — | **Doble `<h1>`** por página: logo del header (`<h1 class="header__logo">` sr-only) + título del banner (`<h1 class="h0">`). Preexistente, no tocado. | ⏳ **Decisión pendiente del dueño** |

### Próximo paso sugerido
**Cart-drawer (§11-A)** — el pendiente más importante (flujo de compra). Ahora se puede hacer con los HTML/CSS reales extraídos del demo (ver metodología arriba).



