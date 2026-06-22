const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Super Admin';

  if (!email || !password) {
    console.error('Uso: node seed-admin.js <email> <password> [name]');
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.role === 'ADMIN') {
      console.log(`El usuario ${email} ya existe y es ADMIN.`);
    } else {
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      });
      console.log(`El usuario ${email} ha sido ascendido a ADMIN.`);
    }
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
      workspaces: {
        create: {
          name: 'Centro de Control Admin',
          domainMappings: {
            create: {
              hostname: `admin-${Date.now()}`,
              type: 'platform_subdomain'
            }
          }
        }
      }
    }
  });

  console.log(`✅ Súper Administrador creado exitosamente: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('Error creando admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
