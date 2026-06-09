const productosData = require('./src/_data/productos.json');

// ── Mapa de sección → pilar URL ───────────────────────────────
const PILARES = {
  'inears':            'in-ears',
  'accesorios-inears': 'in-ears/accesorios',
  'audio-sistemas':    'audio/sistemas',
  'audio-interfaces':  'audio/interfaces',
  'audio-microfonos':  'audio/microfonos',
  'audio-cables':      'audio/cables'
};

// ── Filtro slug ───────────────────────────────────────────────
function safeSlug(str) {
  return String(str).toLowerCase()
    .replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e')
    .replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o')
    .replace(/[úùüû]/g,'u').replace(/ñ/g,'n')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

// ── Resolver IDs a objetos completos ─────────────────────────
function resolverSeccion(seccion) {
  const indice = {};
  productosData.catalogo.forEach(p => { indice[p.id] = p; });
  const ids   = productosData.secciones[seccion] || [];
  const extra = productosData.extra[seccion]      || [];
  return ids.map(id => ({
    ...indice[id],
    extra: extra.includes(id)
  })).filter(Boolean);
}

module.exports = function(eleventyConfig) {

  // ── Assets ───────────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg":     "favicon.svg" });
  eleventyConfig.addPassthroughCopy({ "src/logo-navbar.svg": "logo-navbar.svg" });
  eleventyConfig.addPassthroughCopy({ "src/logo-footer.svg": "logo-footer.svg" });

  // ── Filtros ───────────────────────────────────────────────────
  eleventyConfig.addFilter("gtq",      (num) => `Q${Number(num).toLocaleString()}`);
  eleventyConfig.addFilter("safeSlug", safeSlug);

  // ── Filtro: URL de un producto ────────────────────────────────
  eleventyConfig.addFilter("productoUrl", (nombre, seccion) => {
    const pilar = PILARES[seccion];
    if (!pilar) return '#';
    return `/${pilar}/${safeSlug(nombre)}/`;
  });

  // ── Global data: productos resueltos por sección ─────────────
  // Disponible en templates como productos.inears, productos.monitores, etc.
  eleventyConfig.addGlobalData("productos", () => {
    const resultado = {};
    const todasSecciones = [
      'inears', 'monitores', 'audio', 'accesorios-inears',
      'audio-sistemas', 'audio-interfaces', 'audio-microfonos', 'audio-cables'
    ];
    todasSecciones.forEach(sec => {
      resultado[sec] = resolverSeccion(sec);
    });
    return resultado;
  });

  // ── Colección: páginas individuales de producto ───────────────
  eleventyConfig.addCollection("productosPages", function() {
    const indice = {};
    productosData.catalogo.forEach(p => { indice[p.id] = p; });
    const items = [];

    for (const [seccion, pilar] of Object.entries(PILARES)) {
      const lista = resolverSeccion(seccion);
      lista.forEach(prod => {
        // Evitar duplicados: un producto puede estar en varias secciones
        // Solo genera página en la primera sección donde aparece
        const yaExiste = items.find(i => i.slug === safeSlug(prod.nombre));
        if (yaExiste) return;

        items.push({
          ...prod,
          seccion,
          pilar,
          slug:      safeSlug(prod.nombre),
          permalink: `/${pilar}/${safeSlug(prod.nombre)}/index.html`,
          relacionados: lista
            .filter(p => p.nombre !== prod.nombre)
            .slice(0, 3)
        });
      });
    }
    return items;
  });

  return {
    dir: {
      input:    "src",
      output:   "_site",
      includes: "_includes",
      data:     "_data"
    },
    templateFormats:     ["njk", "html", "md"],
    htmlTemplateEngine:  "njk",
    markdownTemplateEngine: "njk"
  };
};
