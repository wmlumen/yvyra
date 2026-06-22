const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

const showcases = [
  {
    email: 'mili.beats@showcase.local',
    name: 'Mili Beats',
    role: 'USER',
    subdomain: 'milibeats',
    handle: '@milibeats',
    bio: 'TikToker de tendencias, bailes y colaboraciones con marcas urbanas.',
    avatar: 'MB',
    theme: 'aurora',
    miniSite: {
      published: true,
      businessName: 'Mili Beats',
      headline: 'Contenido viral, colaboraciones y agenda comercial',
      description: 'Accede a mi kit de medios, campañas disponibles, colaboraciones y contacto directo.',
      services: ['Colaboraciones con marcas', 'TikTok UGC', 'Promociones musicales', 'Cobertura de eventos'],
      whatsapp: '595981111001',
      email: 'mili.beats@showcase.local',
      address: 'Asunción · Disponible para campañas remotas',
      primaryCtaLabel: 'Ver media kit',
      primaryCtaUrl: 'https://example.com/milibeats-mediakit',
      showClassifieds: true,
      profileExperience: {
        intro: 'Soy creadora de contenido enfocada en campañas rápidas, videos nativos y crecimiento en TikTok.',
        socials: {
          instagram: 'https://instagram.com/milibeats',
          facebook: 'https://facebook.com/milibeats',
          tiktok: 'https://tiktok.com/@milibeats',
          youtube: 'https://youtube.com/@milibeats',
          whatsapp: 'https://wa.me/595981111001',
          telegram: 'https://t.me/milibeats'
        },
        sheets: [
          {
            title: 'Campañas',
            body: 'Accede a campañas vigentes, precios para UGC y formatos verticales disponibles.',
            ctaLabel: 'Solicitar campaña',
            ctaUrl: 'https://wa.me/595981111001?text=Hola%20Mili%2C%20quiero%20cotizar%20una%20campa%C3%B1a.'
          },
          {
            title: 'Prensa',
            body: 'Material para prensa, logos y estadísticas principales para marcas y medios.',
            ctaLabel: 'Descargar press kit',
            ctaUrl: 'https://example.com/milibeats-presskit'
          },
          {
            title: 'Agenda',
            body: 'Fechas para shows, streaming y colaboraciones presenciales o remotas.',
            ctaLabel: 'Ver disponibilidad',
            ctaUrl: 'https://example.com/milibeats-agenda'
          }
        ]
      }
    },
    links: [
      ['🎵 Último TikTok viral', 'https://tiktok.com/@milibeats/video/1'],
      ['📸 Instagram oficial', 'https://instagram.com/milibeats'],
      ['💌 Contrataciones', 'https://wa.me/595981111001'],
      ['🎤 Media kit', 'https://example.com/milibeats-mediakit']
    ],
    classifieds: [
      {
        title: '🎬 Pack de 3 videos UGC para marcas',
        category: 'Servicios',
        price: 180,
        currency: 'USD',
        location: 'Remoto',
        description: 'Tres videos verticales optimizados para TikTok Ads, entregados en 72 horas.',
        tags: ['ugc', 'tiktok', 'marca'],
        featured: true
      }
    ]
  },
  {
    email: 'nico.levelup@showcase.local',
    name: 'Nico LevelUp',
    role: 'USER',
    subdomain: 'nicolevelup',
    handle: '@nicolevelup',
    bio: 'TikToker gamer con reseñas, clips y activaciones para tecnología y streaming.',
    avatar: 'NL',
    theme: 'dark',
    miniSite: {
      published: true,
      businessName: 'Nico LevelUp',
      headline: 'Gaming, tecnología y activaciones para marcas',
      description: 'Encuentra mis directos, sponsors activos, reseñas y enlaces para campañas tech.',
      services: ['Streams patrocinados', 'Reseñas de hardware', 'Clips UGC para gaming', 'Cobertura de lanzamientos'],
      whatsapp: '595981111002',
      email: 'nico.levelup@showcase.local',
      address: 'Ciudad del Este · Cobertura LATAM',
      primaryCtaLabel: 'Ver sponsors',
      primaryCtaUrl: 'https://example.com/nicolevelup-sponsors',
      showClassifieds: true,
      profileExperience: {
        intro: 'Combino contenido gamer con demostraciones reales de productos y comunidades activas.',
        socials: {
          instagram: 'https://instagram.com/nicolevelup',
          facebook: '',
          tiktok: 'https://tiktok.com/@nicolevelup',
          youtube: 'https://youtube.com/@nicolevelup',
          whatsapp: 'https://wa.me/595981111002',
          telegram: ''
        },
        sheets: [
          {
            title: 'Sponsors',
            body: 'Marcas tecnológicas con las que trabajo y formatos disponibles para activación.',
            ctaLabel: 'Ver sponsors',
            ctaUrl: 'https://example.com/nicolevelup-sponsors'
          },
          {
            title: 'Setup',
            body: 'Mi setup completo y enlaces a periféricos recomendados para audiencia gamer.',
            ctaLabel: 'Explorar setup',
            ctaUrl: 'https://example.com/nicolevelup-setup'
          },
          {
            title: 'Directos',
            body: 'Agenda de streaming, torneos y colaboraciones de e-sports.',
            ctaLabel: 'Ver agenda',
            ctaUrl: 'https://example.com/nicolevelup-streams'
          }
        ]
      }
    },
    links: [
      ['🎮 Canal de Twitch', 'https://twitch.tv/nicolevelup'],
      ['📱 TikTok gaming', 'https://tiktok.com/@nicolevelup'],
      ['🛒 Setup recomendado', 'https://example.com/nicolevelup-setup'],
      ['📩 Contacto comercial', 'https://wa.me/595981111002']
    ],
    classifieds: [
      {
        title: '🖥️ Review patrocinada de periféricos gaming',
        category: 'Servicios',
        price: 250,
        currency: 'USD',
        location: 'Remoto',
        description: 'Review completa con clip corto, video principal y mención en directo.',
        tags: ['gaming', 'review', 'hardware'],
        featured: true
      }
    ]
  },
  {
    email: 'luna.fitflow@showcase.local',
    name: 'Luna FitFlow',
    role: 'USER',
    subdomain: 'lunafitflow',
    handle: '@lunafitflow',
    bio: 'TikToker fitness con retos de entrenamiento, rutinas y contenido para bienestar.',
    avatar: 'LF',
    theme: 'clean',
    miniSite: {
      published: true,
      businessName: 'Luna FitFlow',
      headline: 'Rutinas, retos fitness y colaboraciones wellness',
      description: 'Descubre programas, recursos gratuitos y campañas activas en salud y bienestar.',
      services: ['Retos fitness', 'Rutinas patrocinadas', 'UGC wellness', 'Asesorías grupales'],
      whatsapp: '595981111003',
      email: 'luna.fitflow@showcase.local',
      address: 'Encarnación · Entrenamiento online',
      primaryCtaLabel: 'Descargar guía fitness',
      primaryCtaUrl: 'https://example.com/lunafitflow-guia',
      showClassifieds: true,
      profileExperience: {
        intro: 'Ayudo a marcas y audiencias a convertir hábitos saludables en contenido fácil de compartir.',
        socials: {
          instagram: 'https://instagram.com/lunafitflow',
          facebook: 'https://facebook.com/lunafitflow',
          tiktok: 'https://tiktok.com/@lunafitflow',
          youtube: '',
          whatsapp: 'https://wa.me/595981111003',
          telegram: ''
        },
        sheets: [
          {
            title: 'Guías',
            body: 'Descarga gratis guías rápidas y recursos para captar leads de campañas wellness.',
            ctaLabel: 'Descargar guía',
            ctaUrl: 'https://example.com/lunafitflow-guia'
          },
          {
            title: 'Retos',
            body: 'Explora retos patrocinados y formatos de conversión para productos fitness.',
            ctaLabel: 'Ver retos',
            ctaUrl: 'https://example.com/lunafitflow-retos'
          },
          {
            title: 'Reservas',
            body: 'Agenda sesiones grupales, lives y colaboraciones para campañas de bienestar.',
            ctaLabel: 'Reservar cupo',
            ctaUrl: 'https://example.com/lunafitflow-reservas'
          }
        ]
      }
    },
    links: [
      ['💪 Reto de 7 días', 'https://example.com/lunafitflow-retos'],
      ['🎥 TikTok principal', 'https://tiktok.com/@lunafitflow'],
      ['📘 Guía gratuita', 'https://example.com/lunafitflow-guia'],
      ['💬 WhatsApp directo', 'https://wa.me/595981111003']
    ],
    classifieds: [
      {
        title: '🏋️ Programa fitness online de 4 semanas',
        category: 'Servicios',
        price: 59,
        currency: 'USD',
        location: 'Online',
        description: 'Programa con seguimiento semanal, videos y plan básico de alimentación.',
        tags: ['fitness', 'programa', 'online'],
        featured: true
      }
    ]
  },
  {
    email: 'nova.agency@showcase.local',
    name: 'Nova Media Agency',
    role: 'USER',
    subdomain: 'novamedia',
    handle: '@novamedia',
    bio: 'Agencia digital especializada en campañas de contenido, performance y automatización.',
    avatar: 'NM',
    theme: 'dark',
    miniSite: {
      published: true,
      businessName: 'Nova Media Agency',
      headline: 'Campañas, performance y automatización para marcas',
      description: 'Reúne tus servicios, casos de éxito y contacto comercial en un perfil centralizado.',
      services: ['Paid media', 'Contenido UGC', 'Automatización CRM', 'Landing pages'],
      whatsapp: '595981111004',
      email: 'nova.agency@showcase.local',
      address: 'Asunción · Operación regional',
      primaryCtaLabel: 'Solicitar propuesta',
      primaryCtaUrl: 'https://example.com/novamedia-propuesta',
      showClassifieds: true,
      profileExperience: {
        intro: 'Conectamos estrategia, contenido y rendimiento con reportes claros y activación rápida.',
        socials: {
          instagram: 'https://instagram.com/novamediaagency',
          facebook: 'https://facebook.com/novamediaagency',
          tiktok: '',
          youtube: 'https://youtube.com/@novamediaagency',
          whatsapp: 'https://wa.me/595981111004',
          telegram: 'https://t.me/novamediaagency'
        },
        sheets: [
          {
            title: 'Casos',
            body: 'Resultados, métricas y campañas activas para evaluar el encaje comercial.',
            ctaLabel: 'Ver casos',
            ctaUrl: 'https://example.com/novamedia-casos'
          },
          {
            title: 'Servicios',
            body: 'Oferta comercial para marcas, negocios y equipos de ventas.',
            ctaLabel: 'Explorar servicios',
            ctaUrl: 'https://example.com/novamedia-servicios'
          },
          {
            title: 'Contacto',
            body: 'Agenda reuniones, pide presupuesto o comparte un brief comercial.',
            ctaLabel: 'Agendar reunión',
            ctaUrl: 'https://example.com/novamedia-reunion'
          }
        ]
      }
    },
    links: [
      ['📈 Casos de éxito', 'https://example.com/novamedia-casos'],
      ['🧠 Servicios de growth', 'https://example.com/novamedia-servicios'],
      ['📞 Reunión comercial', 'https://example.com/novamedia-reunion'],
      ['💬 WhatsApp empresa', 'https://wa.me/595981111004']
    ],
    classifieds: [
      {
        title: '🚀 Gestión mensual de campañas performance',
        category: 'Servicios',
        price: 900,
        currency: 'USD',
        location: 'Remoto',
        description: 'Gestión integral de Meta Ads y Google Ads con dashboard y optimización semanal.',
        tags: ['performance', 'ads', 'agency'],
        featured: true
      }
    ]
  },
  {
    email: 'casa.verde@showcase.local',
    name: 'Casa Verde Home',
    role: 'USER',
    subdomain: 'casaverdehome',
    handle: '@casaverdehome',
    bio: 'Tienda y estudio de interiorismo con productos para hogar, decoración y asesorías.',
    avatar: 'CV',
    theme: 'aurora',
    miniSite: {
      published: true,
      businessName: 'Casa Verde Home',
      headline: 'Decoración, interiorismo y tienda online para el hogar',
      description: 'Catálogo, reservas de asesoría y contacto directo para proyectos residenciales.',
      services: ['Interiorismo express', 'Catálogo deco', 'Asesoría por ambientes', 'Packs para Airbnb'],
      whatsapp: '595981111005',
      email: 'casa.verde@showcase.local',
      address: 'San Bernardino · Envíos nacionales',
      primaryCtaLabel: 'Ver catálogo',
      primaryCtaUrl: 'https://example.com/casaverde-catalogo',
      showClassifieds: true,
      profileExperience: {
        intro: 'Combinamos tienda digital, atención por WhatsApp y proyectos de decoración listos para convertir.',
        socials: {
          instagram: 'https://instagram.com/casaverdehome',
          facebook: 'https://facebook.com/casaverdehome',
          tiktok: 'https://tiktok.com/@casaverdehome',
          youtube: '',
          whatsapp: 'https://wa.me/595981111005',
          telegram: ''
        },
        sheets: [
          {
            title: 'Catálogo',
            body: 'Productos destacados, promociones y colecciones nuevas para el hogar.',
            ctaLabel: 'Explorar catálogo',
            ctaUrl: 'https://example.com/casaverde-catalogo'
          },
          {
            title: 'Asesoría',
            body: 'Reserva una sesión de interiorismo express para tu casa, local o Airbnb.',
            ctaLabel: 'Reservar asesoría',
            ctaUrl: 'https://example.com/casaverde-asesoria'
          },
          {
            title: 'Clientes',
            body: 'Casos reales, antes y después y testimonios de proyectos entregados.',
            ctaLabel: 'Ver testimonios',
            ctaUrl: 'https://example.com/casaverde-testimonios'
          }
        ]
      }
    },
    links: [
      ['🛍️ Catálogo online', 'https://example.com/casaverde-catalogo'],
      ['🏡 Reserva asesoría', 'https://example.com/casaverde-asesoria'],
      ['📲 TikTok de inspiración', 'https://tiktok.com/@casaverdehome'],
      ['💬 Atención por WhatsApp', 'https://wa.me/595981111005']
    ],
    classifieds: [
      {
        title: '🪴 Pack de decoración para living',
        category: 'Hogar',
        price: 220,
        currency: 'USD',
        location: 'Entrega nacional',
        description: 'Pack con mesa auxiliar, lámpara, textiles y asesoría virtual para instalación.',
        tags: ['hogar', 'decoracion', 'living'],
        featured: true
      }
    ]
  }
];

async function ensureShowcaseProfile(item) {
  const existing = await prisma.user.findUnique({
    where: { email: item.email },
    include: { workspaces: true }
  });

  if (existing) {
    console.log(`⚠️  Showcase ya existe: ${item.email}`);
    return;
  }

  const existingDomain = await prisma.domainMapping.findUnique({ where: { hostname: item.subdomain } });
  if (existingDomain) {
    console.log(`⚠️  Subdominio ocupado, se omite: ${item.subdomain}`);
    return;
  }

  const showcasePassword = process.env.SHOWCASE_PASSWORD || crypto.randomUUID();
  const hashedPassword = await bcrypt.hash(showcasePassword, 10);

  const blocks = [];
  item.links.forEach(([title, url], index) => {
    blocks.push({
      type: 'link',
      title,
      order: index,
      isActive: true,
      payload: JSON.stringify({ url, startAt: '', endAt: '' })
    });
  });

  item.classifieds.forEach((classified, index) => {
    blocks.push({
      type: 'classified',
      title: classified.title,
      order: item.links.length + index,
      isActive: true,
      payload: JSON.stringify({}),
      classified: {
        create: {
          category: classified.category,
          price: classified.price,
          currency: classified.currency,
          location: classified.location,
          description: classified.description,
          tags: JSON.stringify(classified.tags),
          isFeatured: Boolean(classified.featured),
          expiresAt: new Date('2027-12-31')
        }
      }
    });
  });

  await prisma.user.create({
    data: {
      email: item.email,
      password: hashedPassword,
      name: item.name,
      role: item.role,
      workspaces: {
        create: {
          name: item.name,
          handle: item.handle,
          bio: item.bio,
          avatar: item.avatar,
          theme: item.theme,
          miniSite: JSON.stringify(item.miniSite),
          domainMappings: {
            create: {
              hostname: item.subdomain,
              type: 'platform_subdomain',
              canonical: true
            }
          },
          blocks: {
            create: blocks
          }
        }
      }
    }
  });

  console.log(`✅ Showcase creado: ${item.name} (${item.subdomain})`);
}

async function main() {
  for (const showcase of showcases) {
    await ensureShowcaseProfile(showcase);
  }
}

main()
  .catch((error) => {
    console.error('❌ Error en seed-showcase:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
