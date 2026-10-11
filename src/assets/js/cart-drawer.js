/* =============================================================
   ARMS Music — cart-drawer.js
   UI del drawer del carrito
   - Abre/cierra el drawer
   - Renderiza los items
   - Maneja la animación del botón agregar
   - Escucha eventos de cart-store.js
   - Al hacer clic en "Proceder al pago" → navega a /checkout/
============================================================= */

// ── ABRIR / CERRAR ────────────────────────────────────────────
function abrirCarrito() {
  const drawer = document.getElementById('cart-drawer');
  document.getElementById('cart-overlay').style.display = 'block';
  drawer.style.transform = 'translateX(0)';
  drawer.style.boxShadow = '-20px 0 60px rgba(0,0,0,0.5)';
  const waf = document.querySelector('.whatsapp-float');
  if (waf) waf.style.display = 'none';
  document.getElementById('cart-items').scrollTop = 0;
  renderCarrito();
}

function cerrarCarrito() {
  const drawer = document.getElementById('cart-drawer');
  document.getElementById('cart-overlay').style.display = 'none';
  // MISMO valor que el CSS (estado cerrado): 100% + margen, para que el
  // panel salga del todo de la pantalla y no quede la franja de 8/16px.
  drawer.style.transform = 'translateX(calc(100% + 16px))';
  drawer.style.boxShadow = 'none';
  const waf = document.querySelector('.whatsapp-float');
  if (waf) waf.style.display = 'flex';
}

// ── RENDER ────────────────────────────────────────────────────
function renderCarrito() {
  const lista   = document.getElementById('cart-list');
  const empty   = document.getElementById('cart-empty');
  const footer  = document.getElementById('cart-footer');
  const totalEl = document.getElementById('cart-total');

  // Burbuja de conteo del header (demo: count-bubble junto al título).
  // Mismo total que los badges: suma de cantidades (0 si está vacío).
  const countEl = document.getElementById('cart-count-bubble');
  if (countEl) countEl.textContent = carrito.reduce((s, i) => s + i.cantidad, 0);

  if (carrito.length === 0) {
    empty.style.display  = 'block';
    lista.style.display  = 'none';
    footer.style.display = 'none';
    return;
  }

  empty.style.display  = 'none';
  lista.style.display  = 'block';
  footer.style.display = 'block';

  // Clases (no estilos inline): la capa visual vive en arms.css
  // (.cart-line*, estilo cart-drawer de Impact — §19). El hover del
  // ✕ también es CSS (:hover) en lugar de onmouseover/onmouseout.
  lista.innerHTML = carrito.map((item, idx) => `
    <div class="cart-line">
      <div class="cart-line__media">
        ${item.imagen
          ? `<img src="${item.imagen}" alt="${item.nombre}" loading="lazy" onerror="this.style.display='none'">`
          : ''}
      </div>
      <div class="cart-line__info">
        <div class="cart-line__top">
          <p class="cart-line__name">${item.nombre}</p>
          <button onclick="eliminarItem(${idx})" aria-label="Eliminar ${item.nombre}" class="cart-line__remove">✕</button>
        </div>
        <div class="cart-line__row">
          <span class="cart-line__price-each">Q${item.precio.toLocaleString()} c/u</span>
          <button onclick="cambiarCantidad(${idx}, -1)" class="cart-line__qty-btn">−</button>
          <span class="cart-line__qty-num">${item.cantidad}</span>
          <button onclick="cambiarCantidad(${idx}, 1)"  class="cart-line__qty-btn">+</button>
          <p class="cart-line__total">Q${(item.precio * item.cantidad).toLocaleString()}</p>
        </div>
      </div>
    </div>
  `).join('');

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  totalEl.textContent = 'Q' + total.toLocaleString();
}

// ── ANIMACIÓN BOTÓN AGREGAR ───────────────────────────────────
function animarAgregar(btnEl, callback) {
  if (!btnEl) { callback(); return; }
  const originalWidth = btnEl.offsetWidth;
  // El ancho INLINE original importa: el botón de la barra sticky solo
  // recibe su ancho por inline (posicionarBarra de producto.njk); si al
  // terminar se limpiara a '', el botón quedaría chiquito (ancho auto).
  const originalInlineWidth = btnEl.style.width;
  btnEl.style.width       = originalWidth + 'px';
  btnEl.style.minWidth    = originalWidth + 'px';
  btnEl.style.transformOrigin = 'center center';

  requestAnimationFrame(() => {
    btnEl.classList.add('btn-adding');
    btnEl.innerHTML = '';
  });

  setTimeout(() => {
    btnEl.classList.remove('btn-adding');
    btnEl.classList.add('btn-success-anim');
    btnEl.innerHTML = '<i class="fa-solid fa-check"></i>';
    callback();

    setTimeout(() => {
      const dataName   = btnEl.getAttribute('data-product-name') || '';
      const nombreBase = dataName.includes(' - ') ? dataName.split(' - ')[0] : dataName;
      const total      = carrito
        .filter(i => i.nombre === nombreBase || i.nombre.startsWith(nombreBase + ' - '))
        .reduce((s, i) => s + i.cantidad, 0);

      btnEl.classList.remove('btn-success-anim');
      btnEl.style.width    = originalWidth + 'px';
      btnEl.style.minWidth = originalWidth + 'px';
      btnEl.style.position = 'relative';
      btnEl.innerHTML      = total > 0
        ? `<i class="fa-solid fa-cart-plus"></i> Agregar<span style="position:absolute;top:-8px;right:-8px;background:#ef4444;color:#fff;border-radius:50%;width:20px;height:20px;font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1;pointer-events:none;">${total}</span>`
        : '<i class="fa-solid fa-cart-plus"></i> Agregar';

      requestAnimationFrame(() => {
        btnEl.classList.add('btn-bounce');
        btnEl.addEventListener('animationend', () => {
          btnEl.classList.remove('btn-bounce');
          btnEl.style.width    = originalInlineWidth;
          btnEl.style.minWidth = '';
        }, { once: true });
      });
    }, 850);
  }, 320);
}

// ── TOAST ─────────────────────────────────────────────────────
function mostrarToast() {
  const t = document.getElementById('toast-add');
  if (!t) return;
  t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(200px)'; }, 2200);
}

// ── IR AL CHECKOUT ────────────────────────────────────────────
function irACheckout() {
  // Dispara evento InitiateCheckout si existe el Pixel
  if (typeof fbq === 'function') {
    const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
    fbq('track', 'InitiateCheckout', {
      value: total,
      currency: 'GTQ',
      num_items: carrito.reduce((s, i) => s + i.cantidad, 0)
    });
  }
  window.location.href = '/checkout/';
}

// ── ESCUCHAR EVENTOS DE cart-store.js ─────────────────────────
document.addEventListener('arms:carrito:animarAgregar', (e) => {
  const { btnEl, nombre, precio } = e.detail;
  const imagen = btnEl ? (btnEl.getAttribute('data-img') || '') : '';
  animarAgregar(btnEl, () => {
    _commitAgregarAlCarrito(nombre, precio, imagen);
    mostrarToast();
    // Re-render del drawer si está abierto
    const drawer = document.getElementById('cart-drawer');
    if (drawer && drawer.style.transform === 'translateX(0px)' || drawer && drawer.style.transform === 'translateX(0)') {
      renderCarrito();
    }
  });
});

document.addEventListener('arms:carrito:actualizado', () => {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  const isOpen = drawer.style.transform === 'translateX(0px)' || drawer.style.transform === 'translateX(0)';
  if (isOpen) renderCarrito();
});

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Render inicial si hay items
  if (carrito && carrito.length > 0) renderCarrito();
});

document.addEventListener('arms:carrito:cerrar', () => {
  cerrarCarrito();
});