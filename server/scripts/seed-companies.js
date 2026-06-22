const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Creando cuentas de empresas...');
  const password = await bcrypt.hash('123456', 10);

  // Empresa 1: Cafetería
  await prisma.user.create({
    data: {
      email: 'contacto@cafebuenosaires.com',
      name: 'Café Buenos Aires',
      password,
      workspaces: {
        create: {
          name: 'Café Buenos Aires',
          handle: '@cafebuenosaires',
          bio: 'El mejor café de especialidad. Ven a probar nuestro blend de la casa.',
          avatar: '☕',
          theme: 'dark',
          domainMappings: {
            create: { hostname: 'cafe', type: 'platform_subdomain', canonical: true }
          },
          blocks: {
            create: [
              { type: 'link', title: 'Ver nuestro Menú', payload: JSON.stringify({ url: 'https://ejemplo.com/menu' }), order: 0 },
              { type: 'link', title: 'Ubicación en Maps', payload: JSON.stringify({ url: 'https://maps.google.com' }), order: 1 }
            ]
          }
        }
      }
    }
  });

  // Empresa 2: Inmobiliaria
  await prisma.user.create({
    data: {
      email: 'ventas@inmueblespremium.com',
      name: 'Inmuebles Premium',
      password,
      workspaces: {
        create: {
          name: 'Inmuebles Premium',
          handle: '@inmueblespremium',
          bio: 'Casas y departamentos de lujo. Encuentra el hogar de tus sueños.',
          avatar: '🏢',
          theme: 'aurora',
          domainMappings: {
            create: { hostname: 'inmuebles', type: 'platform_subdomain', canonical: true }
          },
          blocks: {
            create: [
              { type: 'link', title: 'Agendar una visita', payload: JSON.stringify({ url: 'https://calendly.com' }), order: 0 },
              { 
                type: 'classified', 
                title: 'Penthouse en el Centro', 
                payload: JSON.stringify({}), 
                order: 1,
                classified: {
                  create: {
                    price: 250000,
                    currency: 'USD',
                    category: 'Inmuebles',
                    description: 'Hermoso penthouse con vista a la ciudad, 3 habitaciones, 2 baños.',
                    tags: JSON.stringify(['Lujo', 'Centro', 'Penthouse']),
                    location: 'Ciudad Central',
                    isFeatured: true
                  }
                }
              }
            ]
          }
        }
      }
    }
  });

  // Empresa 3: Agencia de Marketing
  await prisma.user.create({
    data: {
      email: 'hola@agenciacreativa.com',
      name: 'Agencia Creativa',
      password,
      workspaces: {
        create: {
          name: 'Agencia Creativa',
          handle: '@agenciacreativa',
          bio: 'Hacemos que tu marca destaque en el mundo digital. Marketing, SEO y Ads.',
          avatar: '🚀',
          theme: 'clean',
          miniSite: JSON.stringify({
            heroTitle: 'Transformamos negocios',
            heroSubtitle: 'Diseño web y estrategias que venden',
            services: [
              { title: 'Gestión de Redes', description: 'Manejo profesional de Instagram y TikTok' },
              { title: 'SEO Local', description: 'Aparece en Google Maps cuando te busquen' }
            ],
            contactEmail: 'hola@agenciacreativa.com',
            contactPhone: '+1234567890'
          }),
          domainMappings: {
            create: { hostname: 'agencia', type: 'platform_subdomain', canonical: true }
          },
          blocks: {
            create: [
              { type: 'link', title: 'Ver nuestro Portafolio', payload: JSON.stringify({ url: 'https://behance.net' }), order: 0 }
            ]
          }
        }
      }
    }
  });

  console.log('✅ 3 Cuentas de empresas creadas con éxito!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
