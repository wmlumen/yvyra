export const PRODUCT_SURFACES = {
  tree: {
    key: 'tree',
    title: 'Arbol principal',
    path: 'profile.html'
  },
  classifieds: {
    key: 'classifieds',
    title: 'Clasificados',
    path: 'clasificados.html'
  },
  miniweb: {
    key: 'miniweb',
    title: 'Miniweb',
    path: 'miniweb.html'
  },
  shortlinks: {
    key: 'shortlinks',
    title: 'Enlaces cortos',
    path: 'shortener.html'
  }
};

export function getExplicitTenant(search = globalThis.location?.search || '') {
  try {
    return new URLSearchParams(search).get('tenant') || '';
  } catch {
    return '';
  }
}

export function buildTenantPageUrl(path, tenant = getExplicitTenant()) {
  if (!tenant) return path;
  const url = new URL(path, globalThis.location?.href || 'http://localhost/');
  url.searchParams.set('tenant', tenant);
  return `${url.pathname.split('/').pop()}?${url.searchParams.toString()}`;
}
