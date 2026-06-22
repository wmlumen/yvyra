const prisma = require('../lib/prisma');

const expectedEmails = [
  'adminteko',
  'mili.beats@showcase.local',
  'nico.levelup@showcase.local',
  'luna.fitflow@showcase.local',
  'nova.agency@showcase.local',
  'casa.verde@showcase.local'
];

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: expectedEmails } },
    include: {
      workspaces: {
        include: {
          domainMappings: true,
          blocks: {
            include: { classified: true }
          }
        }
      }
    }
  });

  const foundEmails = new Set(users.map((user) => user.email));
  const missing = expectedEmails.filter((email) => !foundEmails.has(email));

  const summary = users.map((user) => ({
    email: user.email,
    role: user.role,
    workspaceCount: user.workspaces.length,
    subdomain: user.workspaces[0]?.domainMappings[0]?.hostname || null,
    blockCount: user.workspaces[0]?.blocks.length || 0,
    classifiedCount: user.workspaces[0]?.blocks.filter((block) => Boolean(block.classified)).length || 0
  }));

  console.log(JSON.stringify({ missing, summary }, null, 2));

  if (missing.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error('❌ Error verificando showcase:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
