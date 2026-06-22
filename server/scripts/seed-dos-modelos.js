/**
 * 🌱 Seed: Dos modelos completos al 100%
 * 
 * Crea dos workspaces con TODOS los datos posibles:
 *   ✅ Usuario + Workspace + DomainMapping
 *   ✅ Perfil completo (bio, avatar, theme)
 *   ✅ MiniSite publicado con servicios, redes, sheets
 *   ✅ Bloques (links, productos, eventos)
 *   ✅ Clasificados (destacados y normales)
 *   ✅ ShortLinks funcionales
 *   ✅ Eventos de analytics
 *   ✅ Logs de auditoría
 *   ✅ Ejecuciones de agentes
 * 
 * Uso: node scripts/seed-dos-modelos.js
 */

const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// ─── Datos de los dos modelos ─────────────────────────────────

const MODELOS = [
  {
    email: 'cafe@demo.com',
    password: 'Demo123!',
    name: 'Café Aroma',
    role: 'USER',
    subdomain: 'cafearoma',
    handle: '@cafearoma',
    bio: 'Café de especialidad · Tostamos, preparamos y compartimos el mejor café de la ciudad.',
    avatar: 'CA',
    theme: 'clean',
    
    // MiniSite completo
    miniSite: {
      published: true,
      businessName: 'Café Aroma',
      headline: 'Café de especialidad · Tostado artesanal',
      description: 'Descubre nuestro menú, eventos y programas de fidelización. Café recién tostado, catas y más.',
      services: ['Café para llevar', 'Catas guiadas', 'Talleres de barismo', 'Suscripción mensual'],
      whatsapp: '595981555001',
      email: 'cafe@demo.com',
      address: 'Av. Principal 123, Asunción',
      primaryCtaLabel: 'Ver menú digital',
      primaryCtaUrl: 'https://cafearoma.com/menu',
      showClassifieds: true,
      profileExperience: {
        intro: 'Desde 2020 llevando el mejor café de especialidad a la ciudad. Granos importados, tostado propio y un espacio para los amantes del café.',
        socials: {
          instagram: 'https://instagram.com/cafearoma',
          facebook: 'https://facebook.com/cafearoma',
          tiktok: 'https://tiktok.com/@cafearoma',
          youtube: 'https://youtube.com/@cafearoma',
          whatsapp: 'https://wa.me/595981555001',
          telegram: ''
        },
        sheets: [
          {
            title: 'Menú digital',
            body: 'Explora nuestro menú completo con precios, fotos y descripciones de cada producto.',
            ctaLabel: 'Ver menú',
            ctaUrl: 'https://cafearoma.com/menu'
          },
          {
            title: 'Programa de fidelización',
            body: 'Acumula puntos con cada compra y canjea café gratis, descuentos y eventos exclusivos.',
            ctaLabel: 'Registrarse',
            ctaUrl: 'https://wa.me/595981555001?text=Quiero%20unirme%20al%20programa'
          },
          {
            title: 'Eventos y catas',
            body: 'Próximas catas abiertas, talleres de barismo y eventos especiales con música en vivo.',
            ctaLabel: 'Ver calendario',
            ctaUrl: 'https://cafearoma.com/eventos'
          }
        ]
      }
    },

    // Bloques (links + productos)
    links: [
      ['☕ Menú digital', 'https://cafearoma.com/menu', 'link'],
      ['📍 Cómo llegar', 'https://maps.google.com/?q=Cafe+Aroma+Asuncion', 'link'],
      ['📱 WhatsApp pedidos', 'https://wa.me/595981555001', 'link'],
      ['🎫 Eventos de la semana', 'https://cafearoma.com/eventos', 'link'],
      ['🛒 Tienda online', 'https://cafearoma.shop', 'link'],
      ['📸 Instagram', 'https://instagram.com/cafearoma', 'link'],
      ['🏆 Cata premiada', '', 'product'],
      ['☕ Café del mes', '', 'product']
    ],

    // Clasificados
    classifieds: [
      {
        title: '☕ Café de especialidad - Colombia Gesha',
        category: 'Productos',
        price: 18.50,
        currency: 'USD',
        location: 'Tienda física · Asunción',
        description: 'Café de origen único, finca La Esperanza, notas florales y cítricas. Tostado medio. Disponible en grano o molido.',
        tags: ['café', 'especialidad', 'colombia', 'gesha'],
        featured: true
      },
      {
        title: '🎟️ Cata guiada: Orígenes del café',
        category: 'Eventos',
        price: 25,
        currency: 'USD',
        location: 'Café Aroma · Av. Principal 123',
        description: 'Cata guiada de 5 orígenes diferentes. Incluye degustación, ficha técnica y 10% de descuento en compras.',
        tags: ['cata', 'evento', 'degustación'],
        featured: true
      },
      {
        title: '📦 Suscripción mensual de café',
        category: 'Servicios',
        price: 35,
        currency: 'USD',
        location: 'Envío a todo el país',
        description: 'Recibe 250g de café de especialidad cada mes. Origen rotativo, tostado fresco. Cancela cuando quieras.',
        tags: ['suscripción', 'café', 'suscripción'],
        featured: false
      },
      {
        title: '💼 Buscamos barista experimentado',
        category: 'Empleos',
        price: null,
        currency: null,
        location: 'Asunción',
        description: 'Buscamos barista con experiencia mínima de 2 años en café de especialidad. Horario rotativo, buen ambiente laboral.',
        tags: ['empleo', 'barista', 'café'],
        featured: false
      }
    ],

    // ShortLinks
    shortLinks: [
      { slug: 'menu', url: 'https://cafearoma.com/menu' },
      { slug: 'wsp-pedidos', url: 'https://wa.me/595981555001' },
      { slug: 'cata-junio', url: 'https://cafearoma.com/eventos/cata-junio' },
      { slug: 'suscripcion', url: 'https://cafearoma.com/suscribirse' }
    ],

    // Analytics events (simulados)
    analyticsEvents: 25,

    // Auditoría
    auditActions: ['create', 'update', 'create', 'create', 'update']
  },

  {
    email: 'techfix@demo.com',
    password: 'Demo123!',
    name: 'TechFix Pro',
    role: 'USER',
    subdomain: 'techfixpro',
    handle: '@techfixpro',
    bio: 'Reparación de dispositivos · Celulares, tablets, laptops y consolas. Servicio técnico rápido y garantizado.',
    avatar: 'TF',
    theme: 'dark',
    
    miniSite: {
      published: true,
      businessName: 'TechFix Pro',
      headline: 'Reparación exprés · Garantía por escrito',
      description: 'Diagnóstico gratis, presupuesto sin cargo y reparación en 24 horas. Todas las marcas.',
      services: ['Reparación de pantallas', 'Cambio de baterías', 'Servicio de datos', 'Mantenimiento preventivo'],
      whatsapp: '595981555002',
      email: 'techfix@demo.com',
      address: 'Centro, Asunción · Local 5, Galería Comercial',
      primaryCtaLabel: 'Cotizar reparación',
      primaryCtaUrl: 'https://wa.me/595981555002',
      showClassifieds: true,
      profileExperience: {
        intro: 'Más de 8 años reparando dispositivos electrónicos. Técnicos certificados, repuestos originales y garantía de 6 meses en todas las reparaciones.',
        socials: {
          instagram: 'https://instagram.com/techfixpro',
          facebook: 'https://facebook.com/techfixpro',
          tiktok: 'https://tiktok.com/@techfixpro',
          youtube: 'https://youtube.com/@techfixpro',
          whatsapp: 'https://wa.me/595981555002',
          telegram: ''
        },
        sheets: [
          {
            title: 'Lista de precios',
            body: 'Precios actualizados de reparaciones: pantallas, baterías, pin de carga, software y más.',
            ctaLabel: 'Ver precios',
            ctaUrl: 'https://techfixpro.com/precios'
          },
          {
            title: 'Reparaciones urgentes',
            body: 'Servicio exprés con prioridad. Reparación en 2 horas para modelos seleccionados.',
            ctaLabel: 'Pedir urgente',
            ctaUrl: 'https://wa.me/595981555002?text=Urgente%20-%20Necesito%20reparaci%C3%B3n'
          },
          {
            title: 'Venta de accesorios',
            body: 'Fundas, cargadores, auriculares, vidrios templados y más con envío a domicilio.',
            ctaLabel: 'Ver accesorios',
            ctaUrl: 'https://techfixpro.com/accesorios'
          }
        ]
      }
    },

    links: [
      ['📱 Cotizar reparación', 'https://wa.me/595981555002', 'link'],
      ['📍 Ubicación del local', 'https://maps.google.com/?q=TechFix+Pro+Asuncion', 'link'],
      ['📋 Lista de precios', 'https://techfixpro.com/precios', 'link'],
      ['⭐ Reseñas de clientes', 'https://techfixpro.com/resenas', 'link'],
      ['🛒 Accesorios', 'https://techfixpro.com/accesorios', 'link'],
      ['🔧 Servicio técnico empresarial', 'https://techfixpro.com/empresas', 'link'],
      ['💻 Promoción del mes', '', 'product'],
      ['📱 Oferta en accesorios', '', 'product']
    ],

    classifieds: [
      {
        title: '🔧 Reparación de pantalla iPhone 13-15',
        category: 'Servicios',
        price: 89,
        currency: 'USD',
        location: 'Local · Asunción',
        description: 'Reparación de pantalla con vidrio templado incluido. Repuesto original o de alta calidad. Garantía 6 meses.',
        tags: ['iphone', 'pantalla', 'reparación'],
        featured: true
      },
      {
        title: '💻 Notebook HP / Lenovo seminueva',
        category: 'Productos',
        price: 450,
        currency: 'USD',
        location: 'Asunción',
        description: 'Notebook reacondicionada con garantía de 6 meses. i5, 8GB RAM, SSD 256GB. Ideal para estudio y trabajo.',
        tags: ['notebook', 'reacondicionado', 'oferta'],
        featured: true
      },
      {
        title: '📱 iPhone 12 Pro Max - Reacondicionado',
        category: 'Productos',
        price: 599,
        currency: 'USD',
        location: 'Asunción · Envío incluido',
        description: 'iPhone 12 Pro Max reacondicionado por técnicos certificados. Batería >85%. Incluye cargador y funda.',
        tags: ['iphone', 'reacondicionado', 'celular'],
        featured: false
      },
      {
        title: '🔐 Recuperación de datos',
        category: 'Servicios',
        price: 35,
        currency: 'USD',
        location: 'Remoto o presencial',
        description: 'Recuperación de fotos, contactos y documentos de celulares, tablets, discos duros y memorias SD.',
        tags: ['datos', 'recuperación', 'servicio'],
        featured: false
      }
    ],

    shortLinks: [
      { slug: 'cotizar', url: 'https://wa.me/595981555002' },
      { slug: 'precios', url: 'https://techfixpro.com/precios' },
      { slug: 'resenas', url: 'https://techfixpro.com/resenas' },
      { slug: 'accesorios', url: 'https://techfixpro.com/accesorios' },
      { slug: 'wsp-tech', url: 'https://wa.me/595981555002?text=Hola%20TechFix' }
    ],

    analyticsEvents: 30,

    auditActions: ['create', 'create', 'update', 'create', 'update', 'create']
  }
];

// ─── Lógica de seed ──────────────────────────────────────────

async function seedModelo(data) {
  console.log(`\n📦 Creando: ${data.name}`);

  // 1. Verificar si ya existe
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    console.log(`   ⏩ ${data.email} ya existe, saltando.`);
    return;
  }

  // 2. Crear usuario
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role
    }
  });
  console.log(`   ✅ Usuario creado: ${user.email}`);

  // 3. Crear workspace
  const workspace = await prisma.workspace.create({
    data: {
      ownerId: user.id,
      name: data.name,
      handle: data.handle,
      bio: data.bio,
      avatar: data.avatar,
      theme: data.theme,
      miniSite: JSON.stringify(data.miniSite)
    }
  });
  console.log(`   ✅ Workspace: ${workspace.name} (${workspace.id.slice(0,8)}…)`);

  // 4. Crear domain mapping
  await prisma.domainMapping.create({
    data: {
      workspaceId: workspace.id,
      hostname: data.subdomain,
      type: 'platform_subdomain',
      canonical: true
    }
  });
  console.log(`   ✅ Subdominio: ${data.subdomain}`);

  // 5. Crear bloques (links + products)
  for (let i = 0; i < data.links.length; i++) {
    const [title, url, type] = data.links[i];
    const payload = type === 'product'
      ? JSON.stringify({ price: i === 6 ? 35 : 15, description: 'Producto destacado', image: '' })
      : JSON.stringify({ url });

    // Crear o reusar clasificado para productos
    const block = await prisma.treeBlock.create({
      data: {
        workspaceId: workspace.id,
        type,
        title,
        order: i,
        isActive: true,
        payload
      }
    });

    // Si es tipo product, crear clasificado asociado
    if (type === 'product') {
      const classifiedIndex = i >= data.links.length - 2 ? i - (data.links.length - data.classifieds.length) : -1;
      if (classifiedIndex >= 0 && classifiedIndex < data.classifieds.length) {
        await prisma.classified.create({
          data: {
            blockId: block.id,
            category: data.classifieds[classifiedIndex]?.category || 'Productos',
            price: data.classifieds[classifiedIndex]?.price || 0,
            currency: data.classifieds[classifiedIndex]?.currency || 'USD',
            location: data.classifieds[classifiedIndex]?.location || 'Local',
            description: data.classifieds[classifiedIndex]?.description || '',
            tags: data.classifieds[classifiedIndex]?.tags?.join(',') || '',
            isFeatured: data.classifieds[classifiedIndex]?.featured || false
          }
        });
      }
    }
  }
  console.log(`   ✅ ${data.links.length} bloques creados`);

  // 6. Crear clasificados independientes (los que no son productos)
  for (const cls of data.classifieds) {
    const block = await prisma.treeBlock.create({
      data: {
        workspaceId: workspace.id,
        type: 'classified',
        title: cls.title,
        order: 99,
        isActive: true,
        payload: JSON.stringify({})
      }
    });

    await prisma.classified.create({
      data: {
        blockId: block.id,
        category: cls.category,
        price: cls.price,
        currency: cls.currency,
        location: cls.location,
        description: cls.description,
        tags: cls.tags.join(','),
        isFeatured: cls.featured
      }
    });
  }
  console.log(`   ✅ ${data.classifieds.length} clasificados`);

  // 7. Crear short links
  for (const sl of data.shortLinks) {
    await prisma.shortLink.create({
      data: {
        workspaceId: workspace.id,
        slug: sl.slug,
        url: sl.url,
        isActive: true,
        clickCount: Math.floor(Math.random() * 50)
      }
    });
  }
  console.log(`   ✅ ${data.shortLinks.length} short links`);

  // 8. Crear eventos de analytics
  const eventTypes = ['page_view', 'link_click', 'short_click', 'whatsapp_share', 'classified_view'];
  const events = [];
  for (let i = 0; i < data.analyticsEvents; i++) {
    events.push({
      workspaceId: workspace.id,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      visitorId: `visitor_${Math.random().toString(36).slice(2, 8)}`,
      source: Math.random() > 0.5 ? 'whatsapp' : 'direct',
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
    });
  }
  await prisma.analyticsEvent.createMany({ data: events });
  console.log(`   ✅ ${data.analyticsEvents} eventos analytics`);

  // 9. Crear logs de auditoría
  const entities = ['user', 'block', 'classified', 'shortlink', 'domain'];
  const auditLogs = data.auditActions.map(action => ({
    workspaceId: workspace.id,
    userId: user.id,
    action,
    entity: entities[Math.floor(Math.random() * entities.length)],
    entityId: `entity_${Math.random().toString(36).slice(2, 10)}`,
    details: JSON.stringify({ change: 'seed_data', timestamp: new Date().toISOString() })
  }));
  await prisma.auditLog.createMany({ data: auditLogs });
  console.log(`   ✅ ${auditLogs.length} registros de auditoría`);

  // 10. Crear ejecución de agente (simulada)
  await prisma.agentExecution.create({
    data: {
      workspaceId: workspace.id,
      task: `Optimizar perfil de ${data.name}`,
      plan: JSON.stringify([
        { step: 1, type: 'update_profile', params: { bio: data.bio } },
        { step: 2, type: 'create_block', params: { title: 'Enlace principal', type: 'link' } },
        { step: 3, type: 'create_classified', params: { title: 'Producto destacado', category: 'Productos' } }
      ]),
      status: 'completed',
      result: JSON.stringify({ success: true, stepsExecuted: 3, score: 95 }),
      score: 95,
      completedAt: new Date()
    }
  });
  console.log(`   ✅ 1 ejecución de agente`);

  console.log(`   🎯 ${data.name} → 100% completado`);
}

async function main() {
  console.log('🌱 Seed: Dos modelos completos al 100%');
  console.log('======================================');

  for (const modelo of MODELOS) {
    await seedModelo(modelo);
  }

  console.log('\n✨ Seeds completados con éxito.');
  console.log('   Usuarios creados:');
  console.log('     📧 cafe@demo.com / Demo123!  →  Subdominio: cafearoma');
  console.log('     📧 techfix@demo.com / Demo123!  →  Subdominio: techfixpro');
  console.log('\n🔑 Ambos usuarios usan la contraseña: Demo123!');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
