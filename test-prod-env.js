/**
 * Vercel本番環境変数での認証テスト
 * Vercel の本番 DATABASE_URL がNeonのものか確認する
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('DATABASE_URL prefix:', process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[0].split(':')[0] + '://' + process.env.DATABASE_URL.split('@')[0].split(':')[1].replace('//', '') + ':***@...' : 'NOT SET');
  console.log('DIRECT_URL set:', !!process.env.DIRECT_URL);
  console.log('AUTH_SECRET set:', !!process.env.AUTH_SECRET);
  console.log('AUTH_URL:', process.env.AUTH_URL || 'NOT SET');
  console.log('AUTH_TRUST_HOST:', process.env.AUTH_TRUST_HOST || 'NOT SET');
  
  const p = new PrismaClient();
  try {
    const user = await p.user.findUnique({ where: { email: 'pedro.inoue@hb-jp.com' }});
    console.log('DB connection OK. User:', user ? user.email + ' role=' + user.role : 'NOT FOUND');
  } catch(e) {
    console.error('DB connection FAILED:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main().catch(console.error);
