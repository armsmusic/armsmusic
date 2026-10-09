/* =============================================================
   ARMS Music — arms-header.js
   Web Component StoreHeader: comportamiento transparente-sobre-
   hero / sólido al hacer scroll, igual a Impact. Umbral y timing
   confirmados decompilando el theme.js real de Impact.

   IMPORTANTE (fix 2026-10-07): el theme.js del demo tiene DOS ramas
   en _checkTransparency(): la animada (slide-in a los 500px) SOLO
   si el header tiene allow-transparency (páginas con hero); las
   demás páginas usan la rama fallback sin animación. El port
   original mezclaba ambas y el header de producto hacía el
   "sube y vuelve a bajar" en desktop.
============================================================= */

'use strict';

function prefersReducedMotionHeader() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const STICKY_THRESHOLD = 500; // px — umbral real confirmado en Impact

class StoreHeader extends HTMLElement {
  connectedCallback() {
    this._hasSwitchedToSticky = false;
    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    // Si hay algún disclosure abierto dentro del header, forzar fondo sólido
    this.addEventListener('toggle', this._checkTransparency.bind(this), { signal, capture: true });

    // Demo (theme.js): los listeners de scroll/hover de transparencia solo
    // se instalan cuando el header es transparente (página con hero) —
    // ahí vive el slide-in. En las demás páginas (producto, etc.) el
    // header es SIEMPRE sólido y NUNCA anima. El port anterior instalaba
    // el listener de scroll en TODAS las páginas, y por eso en desktop
    // el header hacía el "sube y vuelve a bajar" de los 500px incluso en
    // páginas sin hero (bug reportado por el dueño, 2026-10-07).
    if (this.hasAttribute('allow-transparency')) {
      window.addEventListener('scroll', this._checkTransparency.bind(this), { signal, passive: true });
      this.addEventListener('mouseenter', this._checkTransparency.bind(this), { signal });
      this.addEventListener('mouseleave', this._checkTransparency.bind(this), { signal });
    }

    // Restauración de bfcache: resetear el estado (como el demo)
    if (this.hasAttribute('sticky')) {
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          this.classList.remove('is-filled');
          this._hasSwitchedToSticky = false;
          this._checkTransparency();
        }
      }, { signal });
    }

    this._checkTransparency();
  }

  disconnectedCallback() {
    this._abortController?.abort();
  }

  _checkTransparency() {
    const hasOpen = this.querySelectorAll('[open], .header__dropdown.is-open').length > 0;

    // Demo: la rama ANIMADA (slide-in a los 500px) solo aplica si el
    // header tiene allow-transparency. Sin ese atributo usa la rama
    // fallback: toggle de is-filled SIN ninguna animación.
    const transparentHeader =
      window.CSS.supports('selector(:has(> *))') &&
      this.hasAttribute('sticky') &&
      !this.hasAttribute('hide-on-scroll') &&
      this.hasAttribute('allow-transparency');

    if (!transparentHeader) {
      const hasFallbackScrollDetection = this.hasAttribute('sticky') && window.scrollY > 20;
      this.classList.toggle(
        'is-filled',
        !this.hasAttribute('allow-transparency') || hasOpen || hasFallbackScrollDetection
      );
      return;
    }

    if (hasOpen) {
      this.classList.add('is-filled');
    } else if (window.scrollY >= STICKY_THRESHOLD && !this._hasSwitchedToSticky) {
      this._hasSwitchedToSticky = true;
      this.classList.add('is-filled');
      if (!prefersReducedMotionHeader()) {
        this.animate(
          [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }],
          { duration: 150, easing: 'ease' }
        );
      }
    } else if (window.scrollY < STICKY_THRESHOLD) {
      if (this._hasSwitchedToSticky) {
        this._hasSwitchedToSticky = false;
        if (!prefersReducedMotionHeader()) {
          this.animate(
            [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
            { duration: 150, easing: 'ease' }
          ).finished.then(() => {
            this.style.transform = null;
            this.classList.remove('is-filled');
          });
        } else {
          this.classList.remove('is-filled');
        }
      } else if (this.getAnimations().length === 0) {
        this.classList.remove('is-filled');
      }
    }
  }
}

if (!customElements.get('store-header')) customElements.define('store-header', StoreHeader);

// ── Dropdown simple de categorías (Audio) ──────────────────────
window.toggleAudioDropdown = function() {
  const dropdown = document.getElementById('audio-dropdown');
  if (!dropdown) return;
  const willOpen = !dropdown.classList.contains('is-open');
  dropdown.classList.toggle('is-open', willOpen);

  if (willOpen) {
    const closeOnOutsideClick = (event) => {
      if (!dropdown.contains(event.target) && !event.target.closest('.header__link--dropdown')) {
        dropdown.classList.remove('is-open');
        document.removeEventListener('click', closeOnOutsideClick);
      }
    };
    setTimeout(() => document.addEventListener('click', closeOnOutsideClick), 0);
  }
};
