const productosData = require('./src/_data/productos.json');
const fs            = require('fs');
const path          = require('path');
const md            = require('markdown-it')({ html: true, breaks: true });

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

// ── Leer descripción desde archivo .md ───────────────────────
function leerDescripcion(id) {
  const filePath = path.join(__dirname, 'src', 'descripciones', `${id}.md`);
  if (fs.existsSync(filePath)) {
    return md.render(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

// ── Leer imágenes desde carpeta del producto ─────────────────
const IMG_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png']);

function leerImagenes(id) {
  const carpeta = path.join(__dirname, 'src', 'assets', 'img', 'productos', id);
  if (!fs.existsSync(carpeta)) return [];
  return fs.readdirSync(carpeta)
    .filter(f => IMG_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map(f => `${id}/${f}`);
}

// ── Resolver IDs a objetos completos ─────────────────────────
function resolverSeccion(seccion) {
  const indice = {};
  productosData.catalogo.forEach(p => { indice[p.id] = p; });
  const ids   = productosData.secciones[seccion] || [];
  const extra = productosData.extra[seccion]      || [];
  return ids.map(id => {
    const prod = indice[id];
    if (!prod) return null;
    const descMd = leerDescripcion(id);
    return {
      ...prod,
      descripcion: descMd || prod.descripcion || null,
      imagenes:    leerImagenes(id),
      extra:       extra.includes(id)
    };
  }).filter(Boolean);
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

  // ── Filtro: URL de un producto (busca la sección por ID) ─────
  eleventyConfig.addFilter("productoUrl", (id) => {
    for (const [seccion, pilar] of Object.entries(PILARES)) {
      const ids = productosData.secciones[seccion] || [];
      if (ids.includes(id)) return `/${pilar}/${id}/`;
    }
    return '#';
  });

  // ── Global data: productos resueltos por sección ─────────────
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
    const items = [];

    for (const [seccion, pilar] of Object.entries(PILARES)) {
      const lista = resolverSeccion(seccion);
      lista.forEach(prod => {
        const yaExiste = items.find(i => i.slug === prod.id);
        if (yaExiste) return;

        items.push({
          ...prod,
          seccion,
          pilar,
          slug:      prod.id,
          permalink: `/${pilar}/${prod.id}/index.html`,
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
