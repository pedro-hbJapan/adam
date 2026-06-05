const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany()
  .then(users => {
    users.forEach(u => console.log(u.email, u.role));
  })
  .catch(e => console.error(e.message))
  .finally(() => p.$disconnect());
