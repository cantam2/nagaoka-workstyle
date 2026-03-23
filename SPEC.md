# Nagaoka Workstyle — システム仕様書

> 長岡市向け求人・インターンシップポータルサイト
> 本仕様書は、別の生成AIやエンジニアが同等のシステムを再現できるよう、実装済み内容と設定手順をまとめたものです。

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [環境変数](#3-環境変数)
4. [ディレクトリ構成](#4-ディレクトリ構成)
5. [データベース設計](#5-データベース設計)
6. [認証・権限設計](#6-認証権限設計)
7. [ルーティング一覧](#7-ルーティング一覧)
8. [画面仕様](#8-画面仕様)
9. [メール通知](#9-メール通知)
10. [初期セットアップ手順](#10-初期セットアップ手順)
11. [デプロイ構成](#11-デプロイ構成)
12. [HTMLページとの連携](#12-htmlページとの連携)
13. [デザイントークン](#13-デザイントークン)
14. [今後の追加実装候補](#14-今後の追加実装候補)

---

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| サービス名 | Nagaoka Workstyle |
| 目的 | 長岡市内の企業と求職者・学生をつなぐ求人・インターンポータル |
| ターゲット | 企業担当者、求職者、学生（インターン希望者） |
| 本番URL | https://nagaoka-workstyle.vercel.app |
| リポジトリ | https://github.com/cantam2/nagaoka-workstyle |

### ユーザーの種類（ロール）

| ロール | 説明 |
|--------|------|
| `admin` | サービス管理者。企業承認・ユーザー管理・求人管理が可能 |
| `company` | 企業担当者。企業情報・求人・インターン・応募管理が可能 |
| `jobseeker` | 求職者・学生。求人閲覧・応募・お気に入りが可能 |

---

## 2. 技術スタック

| 分類 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js (App Router) | 16.2.1 |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS v4 | 4.x |
| バックエンド・DB | Supabase (PostgreSQL + Auth) | 最新 |
| Supabaseクライアント | @supabase/ssr | 最新 |
| メール送信 | Resend | 最新 |
| デプロイ | Vercel | — |

### 重要な実装上の注意点

- **Next.js 16** では `middleware.ts` の代わりに `proxy.ts` を使用し、エクスポート関数名も `proxy` にする
- **React 19** では `React.FormEvent` が非推奨。フォームハンドラの型は `{ preventDefault(): void }` を使用
- **Supabase クライアント** に `<Database>` ジェネリクスを渡すと型推論が `never` になるため、ジェネリクスは使用せず `as TypeName` で明示的にキャストする
- **Tailwind CSS v4** では `@import "tailwindcss"` を使用（v3 の `@tailwind base/components/utilities` は不要）
- **Resend** はモジュールレベルで初期化するとビルド時にAPIキーエラーになる。関数内で `new Resend(key)` を呼ぶ遅延初期化パターンを使用すること

---

## 3. 環境変数

`.env.local` に以下を設定する（`.gitignore` の `.env*` パターンで除外済み）

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Nagaoka Workstyle <noreply@your-domain.com>   # 省略時は onboarding@resend.dev
```

| 変数名 | 取得場所 | 必須 |
|--------|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | ✅ |
| `RESEND_API_KEY` | resend.com → API Keys | ✅ |
| `EMAIL_FROM` | 任意（独自ドメイン認証後に設定） | — |

> **注意**: `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイド（APIルート）でのみ使用。`NEXT_PUBLIC_` プレフィックスをつけないこと。

---

## 4. ディレクトリ構成

```
nagaoka-workstyle/
├── public/                          # 静的ファイル（HTMLページを含む）
│   ├── nagaoka-workstyle-top.html
│   ├── nagaoka-workstyle-list.html
│   ├── nagaoka-workstyle-detail.html           # 企業詳細（スラッグ: sample-seisakusho）
│   ├── nagaoka-workstyle-detail-nagaoka-tech.html  # （スラッグ: nagaoka-tech）
│   ├── nagaoka-workstyle-detail-echigo-foods.html  # （スラッグ: echigo-foods）
│   ├── nagaoka-workstyle-gateway.html
│   └── nagaoka-workstyle-spec.html
│
├── src/
│   ├── proxy.ts                     # 認証プロキシ（Next.js 16のmiddleware相当）
│   ├── types/
│   │   └── index.ts                 # 全テーブルのTypeScript型定義
│   ├── lib/
│   │   ├── email.ts                 # Resendメール送信ユーティリティ・HTMLテンプレート
│   │   └── supabase/
│   │       ├── client.ts            # ブラウザ用Supabaseクライアント
│   │       ├── server.ts            # サーバー用Supabaseクライアント（async）
│   │       └── admin.ts             # サービスロール用管理クライアント（サーバーのみ）
│   ├── components/
│   │   ├── PublicHeader.tsx         # 公開ページ共通ヘッダー（ロゴ+ナビ+ログインボタン）
│   │   ├── auth/
│   │   │   └── AuthTabs.tsx         # ログイン/新規登録タブ（usePathname使用）
│   │   ├── company/
│   │   │   ├── JobForm.tsx          # 求人作成・編集フォーム
│   │   │   └── InternshipForm.tsx   # インターン作成・編集フォーム
│   │   └── jobseeker/
│   │       ├── ApplyForm.tsx        # 応募フォーム（求人・インターン共通）
│   │       └── BookmarkButton.tsx   # お気に入りトグルボタン
│   └── app/
│       ├── globals.css              # グローバルスタイル・CSS変数
│       ├── layout.tsx               # ルートレイアウト
│       ├── page.tsx                 # トップページ（/）求人数・企業数を表示
│       ├── (auth)/                  # 認証ページグループ
│       │   ├── layout.tsx           # 認証共通レイアウト（ロゴ+AuthTabs+カード）
│       │   ├── login/page.tsx
│       │   ├── signup/page.tsx
│       │   └── reset-password/page.tsx
│       ├── (dashboard)/             # ダッシュボードページグループ
│       │   ├── admin/
│       │   │   ├── layout.tsx       # 管理者サイドバーレイアウト
│       │   │   ├── page.tsx         # 管理者ホーム（統計カード）
│       │   │   ├── companies/
│       │   │   │   ├── page.tsx     # 企業一覧・承認バッジ表示
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx          # 企業詳細
│       │   │   │       └── ApprovalButton.tsx # 承認/取消ボタン（承認時メール通知）
│       │   │   ├── users/
│       │   │   │   ├── page.tsx              # ユーザー一覧
│       │   │   │   └── RoleChangeButton.tsx  # ロール変更ドロップダウン
│       │   │   ├── jobs/
│       │   │   │   ├── page.tsx              # 求人一覧
│       │   │   │   └── JobToggleButton.tsx   # 公開/非公開トグル
│       │   │   └── applications/
│       │   │       └── page.tsx              # 応募一覧
│       │   ├── company/
│       │   │   ├── page.tsx                  # 企業ダッシュボードホーム
│       │   │   ├── profile/page.tsx          # 企業情報編集（スラッグ自動生成）
│       │   │   ├── jobs/
│       │   │   │   ├── new/page.tsx
│       │   │   │   └── [id]/edit/page.tsx
│       │   │   ├── internships/
│       │   │   │   ├── new/page.tsx
│       │   │   │   └── [id]/edit/page.tsx
│       │   │   └── applications/
│       │   │       └── [id]/
│       │   │           ├── page.tsx          # 応募詳細
│       │   │           └── StatusForm.tsx    # ステータス変更（変更時メール通知）
│       │   └── jobseeker/
│       │       ├── page.tsx                  # 求職者ホーム
│       │       ├── profile/page.tsx          # プロフィール編集
│       │       ├── applications/page.tsx     # 応募履歴
│       │       └── bookmarks/
│       │           ├── page.tsx
│       │           └── BookmarkRemoveButton.tsx
│       ├── jobs/
│       │   ├── page.tsx                      # 公開求人一覧（雇用形態・業種フィルタ）
│       │   └── FilterBar.tsx                 # フィルタUIコンポーネント（クライアント）
│       ├── companies/
│       │   └── page.tsx                      # 承認済み企業一覧（業種フィルタ）
│       ├── apply/                            # 非ログインでも閲覧可能
│       │   ├── company/[slug]/page.tsx       # 企業の求人一覧（slugでアクセス）
│       │   ├── job/[id]/page.tsx             # 求人詳細 + 応募フォーム
│       │   └── internship/[id]/page.tsx      # インターン詳細 + 応募フォーム
│       └── api/
│           ├── auth/signout/route.ts         # ログアウト
│           └── notify/
│               ├── apply/route.ts            # 応募通知（企業へ）
│               ├── approved/route.ts         # 承認通知（企業へ）
│               └── status/route.ts           # ステータス変更通知（求職者へ）
│
├── supabase-schema.sql              # 初回DB構築用SQL（全テーブル+RLS）
├── supabase-add-slug.sql            # slugカラム追加用SQL ← 必ず実行すること
├── .env.local                       # 環境変数（gitignore対象）
└── SPEC.md                          # 本仕様書
```

---

## 5. データベース設計

### 5-1. テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| `profiles` | ユーザープロフィール（auth.usersと1:1） |
| `companies` | 企業情報 |
| `job_listings` | 求人情報 |
| `internship_programs` | インターンシップ情報 |
| `applications` | 応募情報 |
| `bookmarks` | お気に入り（求職者×企業） |

### 5-2. 各テーブルの定義

#### profiles
```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.role not null default 'jobseeker',
  name        text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```
- `auth.users` にユーザーが登録されると自動でレコードが作成されるトリガーあり
- サインアップ時の `raw_user_meta_data.role` を元にロールを設定

#### companies
```sql
create table public.companies (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  industry        text,
  description     text,
  logo_url        text,
  location        text,
  employee_count  text,
  founded_year    integer,
  website_url     text,
  slug            text unique,  -- supabase-add-slug.sql で追加
  is_approved     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```
> `slug` カラムは `supabase-schema.sql` に含まれていません。`supabase-add-slug.sql` を別途実行してください。

#### job_listings
```sql
create table public.job_listings (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  title               text not null,
  catchcopy           text,
  employment_type     public.employment_type not null default 'fulltime',
  salary_min          integer,
  salary_max          integer,
  salary_description  text,
  location            text,
  description         text,
  requirements        text,
  benefits            text,
  appeal_tags         text[] not null default '{}',
  is_published        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
```

#### internship_programs
```sql
create table public.internship_programs (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  title         text not null,
  duration      text,
  description   text,
  requirements  text,
  capacity      integer,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

#### applications
```sql
create table public.applications (
  id              uuid primary key default gen_random_uuid(),
  jobseeker_id    uuid not null references public.profiles(id) on delete cascade,
  job_listing_id  uuid references public.job_listings(id) on delete cascade,
  internship_id   uuid references public.internship_programs(id) on delete cascade,
  status          public.application_status not null default 'pending',
  message         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint applications_target_check check (
    (job_listing_id is not null) or (internship_id is not null)
  )
);
```

#### bookmarks
```sql
create table public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  jobseeker_id  uuid not null references public.profiles(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(jobseeker_id, company_id)
);
```

### 5-3. Enum型

```sql
create type public.role as enum ('admin', 'company', 'jobseeker');
create type public.application_status as enum ('pending', 'reviewing', 'accepted', 'rejected');
create type public.employment_type as enum ('fulltime', 'parttime', 'contract', 'internship');
```
> 既存DBに対して再実行する場合は `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$` で囲む

### 5-4. RLS（Row Level Security）ポリシー

| テーブル | 操作 | 許可条件 |
|---------|------|---------|
| profiles | SELECT | 全員 |
| profiles | UPDATE | 本人のみ |
| companies | SELECT | 承認済み または 管理者 |
| companies | INSERT | `company` ロールのみ |
| companies | UPDATE | 自社のみ |
| job_listings | SELECT | 公開中 または 自社担当者 |
| job_listings | ALL | 自社求人のみ |
| internship_programs | SELECT | 公開中 または 自社担当者 |
| internship_programs | ALL | 自社インターンのみ |
| applications | SELECT | 自分の応募（求職者）または 自社への応募（企業） |
| applications | INSERT | 求職者のみ |
| applications | UPDATE | 自社への応募のみ（企業） |
| bookmarks | ALL | 自分のお気に入りのみ |

---

## 6. 認証・権限設計

### 認証フロー

1. Supabase Auth（メール/パスワード）でサインアップ
2. サインアップ時にロール（`jobseeker` or `company`）を選択
3. `raw_user_meta_data.role` にロールを渡し、トリガーで `profiles` に自動反映
4. ログイン後はロール別にリダイレクト：admin → `/admin`、company → `/company`、jobseeker → `/jobseeker`

### 認証プロキシ（proxy.ts）

`/admin`, `/company`, `/jobseeker` で始まるパスは未ログイン時に `/login` へリダイレクト。

```typescript
// src/proxy.ts
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|...).*)'] }
```

### Supabaseクライアント実装パターン

```typescript
// client.ts（ブラウザ用）
export function createClient() {
  return createBrowserClient(url, anonKey)
}

// server.ts（サーバーコンポーネント用）
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, { cookies: { ... } })
}

// admin.ts（APIルート用・サービスロール）
export function createAdminClient() {
  return createClient(url, serviceRoleKey)  // @supabase/supabase-js
}
```

---

## 7. ルーティング一覧

| パス | レンダリング | 説明 | アクセス制限 |
|------|------------|------|------------|
| `/` | 動的 | トップページ（求人数・企業数表示） | 全員 |
| `/login` | 静的 | ログイン | 全員 |
| `/signup` | 静的 | 新規登録（ロール選択） | 全員 |
| `/reset-password` | 静的 | パスワードリセット | 全員 |
| `/jobs` | 動的 | 公開求人一覧（雇用形態・業種フィルタ） | 全員 |
| `/companies` | 動的 | 承認済み企業一覧（業種フィルタ） | 全員 |
| `/apply/company/[slug]` | 動的 | 企業の求人一覧 | 全員 |
| `/apply/job/[id]` | 動的 | 求人詳細・応募フォーム | 全員（応募はログイン必須） |
| `/apply/internship/[id]` | 動的 | インターン詳細・応募フォーム | 全員（応募はログイン必須） |
| `/admin` | 動的 | 管理者ホーム | admin |
| `/admin/companies` | 動的 | 企業一覧・承認管理 | admin |
| `/admin/companies/[id]` | 動的 | 企業詳細・承認操作 | admin |
| `/admin/users` | 動的 | ユーザー一覧・ロール変更 | admin |
| `/admin/jobs` | 動的 | 求人一覧・公開切替 | admin |
| `/admin/applications` | 動的 | 応募一覧 | admin |
| `/company` | 動的 | 企業ダッシュボードホーム | company |
| `/company/profile` | 静的 | 企業情報編集 | company |
| `/company/jobs/new` | 静的 | 求人作成 | company |
| `/company/jobs/[id]/edit` | 動的 | 求人編集 | company |
| `/company/internships/new` | 静的 | インターン作成 | company |
| `/company/internships/[id]/edit` | 動的 | インターン編集 | company |
| `/company/applications/[id]` | 動的 | 応募詳細・ステータス変更 | company |
| `/jobseeker` | 動的 | 求職者ホーム | jobseeker |
| `/jobseeker/profile` | 静的 | プロフィール編集 | jobseeker |
| `/jobseeker/applications` | 動的 | 応募履歴 | jobseeker |
| `/jobseeker/bookmarks` | 動的 | お気に入り企業 | jobseeker |
| `/api/auth/signout` | API | ログアウト | ログイン中 |
| `/api/notify/apply` | API | 応募通知メール送信 | サーバー内部 |
| `/api/notify/approved` | API | 承認通知メール送信 | サーバー内部 |
| `/api/notify/status` | API | ステータス変更通知メール送信 | サーバー内部 |

---

## 8. 画面仕様

### 8-1. 公開ページ

**トップページ** `/`
- リアルタイムで「募集中の求人数」「掲載企業数」を表示
- 「求人を探す（→/jobs）」「企業を見る（→/companies）」へのCTA
- サービス特徴の紹介セクション
- 企業担当者向け登録CTAセクション

**求人一覧** `/jobs`
- 公開中の全求人を一覧表示
- 雇用形態ボタンフィルタ（すべて/正社員/パート・アルバイト/契約社員/インターンシップ）
- 業種プルダウンフィルタ
- 各求人カード：企業名・タイトル・雇用形態バッジ・アピールタグ・給与・勤務地
- クリックで `/apply/job/[id]` へ

**企業一覧** `/companies`
- 承認済み企業をグリッド（2列）表示
- 業種タブフィルタ
- 各企業カード：企業名・業種・所在地・紹介文・従業員数・設立年
- クリックで `/apply/company/[slug]` へ

**企業の応募起点ページ** `/apply/company/[slug]`
- slugで企業を検索（`is_approved = true` のみ）
- 企業情報表示（名前・業種・所在地・紹介文）
- 公開中の求人一覧 → `/apply/job/[id]` へ
- 公開中のインターン一覧 → `/apply/internship/[id]` へ
- `?type=job` / `?type=intern` で絞り込み可能
- ログイン/新規登録への誘導CTA

**求人詳細・応募** `/apply/job/[id]`
- 求人の全情報表示
- `ApplyForm`：名前・電話番号・応募メッセージを入力して応募
- 応募済みの場合は「応募済み」表示
- 未ログイン時はログイン誘導

**インターン詳細・応募** `/apply/internship/[id]`
- インターンの全情報 + 同じ `ApplyForm`

---

### 8-2. 認証ページ

**共通レイアウト** `(auth)/layout.tsx`
- ロゴ + `AuthTabs`（ログイン/新規登録タブ）+ カード

**ログイン** `/login`
- メール・パスワード入力、ロール別リダイレクト

**新規登録** `/signup`
- ロール選択（求職者/企業担当者）→ 名前・メール・パスワード入力

**パスワードリセット** `/reset-password`
- メールアドレス入力 → Supabase経由でリセットメール送信

---

### 8-3. 管理者ダッシュボード

**共通レイアウト**: ダークサイドバー（ホーム/企業管理/ユーザー管理/求人管理/応募管理/ログアウト）

**管理者ホーム** `/admin`
- 統計カード：企業数（承認済み/未承認）・ユーザー数・求人数・応募数
- 未承認企業の一覧

**企業一覧** `/admin/companies`
- 全企業リスト（承認済み/未承認バッジ）

**企業詳細** `/admin/companies/[id]`
- 全情報表示 + 承認/取消ボタン（`ApprovalButton.tsx`）
- 承認時 → `POST /api/notify/approved` を呼び出してメール通知

**ユーザー一覧** `/admin/users`
- 全ユーザーリスト + ロール変更ドロップダウン（`RoleChangeButton.tsx`）

**求人一覧** `/admin/jobs`
- 全求人リスト + 公開/非公開トグル（`JobToggleButton.tsx`）

**応募一覧** `/admin/applications`
- 全応募リスト（求職者名・求人名・ステータス・日付）

---

### 8-4. 企業ダッシュボード

**企業ホーム** `/company`
- 求人数・インターン数・応募数サマリー
- 最近の応募5件
- 未登録/未承認の場合は案内メッセージ

**企業情報編集** `/company/profile`
- 企業名（必須）
- URLスラッグ（企業名から自動生成、手動上書き可）
- 業種・所在地・従業員数・設立年・Webサイト・企業紹介

**求人作成/編集** `/company/jobs/new`, `[id]/edit`
- タイトル・キャッチコピー・雇用形態・給与・勤務地
- 仕事内容・応募資格・福利厚生
- アピールタグ（プリセット＋カスタム）
- 公開/非公開トグル

**インターン作成/編集** `/company/internships/new`, `[id]/edit`
- タイトル・実施期間・説明・要件・定員・公開/非公開

**応募詳細** `/company/applications/[id]`
- 応募者情報・応募メッセージ
- ステータス変更（`StatusForm.tsx`）→ 変更時に `POST /api/notify/status` でメール通知

---

### 8-5. 求職者ダッシュボード

**求職者ホーム** `/jobseeker`
- プロフィール完了率・応募件数・お気に入り数

**プロフィール編集** `/jobseeker/profile`
- 名前・電話番号

**応募履歴** `/jobseeker/applications`
- 応募した求人/インターン一覧とステータスバッジ
- `?applied=1` 付きでアクセスすると成功バナーを表示

**お気に入り** `/jobseeker/bookmarks`
- お気に入り企業一覧 + 解除ボタン

---

## 9. メール通知

**使用サービス**: Resend（https://resend.com）

### 通知の種類

| タイミング | 送信先 | 件名 |
|----------|--------|------|
| 求職者が応募した時 | 企業担当者 | 新しい応募が届きました — {求人名} |
| 管理者が企業を承認した時 | 企業担当者 | 企業情報が承認されました |
| 企業がステータスを変更した時 | 求職者 | 選考状況が更新されました — {求人名} |

### 実装の仕組み

```
[クライアント] 操作完了
     ↓ fetch（fire & forget）
[APIルート /api/notify/*]
     ↓ Supabaseで関連データ取得
     ↓ admin.auth.admin.getUserById() でメールアドレス取得
     ↓ Resend でメール送信
```

- メール送信は操作フローをブロックしない（`.catch(() => {})` で無視）
- ユーザーのメールアドレスは `auth.users` にあるため、サービスロールクライアント（`admin.ts`）経由で取得

### ドメイン設定について

| 状態 | 送信先の制限 |
|------|------------|
| ドメイン未設定（デフォルト） | Resendに登録した自分のメールのみ |
| 独自ドメインを Resend で認証済み | 誰でも送信可 |

本番運用では Resend ダッシュボード → **Domains** で独自ドメインを認証し、`EMAIL_FROM` 環境変数を設定すること。

---

## 10. 初期セットアップ手順

### 🔴 必須（これをやらないとサービスが動かない）

#### ① supabase-add-slug.sql の実行

Supabase ダッシュボード → **SQL Editor** で以下を実行：

```sql
alter table public.companies add column if not exists slug text unique;
create index if not exists companies_slug_idx on public.companies(slug);
```

> `supabase-schema.sql` には含まれていません。必ず別途実行してください。

---

#### ② Supabase Auth の URL 設定

パスワードリセットメールのリダイレクト先が正しく動くために必要。

Supabase → **Authentication → URL Configuration**

| 設定項目 | 値 |
|---------|---|
| Site URL | `https://nagaoka-workstyle.vercel.app` |
| Redirect URLs | `https://nagaoka-workstyle.vercel.app/**` |

---

#### ③ 初回管理者アカウントの作成

管理者がいないと企業を承認できず、求人が一切公開されない。

1. `https://nagaoka-workstyle.vercel.app/signup` でアカウント登録（ロール: 求職者でよい）
2. Supabase → **Table Editor → profiles** テーブル
3. 作成されたレコードの `role` 列を `admin` に変更
4. 以降 `/admin` にアクセス可能

---

### 🟡 推奨（あとからでも可）

#### ④ Vercel に環境変数を追加

Vercel ダッシュボード → Settings → Environment Variables

```
RESEND_API_KEY = re_xxxxxxxxx
```

追加後 → **Deployments → Redeploy** で反映。

---

#### ⑤ Supabase のメール確認を無効化（テスト中のみ）

デフォルトでは新規登録時にメール確認が必要なため、テスト中は無効にすると楽。

Supabase → **Authentication → Providers → Email → "Confirm email"** をオフ

---

## 11. デプロイ構成

| 項目 | 内容 |
|------|------|
| ホスティング | Vercel |
| データベース | Supabase（PostgreSQL） |
| 認証 | Supabase Auth |
| メール送信 | Resend |
| ファイルストレージ | Supabase Storage（未実装） |
| ドメイン | nagaoka-workstyle.vercel.app（カスタムドメイン設定可） |

### Vercel 環境変数（全件）

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
EMAIL_FROM          （任意・独自ドメイン認証後）
```

### DB 初期セットアップ順序

```
1. supabase-schema.sql を SQL Editor で実行
2. supabase-add-slug.sql を SQL Editor で実行  ← 必須
3. Vercel に環境変数を設定してデプロイ
4. Supabase Auth の URL Configuration を更新  ← 必須
5. 管理者アカウントを手動で作成  ← 必須
```

---

## 12. HTMLページとの連携

`public/` フォルダに静的HTMLを置くことで Next.js アプリと同一オリジンで配信。

| URL | 説明 |
|-----|------|
| `/nagaoka-workstyle-top.html` | トップページ（HTML版） |
| `/nagaoka-workstyle-list.html` | 求人一覧（HTML版） |
| `/nagaoka-workstyle-detail.html` | 企業詳細（スラッグ: `sample-seisakusho`） |
| `/nagaoka-workstyle-detail-nagaoka-tech.html` | 企業詳細（スラッグ: `nagaoka-tech`） |
| `/nagaoka-workstyle-detail-echigo-foods.html` | 企業詳細（スラッグ: `echigo-foods`） |
| `/nagaoka-workstyle-gateway.html` | ゲートウェイページ |
| `/nagaoka-workstyle-spec.html` | 仕様書ページ（HTML版） |

### スラッグ連携について

各HTMLファイルの「応募する」ボタンは、`</body>` 直前に挿入したJSにより `/apply/company/[スラッグ]` にリダイレクトする。

**実際の企業が登録されたら**、HTMLファイル内の `COMPANY_SLUG` 変数を実際のスラッグに書き換えること。

```javascript
var COMPANY_SLUG = 'sample-seisakusho'; // ← 登録した企業のスラッグに変更する
```

---

## 13. デザイントークン

`globals.css` で定義されたCSS変数:

```css
:root {
  --primary:      #2ea7c8;  /* メインカラー（青緑） */
  --primary-dark: #1d8aab;  /* ホバー時の濃いメインカラー */
  --accent:       #ff6b35;  /* アクセントカラー（オレンジ） */
  --dark:         #1a2332;  /* テキスト・ダーク背景 */
  --background:   #f8fbfd;  /* ページ背景 */
  --foreground:   #1a2332;  /* デフォルト文字色 */
}
```

**フォント**: `'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif`

**共通UIパターン**:
- カード: `bg-white rounded-2xl p-6 shadow-sm`
- 入力欄: `border border-gray-200 rounded-xl focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20`
- プライマリボタン: `bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark]`
- セカンダリボタン: `border-2 border-gray-200 text-gray-600 font-bold rounded-xl`

---

## 14. 今後の追加実装候補

| 機能 | 概要 | 難易度 |
|------|------|--------|
| 企業ロゴ画像 | Supabase Storage でロゴ画像をアップロード・表示 | 中 |
| HTMLスラッグ連携 | 掲載企業が決まったらHTMLの `COMPANY_SLUG` を変更 | 低 |
| Resend ドメイン認証 | 独自ドメインで全ユーザーにメール送信可能にする | 低 |
| 公開求人検索 | `/jobs` にキーワード検索を追加 | 中 |
| カスタムドメイン | Vercel にカスタムドメインを設定 | 低 |

---

*仕様書バージョン: 2.0 / 最終更新: 2026-03-23*
