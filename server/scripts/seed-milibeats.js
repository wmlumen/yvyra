/**
 * Seed: milibeats
 * Crea el usuario milibeats con perfil básico.
 * 
 * Uso: DATABASE_URL="postgresql://..." node scripts/seed-milibeats.js
 */
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

const PASSWORD = 'Demo123456!';

async function seed() {
  const SUBDOMAIN = 'milibeats';
  const EMAIL = 'mili@demo.com';
  const NAME = 'Mili Beats';
  const HANDLE = 'milibeats';

  // Limpiar si ya existe
  const existingUser = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existingUser) {
    console.log(`⚠️  ${EMAIL} ya existe. Eliminando para recrear...`);
    await prisma.domainMapping.deleteMany({ where: { hostname: SUBDOMAIN } });
    await prisma.workspace.deleteMany({ where: { ownerId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const existingDomain = await prisma.domainMapping.findUnique({ where: { hostname: SUBDOMAIN } });
  if (existingDomain) {
    console.log(`⚠️  Subdominio "${SUBDOMAIN}" ya existe. Eliminando...`);
    await prisma.workspace.delete({ where: { id: existingDomain.workspaceId } });
  }

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: NAME,
      password: hashedPassword,
      role: 'USER'
    }
  });

  const miniSite = {
    published: true,
    showClassifieds: true,
    businessName: 'Mili Beats',
    headline: 'Beats y producción musical',
    description: 'Productor musical especializado en beats urbanos, reggaeton y trap latino. Grabación, mezcla y mastering.',
    whatsapp: '595981000000',
    email: 'mili@milibeats.com',
    address: 'Asunción, Paraguay',
    primaryCtaLabel: 'Escuchar beats',
    primaryCtaUrl: 'profile.html?tenant=milibeats',
    services: ['Beats exclusivos — Instrumentales originales', 'Mezcla y Mastering — Calidad profesional', 'Colaboraciones — Artistas y productores']
  };

  const workspace = await prisma.workspace.create({
    data: {
      ownerId: user.id,
      name: NAME,
      handle: HANDLE,
      bio: '🎵 Productor musical. Beats urbanos, reggaeton y trap. Grabación, mezcla y mastering. 📀',
      avatar: '🎵',
      theme: 'dark',
      miniSite: JSON.stringify(miniSite),
      domainMappings: {
        create: {
          hostname: SUBDOMAIN,
          type: 'platform_subdomain',
          canonical: true
        }
      }
    }
  });

  const links = [
    { title: '🎵 Escuchá mis beats', payload: { url: 'https://soundcloud.com/milibeats' }, order: 0 },
    { title: '📀 YouTube', payload: { url: 'https://youtube.com/@milibeats' }, order: 1 },
    { title: '📸 Instagram', payload: { url: 'https://instagram.com/milibeats' }, order: 2 },
    { title: '🎧 Spotify', payload: { url: 'https://open.spotify.com/artist/milibeats' }, order: 3 },
    { title: '📱 Contratar beat', payload: { url: 'https://wa.me/595981000000?text=Hola%20Mili%20Beats' }, order: 4 }
  ];

  for (const link of links) {
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

  const classifieds = [
    { category: 'Servicios', title: 'Beat Exclusivo con Licencia', price: 200000, currency: 'PYG', description: 'Beat original con licencia de uso comercial. Incluye pista estéreo, stems y contrato de licencia.', tags: ['beat', 'instrumental', 'licencia'], location: 'Remoto' },
    { category: 'Servicios', title: 'Pack de 5 Beats', price: 750000, currency: 'PYG', description: '5 beats originales con licencia básica. Ideal para artistas que buscan variedad.', tags: ['pack', 'beats', 'descuento'], location: 'Remoto' }
  ];

  for (let i = 0; i < classifieds.length; i++) {
    const cl = classifieds[i];
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

  console.log('\n✅ Mili Beats creado exitosamente!');
  console.log('   📧 mili@demo.com / clave: ' + PASSWORD);
  console.log('   🔗 Subdominio: milibeats');
  console.log('   📝 Links: ' + links.length);
  console.log('   📋 Clasificados: ' + classifieds.length);
  console.log('\n🌐 https://enlacehub-app-production.up.railway.app/profile.html?tenant=milibeats');
  console.log('🌐 https://enlacehub-app-production.up.railway.app/miniweb.html?tenant=milibeats');
}

seed()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
