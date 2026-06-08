const productosData = require('./src/_data/productos.json');

// ── Mapa de sección → pilar URL ───────────────────────────────
const PILARES = {
  'inears':            'in-ears',
  'accesorios-inears': 'in-ears/accesorios',
  // audio y sus subpilares se agregarán aquí cuando estén definidos
};

// ── Filtro slug (igual que antes) ─────────────────────────────
function safeSlug(str) {
  return String(str).toLowerCase()
    .replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e')
    .replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o')
    .replace(/[úùüû]/g,'u').replace(/ñ/g,'n')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
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
  // Uso: {{ prod.nombre | productoUrl(prod.seccion) }}
  eleventyConfig.addFilter("productoUrl", (nombre, seccion) => {
    const pilar = PILARES[seccion];
    if (!pilar) return '#';
    return `/${pilar}/${safeSlug(nombre)}/`;
  });

  // ── Colección: todas las páginas de producto ──────────────────
  // Para las secciones que YA tienen pilar definido
  eleventyConfig.addCollection("productos", function() {
    const items = [];
    for (const [seccion, pilar] of Object.entries(PILARES)) {
      const lista = productosData[seccion] || [];
      lista.forEach(prod => {
        items.push({
          ...prod,
          seccion,
          pilar,
          slug:      safeSlug(prod.nombre),
          permalink: `/${pilar}/${safeSlug(prod.nombre)}/index.html`,
          // Productos relacionados: misma sección, excluyendo el actual
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
