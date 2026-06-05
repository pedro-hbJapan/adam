# Adam - 社内統合プラットフォーム

社内向け統合管理プラットフォームの基盤 (v0.1)。

## 本番環境

| 項目 | 値 |
|------|----|
| **本番URL** | https://adam-seven-gamma.vercel.app |
| **GitHub** | https://github.com/pedro-hbJapan/adam |
| **Neon プロジェクト** | ep-quiet-surf-aorj7bs8 (ap-southeast-1) |

> **初期パスワードを必ず変更してください**: `master@example.com` / `ChangeMe123!`

## 技術スタック

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** (最低限スタイル)
- **Prisma ORM** + PostgreSQL (本番: Neon)
- **NextAuth v5** (Credentials Provider / JWT)

## 役職 (Role)

| Role | アクセス範囲 |
|------|------------|
| MASTER | 全機能 + ユーザー管理 |
| OFFICE | /dashboard/office のみ |
| WAREHOUSE | /dashboard/warehouse のみ |
| SALES | /dashboard/sales のみ |
| CUSTOMER | /dashboard/customer のみ |

## ローカル開発セットアップ

### 1. 依存パッケージインストール

```bash
npm install
```

### 2. 環境変数設定

`.env.local` を編集:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/adam"
NEXTAUTH_SECRET="ランダムな32文字以上の文字列"
NEXTAUTH_URL="http://localhost:3000"
```

`NEXTAUTH_SECRET` の生成:
```bash
openssl rand -base64 32
```

### 3. DBマイグレーション + seed

```bash
npx prisma migrate deploy
npm run db:seed
```

### 4. 開発サーバー起動

```bash
npm run dev
```

### 初期アカウント

| Email | Password | Role |
|-------|----------|------|
| master@example.com | ChangeMe123! | MASTER |

**本番環境では必ずパスワードを変更してください。**

## 本番デプロイ (Vercel + Neon)

1. Neon でプロジェクト作成 → `DATABASE_URL` 取得
2. Vercel プロジェクト作成・紐付け
3. Vercel 環境変数設定:
   - `DATABASE_URL`: Neon の接続文字列
   - `NEXTAUTH_SECRET`: `openssl rand -base64 32` で生成
   - `NEXTAUTH_URL`: `https://your-app.vercel.app`
4. デプロイ後、本番DBにマイグレーション実行:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

## 機能追加ガイド

### 新しい Role を追加する

1. `prisma/schema.prisma` の `enum Role` に追加
2. `src/lib/roles.ts` の `ROLE_DASHBOARD` に対応パスを追加
3. `src/app/dashboard/layout.tsx` の `ROLE_NAV` にナビ項目追加
4. `src/app/dashboard/<new-role>/page.tsx` を作成
5. `src/middleware.ts` の `ROLE_PATHS` に追加
6. マイグレーション実行: `npx prisma migrate dev --name add-new-role`

### 新しいルートに RBAC を追加する

`src/middleware.ts` の `ROLE_PATHS` に追記:

```typescript
"/new-feature": ["MASTER", "OFFICE"], // アクセス許可するRoleを配列で指定
```

### 新しい機能ページを追加する

1. `src/app/<path>/page.tsx` を作成 (Server Component 推奨)
2. 必要な場合 Server Actions を `actions.ts` で定義
3. `src/middleware.ts` でアクセス制御を追加

## ディレクトリ構成

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth ハンドラ
│   ├── dashboard/
│   │   ├── layout.tsx                   # ダッシュボード共通レイアウト
│   │   ├── master/page.tsx
│   │   ├── office/page.tsx
│   │   ├── warehouse/page.tsx
│   │   ├── sales/page.tsx
│   │   └── customer/page.tsx
│   ├── login/page.tsx                   # ログインページ
│   ├── master/
│   │   ├── layout.tsx
│   │   └── users/                       # ユーザー管理 (MASTER only)
│   │       ├── page.tsx
│   │       ├── UsersClient.tsx
│   │       └── actions.ts
│   └── page.tsx                         # / → ダッシュボードへリダイレクト
├── components/
│   └── DashboardLayoutClient.tsx        # サイドバー付きレイアウト
├── lib/
│   ├── auth.ts                          # NextAuth 設定
│   ├── prisma.ts                        # Prisma クライアント
│   └── roles.ts                         # Role → パス マッピング
├── middleware.ts                         # RBAC ミドルウェア
└── types/
    └── next-auth.d.ts                   # NextAuth 型拡張
prisma/
├── schema.prisma                        # DB スキーマ
└── seed.ts                              # 初期データ
```
