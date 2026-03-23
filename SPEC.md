# Nagaoka Workstyle — システム仕様書

> 長岡市向け求人・インターンシップポータルサイト
> 本仕様書は、別の生成AIやエンジニアが同等のシステムを再現できるよう、実装済み内容と追加実装事項をまとめたものです。

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [環境変数](#3-環境変数)
4. [ディレクトリ構成](#4-ディレクトリ構成)
5. [データベース設計](#5-データベース設計)
6. [認証・権限設計](#6-認証権限設計)
7. [ルーティング一覧](#7-ルーティング一覧)
8. [画面仕様（実装済み）](#8-画面仕様実装済み)
9. [追加実装事項](#9-追加実装事項)
10. [デプロイ構成](#10-デプロイ構成)
11. [HTMLページとの連携](#11-htmlページとの連携)
12. [デザイントークン](#12-デザイントークン)

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
| デプロイ | Vercel | — |

### 重要な実装上の注意点

- **Next.js 16** では `middleware.ts` の代わりに `proxy.ts` を使用し、エクスポート関数名も `proxy` にする
- **React 19** では `React.FormEvent` が非推奨。フォームハンドラの型は `{ preventDefault(): void }` を使用
- **Supabase クライアント** に `<Database>` ジェネリクスを渡すと型推論が `never` になるため、ジェネリクスは使用せず `as TypeName` で明示的にキャストする
- **Tailwind CSS v4** では `@import "tailwindcss"` を使用（v3 の `@tailwind base/components/utilities` は不要）

---

## 3. 環境変数

`.env.local` に以下を設定する（`.gitignore` で除外すること）

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

| 変数名 | 取得場所 |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase ダッシュボード → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase ダッシュボード → Settings → API → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase ダッシュボード → Settings → API → service_role |

---

## 4. ディレクトリ構成

```
nagaoka-workstyle/
├── public/                          # 静的ファイル（HTMLページを含む）
│   ├── nagaoka-workstyle-top.html
│   ├── nagaoka-workstyle-list.html
│   ├── nagaoka-workstyle-detail.html        # サンプル製作所
│   ├── nagaoka-workstyle-detail-nagaoka-tech.html
│   ├── nagaoka-workstyle-detail-echigo-foods.html
│   ├── nagaoka-workstyle-gateway.html
│   └── nagaoka-workstyle-spec.html
│
├── src/
│   ├── proxy.ts                     # 認証プロキシ（Next.js 16のmiddleware相当）
│   ├── types/
│   │   └── index.ts                 # 全テーブルのTypeScript型定義
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts            # ブラウザ用Supabaseクライアント
│   │       └── server.ts            # サーバー用Supabaseクライアント（async）
│   ├── components/
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
│       ├── page.tsx                 # トップページ（/）
│       ├── (auth)/                  # 認証ページグループ
│       │   ├── layout.tsx           # 認証共通レイアウト（ロゴ+AuthTabs+カード）
│       │   ├── login/page.tsx
│       │   ├── signup/page.tsx
│       │   └── reset-password/page.tsx
│       ├── (dashboard)/             # ダッシュボードページグループ
│       │   ├── admin/
│       │   │   ├── layout.tsx       # 管理者サイドバーレイアウト
│       │   │   ├── page.tsx         # 管理者ホーム
│       │   │   ├── companies/
│       │   │   │   ├── page.tsx     # 企業一覧
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx
│       │   │   │       └── ApprovalButton.tsx
│       │   │   ├── users/
│       │   │   │   ├── page.tsx     # ユーザー一覧
│       │   │   │   └── RoleChangeButton.tsx
│       │   │   ├── jobs/
│       │   │   │   ├── page.tsx     # 求人一覧
│       │   │   │   └── JobToggleButton.tsx
│       │   │   └── applications/
│       │   │       └── page.tsx     # 応募一覧
│       │   ├── company/
│       │   │   ├── page.tsx         # 企業ダッシュボードホーム
│       │   │   ├── profile/page.tsx # 企業情報編集
│       │   │   ├── jobs/
│       │   │   │   ├── new/page.tsx
│       │   │   │   └── [id]/edit/page.tsx
│       │   │   ├── internships/
│       │   │   │   ├── new/page.tsx
│       │   │   │   └── [id]/edit/page.tsx
│       │   │   └── applications/
│       │   │       └── [id]/
│       │   │           ├── page.tsx
│       │   │           └── StatusForm.tsx
│       │   └── jobseeker/
│       │       ├── page.tsx         # 求職者ホーム
│       │       ├── profile/page.tsx # プロフィール編集
│       │       ├── applications/page.tsx
│       │       └── bookmarks/
│       │           ├── page.tsx
│       │           └── BookmarkRemoveButton.tsx
│       ├── apply/                   # 非ログインでも閲覧可能な応募起点ページ
│       │   ├── company/[slug]/page.tsx   # 企業の求人一覧（slugでアクセス）
│       │   ├── job/[id]/page.tsx         # 求人詳細 + 応募フォーム
│       │   └── internship/[id]/page.tsx  # インターン詳細 + 応募フォーム
│       └── api/
│           └── auth/signout/route.ts     # ログアウトAPIルート
│
├── supabase-schema.sql              # 初回DB構築用SQL（全テーブル+RLS）
├── supabase-add-slug.sql            # slugカラム追加用SQL（ALTER TABLE）
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
  role        public.role not null default 'jobseeker',  -- 'admin' | 'company' | 'jobseeker'
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
  industry        text,        -- '製造業' | '食品・飲料' | 'IT・情報通信' など
  description     text,
  logo_url        text,        -- 【未実装】Supabase Storageの画像URL
  location        text,
  employee_count  text,        -- '1〜10名' | '11〜50名' など選択肢
  founded_year    integer,
  website_url     text,
  slug            text unique, -- URLスラッグ（/apply/company/[slug] に使用）
  is_approved     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
-- slugカラムはsupabase-add-slug.sqlで追加（ALTER TABLE）
```
> **注意**: `slug` カラムは `supabase-schema.sql` には含まれていません。`supabase-add-slug.sql` を別途実行してください。

#### job_listings
```sql
create table public.job_listings (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  title               text not null,
  catchcopy           text,             -- キャッチコピー
  employment_type     public.employment_type not null default 'fulltime',
                                        -- 'fulltime' | 'parttime' | 'contract' | 'internship'
  salary_min          integer,          -- 月給下限（円）
  salary_max          integer,          -- 月給上限（円）
  salary_description  text,             -- 給与補足説明
  location            text,
  description         text,             -- 仕事内容
  requirements        text,             -- 応募資格
  benefits            text,             -- 福利厚生
  appeal_tags         text[] not null default '{}',  -- アピールタグ（例: ['地域密着', '子育て支援']）
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
  duration      text,      -- 例: '3日間' | '1週間' | '2週間〜1ヶ月'
  description   text,
  requirements  text,
  capacity      integer,   -- 定員人数
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
                  -- 'pending' | 'reviewing' | 'accepted' | 'rejected'
  message         text,  -- 応募メッセージ
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
| profiles | SELECT | 全員（認証不要） |
| profiles | UPDATE | 本人のみ（`auth.uid() = id`） |
| companies | SELECT | 承認済み（`is_approved = true`）または管理者 |
| companies | INSERT | `company` ロールのユーザーのみ |
| companies | UPDATE | 自社のみ（`profile_id = auth.uid()`） |
| job_listings | SELECT | 公開中（`is_published = true`）または自社担当者 |
| job_listings | ALL | 自社求人のみ |
| internship_programs | SELECT | 公開中または自社担当者 |
| internship_programs | ALL | 自社インターンのみ |
| applications | SELECT | 自分の応募（求職者）または自社への応募（企業） |
| applications | INSERT | 求職者のみ（`jobseeker_id = auth.uid()`） |
| applications | UPDATE | 自社への応募のみ（企業が選考ステータスを更新） |
| bookmarks | ALL | 自分のお気に入りのみ |

---

## 6. 認証・権限設計

### 認証フロー

1. Supabase Auth（メール/パスワード認証）を使用
2. サインアップ時にロール（`jobseeker` or `company`）を選択
3. `raw_user_meta_data.role` にロールを渡し、トリガーで `profiles` テーブルに自動反映
4. ログイン後はロールに応じてリダイレクト：
   - `admin` → `/admin`
   - `company` → `/company`
   - `jobseeker` → `/jobseeker`

### 認証プロキシ（proxy.ts）

`/admin`, `/company`, `/jobseeker` で始まるパスは未ログイン時に `/login` へリダイレクト。

```typescript
// src/proxy.ts
export async function proxy(request: NextRequest) { ... }
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

> Next.js 16 では `middleware.ts` + `export function middleware` ではなく、
> `proxy.ts` + `export function proxy` を使用する

### Supabaseクライアントの実装

```typescript
// src/lib/supabase/client.ts（ブラウザ用）
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// src/lib/supabase/server.ts（サーバーコンポーネント用）
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { ... }, setAll(cs) { ... } } }
  )
}
```

---

## 7. ルーティング一覧

| パス | 種別 | 説明 | アクセス制限 |
|------|------|------|------------|
| `/` | 静的 | トップページ | 全員 |
| `/login` | 静的 | ログイン | 全員 |
| `/signup` | 静的 | 新規登録 | 全員 |
| `/reset-password` | 静的 | パスワードリセット | 全員 |
| `/apply/company/[slug]` | 動的 | 企業の求人一覧（slug指定） | 全員 |
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
| `/jobseeker/profile` | 静的 | 求職者プロフィール編集 | jobseeker |
| `/jobseeker/applications` | 動的 | 応募履歴 | jobseeker |
| `/jobseeker/bookmarks` | 動的 | お気に入り企業一覧 | jobseeker |
| `/api/auth/signout` | API | ログアウト処理 | ログイン中 |

---

## 8. 画面仕様（実装済み）

### 8-1. 認証ページ群

**共通レイアウト** `(auth)/layout.tsx`
- ロゴ表示
- `AuthTabs`（ログイン/新規登録タブ）：`usePathname()` で現在地を判定しハイライト
- カード形式のラッパー

**ログインページ** `/login`
- メールアドレス + パスワード入力
- ログイン後、`profiles.role` を取得してロール別にリダイレクト
- 「パスワードを忘れた方」リンク

**新規登録ページ** `/signup`
- ロール選択（求職者 / 企業担当者）→選択後に入力フォームを表示
- 名前、メールアドレス、パスワード
- `raw_user_meta_data: { role, name }` をSupabaseに渡す

**パスワードリセット** `/reset-password`
- メールアドレス入力 → Supabase経由でリセットメール送信

---

### 8-2. 管理者ダッシュボード

**共通レイアウト** `(dashboard)/admin/layout.tsx`
- ダークカラーのサイドバー
- ナビゲーション: ホーム / 企業管理 / ユーザー管理 / 求人管理 / 応募管理
- ログアウトボタン

**管理者ホーム** `/admin`
- 統計カード: 企業数（承認済み/未承認）、ユーザー数、求人数、応募数
- 未承認企業の一覧（承認待ちアラート）

**企業一覧** `/admin/companies`
- 全企業をリスト表示（承認済み/未承認バッジ付き）
- 各企業の詳細ページへのリンク

**企業詳細** `/admin/companies/[id]`
- 企業の全情報表示
- 承認/取消ボタン（`ApprovalButton.tsx`）：クライアントコンポーネント、`router.refresh()` で即時反映

**ユーザー一覧** `/admin/users`
- 全ユーザーをリスト表示（名前、メール、ロール、登録日）
- ロール変更ドロップダウン（`RoleChangeButton.tsx`）

**求人一覧** `/admin/jobs`
- 全求人（企業名付き）をリスト表示
- 公開/非公開トグル（`JobToggleButton.tsx`）

**応募一覧** `/admin/applications`
- 全応募を表示（求職者名、求人名、ステータス、日付）

---

### 8-3. 企業ダッシュボード

**企業ホーム** `/company`
- 求人数・インターン数・応募数のサマリー
- 最近の応募一覧（5件）
- 企業未登録または未承認の場合は案内メッセージ

**企業情報編集** `/company/profile`
- 入力項目:
  - 企業名（必須）
  - URLスラッグ（企業名から自動生成、手動上書き可。英数字+ハイフンのみ）
  - 業種（選択: 製造業/食品・飲料/IT・情報通信/建設・土木/医療・福祉/教育・学習支援/小売業/飲食業/運輸・物流/サービス業/その他）
  - 所在地
  - 従業員数（選択: 1〜10名/11〜50名/51〜100名/101〜300名/301〜1000名/1001名以上）
  - 設立年（数値入力）
  - Webサイト（URL）
  - 企業紹介（テキストエリア）
- 新規登録時は管理者承認待ちメッセージを表示
- スラッグ確認用プレビュー: `/apply/company/{slug}`

**求人作成/編集** `/company/jobs/new`, `/company/jobs/[id]/edit`
- `JobForm.tsx` コンポーネントを使用
- 入力項目:
  - タイトル（必須）
  - キャッチコピー
  - 雇用形態（正社員/パート・アルバイト/契約社員/インターンシップ）
  - 月給下限・上限（数値）
  - 給与補足説明
  - 勤務地
  - 仕事内容（テキストエリア）
  - 応募資格（テキストエリア）
  - 福利厚生（テキストエリア）
  - アピールタグ（プリセットから複数選択 + カスタム入力）
  - 公開/非公開トグル

**インターン作成/編集** `/company/internships/new`, `/company/internships/[id]/edit`
- `InternshipForm.tsx` コンポーネントを使用
- 入力項目: タイトル、実施期間、説明、応募要件、定員、公開/非公開

**応募詳細** `/company/applications/[id]`
- 応募者情報（名前、電話番号）
- 応募対象（求人名またはインターン名）
- 応募メッセージ
- ステータス変更フォーム（`StatusForm.tsx`）: pending/reviewing/accepted/rejected

---

### 8-4. 求職者ダッシュボード

**求職者ホーム** `/jobseeker`
- プロフィール完了率
- 応募件数サマリー
- お気に入り企業数

**プロフィール編集** `/jobseeker/profile`
- 名前、電話番号

**応募履歴** `/jobseeker/applications`
- 応募した求人/インターンの一覧
- ステータスバッジ（選考中/書類確認中/採用/不採用）
- `?applied=1` クエリパラメータ付きでアクセスした場合、成功バナーを表示

**お気に入り** `/jobseeker/bookmarks`
- お気に入りした企業一覧
- `BookmarkRemoveButton.tsx` でお気に入り解除

---

### 8-5. 公開応募ページ

**企業の応募起点ページ** `/apply/company/[slug]`
- slugで企業を検索（`is_approved = true` の企業のみ）
- 企業情報（名前、業種、所在地、紹介文）
- 公開中の求人一覧
- 公開中のインターンシップ一覧
- ログイン/新規登録への誘導CTA
- `?type=job` または `?type=intern` で絞り込み表示可能

**求人詳細・応募** `/apply/job/[id]`
- 求人の全情報表示
- `ApplyForm.tsx`：名前・電話番号・応募メッセージを入力して応募
- 応募済みの場合は「応募済み」表示
- 未ログイン時はログイン誘導

**インターン詳細・応募** `/apply/internship/[id]`
- インターンの全情報表示
- `ApplyForm.tsx` と同じ応募フォーム

---

## 9. 追加実装事項

以下は **未実装** であり、追加開発が必要な機能です。

---

### 9-1. メール確認の設定

**現状**: Supabase はデフォルトでサインアップ時にメール確認が必要
**対応方法**:

**テスト環境（確認を無効化）**:
Supabase ダッシュボード → Authentication → Providers → Email → "Confirm email" をオフ

**本番環境（確認を有効化＋カスタムメール）**:
Supabase ダッシュボード → Authentication → Email Templates でメール文面を日本語にカスタマイズ

---

### 9-2. 企業ロゴ画像アップロード

**概要**: 現在は企業名の頭文字をアバターとして表示している。Supabase Storage を使って画像アップロード機能を追加する。

**実装手順**:

1. **Supabase Storage にバケット作成**
   - バケット名: `company-logos`
   - 公開読み取り: ON

2. **RLSポリシー追加**（Storage用）
   ```sql
   -- 全員が読み取り可能
   create policy "logos_public_read" on storage.objects
     for select using (bucket_id = 'company-logos');

   -- 企業担当者のみアップロード可能
   create policy "logos_company_upload" on storage.objects
     for insert with check (
       bucket_id = 'company-logos'
       and auth.uid()::text = (storage.foldername(name))[1]
     );
   ```

3. **`/company/profile/page.tsx` に画像アップロードUIを追加**
   ```typescript
   async function handleLogoUpload(file: File) {
     const ext = file.name.split('.').pop()
     const path = `${user.id}/logo.${ext}`
     const { data } = await supabase.storage
       .from('company-logos')
       .upload(path, file, { upsert: true })
     const { data: { publicUrl } } = supabase.storage
       .from('company-logos')
       .getPublicUrl(path)
     // companies テーブルの logo_url を更新
   }
   ```

4. **企業表示箇所で `logo_url` を `<img>` タグで表示**（現在は頭文字表示）

---

### 9-3. HTMLページのスラッグ連携

**概要**: `public/` フォルダのHTMLファイルに埋め込まれた企業スラッグと、データベースの企業スラッグを一致させる必要がある。

**現在の埋め込みスラッグ**:
| HTMLファイル | スラッグ |
|------------|---------|
| `nagaoka-workstyle-detail.html` | `sample-seisakusho` |
| `nagaoka-workstyle-detail-nagaoka-tech.html` | `nagaoka-tech` |
| `nagaoka-workstyle-detail-echigo-foods.html` | `echigo-foods` |

**対応手順**:
1. 企業担当者が `/company/profile` でスラッグを設定する
2. 設定したスラッグをHTMLファイルの `COMPANY_SLUG` 変数と一致させる
3. またはHTMLファイルの `COMPANY_SLUG` の値を、実際に登録した企業のスラッグに書き換える

**HTMLへのJS注入コード** (各詳細HTMLファイルの `</body>` 直前に挿入済み):
```javascript
<script>
var COMPANY_SLUG = 'sample-seisakusho'; // ← 実際のスラッグに合わせる
var _origOpenModal = openModal;
openModal = function(id) {
  if (id === 'applyModal') {
    window.location.href = '/apply/company/' + COMPANY_SLUG;
  } else { _origOpenModal(id); }
};
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[onclick*="インターン"]').forEach(function(el) {
    el.removeAttribute('onclick');
    el.href = '/apply/company/' + COMPANY_SLUG + '?type=intern';
  });
});
</script>
```

---

### 9-4. 初回管理者アカウント作成

**手順**:
1. `https://nagaoka-workstyle.vercel.app/signup` でアカウント登録（ロール: 求職者 で構わない）
2. Supabase ダッシュボード → **Table Editor** → `profiles` テーブル
3. 作成されたレコードの `role` 列を `admin` に変更
4. 以降は `/admin` にアクセス可能

---

### 9-5. 本番用Supabase Auth設定

Vercelデプロイ後、以下を設定する:

Supabase ダッシュボード → **Authentication → URL Configuration**

| 設定項目 | 値 |
|---------|---|
| Site URL | `https://nagaoka-workstyle.vercel.app` |
| Redirect URLs | `https://nagaoka-workstyle.vercel.app/**` |

---

### 9-6. （任意）求人一覧の公開ページ

現在、求職者がログインせずに求人を探せる公開ページが存在しない。
以下のようなページを追加することを推奨:

| パス | 説明 |
|------|------|
| `/jobs` | 公開中の全求人一覧（業種・雇用形態でフィルタ） |
| `/jobs/[id]` | 求人詳細（`/apply/job/[id]` にリダイレクトまたは統合） |
| `/companies` | 承認済み企業一覧 |

---

### 9-7. （任意）通知機能

- 企業が承認された際にメール通知
- 応募があった際に企業担当者にメール通知
- ステータスが変更された際に求職者にメール通知

実装方法: Supabase Edge Functions + SMTP（または Resend / SendGrid）

---

## 10. デプロイ構成

| 項目 | 内容 |
|------|------|
| ホスティング | Vercel |
| データベース | Supabase（PostgreSQL） |
| 認証 | Supabase Auth |
| ファイルストレージ | Supabase Storage（未実装） |
| ドメイン | nagaoka-workstyle.vercel.app（カスタムドメイン設定可） |

### Vercelの環境変数設定

Vercel ダッシュボード → Project → Settings → Environment Variables に以下を追加:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### DBの初期セットアップ手順

1. Supabase SQL Editor で `supabase-schema.sql` を実行
2. 続けて `supabase-add-slug.sql` を実行
3. Vercel に環境変数を設定してデプロイ
4. Supabase Auth の URL Configuration を更新
5. 管理者アカウントを手動で作成（前述の手順）

---

## 11. HTMLページとの連携

`public/` フォルダに静的HTMLファイルを置くことで、Next.jsアプリと同一オリジンで配信できる。

| HTMLファイルURL | 説明 |
|---------------|------|
| `/nagaoka-workstyle-top.html` | トップページ（HTML版） |
| `/nagaoka-workstyle-list.html` | 求人一覧（HTML版） |
| `/nagaoka-workstyle-detail.html` | 企業詳細（サンプル製作所） |
| `/nagaoka-workstyle-detail-nagaoka-tech.html` | 企業詳細（長岡テック） |
| `/nagaoka-workstyle-detail-echigo-foods.html` | 企業詳細（越後フーズ） |
| `/nagaoka-workstyle-gateway.html` | ゲートウェイページ |
| `/nagaoka-workstyle-spec.html` | 仕様書ページ（HTML版） |

HTMLファイル内の「応募する」ボタンは JavaScript の上書きにより `/apply/company/[slug]` にリダイレクトする（前述のJS注入コードを参照）。

---

## 12. デザイントークン

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

*仕様書バージョン: 1.0 / 作成日: 2026-03-23*
