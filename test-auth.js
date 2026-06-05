/**
 * NextAuth の authorize 関数を直接テストする
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const email = 'pedro.inoue@hb-jp.com';
const password = 'ChangeMe123!';

const p = new PrismaClient();

async function testAuth() {
  try {
    const user = await p.user.findUnique({ where: { email } });
    if (!user) {
      console.log('NG: User not found');
      return;
    }
    console.log('User found:', user.email, 'role:', user.role);
    console.log('passwordHash length:', user.passwordHash ? user.passwordHash.length : 'NULL');

    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', valid);
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

testAuth();
