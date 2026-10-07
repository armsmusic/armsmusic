/* =============================================================
   ARMS Music — safe-sticky.js
   Web Component <safe-sticky>: compensación de scroll para
   position:sticky (mantener el elemento "enganchado" aunque haya
   ancestros con transform/animaciones).

   Portado del theme.js real de Impact (clase SafeSticky,
   descargado del CDN del demo y decompilado): misma lógica,
   mismos clamps. Las dependencias del bundle (throttle del
   vendor y el paquete in-view) se reimplementan aquí de forma
   equivalente para no cargar librerías externas.
   ============================================================= */

'use strict';

// ── throttle (vendor de theme.js, basado en requestAnimationFrame)
function throttleSafeSticky(callback) {
  let requestId = null, lastArgs;
  const later = (context) => () => {
    requestId = null;
    callback.apply(context, lastArgs);
  };
  const throttled = (...args) => {
    lastArgs = args;
    requestId === null && (requestId = requestAnimationFrame(later(this)));
  };
  throttled.cancel = () => {
    cancelAnimationFrame(requestId);
    requestId = null;
  };
  return throttled;
}

// ── inView (equivalente al paquete "in-view" de theme.js)
// Llama a fn() cuando el elemento entra en el viewport (con margen)
// y a la función que devuelve fn() cuando sale.
function inViewSafeSticky(el, fn, { margin = 0 } = {}) {
  const opts = {
    rootMargin: typeof margin === 'string' ? margin : `${margin}px`,
  };
  let abort = null;
  const ioExit = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        if (abort) abort();
        abort = null;
        ioExit.disconnect();
      }
    }
  }, opts);
  const ioEnter = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        ioEnter.disconnect();
        abort = fn();
        ioExit.observe(el);
      }
    }
  }, opts);
  ioEnter.observe(el);
  return () => {
    ioEnter.disconnect();
    ioExit.disconnect();
    if (abort) abort();
  };
}

// ── SafeSticky (lógica idéntica a la de theme.js) ─────────────
class SafeSticky extends HTMLElement {
  constructor() {
    super();
    this._resizeObserver = new ResizeObserver(this._recalculateStyles.bind(this));
    this._checkPositionListener = throttleSafeSticky(this._checkPosition.bind(this));
    this._initialTop = 0;
    this._lastKnownY = 0;
    this._currentTop = 0;
    this._position = 'relative';
  }

  connectedCallback() {
    inViewSafeSticky(this, () => {
      this._resizeObserver.observe(this);
      window.addEventListener('scroll', this._checkPositionListener);
      return () => {
        this._resizeObserver.unobserve(this);
        window.removeEventListener('scroll', this._checkPositionListener);
      };
    }, { margin: '500px' });
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this._checkPositionListener);
  }

  _recalculateStyles() {
    this.style.removeProperty('top');
    const computedStyles = getComputedStyle(this);
    this._initialTop = parseInt(computedStyles.top);
    this._position = computedStyles.position;
    this._checkPosition();
  }

  _checkPosition() {
    if (this._position !== 'sticky') {
      return this.style.removeProperty('top');
    }
    let bounds = this.getBoundingClientRect(),
      maxTop = bounds.top + window.scrollY - this.offsetTop + this._initialTop,
      minTop = this.clientHeight - window.innerHeight + 20;

    window.scrollY < this._lastKnownY
      ? this._currentTop = this._currentTop - (window.scrollY - this._lastKnownY)
      : this._currentTop = this._currentTop + (this._lastKnownY - window.scrollY);

    this._currentTop = Math.min(Math.max(this._currentTop, -minTop), maxTop, this._initialTop);
    this._lastKnownY = window.scrollY;
    this.style.top = `${Math.round(this._currentTop)}px`;
  }
}

if (!customElements.get('safe-sticky')) customElements.define('safe-sticky', SafeSticky);
