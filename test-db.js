const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.user.findFirst()
  .then(u => {
    console.log('DB OK:', u ? u.email : '(no users)');
  })
  .catch(e => {
    console.error('DB ERR:', e.message);
  })
  .finally(() => p.$disconnect());
