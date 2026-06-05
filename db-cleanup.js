/**
 * DB診断・クリーンアップスクリプト
 *
 * 目的:
 *   - PrismaAdapter を使用していた際に蓄積した Account / Session テーブルの
 *     不要レコードを確認・削除する
 *   - credentials プロバイダーで作られた Account レコードが
 *     @@unique([provider, providerAccountId]) 制約に引っかかっていた可能性を確認
 *
 * 使い方:
 *   node db-cleanup.js          # 確認のみ（削除しない）
 *   node db-cleanup.js --delete # 実際に削除実行
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const shouldDelete = process.argv.includes('--delete');

async function main() {
  console.log('=== DB 診断開始 ===\n');

  // 1. ユーザー一覧
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`[Users] 合計: ${users.length} 件`);
  for (const u of users) {
    console.log(`  - ${u.email} (${u.role}) id=${u.id}`);
  }

  // 2. Account テーブルの内容 (credentials型のものが問題)
  let accounts = [];
  try {
    accounts = await prisma.account.findMany({
      select: { id: true, userId: true, provider: true, type: true, providerAccountId: true },
      orderBy: { id: 'asc' },
    });
    console.log(`\n[Accounts] 合計: ${accounts.length} 件`);
    for (const a of accounts) {
      console.log(`  - id=${a.id} provider=${a.provider} type=${a.type} userId=${a.userId} providerAccountId=${a.providerAccountId}`);
    }

    const credAccounts = accounts.filter(a => a.provider === 'credentials' || a.type === 'credentials');
    console.log(`\n  うち credentials 型: ${credAccounts.length} 件 (これが問題の原因)`);

    if (shouldDelete && credAccounts.length > 0) {
      console.log('\n  → credentials Account レコードを削除中...');
      const result = await prisma.account.deleteMany({
        where: {
          OR: [
            { provider: 'credentials' },
            { type: 'credentials' },
          ],
        },
      });
      console.log(`  削除完了: ${result.count} 件`);
    }
  } catch (e) {
    console.log(`\n[Accounts] テーブルアクセスエラー: ${e.message}`);
  }

  // 3. Session テーブルの内容 (JWT戦略では不要)
  let sessions = [];
  try {
    sessions = await prisma.session.findMany({
      select: { id: true, userId: true, expires: true },
      orderBy: { expires: 'asc' },
    });
    console.log(`\n[Sessions] 合計: ${sessions.length} 件 (JWT戦略では不使用)`);
    for (const s of sessions) {
      const expired = new Date(s.expires) < new Date();
      console.log(`  - id=${s.id} userId=${s.userId} expires=${s.expires} ${expired ? '(期限切れ)' : ''}`);
    }

    if (shouldDelete && sessions.length > 0) {
      console.log('\n  → 全 Session レコードを削除中...');
      const result = await prisma.session.deleteMany({});
      console.log(`  削除完了: ${result.count} 件`);
    }
  } catch (e) {
    console.log(`\n[Sessions] テーブルアクセスエラー: ${e.message}`);
  }

  // 4. passwordHash の存在確認 (bcrypt フォーマット検証)
  console.log('\n[passwordHash 検証]');
  for (const u of users) {
    const fullUser = await prisma.user.findUnique({
      where: { id: u.id },
      select: { email: true, passwordHash: true },
    });
    const hash = fullUser?.passwordHash ?? '';
    const isBcrypt = hash.startsWith('$2a$') || hash.startsWith('$2b$');
    console.log(`  - ${u.email}: hash=${isBcrypt ? '✓ bcrypt形式' : `✗ 不正 (${hash.slice(0, 20)}...)`}`);
  }

  console.log('\n=== 診断完了 ===');
  if (!shouldDelete) {
    console.log('\n削除するには: node db-cleanup.js --delete');
  }
}

main()
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
