/**
 * Script de semilla completa: crea un usuario con el 100% de los datos
 * poblados: perfil, subdominio, enlaces, clasificados, miniweb,
 * enlaces cortos, eventos de analítica y log de auditoría.
 *
 * Uso: node scripts/seed-completo.js
 *       node scripts/seed-completo.js <email> <password> <nombre> <subdominio>
 */

const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  const email = process.argv[2] || 'demo@enlacehub.com';
  const password = process.argv[3] || 'Demo123!';
  const businessName = process.argv[4] || 'Empresa Demo';
  const subdomain = process.argv[5] || 'demo';

  // Verificar si ya existe
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`⚠️  El usuario ${email} ya existe. Saltando...`);
    process.exit(0);
  }

  const existingDomain = await prisma.domainMapping.findUnique({ where: { hostname: subdomain } });
  if (existingDomain) {
    console.log(`⚠️  El subdominio "${subdomain}" ya está ocupado.`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date();

  console.log(`\n🚀 Creando usuario completo: ${businessName} (${email})`);
  console.log(`   Subdominio: ${subdomain}`);
  console.log(`   Contraseña: ${password}\n`);

  // ============================================================
  // 1. CREAR USUARIO + WORKSPACE + DOMINIO + BLOQUES + MINISITE
  // ============================================================
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: businessName,
      role: 'USER',
      workspaces: {
        create: {
          name: businessName,
          handle: `@${subdomain}`,
          bio: 'Transformamos ideas en experiencias digitales. Conectamos personas, servicios y oportunidades en un solo lugar.',
          avatar: '🚀',
          theme: 'dark',

          // Configuración completa de miniweb
          miniSite: JSON.stringify({
            published: true,
            businessName: businessName,
            headline: 'Soluciones digitales para personas y negocios',
            description: 'Ofrecemos servicios de consultoría digital, desarrollo web y marketing para ayudar a tu negocio a crecer en el mundo online.',
            services: [
              'Consultoría digital estratégica',
              'Desarrollo de páginas web',
              'Marketing en redes sociales',
              'Optimización SEO y analítica'
            ],
            whatsapp: '541112345678',
            email: email,
            address: 'Atención remota — Todo el país',
            primaryCtaLabel: 'Agenda una consultoría gratuita',
            primaryCtaUrl: 'https://calendly.com/demo/consulta',
            showClassifieds: true
          }),

          domainMappings: {
            create: {
              hostname: subdomain,
              type: 'platform_subdomain',
              canonical: true
            }
          },

          // ================================================
          // 2. BLOQUES: enlaces + clasificados
          // ================================================
          blocks: {
            create: [
              // Enlaces principales
              {
                type: 'link',
                title: '🌐 Sitio web oficial',
                payload: JSON.stringify({ url: 'https://ejemplo.com', startAt: '', endAt: '' }),
                order: 0,
                isActive: true
              },
              {
                type: 'link',
                title: '📞 Contáctanos por WhatsApp',
                payload: JSON.stringify({ url: 'https://wa.me/541112345678', startAt: '', endAt: '' }),
                order: 1,
                isActive: true
              },
              {
                type: 'link',
                title: '📸 Síguenos en Instagram',
                payload: JSON.stringify({ url: 'https://instagram.com/ejemplo', startAt: '', endAt: '' }),
                order: 2,
                isActive: true
              },
              {
                type: 'link',
                title: '💼 Portafolio de proyectos',
                payload: JSON.stringify({ url: 'https://ejemplo.com/portafolio', startAt: '', endAt: '' }),
                order: 3,
                isActive: true
              },
              {
                type: 'link',
                title: '📄 Último artículo del blog',
                payload: JSON.stringify({ url: 'https://ejemplo.com/blog', startAt: '', endAt: '' }),
                order: 4,
                isActive: true
              },
              {
                type: 'link',
                title: '🎯 Servicio destacado — 50% OFF',
                payload: JSON.stringify({ url: 'https://ejemplo.com/oferta', startAt: '2026-06-01T00:00:00Z', endAt: '2026-07-31T23:59:59Z' }),
                order: 5,
                isActive: true
              },
              {
                type: 'link',
                title: '⏳ Próximamente: nuevo curso',
                payload: JSON.stringify({ url: 'https://ejemplo.com/proximamente', startAt: '2026-07-01T00:00:00Z', endAt: '' }),
                order: 6,
                isActive: true
              },
              // Clasificados
              {
                type: 'classified',
                title: 'Consultoría digital integral',
                payload: JSON.stringify({}),
                order: 7,
                isActive: true,
                classified: {
                  create: {
                    category: 'Servicios',
                    price: 299.99,
                    currency: 'USD',
                    location: 'Remoto / Todo el país',
                    description: 'Diagnóstico completo de tu presencia digital + plan de acción personalizado + 2 meses de seguimiento. Incluye auditoría SEO, redes sociales y sitio web.',
                    tags: JSON.stringify(['Consultoría', 'Digital', 'SEO', 'Marketing']),
                    isFeatured: true,
                    expiresAt: new Date('2027-06-21')
                  }
                }
              },
              {
                type: 'classified',
                title: 'Desarrollo de página web profesional',
                payload: JSON.stringify({}),
                order: 8,
                isActive: true,
                classified: {
                  create: {
                    category: 'Servicios',
                    price: 499.99,
                    currency: 'USD',
                    location: 'Remoto',
                    description: 'Diseño y desarrollo de sitio web responsive con panel de administración, optimización SEO y formulario de contacto. Incluye hosting por 3 meses.',
                    tags: JSON.stringify(['Desarrollo Web', 'Diseño', 'HTML', 'CSS', 'JavaScript']),
                    isFeatured: true,
                    expiresAt: new Date('2027-06-21')
                  }
                }
              },
              {
                type: 'classified',
                title: 'Laptop Profesional reacondicionada',
                payload: JSON.stringify({}),
                order: 9,
                isActive: true,
                classified: {
                  create: {
                    category: 'Tecnología',
                    price: 580.00,
                    currency: 'USD',
                    location: 'Envío a todo el país',
                    description: 'Laptop Dell Latitude 5490, i7 8va gen, 16GB RAM, 512GB SSD, pantalla 14". Incluye cargador, garantía de 6 meses y sistema operativo instalado.',
                    tags: JSON.stringify(['Laptop', 'Dell', 'i7', 'SSD', 'Reacondicionado']),
                    isFeatured: false,
                    expiresAt: new Date('2026-09-21')
                  }
                }
              },
              {
                type: 'classified',
                title: 'Curso online: Marketing Digital para Principiantes',
                payload: JSON.stringify({}),
                order: 10,
                isActive: true,
                classified: {
                  create: {
                    category: 'Servicios',
                    price: 47.00,
                    currency: 'USD',
                    location: 'Online — Acceso inmediato',
                    description: 'Aprende los fundamentos del marketing digital: SEO, redes sociales, email marketing y Google Ads. 8 módulos con videos, guías y certificado al finalizar.',
                    tags: JSON.stringify(['Curso', 'Marketing', 'Online', 'SEO', 'Google Ads']),
                    isFeatured: false,
                    expiresAt: new Date('2026-12-31')
                  }
                }
              },
              {
                type: 'classified',
                title: 'Espacio de coworking mensual',
                payload: JSON.stringify({}),
                order: 11,
                isActive: true,
                classified: {
                  create: {
                    category: 'Hogar',
                    price: 150.00,
                    currency: 'USD',
                    location: 'Ciudad Central, Zona Norte',
                    description: 'Espacio de trabajo compartido con wifi de alta velocidad, café ilimitado, sala de reuniones y eventos de networking incluidos. Promoción primer mes.',
                    tags: JSON.stringify(['Coworking', 'Oficina', 'Espacio', 'Trabajo']),
                    isFeatured: false,
                    expiresAt: new Date('2026-08-15')
                  }
                }
              }
            ]
          }
        }
      }
    },
    include: {
      workspaces: {
        include: {
          blocks: { include: { classified: true } }
        }
      }
    }
  });

  const workspace = user.workspaces[0];
  const blocks = workspace.blocks;

  console.log(`✅ Usuario, workspace, subdominio y ${blocks.length} bloques creados.`);

  // ================================================
  // 3. ENLACES CORTOS
  // ================================================
  const shortLinks = [
    { slug: 'contacto', url: 'https://ejemplo.com/contacto' },
    { slug: 'portafolio', url: 'https://ejemplo.com/proyectos' },
    { slug: 'whatsapp-directo', url: 'https://wa.me/541112345678' },
    { slug: 'oferta-junio', url: 'https://ejemplo.com/oferta-junio' },
    { slug: 'linkedin-perfil', url: 'https://linkedin.com/in/ejemplo' }
  ];

  for (const link of shortLinks) {
    await prisma.shortLink.create({
      data: {
        workspaceId: workspace.id,
        slug: link.slug,
        url: link.url,
        isActive: true,
        clickCount: Math.floor(Math.random() * 50)
      }
    });
  }

  console.log(`✅ ${shortLinks.length} enlaces cortos creados.`);

  // ================================================
  // 4. EVENTOS DE ANALÍTICA (30 días de datos)
  // ================================================
  const eventTypes = ['page_view', 'link_click', 'short_click', 'whatsapp_share', 'contact'];
  const sources = ['direct', 'whatsapp', 'instagram', 'facebook', 'google', 'email'];
  const campaigns = ['general', 'whatsapp-verano', 'instagram-campaña', 'email-junio', 'facebook-ads'];

  const analyticsEvents = [];
  for (let day = 0; day < 30; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Entre 5 y 20 eventos por día
    const eventsPerDay = 5 + Math.floor(Math.random() * 16);
    for (let e = 0; e < eventsPerDay; e++) {
      const eventDate = new Date(date);
      eventDate.setHours(Math.floor(Math.random() * 24));
      eventDate.setMinutes(Math.floor(Math.random() * 60));
      eventDate.setSeconds(Math.floor(Math.random() * 60));

      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];

      let targetId = null;
      if (eventType === 'link_click' || eventType === 'short_click') {
        const randomBlock = blocks[Math.floor(Math.random() * blocks.length)];
        targetId = randomBlock.id;
      }

      analyticsEvents.push({
        workspaceId: workspace.id,
        type: eventType,
        targetId,
        visitorId: `visitor_${Math.random().toString(36).slice(2, 8)}`,
        source,
        medium: source === 'whatsapp' ? 'messaging' : 'referral',
        campaign,
        metadata: null,
        createdAt: eventDate
      });
    }
  }

  // Insertar en lotes
  for (let i = 0; i < analyticsEvents.length; i += 50) {
    const batch = analyticsEvents.slice(i, i + 50);
    await prisma.analyticsEvent.createMany({ data: batch });
  }

  console.log(`✅ ${analyticsEvents.length} eventos de analítica creados (30 días).`);

  // ================================================
  // 5. LOG DE AUDITORÍA
  // ================================================
  const auditActions = [
    { action: 'create', entity: 'workspace', details: 'Workspace creado durante el registro' },
    { action: 'create', entity: 'block', details: 'Bloques iniciales creados' },
    { action: 'create', entity: 'domain', details: `Subdominio ${subdomain} asignado` },
    { action: 'update', entity: 'profile', details: 'Perfil personalizado con bio y avatar' },
    { action: 'create', entity: 'shortlink', details: '5 enlaces cortos creados' },
    { action: 'update', entity: 'minisite', details: 'Miniweb configurada y publicada' },
    { action: 'create', entity: 'classified', details: '5 clasificados publicados' }
  ];

  for (const audit of auditActions) {
    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: audit.action,
        entity: audit.entity,
        details: audit.details
      }
    });
  }

  console.log(`✅ ${auditActions.length} registros de auditoría creados.`);

  // ================================================
  // 6. MOSTRAR RESUMEN
  // ================================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 USUARIO COMPLETO CREADO CON ÉXITO');
  console.log('='.repeat(60));
  console.log(`
📧 Email:       ${email}
🔑 Contraseña:  ${password}
🏢 Empresa:     ${businessName}
🌐 Subdominio:  ${subdomain}
🔗 Perfil:      http://localhost:3000/api/workspace/public (por subdominio)

📊 Contenido:
   • ${blocks.length} bloques (enlaces + clasificados)
   • ${shortLinks.length} enlaces cortos
   • ${analyticsEvents.length} eventos de analítica
   • ${auditActions.length} registros de auditoría
   • Miniweb publicada con servicios y contacto
   • Tema oscuro con avatar personalizado

🔗 Panel:        http://localhost:8080/dashboard.html
🔗 Árbol:        http://localhost:8080/profile.html
🔗 Clasificados: http://localhost:8080/clasificados.html
🔗 Miniweb:      http://localhost:8080/miniweb.html
`);
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
