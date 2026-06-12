/* =============================================================
   ARMS Music — Checkout / Formulario de Pedido
   Depende de: carrito.js (carrito, stockGlobal, SHEETS_URL, WA_NUMBER)
============================================================= */

// ── IR AL FORMULARIO ──────────────────────────────────────────
function irAFormulario() {
  mostrarPantalla('form');
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  document.getElementById('form-total').textContent = 'Q' + total.toLocaleString();
  document.getElementById('form-summary').innerHTML = carrito.map(i =>
    `<div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
      <span style="color:rgba(255,255,255,0.7); font-size:0.875rem;">${i.nombre} x${i.cantidad}</span>
      <span style="color:#fff; font-size:0.875rem; font-weight:600;">Q${(i.precio * i.cantidad).toLocaleString()}</span>
    </div>`
  ).join('');
  const formScroll = document.querySelector('#screen-form [style*="overflow-y"]');
  if (formScroll) formScroll.scrollTop = 0;
}

function volverAlCarrito() {
  mostrarPantalla('cart');
  document.getElementById('cart-items').scrollTop = 0;
  renderCarrito();
}

// ── GENERAR MENSAJE WHATSAPP ──────────────────────────────────
function generarMensajeWA(datos) {
  const lineas = carrito.map(i => `• ${i.nombre} x${i.cantidad} — Q${(i.precio * i.cantidad).toLocaleString()}`).join('\n');
  const total  = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  return encodeURIComponent(
    `🛒 *NUEVO PEDIDO - ARMS Music*\n\n` +
    `👤 *Cliente:* ${datos.nombre}\n` +
    `📞 *Teléfono:* ${datos.telefono}\n` +
    `📍 *Dirección:* ${datos.direccion}\n` +
    `🗺️ *Departamento:* ${datos.departamento}\n` +
    `🏙️ *Municipio:* ${datos.municipio}\n` +
    (datos.notas ? `📝 *Notas:* ${datos.notas}\n` : '') +
    `💳 *Forma de pago:* ${datos.pago}\n` +
    `\n🎧 *Productos:*\n${lineas}\n\n` +
    `💰 *Total: Q${total.toLocaleString()}*`
  );
}

// ── ENVIAR PEDIDO ─────────────────────────────────────────────
async function enviarPedido() {
  const nombre       = document.getElementById('f-nombre').value.trim();
  const telefono     = document.getElementById('f-telefono').value.trim();
  const direccion    = document.getElementById('f-direccion').value.trim();
  const departamento = document.getElementById('f-departamento').value.trim();
  const municipio    = document.getElementById('f-municipio').value.trim();
  const notas        = document.getElementById('f-notas').value.trim();
  const errorEl      = document.getElementById('form-error');
  const btnEl        = document.getElementById('btn-enviar');

  const errores = [];
  if (!nombre || nombre.length < 3)       errores.push('El nombre debe tener al menos 3 caracteres.');
  if (!direccion || direccion.length < 6) errores.push('La dirección debe tener al menos 6 caracteres.');
  if (!departamento)                       errores.push('Selecciona un departamento.');
  if (!municipio)                          errores.push('Selecciona un municipio.');

  const soloDigitos = telefono.replace(/\D/g, '');
  if (soloDigitos.length !== 8) errores.push('El teléfono debe tener exactamente 8 dígitos.');

  if (errores.length > 0) {
    errorEl.innerHTML = errores.map(e => `<div>⚠️ ${e}</div>`).join('');
    errorEl.style.display = 'block';
    if (soloDigitos.length !== 8) {
      const telInput = document.getElementById('f-telefono');
      telInput.style.borderColor = '#ef4444';
      telInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  errorEl.style.display = 'none';
  document.getElementById('f-telefono').style.borderColor = '';

  const total    = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const productos = carrito.map(i => `${i.nombre} x${i.cantidad} (Q${(i.precio * i.cantidad).toLocaleString()})`).join(', ');
  const datos    = { nombre, telefono, direccion, departamento, municipio, notas, pago: PAGO_CONFIG[formaPagoSeleccionada].text };

  const msgWA = generarMensajeWA(datos);
  const waURL = `https://wa.me/${WA_NUMBER}?text=${msgWA}`;
  document.getElementById('btn-whatsapp').href     = waURL;
  document.getElementById('confirm-whatsapp').href = waURL;

  btnEl.disabled    = true;
  btnEl.textContent = '⏳ Enviando pedido...';
  resetearProgreso();
  mostrarPantalla('progress');
  setTimeout(() => activarPaso(1), 300);

  try {
    const payload = { nombre, telefono, direccion, departamento, municipio, notas, pago: PAGO_CONFIG[formaPagoSeleccionada].text, productos, total: 'Q' + total.toLocaleString() };
    const url     = SHEETS_URL + '?pedido=' + encodeURIComponent(JSON.stringify(payload));
    setTimeout(() => activarPaso(2), 1200);
    const res  = await fetch(url);
    const data = await res.json();
    if (data.ok && data.productos) {
      data.productos.forEach(p => { stockGlobal[p.nombre] = p.stock; });
      actualizarBotonesStock();
    }
  } catch(e) {
    mostrarPantalla('form');
    btnEl.disabled    = false;
    btnEl.textContent = 'Confirmar pedido';
    errorEl.innerHTML = '⚠️ Error de conexión. Revisa tu internet e intenta de nuevo.';
    errorEl.style.display = 'block';
    return;
  }

  activarPaso(3);
  await new Promise(r => setTimeout(r, 900));

  mostrarPantalla('confirm');
  const esTransferencia = formaPagoSeleccionada === 'transferencia';
  document.getElementById('confirm-msg-entrega').style.display      = esTransferencia ? 'none'  : 'block';
  document.getElementById('confirm-msg-transferencia').style.display = esTransferencia ? 'block' : 'none';
  document.getElementById('confirm-whatsapp-label').textContent      = esTransferencia ? 'Solicitar Cuenta por WhatsApp' : 'Confirmar por WhatsApp';
  const pulse = document.getElementById('confirm-wa-pulse');
  pulse.style.animationPlayState = esTransferencia ? 'running' : 'paused';
  pulse.style.opacity            = esTransferencia ? '1'       : '0';
  pulse.style.visibility         = esTransferencia ? 'visible' : 'hidden';
}

// ── PANTALLA DE PROGRESO ──────────────────────────────────────
const PASOS = {
  1: { titulo: 'Colocando tu pedido...', sub: 'Registrando tu orden',      pct: 20,  icono: '📋' },
  2: { titulo: 'Verificando stock...',   sub: 'Revisando disponibilidad',  pct: 60,  icono: '🔍' },
  3: { titulo: '¡Pedido exitoso!',       sub: '¡Tu pedido fue procesado!', pct: 100, icono: '🎉' }
};

function activarPaso(paso) {
  const p     = PASOS[paso];
  const title = document.getElementById('progress-title');
  const sub   = document.getElementById('progress-sub');
  const pct   = document.getElementById('progress-pct');
  const bar   = document.getElementById('progress-bar-fill');
  const spin  = document.getElementById('progress-spinner');

  title.style.opacity = '0';
  sub.style.opacity   = '0';

  setTimeout(() => {
    title.textContent    = p.titulo;
    sub.textContent      = p.sub;
    spin.textContent     = p.icono;
    pct.textContent      = p.pct + '%';
    bar.style.width      = p.pct + '%';
    pct.style.color      = paso === 3 ? '#10B981' : paso === 2 ? '#f97316' : '#6600FF';
    spin.style.animation = paso === 3 ? 'none' : 'spin-icon 1.5s linear infinite';
    title.style.opacity  = '1';
    sub.style.opacity    = '1';
  }, 300);
}

function resetearProgreso() {
  const bar  = document.getElementById('progress-bar-fill');
  const pct  = document.getElementById('progress-pct');
  const spin = document.getElementById('progress-spinner');
  bar.style.transition = 'none';
  bar.style.width      = '0%';
  pct.textContent      = '0%';
  pct.style.color      = '#6600FF';
  spin.textContent     = '📦';
  spin.style.animation = 'spin-icon 1.5s linear infinite';
  document.getElementById('progress-title').textContent = 'Colocando tu pedido...';
  document.getElementById('progress-title').style.opacity = '1';
  document.getElementById('progress-sub').textContent    = 'Registrando tu orden';
  document.getElementById('progress-sub').style.opacity  = '1';
  setTimeout(() => { bar.style.transition = 'width 1.2s cubic-bezier(0.4,0,0.2,1)'; }, 50);
}

// ── FINALIZAR COMPRA ──────────────────────────────────────────
function finalizarCompra() {
  carrito = [];
  guardarCarrito();
  actualizarContador();
  cerrarCarrito();
  const pulse = document.getElementById('confirm-wa-pulse');
  if (pulse) { pulse.style.animationPlayState = 'paused'; pulse.style.opacity = '0'; pulse.style.visibility = 'hidden'; }
  ['f-nombre','f-telefono','f-direccion','f-notas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const deptoEl = document.getElementById('f-departamento');
  if (deptoEl) deptoEl.value = '';
  actualizarMunicipios();
  const btnEl = document.getElementById('btn-enviar');
  if (btnEl) { btnEl.disabled = false; btnEl.textContent = '✅ Finalizar pedido'; }
  seleccionarPago('entrega');
}

// ── FORMA DE PAGO ─────────────────────────────────────────────
let formaPagoSeleccionada = 'entrega';

const PAGO_CONFIG = {
  entrega:       { label: 'lbl-pago-entrega',       radio: 'radio-entrega',       color: '#10B981', text: 'Pago Contra Entrega' },
  transferencia: { label: 'lbl-pago-transferencia', radio: 'radio-transferencia', color: '#6600FF', text: 'Transferencia / Depósito' }
};

function seleccionarPago(tipo) {
  formaPagoSeleccionada = tipo;
  Object.entries(PAGO_CONFIG).forEach(([key, cfg]) => {
    const lbl   = document.getElementById(cfg.label);
    const radio = document.getElementById(cfg.radio);
    const activo = key === tipo;
    if (lbl) {
      lbl.style.background  = activo ? `rgba(${key==='entrega'?'16,185,129':'102,0,255'},0.12)` : 'rgba(255,255,255,0.03)';
      lbl.style.borderColor = activo ? cfg.color : 'rgba(255,255,255,0.1)';
    }
    if (radio) {
      radio.style.background  = activo ? cfg.color : 'transparent';
      radio.style.borderColor = activo ? cfg.color : 'rgba(255,255,255,0.25)';
      radio.innerHTML         = activo ? '<span style="width:7px;height:7px;border-radius:50%;background:#fff;"></span>' : '';
    }
  });
  const sub = document.getElementById('subtitulo-transferencia');
  if (sub) sub.textContent = tipo === 'transferencia'
    ? 'Solicitar No. de cuenta por WhatsApp'
    : 'Depósito o transferencia bancaria';
}

function scrollAFormaPago() {
  setTimeout(() => {
    const el = document.getElementById('forma-pago-label');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function limpiarErrorTelefono() {
  const tel = document.getElementById('f-telefono');
  const err = document.getElementById('error-telefono');
  if (tel) tel.style.borderColor = 'rgba(255,255,255,0.1)';
  if (err) err.style.display     = 'none';
}

// ── MUNICIPIOS DE GUATEMALA ───────────────────────────────────
const MUNICIPIOS_GT = {
  'Alta Verapaz': ['Cobán','Cahabón','Chahal','Chisec','Fray Bartolomé de las Casas','La Tinta','Lanquín','Panzós','Raxruhá','San Cristóbal Verapaz','San Juan Chamelco','San Pedro Carchá','Santa Catalina La Tinta','Santa Cruz Verapaz','Santa María Cahabón','Senahú','Tamahú','Tactic','Tucurú'],
  'Baja Verapaz': ['Salamá','Cubulco','El Chol','Granados','Purulhá','Rabinal','San Jerónimo','San Miguel Chicaj','Santa Cruz El Chol'],
  'Chimaltenango': ['Chimaltenango','Acatenango','El Tejar','Parramos','Patzicía','Patzún','Pochuta','San Andrés Itzapa','San José Poaquil','San Juan Comalapa','San Martín Jilotepeque','San Miguel Pochuta','Santa Apolonia','Santa Cruz Balanyá','Tecpán Guatemala','Yepocapa','Zaragoza'],
  'Chiquimula': ['Chiquimula','Camotán','Concepción Las Minas','Esquipulas','Ipala','Jocotán','Olopa','Quezaltepeque','San Jacinto','San José La Arada','San Juan La Ermita'],
  'El Progreso': ['Guastatoya','El Jícaro','Morazán','San Agustín Acasaguastlán','San Antonio La Paz','San Cristóbal Acasaguastlán','Sansare','Sanarate'],
  'Escuintla': ['Escuintla','Guanagazapa','Iztapa','La Democracia','La Gomera','Masagua','Nueva Concepción','Palín','San José','San Vicente Pacaya','Santa Lucía Cotzumalguapa','Siquinalá','Tiquisate'],
  'Guatemala': ['Guatemala','Amatitlán','Chinautla','Chuarrancho','Fraijanes','Mixco','Palencia','Petapa','San José del Golfo','San José Pinula','San Juan Sacatepéquez','San Miguel Petapa','San Pedro Ayampuc','San Pedro Sacatepéquez','San Raymundo','Santa Catarina Pinula','Villa Canales','Villa Nueva'],
  'Huehuetenango': ['Huehuetenango','Aguacatán','Barillas','Chiantla','Colotenango','Concepción Huista','Cuilco','Ixtahuacán','Jacaltenango','La Democracia','La Libertad','Malacatancito','Nentón','San Antonio Huista','San Gaspar Ixchil','San Ildefonso Ixtahuacán','San Juan Atitán','San Juan Ixcoy','San Marcos Huista','San Mateo Ixtatán','San Miguel Acatán','San Pedro Necta','San Pedro Soloma','San Rafael La Independencia','San Rafael Petzal','San Sebastián Coatán','San Sebastián Huehuetenango','Santa Ana Huista','Santa Bárbara','Santa Cruz Barillas','Santa Eulalia','Santiago Chimaltenango','Tectitán','Todos Santos Cuchumatán','Unión Cantinil'],
  'Izabal': ['Puerto Barrios','El Estor','Livingston','Los Amates','Morales'],
  'Jalapa': ['Jalapa','Mataquescuintla','Monjas','San Carlos Alzatate','San Luis Jilotepeque','San Manuel Chaparrón','San Pedro Pinula'],
  'Jutiapa': ['Jutiapa','Agua Blanca','Asunción Mita','Atescatempa','Comapa','Conguaco','El Adelanto','Jalpatagua','Jerez','Moyuta','Pasaco','Quesada','San José Acatempa','Santa Catarina Mita','Yupiltepeque','Zapotitlán'],
  'Petén': ['Flores','Dolores','El Chal','La Libertad','Las Cruces','Melchor de Mencos','Poptún','San Andrés','San Benito','San Francisco','San José','San Luis','Santa Ana','Sayaxché'],
  'Quetzaltenango': ['Quetzaltenango','Almolonga','Cantel','Coatepeque','Colomba','Concepción Chiquirichapa','El Palmar','Flores Costa Cuca','Génova','Huitán','La Esperanza','Llano del Pinal','Olintepeque','Ostuncalco','Palestina de Los Altos','Salcajá','San Carlos Sija','San Francisco La Unión','San Marcos Atitlán','San Martín Sacatepéquez','San Mateo','San Miguel Sigüilá','Sibilia','Zunil'],
  'Quiché': ['Santa Cruz del Quiché','Canillá','Chajul','Chicamán','Chiché','Chichicastenango','Chinique','Cunén','Ixcán','Joyabaj','Nebaj','Pachalum','Patzité','Sacapulas','San Andrés Sajcabajá','San Antonio Ilotenango','San Bartolomé Jocotenango','San Juan Cotzal','San Pedro Jocopilas','Uspantán','Zacualpa'],
  'Retalhuleu': ['Retalhuleu','Champerico','El Asintal','Nuevo San Carlos','San Andrés Villa Seca','San Felipe','San Martín Zapotitlán','San Sebastián','Santa Cruz Muluá'],
  'Sacatepéquez': ['Antigua Guatemala','Alotenango','Ciudad Vieja','Jocotenango','Magdalena Milpas Altas','Pastores','San Antonio Aguas Calientes','San Bartolomé Milpas Altas','San Lucas Sacatepéquez','San Miguel Dueñas','Santa Catarina Barahona','Santa Lucía Milpas Altas','Santa María de Jesús','Santo Domingo Xenacoj','Santiago Sacatepéquez','Sumpango','Yepocapa'],
  'San Marcos': ['San Marcos','Ayutla','Catarina','Comitancillo','Concepción Tutuapa','El Quetzal','El Rodeo','El Tumbador','Esquipulas Palo Gordo','Ixchiguán','La Blanca','La Reforma','Malacatán','Nuevo Progreso','Ocós','Pajapita','Río Blanco','San Antonio Sacatepéquez','San Cristóbal Cucho','San José Ojetenam','San Lorenzo','San Miguel Ixtahuacán','San Pablo','San Pedro Sacatepéquez','San Rafael Pie de la Cuesta','Sibinal','Sipacapa','Tacaná','Tajumulco','Tejutla'],
  'Santa Rosa': ['Cuilapa','Barberena','Casillas','Chiquimulilla','Guazacapán','Nueva Santa Rosa','Oratorio','Pueblo Nuevo Viñas','San Juan Tecuaco','San Rafael Las Flores','Santa Cruz Naranjo','Santa María Ixhuatán','Santa Rosa de Lima','Taxisco'],
  'Sololá': ['Sololá','Concepción','Nahualá','Panajachel','San Andrés Semetabaj','San Antonio Palopó','San José Chacayá','San Juan La Laguna','San Lucas Tolimán','San Marcos La Laguna','San Pablo La Laguna','San Pedro La Laguna','Santa Catarina Ixtahuacán','Santa Catarina Palopó','Santa Clara La Laguna','Santa Cruz La Laguna','Santa Lucía Utatlán','Santa María Visitación','Santiago Atitlán'],
  'Suchitepéquez': ['Mazatenango','Chicacao','Cuyotenango','Patulul','Pueblo Nuevo','Río Bravo','Samayac','San Antonio Suchitepéquez','San Bernardino','San Francisco Zapotitlán','San Gabriel','San José El Ídolo','San Juan Bautista','San Lorenzo','San Miguel Panán','San Pablo Jocopilas','Santa Bárbara','Santo Domingo Suchitepéquez','Santo Tomás La Unión','Zunilito'],
  'Totonicapán': ['Totonicapán','Momostenango','San Andrés Xecul','San Bartolo','San Cristóbal Totonicapán','San Francisco El Alto','Santa Lucía La Reforma','Santa María Chiquimula'],
  'Zacapa': ['Zacapa','Cabañas','Estanzuela','Gualán','Huité','La Unión','Río Hondo','San Diego','San Jorge','Teculután','Usumatlán']
};

function actualizarMunicipios() {
  const depto = document.getElementById('f-departamento');
  const sel   = document.getElementById('f-municipio');
  if (!depto || !sel) return;
  sel.innerHTML = '';
  if (!depto.value || !MUNICIPIOS_GT[depto.value]) {
    sel.innerHTML = '<option value="" disabled selected>Primero selecciona un departamento</option>';
    return;
  }
  sel.innerHTML = '<option value="" disabled selected>Selecciona un municipio</option>' +
    MUNICIPIOS_GT[depto.value].map(m => `<option value="${m}">${m}</option>`).join('');
  setTimeout(() => { sel.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

// ── MOTOR DE BÚSQUEDA + FILTRO DE PRECIO ─────────────────────
(function() {
  const SECCIONES        = ['inears', 'monitores', 'audio', 'accesorios-inears'];
  const PRECIO_GLOBAL_MIN = 0;
  const PRECIO_GLOBAL_MAX = 2000;

  let queryActual     = '';
  let precioMin       = PRECIO_GLOBAL_MIN;
  let precioMax       = PRECIO_GLOBAL_MAX;
  let precioPanelOpen = false;
  let searchPanelOpen = false;

  const searchPanel      = document.getElementById('search-panel');
  const searchInputPanel = document.getElementById('search-input-panel');
  const searchClearPanel = document.getElementById('search-clear-panel');
  const panelPrecio      = document.getElementById('panel-precio');
  const btnPrecioToggle  = document.getElementById('btn-precio-toggle');
  const btnPrecioReset   = document.getElementById('btn-precio-reset');
  const rangeMin         = document.getElementById('range-min');
  const rangeMax         = document.getElementById('range-max');
  const trackFill        = document.getElementById('slider-track-fill');
  const lblMin           = document.getElementById('lbl-precio-min');
  const lblMax           = document.getElementById('lbl-precio-max');
  const lblRango         = document.getElementById('lbl-precio-rango');
  const precioBadge      = document.getElementById('precio-badge-label');
  const resultCount      = document.getElementById('resultado-count');

  if (!searchPanel) return;

  function actualizarTrack() {
    if (!rangeMin || !rangeMax || !trackFill) return;
    const min   = parseInt(rangeMin.min, 10);
    const max   = parseInt(rangeMax.max, 10);
    const rng   = max - min;
    const left  = ((precioMin - min) / rng) * 100;
    const right = ((precioMax - min) / rng) * 100;
    trackFill.style.left  = left  + '%';
    trackFill.style.width = (right - left) + '%';
  }
  actualizarTrack();

  function filtrarProductos() {
    const q = queryActual.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    let totalVisible = 0;

    SECCIONES.forEach(sec => {
      const section    = document.getElementById(sec);
      const emptyState = section ? section.querySelector('.section-empty') : null;
      let secVisible   = 0;

      // Las cards principales están en #row-{sec} y NO tienen data-section.
      // Las extra-cards SÍ tienen data-section pero están ocultas por defecto.
      // Buscamos todos los .reveal dentro del row de la sección.
      const row = document.getElementById('row-' + sec);
      if (!row) return;

      const hayFiltroActivo = q || precioMin > PRECIO_GLOBAL_MIN || precioMax < PRECIO_GLOBAL_MAX;

      row.querySelectorAll('.reveal').forEach(col => {
        const esExtraCard = col.classList.contains('extra-card');

        // Sin filtro activo: restaurar extra-cards a su estado oculto original
        if (!hayFiltroActivo && esExtraCard) {
          col.style.display = 'none';
          return;
        }

        const card    = col.querySelector('.card-categoria, .card');
        const titleEl = card ? (card.querySelector('.card-categoria-nombre') || card.querySelector('.card-title')) : null;
        const descEl  = card ? card.querySelector('.card-text') : null;

        const titleTxt = (titleEl?.textContent || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        const descTxt  = (descEl?.textContent  || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

        const matchQ = !q || titleTxt.includes(q) || descTxt.includes(q);

        // Precio: buscar en card-cat-precio-actual o badge.bg-primary
        const precioEl = card ? card.querySelector('.card-cat-precio-actual') : null;
        const priceBadges = card ? card.querySelectorAll('.badge.bg-primary') : [];
        let cardPrecio = Infinity;
        if (precioEl) {
          const val = parseFloat(precioEl.textContent.replace(/[^0-9.]/g,''));
          if (!isNaN(val)) cardPrecio = val;
        }
        priceBadges.forEach(b => {
          const val = parseFloat(b.textContent.replace(/[^0-9.]/g,''));
          if (!isNaN(val) && val < cardPrecio) cardPrecio = val;
        });
        // Fallback: extraer precio del onclick del botón agregar
        const addBtn = card ? card.querySelector('.btn-agregar') : null;
        if (addBtn) {
          const onc = addBtn.getAttribute('onclick') || '';
          const m   = onc.match(/,\s*([\d.]+)\s*[,)]/);
          if (m) {
            const p = parseFloat(m[1]);
            if (!isNaN(p) && p < cardPrecio) cardPrecio = p;
          }
        }
        const matchP = cardPrecio === Infinity || (cardPrecio >= precioMin && cardPrecio <= precioMax);

        const visible = matchQ && matchP;
        col.style.display = visible ? '' : 'none';
        if (visible) { secVisible++; totalVisible++; }
      });

      if (emptyState) emptyState.classList.toggle('visible', secVisible === 0 && hayFiltroActivo);

      // Ocultar "Ver todo" mientras hay filtro activo; restaurar al limpiar
      const verTodoWrap  = document.getElementById('ver-todo-wrap-'  + sec);
      const verMenosWrap = document.getElementById('ver-menos-wrap-' + sec);
      if (verTodoWrap)  verTodoWrap.style.display  = hayFiltroActivo ? 'none' : '';
      if (verMenosWrap) verMenosWrap.style.display = 'none';
    });

    if (resultCount) {
      const hayFiltro = q || precioMin > PRECIO_GLOBAL_MIN || precioMax < PRECIO_GLOBAL_MAX;
      resultCount.style.display = hayFiltro ? 'inline' : 'none';
      resultCount.textContent   = hayFiltro ? `${totalVisible} resultado${totalVisible !== 1 ? 's' : ''}` : '';
    }
  }

  function scrollAPrimeraSeccion() {
    for (const sec of SECCIONES) {
      const row = document.getElementById('row-' + sec);
      const visibles = Array.from(row ? row.querySelectorAll('.reveal') : [])
                            .filter(el => el.style.display !== 'none');
      if (visibles.length > 0) {
        const navbar = document.querySelector('.navbar-floating');
        const bar    = document.getElementById('cat-tabs-bar');
        const navH   = navbar ? navbar.offsetHeight : 56;
        const barH   = bar    ? bar.offsetHeight    : 48;
        const offset = (searchPanelOpen && searchPanel)
          ? searchPanel.offsetHeight + barH + 24
          : navH + barH + 24;
        const top    = visibles[0].getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        const cardEl = visibles[0].querySelector('.card');
        if (cardEl) {
          cardEl.classList.remove('search-highlight');
          void cardEl.offsetWidth;
          cardEl.classList.add('search-highlight');
          setTimeout(() => cardEl.classList.remove('search-highlight'), 1200);
        }
        break;
      }
    }
  }

  // Abrir panel búsqueda
  function abrirSearchPanel() {
    if (!searchPanel) return;
    searchPanelOpen = true;
    const navbar = document.querySelector('.navbar-floating');
    const navH   = navbar ? navbar.offsetHeight : 56;
    const navTop = 6;
    searchPanel.style.paddingTop = (navTop + navH) + 'px';
    searchPanel.style.display    = 'block';
    setTimeout(() => searchInputPanel && searchInputPanel.focus(), 80);
  }

  function cerrarSearchPanel() {
    if (!searchPanel) return;
    searchPanelOpen = false;
    searchPanel.style.display = 'none';
    if (precioPanelOpen) {
      precioPanelOpen = false;
      if (panelPrecio) panelPrecio.style.display = 'none';
    }
  }

  // Botón lupa desktop
  const searchBtnDesktop = document.getElementById('navbar-search-btn');
  if (searchBtnDesktop) {
    searchBtnDesktop.addEventListener('click', () => {
      if (searchPanelOpen) cerrarSearchPanel();
      else abrirSearchPanel();
    });
  }

  // Botón lupa mobile
  const searchBtnMobile = document.getElementById('navbar-search-btn-mobile');
  if (searchBtnMobile) {
    searchBtnMobile.addEventListener('click', () => {
      if (searchPanelOpen) cerrarSearchPanel();
      else abrirSearchPanel();
    });
  }

  // Cerrar panel al click fuera
  document.addEventListener('click', e => {
    if (!searchPanelOpen) return;
    if (searchPanel && searchPanel.contains(e.target)) return;
    if (searchBtnDesktop && searchBtnDesktop.contains(e.target)) return;
    if (searchBtnMobile  && searchBtnMobile.contains(e.target))  return;
    cerrarSearchPanel();
  });

  // Input del panel
  if (searchInputPanel) {
    searchInputPanel.addEventListener('input', function() {
      queryActual = this.value;
      if (searchClearPanel) searchClearPanel.style.display = queryActual.length > 0 ? 'flex' : 'none';
      filtrarProductos();
      if (queryActual.trim().length > 0) {
        clearTimeout(searchInputPanel._t);
        searchInputPanel._t = setTimeout(scrollAPrimeraSeccion, 200);
      }
    });

    searchInputPanel.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
        cerrarSearchPanel();
        if (queryActual.trim().length > 0 || precioMin > PRECIO_GLOBAL_MIN || precioMax < PRECIO_GLOBAL_MAX) {
          setTimeout(scrollAPrimeraSeccion, 100);
        }
      }
    });
  }

  if (searchClearPanel) {
    searchClearPanel.addEventListener('click', function() {
      if (searchInputPanel) searchInputPanel.value = '';
      queryActual = '';
      this.style.display = 'none';
      filtrarProductos();
    });
  }

  // Sincronizar input desktop
  const searchInputDsk = document.getElementById('search-input');
  const searchClearDsk = document.getElementById('search-clear');
  if (searchInputDsk) {
    searchInputDsk.addEventListener('input', function() {
      queryActual = this.value;
      if (searchInputPanel) searchInputPanel.value = this.value;
      if (searchClearPanel) searchClearPanel.style.display = queryActual.length > 0 ? 'flex' : 'none';
      if (searchClearDsk)   searchClearDsk.classList.toggle('visible', queryActual.length > 0);
      filtrarProductos();
      if (queryActual.trim().length > 0) {
        clearTimeout(searchInputDsk._t);
        searchInputDsk._t = setTimeout(scrollAPrimeraSeccion, 200);
      }
    });
    searchInputDsk.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); this.blur(); cerrarSearchPanel(); setTimeout(scrollAPrimeraSeccion, 100); }
    });
    if (searchClearDsk) {
      searchClearDsk.addEventListener('click', function() {
        searchInputDsk.value = '';
        if (searchInputPanel) searchInputPanel.value = '';
        queryActual = '';
        this.classList.remove('visible');
        if (searchClearPanel) searchClearPanel.style.display = 'none';
        filtrarProductos();
      });
    }
  }

  // Sincronizar input mobile navbar
  const searchInputMob = document.getElementById('search-input-mobile');
  if (searchInputMob) {
    searchInputMob.addEventListener('input', function() {
      queryActual = this.value;
      if (searchInputPanel) searchInputPanel.value = this.value;
      if (searchClearPanel) searchClearPanel.style.display = queryActual.length > 0 ? 'flex' : 'none';
      filtrarProductos();
      if (queryActual.trim().length > 0) {
        clearTimeout(searchInputMob._t);
        searchInputMob._t = setTimeout(scrollAPrimeraSeccion, 200);
      }
    });
    searchInputMob.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault(); this.blur();
        const navbarNav = document.getElementById('navbarNav');
        if (navbarNav && navbarNav.classList.contains('show')) {
          bootstrap.Collapse.getOrCreateInstance(navbarNav).hide();
        }
        setTimeout(scrollAPrimeraSeccion, 200);
      }
    });
  }

  // Precio toggle
  if (btnPrecioToggle) {
    btnPrecioToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      precioPanelOpen = !precioPanelOpen;
      if (panelPrecio) panelPrecio.style.display = precioPanelOpen ? 'block' : 'none';
      this.setAttribute('aria-expanded', precioPanelOpen);
      this.style.background  = precioPanelOpen ? 'rgba(102,0,255,0.18)' : 'rgba(255,255,255,0.07)';
      this.style.borderColor = precioPanelOpen ? 'var(--arms-purple)'   : 'rgba(255,255,255,0.12)';
      this.style.color       = precioPanelOpen ? '#c4a8ff'              : 'rgba(255,255,255,0.6)';
    });
  }

  // Sliders precio
  function syncSliders() {
    if (!rangeMin || !rangeMax) return;
    let vMin = parseInt(rangeMin.value, 10);
    let vMax = parseInt(rangeMax.value, 10);
    const GAP = 25;
    if (vMin > vMax - GAP) { vMin = vMax - GAP; rangeMin.value = vMin; }
    if (vMax < vMin + GAP) { vMax = vMin + GAP; rangeMax.value = vMax; }
    precioMin = vMin; precioMax = vMax;
    if (lblMin) lblMin.textContent = vMin;
    if (lblMax) lblMax.textContent = vMax;
    const hayFiltro = vMin > PRECIO_GLOBAL_MIN || vMax < PRECIO_GLOBAL_MAX;
    if (lblRango)   lblRango.textContent   = hayFiltro ? `Q${vMin} – Q${vMax}` : 'Todos los precios';
    if (precioBadge) { precioBadge.textContent = `Q${vMin}–Q${vMax}`; precioBadge.style.display = hayFiltro ? 'inline' : 'none'; }
    if (btnPrecioReset) btnPrecioReset.classList.toggle('visible', hayFiltro);
    actualizarTrack();
    filtrarProductos();
    if (hayFiltro) { clearTimeout(syncSliders._t); syncSliders._t = setTimeout(scrollAPrimeraSeccion, 200); }
  }

  if (rangeMin) rangeMin.addEventListener('input', syncSliders);
  if (rangeMax) rangeMax.addEventListener('input', syncSliders);

  if (btnPrecioReset) {
    btnPrecioReset.addEventListener('click', function() {
      if (rangeMin) rangeMin.value = PRECIO_GLOBAL_MIN;
      if (rangeMax) rangeMax.value = PRECIO_GLOBAL_MAX;
      syncSliders();
    });
  }
})();
