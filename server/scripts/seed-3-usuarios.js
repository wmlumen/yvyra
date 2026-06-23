/**
 * Seed: 3 Usuarios Demo Completos
 * 
 * Crea tres usuarios con perfiles, enlaces, clasificados,
 * enlaces cortos y config de miniweb para visualizar el
 * sistema con datos reales desde diferentes perspectivas.
 * 
 * Uso: DATABASE_URL="postgresql://..." node scripts/seed-3-usuarios.js
 * O via Railway: railway run "node scripts/seed-3-usuarios.js"
 */

const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

const PASSWORD = 'Demo123456!';

const USERS = [
  {
    email: 'cafe@demo.com',
    name: 'Café Aroma',
    subdomain: 'cafe-aroma',
    theme: 'dark',
    avatar: '☕',
    handle: 'cafearoma',
    bio: '☕ Café de especialidad tostado artesanalmente. Granos de origen único, catas y eventos. ¡Te esperamos!',
    miniSite: {
      published: true,
      showClassifieds: true,
      businessName: 'Café Aroma',
      headline: 'El aroma que despierta tus sentidos',
      description: 'Somos una micro-tostadora de café de especialidad. Seleccionamos granos directamente de productores en Chiapas y los tostamos en lotes pequeños para garantizar la máxima frescura.',
      whatsapp: '595981111001',
      email: 'hola@cafearoma.com',
      address: 'Av. Rodríguez 1234, Asunción',
      primaryCtaLabel: 'Ver árbol de enlaces',
      primaryCtaUrl: 'profile.html?tenant=cafe-aroma',
      services: ['Café de Origen — Granos 100% arábica', 'Tostado Artesanal — Lotes pequeños', 'Envío Gratis en Asunción'],
      schedule: [
        { day: 'Lun-Vie', hours: '07:00 - 20:00' },
        { day: 'Sáb', hours: '08:00 - 22:00' },
        { day: 'Dom', hours: '09:00 - 18:00' }
      ],
      social: {
        instagram: '@cafearoma',
        facebook: 'cafearomapy'
      },
      features: [
        { icon: '☕', title: 'Café de Origen', desc: 'Granos 100% arábica de Chiapas, Guatemala y Colombia.' },
        { icon: '🔥', title: 'Tostado Artesanal', desc: 'Lotes pequeños, tostado medio para resaltar notas naturales.' },
        { icon: '🚚', title: 'Envío Gratis', desc: 'Pedidos mayores a Gs. 150.000 en Asunción.' }
      ],
      profileExperience: {
        highlights: ['Premio Mejor Café 2025', '5★ en Google', 'Más de 500 clientes felices'],
        mediaGallery: [],
        testimonials: [
          { name: 'María L.', text: 'El mejor café que he probado. El aroma es increíble.', rating: 5 },
          { name: 'Carlos G.', text: 'Compro seguido, el envío es súper rápido.', rating: 5 }
        ]
      }
    },
    links: [
      { title: '📱 Pedí por WhatsApp', payload: { url: 'https://wa.me/595981111001?text=Hola%20Café%20Aroma' }, order: 0 },
      { title: '📸 Instagram', payload: { url: 'https://instagram.com/cafearoma' }, order: 1 },
      { title: '📍 Ubicación', payload: { url: 'https://maps.google.com/?q=-25.282,-57.635' }, order: 2 },
      { title: '📖 Nuestra Historia', payload: { url: 'https://cafearoma.com/historia' }, order: 3 },
      { title: '🛒 Tienda Online', payload: { url: 'https://cafearoma.com/tienda' }, order: 4 }
    ],
    classifieds: [
      { category: 'Hogar', title: 'Café Arábica Premium 250g', price: 45000, currency: 'PYG', description: 'Café de especialidad tostado artesanalmente. Notas a chocolate amargo y frutos rojos.', tags: ['café', 'arábica', 'premium', 'origen'], location: 'Asunción', country: 'Paraguay', department: 'Central', city: 'Asunción' },
      { category: 'Servicios', title: 'Taller de Barismo Básico', price: 120000, currency: 'PYG', description: 'Aprendé a preparar espresso, cappuccino y latte art. Incluye materiales.', tags: ['taller', 'barismo', 'café'], location: 'Asunción', country: 'Paraguay', department: 'Central', city: 'Asunción' }
    ],
    shortLinks: [
      { slug: 'wsp-cafe', url: 'https://wa.me/595981111001?text=Hola%20Café%20Aroma' },
      { slug: 'menu-cafe', url: 'https://cafearoma.com/menu' }
    ]
  },
  {
    email: 'tech@demo.com',
    name: 'TechFix Pro',
    subdomain: 'techfix',
    theme: 'clean',
    avatar: '🔧',
    handle: 'techfixpro',
    bio: '🔧 Reparación de laptops, PCs y celulares. Servicio técnico rápido y garantizado. 🚀',
    miniSite: {
      published: true,
      showClassifieds: true,
      businessName: 'TechFix Pro',
      headline: 'Tu tecnología en buenas manos',
      description: 'Más de 10 años de experiencia en reparación de equipos informáticos. Trabajamos con todas las marcas y ofrecemos garantía escrita en cada reparación.',
      whatsapp: '595981222002',
      email: 'soporte@techfixpro.com',
      address: 'Calle Estrella 456, Centro',
      primaryCtaLabel: 'Ver árbol de enlaces',
      primaryCtaUrl: 'profile.html?tenant=techfix',
      services: ['Reparación Rápida — Diagnóstico en 30 min', 'Garantía Escrita — 90 días en todas las reparaciones', 'Todas las Marcas — HP, Dell, Apple, Samsung y más'],
      schedule: [
        { day: 'Lun-Vie', hours: '08:00 - 19:00' },
        { day: 'Sáb', hours: '09:00 - 14:00' },
        { day: 'Dom', hours: 'Cerrado' }
      ],
      social: {
        instagram: '@techfixpro',
        facebook: 'techfixpro'
      },
      features: [
        { icon: '⚡', title: 'Reparación Rápida', desc: 'Diagnóstico en 30 min. La mayoría de reparaciones en 24 hs.' },
        { icon: '🛡️', title: 'Garantía Escrita', desc: 'Todas nuestras reparaciones tienen garantía de 90 días.' },
        { icon: '💻', title: 'Todas las Marcas', desc: 'HP, Dell, Lenovo, Apple, Samsung y más.' }
      ],
      profileExperience: {
        highlights: ['10+ años de experiencia', '5000+ equipos reparados', 'Garantía 90 días'],
        mediaGallery: [],
        testimonials: [
          { name: 'Pedro R.', text: 'Me salvaron la laptop con los archivos intactos. Muy recomendados.', rating: 5 },
          { name: 'Ana S.', text: 'Rápidos y profesionales. Precio justo.', rating: 5 }
        ]
      }
    },
    links: [
      { title: '💬 Consultá por WhatsApp', payload: { url: 'https://wa.me/595981222002?text=Hola%20TechFix' }, order: 0 },
      { title: '📞 Llamanos', payload: { url: 'tel:+595981222002' }, order: 1 },
      { title: '📍 Taller', payload: { url: 'https://maps.google.com/?q=-25.280,-57.640' }, order: 2 },
      { title: '📋 Presupuesto Online', payload: { url: 'https://techfixpro.com/presupuesto' }, order: 3 },
      { title: '⭐ Reseñas', payload: { url: 'https://google.com/search?q=TechFix+Pro' }, order: 4 },
      { title: '🎮 Reparación Consolas', payload: { url: 'https://techfixpro.com/consolas' }, order: 5 }
    ],
    classifieds: [
      { category: 'Tecnología', title: 'Reparación de Laptop', price: 80000, currency: 'PYG', description: 'Diagnóstico y reparación de laptops. Cambio de pantalla, teclado, batería y más.', tags: ['laptop', 'reparación', 'tecnología'], location: 'Asunción', country: 'Paraguay', department: 'Central', city: 'Asunción' },
      { category: 'Tecnología', title: 'Mantenimiento PC', price: 50000, currency: 'PYG', description: 'Limpieza interna, cambio de pasta térmica, optimización de sistema.', tags: ['pc', 'mantenimiento', 'limpieza'], location: 'Asunción', country: 'Paraguay', department: 'Central', city: 'Asunción' },
      { category: 'Hogar', title: 'Cargador Lenovo Original', price: 95000, currency: 'PYG', description: 'Cargador original Lenovo 65W. Compatible con la mayoría de modelos.', tags: ['cargador', 'lenovo', 'original'], location: 'Asunción', country: 'Paraguay', department: 'Central', city: 'Asunción' }
    ],
    shortLinks: [
      { slug: 'wsp-tech', url: 'https://wa.me/595981222002?text=Hola%20TechFix' },
      { slug: 'precio-tech', url: 'https://techfixpro.com/precios' },
      { slug: 'repo', url: 'https://techfixpro.com/reparaciones' }
    ]
  },
  {
    email: 'luna@demo.com',
    name: 'Luna Arte',
    subdomain: 'luna-arte',
    theme: 'vibrant',
    avatar: '🎨',
    handle: 'lunaarte',
    bio: '🎨 Ilustraciones, murales y arte digital. Transformo tus ideas en colores. ✨',
    miniSite: {
      published: true,
      showClassifieds: true,
      businessName: 'Luna Arte',
      headline: 'Donde tus ideas cobran color',
      description: 'Soy ilustradora y muralista con 5 años de experiencia. Trabajo con técnicas mixtas, arte digital y murales de gran formato. Cada proyecto es una historia única que merece ser contada con colores.',
      whatsapp: '595981333003',
      email: 'hola@lunaarte.com',
      address: 'ArteCo Espacio, San Lorenzo',
      primaryCtaLabel: 'Ver árbol de enlaces',
      primaryCtaUrl: 'profile.html?tenant=luna-arte',
      services: ['Ilustración Digital — Personajes, retratos y arte conceptual', 'Murales — Pintura interior y exterior', 'Arte Personalizado — Creaciones únicas para tu marca'],
      schedule: [
        { day: 'Lun-Vie', hours: '09:00 - 18:00' },
        { day: 'Sáb', hours: '10:00 - 13:00' }
      ],
      social: {
        instagram: '@lunaarte.py',
        facebook: 'lunaartepy',
        tiktok: '@lunaarte'
      },
      features: [
        { icon: '🖌️', title: 'Ilustración Digital', desc: 'Personajes, retratos y arte conceptual en alta resolución.' },
        { icon: '🧱', title: 'Murales', desc: 'Pintura mural interior y exterior. Presupuesto sin cargo.' },
        { icon: '🎭', title: 'Arte Personalizado', desc: 'Creaciones únicas para tu marca, hogar o evento especial.' }
      ],
      profileExperience: {
        highlights: ['+50 murales realizados', 'Exposición Galería 2024', 'Arte digital y tradicional'],
        mediaGallery: [],
        testimonials: [
          { name: 'Sofía M.', text: 'El mural que hizo en mi local es espectacular. Todos los clientes lo felicitan.', rating: 5 },
          { name: 'Diego P.', text: 'Ilustró mi libro infantil con un talento increíble. Muy recomendada.', rating: 5 }
        ]
      }
    },
    links: [
      { title: '🎨 Portfolio Online', payload: { url: 'https://lunaarte.com/portfolio' }, order: 0 },
      { title: '📱 Pedí tu ilustración', payload: { url: 'https://wa.me/595981333003?text=Hola%20Luna%20Arte' }, order: 1 },
      { title: '📸 Instagram', payload: { url: 'https://instagram.com/lunaarte.py' }, order: 2 },
      { title: '🐉 TikTok', payload: { url: 'https://tiktok.com/@lunaarte' }, order: 3 },
      { title: '📧 Contacto', payload: { url: 'mailto:hola@lunaarte.com' }, order: 4 },
      { title: '🖼️ Tienda de Prints', payload: { url: 'https://lunaarte.com/tienda' }, order: 5 }
    ],
    classifieds: [
      { category: 'Servicios', title: 'Ilustración Digital Personalizada', price: 150000, currency: 'PYG', description: 'Ilustración digital en alta resolución. Personajes, retratos o arte conceptual.', tags: ['ilustración', 'digital', 'arte'], location: 'San Lorenzo', country: 'Paraguay', department: 'Central', city: 'San Lorenzo' },
      { category: 'Servicios', title: 'Mural Decorativo (1m²)', price: 250000, currency: 'PYG', description: 'Pintura mural decorativa para interior. Incluye diseño personalizado.', tags: ['mural', 'decoración', 'pintura'], location: 'San Lorenzo', country: 'Paraguay', department: 'Central', city: 'San Lorenzo' },
      { category: 'Hogar', title: 'Print Fine Art A3', price: 65000, currency: 'PYG', description: 'Impresión fine art en papel de algodón 100%. Edición limitada y firmada.', tags: ['print', 'fine-art', 'edición-limitada'], location: 'San Lorenzo', country: 'Paraguay', department: 'Central', city: 'San Lorenzo' }
    ],
    shortLinks: [
      { slug: 'portafolio', url: 'https://lunaarte.com/portfolio' },
      { slug: 'wsp-luna', url: 'https://wa.me/595981333003?text=Hola%20Luna%20Arte' },
      { slug: 'prints', url: 'https://lunaarte.com/tienda' }
    ]
  }
];

async function seed() {
  console.log('🌱 Sembrando 3 usuarios demo...\n');

  for (const data of USERS) {
    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      console.log(`⚠️  ${data.email} ya existe. Eliminando para recrear...`);
      await prisma.domainMapping.deleteMany({ where: { hostname: data.subdomain } });
      await prisma.workspace.deleteMany({ where: { ownerId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    const existingDomain = await prisma.domainMapping.findUnique({ where: { hostname: data.subdomain } });
    if (existingDomain) {
      console.log(`⚠️  El subdominio "${data.subdomain}" ya existe. Eliminando...`);
      await prisma.workspace.delete({ where: { id: existingDomain.workspaceId } });
    }

    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: 'USER'
      }
    });

    const workspace = await prisma.workspace.create({
      data: {
        ownerId: user.id,
        name: data.name,
        handle: data.handle,
        bio: data.bio,
        avatar: data.avatar,
        theme: data.theme,
        miniSite: JSON.stringify(data.miniSite),
        domainMappings: {
          create: {
            hostname: data.subdomain,
            type: 'platform_subdomain',
            canonical: true
          }
        }
      }
    });

    // Crear bloques (links)
    for (const link of data.links) {
      await prisma.treeBlock.create({
        data: {
          workspaceId: workspace.id,
          type: 'link',
          title: link.title,
          payload: JSON.stringify(link.payload),
          order: link.order,
          isActive: true
        }
      });
    }

    // Crear clasificados
    for (let i = 0; i < data.classifieds.length; i++) {
      const cl = data.classifieds[i];
      await prisma.treeBlock.create({
        data: {
          workspaceId: workspace.id,
          type: 'classified',
          title: cl.title,
          payload: JSON.stringify({ price: cl.price, currency: cl.currency, location: cl.location }),
          order: 20 + i,
          isActive: true,
          classified: {
            create: {
              category: cl.category,
              price: cl.price,
              currency: cl.currency,
              location: cl.location,
              description: cl.description,
              tags: JSON.stringify(cl.tags),
              isFeatured: i === 0
            }
          }
        }
      });
    }

    // Crear short links
    for (const sl of data.shortLinks) {
      await prisma.shortLink.create({
        data: {
          workspaceId: workspace.id,
          slug: sl.slug,
          url: sl.url,
          isActive: true
        }
      });
    }

    console.log(`✅ ${data.name}`);
    console.log(`   📧 ${data.email} / clave: ${PASSWORD}`);
    console.log(`   🎨 Tema: ${data.theme}`);
    console.log(`   🔗 Subdominio: ${data.subdomain}`);
    console.log(`   📝 Links: ${data.links.length}`);
    console.log(`   📋 Clasificados: ${data.classifieds.length}`);
    console.log(`   🔗 Short Links: ${data.shortLinks.length}`);
    console.log('');
  }

  console.log('🎉 ¡3 usuarios creados exitosamente!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Credenciales comunes:');
  console.log('   Clave: Demo123456!');
  console.log('');
  console.log('👤 Café Aroma   → cafe@demo.com');
  console.log('👤 TechFix Pro  → tech@demo.com');
  console.log('👤 Luna Arte    → luna@demo.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
