const prisma = require('../lib/prisma');
const { getKindLabel, normalizeKind } = require('../lib/classifiedKinds');
// Buscador Global de Clasificados
exports.searchClassifieds = async (req, res) => {
  try {
    const { 
      q,           // Búsqueda por texto (palabras clave)
      kind,        // Tipo de ficha publicable
      category,    // Filtrar por categoría
      minPrice,    // Rango de precio
      maxPrice,
      location,    // Ubicación
      sortBy       // Ordenamiento (recent, price_asc, price_desc)
    } = req.query;

    // Construir los filtros dinámicamente
    const filters = {
      block: {
        isActive: true,
        type: { in: ['classified', 'product', 'service', 'event', 'need', 'promo', 'donation'] }
      }
    };

    if (kind) filters.block.type = normalizeKind(kind);
    if (category) filters.category = category;
    if (location) filters.location = { contains: location };
    
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.gte = parseFloat(minPrice);
      if (maxPrice) filters.price.lte = parseFloat(maxPrice);
    }

    if (q) {
      // Búsqueda en descripción, tags o título del bloque usando Prisma OR
      filters.OR = [
        { description: { contains: q } },
        { block: { title: { contains: q } } }
      ];
    }

    // Configurar el ordenamiento
    let orderBy = {};
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    else orderBy = { createdAt: 'desc' }; // Por defecto los más recientes

    const classifieds = await prisma.classified.findMany({
      where: filters,
      orderBy,
      include: {
        block: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                domainMappings: {
                  where: { canonical: true },
                  select: { hostname: true }
                }
              }
            }
          }
        }
      },
      take: 50 // Límite de paginación básico
    });

    const normalized = classifieds.map((item) => {
      let payload = {};
      try {
        payload = item.block?.payload ? JSON.parse(item.block.payload) : {};
      } catch {
        payload = {};
      }

      return {
        id: item.id,
        kind: normalizeKind(item.block?.type),
        kindLabel: getKindLabel(item.block?.type),
        title: item.block?.title || 'Clasificado',
        description: item.description,
        category: item.category,
        price: item.price,
        currency: item.currency,
        location: item.location,
        city: item.city || '',
        department: item.department || '',
        country: item.country || '',
        featured: item.isFeatured,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
        tags: (() => {
          try { return JSON.parse(item.tags || '[]'); } catch { return []; }
        })(),
        imageUrl: payload.imageUrl || '',
        contactUrl: payload.contactUrl || '',
        workspace: item.block?.workspace || null
      };
    });

    res.json(normalized);
  } catch (error) {
    console.error('Error buscando clasificados:', error);
    res.status(500).json({ error: 'Error en la búsqueda global' });
  }
};
