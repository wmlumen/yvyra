const LISTING_KIND_META = {
  classified: { label: 'Clasificado', aliases: ['classified', 'ad', 'listing'] },
  product: { label: 'Producto', aliases: ['product', 'catalogo', 'catalog'] },
  service: { label: 'Servicio', aliases: ['service', 'servicio'] },
  event: { label: 'Evento', aliases: ['event', 'evento'] },
  need: { label: 'Necesidad', aliases: ['need', 'necesidad', 'request'] },
  promo: { label: 'Promocion', aliases: ['promo', 'promotion', 'coupon', 'cupon'] },
  donation: { label: 'Donacion', aliases: ['donation', 'donacion', 'fundraising'] }
};

const CLASSIFIED_BLOCK_TYPES = new Set(Object.keys(LISTING_KIND_META));

function normalizeKind(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!raw) return 'classified';
  if (LISTING_KIND_META[raw]) return raw;

  for (const [kind, meta] of Object.entries(LISTING_KIND_META)) {
    if (meta.aliases.includes(raw)) return kind;
  }

  return 'classified';
}

function getKindLabel(kind) {
  return LISTING_KIND_META[normalizeKind(kind)].label;
}

function isClassifiedBlockType(type) {
  return CLASSIFIED_BLOCK_TYPES.has(normalizeKind(type));
}

module.exports = {
  LISTING_KIND_META,
  normalizeKind,
  getKindLabel,
  isClassifiedBlockType
};
