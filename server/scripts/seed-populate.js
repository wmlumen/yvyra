/**
 * Script para poblar al 100% un workspace EXISTENTE.
 * No borra nada existente, solo agrega datos faltantes:
 * perfil, enlaces extra, clasificados, shortlinks, analítica, auditoría, miniweb.
 *
 * Uso: node scripts/seed-populate.js <email>
 * Ej:  node scripts/seed-populate.js wmlumen@gmail.com
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) { console.error('Uso: node scripts/seed-populate.js <email>'); process.exit(1); }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspaces: { include: { blocks: true, domainMappings: true } } }
  });
  if (!user) { console.error(`Usuario ${email} no encontrado.`); process.exit(1); }

  const ws = user.workspaces[0];
  if (!ws) { console.error(`El usuario ${email} no tiene workspace.`); process.exit(1); }

  const subdomain = ws.domainMappings[0]?.hostname || 'usuario';
  console.log(`\n🚀 Poblando datos para: ${user.name} (${email}) — subdominio: ${subdomain}\n`);

  const now = new Date();

  // ============================================
  // 1. ACTUALIZAR PERFIL (si está incompleto)
  // ============================================
  const updates = {};
  if (!ws.handle) updates.handle = `@${subdomain}`;
  if (!ws.bio) updates.bio = 'Transformamos ideas en experiencias digitales. Conectamos personas, servicios y oportunidades en un solo lugar.';
  if (!ws.avatar) updates.avatar = '✨';
  if (!ws.theme || ws.theme === 'clean') updates.theme = 'dark';
  if (!ws.miniSite || ws.miniSite === '{}') {
    updates.miniSite = JSON.stringify({
      published: true,
      businessName: user.name,
      headline: 'Bienvenido a mi espacio digital',
      description: 'Descubre mis servicios, enlaces y clasificados. Todo en un solo lugar.',
      services: ['Consultoría digital', 'Desarrollo web', 'Marketing online'],
      whatsapp: '541112345678',
      email: email,
      address: 'Disponible en línea',
      primaryCtaLabel: 'Contáctame',
      primaryCtaUrl: 'https://wa.me/541112345678',
      showClassifieds: true
    });
  }

  if (Object.keys(updates).length > 0) {
    await prisma.workspace.update({ where: { id: ws.id }, data: updates });
    console.log('✅ Perfil actualizado (handle, bio, avatar, tema, miniweb)');
  } else {
    console.log('⏭️  Perfil ya completo, saltando');
  }

  // ============================================
  // 2. AGREGAR BLOQUES FALTANTES
  // ============================================
  const existingTitles = new Set(ws.blocks.map(b => b.title));
  const blocksToAdd = [];

  const linkTemplates = [
    { title: '🌐 Sitio web oficial', url: 'https://ejemplo.com' },
    { title: '📞 Contáctame por WhatsApp', url: 'https://wa.me/541112345678' },
    { title: '📸 Sígueme en Instagram', url: 'https://instagram.com/tuusuario' },
    { title: '💼 Portafolio de proyectos', url: 'https://ejemplo.com/portafolio' },
    { title: '📄 Último artículo del blog', url: 'https://ejemplo.com/blog' }
  ];

  let order = ws.blocks.length;
  for (const tpl of linkTemplates) {
    if (!existingTitles.has(tpl.title)) {
      blocksToAdd.push({
        workspaceId: ws.id,
        type: 'link',
        title: tpl.title,
        payload: JSON.stringify({ url: tpl.url }),
        order: order++,
        isActive: true
      });
    }
  }

  // Clasificados (solo si no hay ninguno aún)
  const hasClassifieds = ws.blocks.some(b => b.type === 'classified');
  if (!hasClassifieds) {
    const classifieds = [
      { title: '🌟 Servicio Premium', category: 'Servicios', price: 299.99, currency: 'USD', location: 'Online', description: 'Paquete completo de servicios digitales con asesoría personalizada y seguimiento mensual.', tags: ['Premium', 'Digital', 'Asesoría'], featured: true },
      { title: '📦 Producto Destacado', category: 'Productos', price: 149.99, currency: 'USD', location: 'Envío a todo el país', description: 'Producto digital de alta calidad con soporte incluido y actualizaciones gratuitas por 6 meses.', tags: ['Producto', 'Digital', 'Destacado'], featured: false }
    ];
    for (const c of classifieds) {
      blocksToAdd.push({
        workspaceId: ws.id,
        type: 'classified',
        title: c.title,
        payload: JSON.stringify({}),
        order: order++,
        isActive: true,
        classified: {
          create: {
            category: c.category,
            price: c.price,
            currency: c.currency,
            location: c.location,
            description: c.description,
            tags: JSON.stringify(c.tags),
            isFeatured: c.featured,
            expiresAt: new Date('2027-06-21')
          }
        }
      });
    }
  }

  if (blocksToAdd.length > 0) {
    for (const b of blocksToAdd) {
      await prisma.treeBlock.create({ data: b });
    }
    console.log(`✅ ${blocksToAdd.length} bloques nuevos agregados (${blocksToAdd.filter(b => b.type === 'link').length} enlaces, ${blocksToAdd.filter(b => b.type === 'classified').length} clasificados)`);
  } else {
    console.log('⏭️  No se necesitan bloques nuevos');
  }

  // Recargar bloques actualizados
  const allBlocks = await prisma.treeBlock.findMany({ where: { workspaceId: ws.id } });
  const blockCount = allBlocks.length;

  // ============================================
  // 3. ENLACES CORTOS
  // ============================================
  const existingShortLinks = await prisma.shortLink.count({ where: { workspaceId: ws.id } });
  if (existingShortLinks === 0) {
    const shortLinks = [
      { slug: `contacto-${subdomain}`, url: 'https://ejemplo.com/contacto' },
      { slug: `portafolio-${subdomain}`, url: 'https://ejemplo.com/proyectos' },
      { slug: `whatsapp-${subdomain}`, url: 'https://wa.me/541112345678' }
    ];
    for (const link of shortLinks) {
      try {
        await prisma.shortLink.create({
          data: { workspaceId: ws.id, slug: link.slug, url: link.url, isActive: true, clickCount: Math.floor(Math.random() * 30) }
        });
      } catch (e) {
        // si el slug ya existe, ignorar
      }
    }
    console.log(`✅ ${shortLinks.length} enlaces cortos creados`);
  } else {
    console.log(`⏭️  ${existingShortLinks} enlaces cortos ya existen`);
  }

  // ============================================
  // 4. EVENTOS DE ANALÍTICA (30 días)
  // ============================================
  const existingEvents = await prisma.analyticsEvent.count({ where: { workspaceId: ws.id } });
  if (existingEvents === 0) {
    const eventTypes = ['page_view', 'link_click', 'short_click', 'whatsapp_share', 'contact'];
    const sources = ['direct', 'whatsapp', 'instagram', 'facebook', 'google'];
    const events = [];
    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      const perDay = 3 + Math.floor(Math.random() * 10);
      for (let e = 0; e < perDay; e++) {
        const d = new Date(date);
        d.setHours(Math.floor(Math.random() * 24));
        d.setMinutes(Math.floor(Math.random() * 60));
        events.push({
          workspaceId: ws.id,
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          targetId: allBlocks.length > 0 ? allBlocks[Math.floor(Math.random() * allBlocks.length)].id : null,
          visitorId: `visitor_${Math.random().toString(36).slice(2, 8)}`,
          source: sources[Math.floor(Math.random() * sources.length)],
          medium: 'referral',
          campaign: 'general',
          createdAt: d
        });
      }
    }
    for (let i = 0; i < events.length; i += 50) {
      await prisma.analyticsEvent.createMany({ data: events.slice(i, i + 50) });
    }
    console.log(`✅ ${events.length} eventos de analítica creados (30 días)`);
  } else {
    console.log(`⏭️  ${existingEvents} eventos ya existen`);
  }

  // ============================================
  // 5. LOG DE AUDITORÍA
  // ============================================
  const existingAudits = await prisma.auditLog.count({ where: { workspaceId: ws.id } });
  if (existingAudits === 0) {
    const actions = [
      { action: 'update', entity: 'profile', details: 'Perfil personalizado completado' },
      { action: 'create', entity: 'block', details: `${blocksToAdd.filter(b => b.type === 'link').length} enlaces agregados` },
      { action: 'create', entity: 'classified', details: `${blocksToAdd.filter(b => b.type === 'classified').length} clasificados publicados` },
      { action: 'create', entity: 'shortlink', details: 'Enlaces cortos generados' },
      { action: 'update', entity: 'minisite', details: 'Miniweb configurada y publicada' }
    ];
    for (const a of actions) {
      await prisma.auditLog.create({
        data: { workspaceId: ws.id, userId: user.id, action: a.action, entity: a.entity, details: a.details }
      });
    }
    console.log(`✅ ${actions.length} registros de auditoría creados`);
  } else {
    console.log(`⏭️  ${existingAudits} auditorías ya existen`);
  }

  // ============================================
  // RESUMEN
  // ============================================
  const finalBlocks = await prisma.treeBlock.count({ where: { workspaceId: ws.id } });
  const finalShortLinks = await prisma.shortLink.count({ where: { workspaceId: ws.id } });
  const finalEvents = await prisma.analyticsEvent.count({ where: { workspaceId: ws.id } });
  const finalAudits = await prisma.auditLog.count({ where: { workspaceId: ws.id } });

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 WORKSPACE POBLADO AL 100%: ${user.name}`);
  console.log('='.repeat(60));
  console.log(`  Bloques:       ${finalBlocks}`);
  console.log(`  Enlaces cortos: ${finalShortLinks}`);
  console.log(`  Analítica:      ${finalEvents} eventos`);
  console.log(`  Auditoría:      ${finalAudits} registros`);
  console.log(`  Subdominio:     ${subdomain}`);
  console.log(`  Dashboard:      http://localhost:8080/dashboard.html`);
  console.log('');
}

main()
  .catch(e => { console.error('\n❌ Error:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
