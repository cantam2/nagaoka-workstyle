# Nagaoka Workstyle — Manus向け実装計画書

> 本ドキュメントは、Claude Code が構築した「長岡ワークスタイル」の仕様を Manus が実装・拡張できるよう再構成したものです。
> コードは実装・デプロイ済み。本書はその継続・拡張・再現を目的とします。

---

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| サービス名 | Nagaoka Workstyle（長岡ワークスタイル） |
| 目的 | 長岡市内の企業と求職者・学生をつなぐ地域密着型の求人・インターンポータル |
| 本番URL | https://nagaoka-workstyle.vercel.app |
| リポジトリ | https://github.com/cantam2/nagaoka-workstyle |
| 現在のステータス | **コア機能は実装・デプロイ済み。初期設定3項目が未完了。** |

### 技術スタック

| 分類 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js（App Router） | 16.2.1 |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | v4 |
| DB・認証 | Supabase（PostgreSQL + Auth） | 最新 |
| Supabaseクライアント | @supabase/ssr | 最新 |
| メール送信 | Resend | 最新 |
| ホスティング | Vercel | — |

### 実装上の必須知識（注意点）

- Next.js 16 では `middleware.ts` ではなく `proxy.ts` を使い、export 関数名も `proxy` にする
- React 19 では `React.FormEvent` が非推奨。フォームハンドラの型は `{ preventDefault(): void }` にする
- Supabase クライアントに `<Database>` ジェネリクスを渡すと型が `never` になる。ジェネリクスは使わず `as TypeName` でキャストする
- Tailwind CSS v4 では `@import "tailwindcss"` のみ記述（`@tailwind base` 等は不要）
- Resend はモジュールレベルで `new Resend(key)` するとビルド時エラー。関数内で初期化する（遅延初期化）

---

## 2. MVP（実装済み）

以下はすべて **コード実装・本番デプロイ完了** している機能です。

### 認証・ユーザー管理
- [x] メール/パスワード認証（Supabase Auth）
- [x] サインアップ時のロール選択（求職者 / 企業担当者）
- [x] ログイン後のロール別リダイレクト
- [x] パスワードリセット（メール送信）
- [x] 未認証ユーザーのダッシュボードへのアクセス制限（proxy.ts）

### 公開ページ（ログイン不要）
- [x] トップページ（求人数・企業数のリアルタイム表示）
- [x] 求人一覧 `/jobs`（雇用形態・業種フィルタ付き）
- [x] 企業一覧 `/companies`（業種フィルタ付き）
- [x] 企業別応募起点ページ `/apply/company/[slug]`
- [x] 求人詳細・応募フォーム `/apply/job/[id]`
- [x] インターン詳細・応募フォーム `/apply/internship/[id]`

### 管理者機能（admin）
- [x] 管理者ダッシュボード（統計カード・未承認企業一覧）
- [x] 企業の承認 / 承認取消
- [x] ユーザー一覧・ロール変更
- [x] 求人の公開/非公開切替
- [x] 全応募一覧の閲覧

### 企業機能（company）
- [x] 企業プロフィール登録・編集（スラッグ自動生成含む）
- [x] 求人の作成・編集・削除
- [x] インターンシップの作成・編集・削除
- [x] 応募一覧の閲覧・ステータス変更（未確認 / 審査中 / 合格 / 不合格）

### 求職者機能（jobseeker）
- [x] プロフィール編集（名前・電話番号）
- [x] 求人・インターンへの応募（メッセージ付き）
- [x] 応募履歴・ステータス確認
- [x] 企業のお気に入り登録・解除

### メール通知
- [x] 応募時 → 企業担当者に通知
- [x] 企業承認時 → 企業担当者に通知
- [x] ステータス変更時 → 求職者に通知

### HTMLページ連携
- [x] 既存の静的HTMLを `public/` に配置（同一オリジン配信）
- [x] HTMLの「応募する」ボタンを JS で上書きし `/apply/company/[slug]` にリダイレクト

---

## 3. 非MVP（未実装・今後の対応）

以下は実装されていない機能です。優先度の高いものから記載します。

| 機能 | 概要 | 優先度 |
|------|------|--------|
| 企業ロゴ画像アップロード | Supabase Storage を使って企業ロゴを登録・表示 | 中 |
| HTMLページのスラッグ連携 | 掲載企業が決まったら HTML 内の `COMPANY_SLUG` を実際の値に変更 | 低（企業登録後） |
| Resend 独自ドメイン認証 | 送信元を `noreply@独自ドメイン` にする | 低（ドメイン取得後） |
| カスタムドメイン設定 | Vercel にカスタムドメインを紐付け | 低 |
| 求人キーワード検索 | `/jobs` にテキスト検索を追加 | 低 |
| 管理者作成UI | `/admin/users` からロール変更する代わりに招待フローを実装 | 低 |

---

## 4. ユーザーと利用目的

| ロール | 登録方法 | 主な利用目的 |
|--------|---------|------------|
| `admin`（管理者） | サインアップ後、DB で手動ロール変更 | 企業の承認・ユーザー管理・求人の監視 |
| `company`（企業担当者） | `/signup` でロール選択 → 管理者承認後に求人掲載可 | 企業情報・求人・インターン登録と応募管理 |
| `jobseeker`（求職者・学生） | `/signup` でロール選択 | 求人検索・応募・お気に入り管理 |

### ロール制御の仕組み

1. サインアップ時に `raw_user_meta_data.role` を Supabase に渡す
2. DB トリガー（`handle_new_user`）が `profiles` テーブルにロールを自動書き込み
3. `proxy.ts` が `/admin`, `/company`, `/jobseeker` への未認証アクセスを `/login` にリダイレクト
4. 各ダッシュボードページは `profiles.role` を確認してロール別UIを表示

---

## 5. 画面一覧

### 公開画面（認証不要）

| 画面名 | パス | 概要 |
|--------|------|------|
| トップ | `/` | 求人数・企業数表示、求人/企業一覧へのCTA |
| 求人一覧 | `/jobs` | 全公開求人。雇用形態・業種でフィルタ |
| 企業一覧 | `/companies` | 全承認済み企業。業種でフィルタ |
| 企業応募起点 | `/apply/company/[slug]` | 企業ページ。求人/インターン一覧表示 |
| 求人詳細・応募 | `/apply/job/[id]` | 求人詳細 + 応募フォーム |
| インターン詳細・応募 | `/apply/internship/[id]` | インターン詳細 + 応募フォーム |

### 認証画面

| 画面名 | パス | 概要 |
|--------|------|------|
| ログイン | `/login` | メール/パスワードでログイン |
| 新規登録 | `/signup` | ロール選択→名前・メール・パスワード |
| パスワードリセット | `/reset-password` | リセットメール送信 |

### 管理者画面（admin）

| 画面名 | パス | 概要 |
|--------|------|------|
| ダッシュボード | `/admin` | 統計カード・未承認企業一覧 |
| 企業一覧 | `/admin/companies` | 全企業リスト + 承認バッジ |
| 企業詳細 | `/admin/companies/[id]` | 企業全情報 + 承認/取消ボタン |
| ユーザー一覧 | `/admin/users` | 全ユーザー + ロール変更 |
| 求人一覧 | `/admin/jobs` | 全求人 + 公開/非公開トグル |
| 応募一覧 | `/admin/applications` | 全応募一覧 |

### 企業画面（company）

| 画面名 | パス | 概要 |
|--------|------|------|
| ダッシュボード | `/company` | 求人数・応募数サマリー |
| 企業情報編集 | `/company/profile` | 企業登録・編集（スラッグ付き） |
| 求人作成 | `/company/jobs/new` | 求人新規作成 |
| 求人編集 | `/company/jobs/[id]/edit` | 求人編集 |
| インターン作成 | `/company/internships/new` | インターン新規作成 |
| インターン編集 | `/company/internships/[id]/edit` | インターン編集 |
| 応募詳細 | `/company/applications/[id]` | 応募者情報 + ステータス変更 |

### 求職者画面（jobseeker）

| 画面名 | パス | 概要 |
|--------|------|------|
| ダッシュボード | `/jobseeker` | 応募数・お気に入り数サマリー |
| プロフィール | `/jobseeker/profile` | 名前・電話番号編集 |
| 応募履歴 | `/jobseeker/applications` | 応募済み一覧 + ステータス |
| お気に入り | `/jobseeker/bookmarks` | お気に入り企業一覧 + 解除 |

---

## 6. 機能要件

### 認証

| # | 要件 |
|---|------|
| A-1 | メール/パスワードで新規登録できる |
| A-2 | 登録時にロール（求職者 / 企業担当者）を選択できる |
| A-3 | ログイン後、ロールに応じたダッシュボードに自動リダイレクトされる |
| A-4 | パスワードリセットメールを送信できる |
| A-5 | ログアウトできる |
| A-6 | 未認証ユーザーはダッシュボード系パスにアクセスできない |

### 企業登録・承認フロー

| # | 要件 |
|---|------|
| C-1 | `company` ロールのユーザーは企業情報を登録・編集できる |
| C-2 | 企業名を入力するとURLスラッグが自動生成される（英数字+ハイフン） |
| C-3 | スラッグは手動上書き可能。DB 上でユニーク制約あり |
| C-4 | 新規登録した企業は `is_approved = false` で管理者承認待ちになる |
| C-5 | 管理者が承認すると `is_approved = true` になり公開される |
| C-6 | 承認時に企業担当者へメール通知が届く |
| C-7 | 承認済みの企業のみ求人・インターンを公開できる |

### 求人・インターン

| # | 要件 |
|---|------|
| J-1 | 企業担当者は求人を作成・編集・削除できる |
| J-2 | 求人には雇用形態（正社員/パート/契約/インターン）を設定できる |
| J-3 | 求人には「アピールタグ」をプリセットから複数選択 + カスタム追加できる |
| J-4 | 求人は公開/非公開をワンクリックで切替できる |
| J-5 | 企業担当者はインターンシッププログラムを作成・編集できる |
| J-6 | 公開中の求人・インターンのみ `/jobs`、`/apply/company/[slug]` に表示される |

### 応募フロー

| # | 要件 |
|---|------|
| AP-1 | 求職者は求人・インターンに応募できる（名前・電話番号・メッセージ） |
| AP-2 | 応募時に企業担当者へメール通知が届く |
| AP-3 | 同じ求人への二重応募はできない（応募済み表示） |
| AP-4 | 企業担当者は応募のステータスを変更できる（未確認/審査中/合格/不合格） |
| AP-5 | ステータス変更時に求職者へメール通知が届く |
| AP-6 | 求職者は応募履歴とステータスを確認できる |

### 公開検索

| # | 要件 |
|---|------|
| S-1 | 非ログインユーザーが `/jobs` で求人を閲覧できる |
| S-2 | 雇用形態ボタン・業種プルダウンで求人を絞り込める |
| S-3 | 非ログインユーザーが `/companies` で企業を閲覧できる |
| S-4 | 業種タブで企業を絞り込める |

---

## 7. データ設計

### テーブル一覧

| テーブル | 主キー | 説明 |
|---------|--------|------|
| `profiles` | `id` (= auth.users.id) | ユーザープロフィール。auth.users と 1:1 |
| `companies` | `id` (uuid) | 企業情報 |
| `job_listings` | `id` (uuid) | 求人情報 |
| `internship_programs` | `id` (uuid) | インターン情報 |
| `applications` | `id` (uuid) | 応募情報 |
| `bookmarks` | `id` (uuid) | お気に入り（求職者×企業） |

### Enum 型

```sql
create type public.role as enum ('admin', 'company', 'jobseeker');
create type public.application_status as enum ('pending', 'reviewing', 'accepted', 'rejected');
create type public.employment_type as enum ('fulltime', 'parttime', 'contract', 'internship');
```

### 主要カラム定義

#### profiles
```sql
id          uuid  primary key (= auth.users.id)
role        enum  'admin' | 'company' | 'jobseeker'  default 'jobseeker'
name        text
phone       text
avatar_url  text
```

#### companies
```sql
id              uuid  primary key
profile_id      uuid  references profiles(id)   -- 企業担当者のユーザーID
name            text  not null
slug            text  unique                      -- ※ supabase-add-slug.sql で追加
industry        text
description     text
logo_url        text                              -- 未実装
location        text
employee_count  text  -- '1〜10名' | '11〜50名' | ...
founded_year    integer
website_url     text
is_approved     boolean  default false
```

#### job_listings
```sql
id                uuid  primary key
company_id        uuid  references companies(id)
title             text  not null
catchcopy         text
employment_type   enum  'fulltime' | 'parttime' | 'contract' | 'internship'
salary_min        integer
salary_max        integer
salary_description text
location          text
description       text
requirements      text
benefits          text
appeal_tags       text[]  default '{}'
is_published      boolean  default false
```

#### internship_programs
```sql
id           uuid  primary key
company_id   uuid  references companies(id)
title        text  not null
duration     text
description  text
requirements text
capacity     integer
is_published boolean  default false
```

#### applications
```sql
id              uuid  primary key
jobseeker_id    uuid  references profiles(id)
job_listing_id  uuid  references job_listings(id)    -- どちらか必須
internship_id   uuid  references internship_programs(id)
status          enum  'pending' | 'reviewing' | 'accepted' | 'rejected'
message         text
```
制約: `job_listing_id` か `internship_id` のどちらか一方は必ず non-null

#### bookmarks
```sql
id           uuid  primary key
jobseeker_id uuid  references profiles(id)
company_id   uuid  references companies(id)
unique(jobseeker_id, company_id)
```

### RLS ポリシー概要

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| profiles | 全員 | — | 本人のみ | — |
| companies | 承認済みまたは管理者 | companyロールのみ | 自社のみ | — |
| job_listings | 公開中または自社担当者 | 自社のみ | 自社のみ | 自社のみ |
| internship_programs | 公開中または自社担当者 | 自社のみ | 自社のみ | 自社のみ |
| applications | 自分の応募または自社への応募 | 求職者のみ | 自社への応募（企業） | — |
| bookmarks | 自分のみ | 自分のみ | — | 自分のみ |

---

## 8. API 要件

### 認証 API

| メソッド | パス | 処理 |
|---------|------|------|
| POST | `/api/auth/signout` | Supabase セッションを削除してログアウト |

### メール通知 API

すべて `POST` メソッド。クライアントから fire & forget で呼び出す（失敗しても操作フローに影響しない）。

| パス | リクエストボディ | 処理 |
|------|---------------|------|
| `/api/notify/apply` | `{ applicationId: string }` | 応募IDから企業担当者メールを取得してResendで送信 |
| `/api/notify/approved` | `{ companyId: string }` | 企業IDから担当者メールを取得してResendで送信 |
| `/api/notify/status` | `{ applicationId: string, status: string }` | 応募IDから求職者メールを取得してResendで送信 |

### メール取得の仕組み

ユーザーのメールアドレスは Supabase の `auth.users` テーブルに格納されており、anon キーでは取得不可。
APIルート内で **サービスロールクライアント**（`admin.ts`）を使って `admin.auth.admin.getUserById(userId)` で取得する。

```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // サーバーサイドのみ
  )
}
```

---

## 9. 非機能要件

| 項目 | 要件 |
|------|------|
| レスポンシブ | スマートフォン・タブレット・PC すべてで動作 |
| 認証セキュリティ | RLS により他ユーザーのデータに直接アクセス不可 |
| メール送信 | 送信失敗は操作フローをブロックしない（fire & forget） |
| サービスロールキー | サーバーサイド（APIルート）のみで使用。クライアントに露出しない |
| ビルド | `npm run build` でエラー・型エラーゼロ |
| デプロイ | GitHub push 時に Vercel が自動デプロイ |

---

## 10. 受け入れ条件

### 認証
- [ ] `/signup` で求職者・企業担当者それぞれ登録でき、ロール別ダッシュボードにリダイレクトされる
- [ ] 未ログインで `/admin`・`/company`・`/jobseeker` にアクセスすると `/login` にリダイレクトされる

### 企業フロー
- [ ] 企業担当者が `/company/profile` で企業を登録すると `is_approved = false` で保存される
- [ ] 管理者が承認すると企業担当者にメールが届く
- [ ] 承認後、企業が `/companies` に表示される

### 求人フロー
- [ ] 企業担当者が求人を作成・公開すると `/jobs` に表示される
- [ ] 非ログインユーザーが `/jobs` を閲覧・フィルタできる

### 応募フロー
- [ ] 求職者が応募すると企業担当者にメールが届く
- [ ] 企業担当者がステータスを変更すると求職者にメールが届く
- [ ] 求職者の応募履歴にステータスが表示される

### メール通知
- [ ] Resend ダッシュボードの「Emails」タブに送信ログが記録される

---

## 11. 要確認事項

以下の項目は仕様から読み取れなかった、または今後の決定が必要な事項です。

| # | 項目 | 状況 |
|---|------|------|
| Q-1 | **管理者アカウントの運用方法** | 現在は「サインアップ後に DB で手動ロール変更」。管理者が増える場合の招待フローが未定 |
| Q-2 | **Resend の送信ドメイン** | 現在は `onboarding@resend.dev`（自分のメールにしか送れない）。本番運用では独自ドメインの Resend 認証が必要 |
| Q-3 | **HTMLページのスラッグ** | 現在 `sample-seisakusho` / `nagaoka-tech` / `echigo-foods` が埋め込まれているが、実際に掲載する企業が未定。企業登録後に HTML を書き換える必要あり |
| Q-4 | **カスタムドメイン** | 現在は `nagaoka-workstyle.vercel.app`。独自ドメインの取得・設定予定は未定 |
| Q-5 | **企業ロゴ** | 現在は企業名の頭文字で代替。画像アップロード機能の実装予定は未定 |
| Q-6 | **Supabase のメール確認** | デフォルトで有効。テスト中は無効化推奨。本番でのメール文面カスタマイズ要否が未定 |
| Q-7 | **応募キャンセル機能** | 現在は「応募後にキャンセル不可」の設計。変更要否が未定 |
| Q-8 | **求人の削除機能** | 管理者・企業担当者からの削除 UI が未実装（DB には cascade delete あり）|

---

## 12. Manus 向け実装タスク分解

### フェーズ 0：環境セットアップ（コードなし・設定のみ）

> これが完了するまでサービスが正常に動作しない

- [ ] **T-0-1** Supabase SQL Editor で `supabase-schema.sql` を実行
- [ ] **T-0-2** Supabase SQL Editor で `supabase-add-slug.sql` を実行
  ```sql
  alter table public.companies add column if not exists slug text unique;
  create index if not exists companies_slug_idx on public.companies(slug);
  ```
- [ ] **T-0-3** Supabase → Authentication → URL Configuration を設定
  - Site URL: `https://nagaoka-workstyle.vercel.app`
  - Redirect URLs: `https://nagaoka-workstyle.vercel.app/**`
- [ ] **T-0-4** 初回管理者アカウントを作成
  1. `/signup` で任意のアカウント登録
  2. Supabase → Table Editor → profiles → `role` を `admin` に変更
- [ ] **T-0-5** Vercel に `RESEND_API_KEY` 環境変数を追加 → Redeploy

---

### フェーズ 1：動作確認

- [ ] **T-1-1** 求職者・企業担当者それぞれでサインアップし、ダッシュボードに入れることを確認
- [ ] **T-1-2** 管理者アカウントで `/admin` にアクセスし、統計カードが表示されることを確認
- [ ] **T-1-3** 企業担当者で企業情報・求人を登録し、管理者が承認できることを確認
- [ ] **T-1-4** 求職者で `/jobs` から応募し、企業担当者・求職者にメールが届くことを確認
- [ ] **T-1-5** Resend ダッシュボードで送信ログを確認

---

### フェーズ 2：拡張実装（非MVP）

#### T-2-1: 企業ロゴ画像アップロード

1. Supabase Storage にバケット `company-logos` を作成（公開読み取り ON）
2. Storage 用 RLS ポリシーを追加（企業担当者のみアップロード可）
3. `/company/profile` に画像アップロード UI を追加
4. `companies.logo_url` に保存し、`/companies` 等で表示切替

#### T-2-2: HTMLスラッグ連携

掲載企業が確定したら以下を実施：

1. 企業担当者が `/company/profile` でスラッグを登録
2. 対応するHTMLファイルの `COMPANY_SLUG` 変数を書き換え
   ```javascript
   var COMPANY_SLUG = '実際のスラッグ'; // 例: 'nagaoka-seisakusho'
   ```
3. `git push` → Vercel が自動デプロイ

対象ファイル：
- `public/nagaoka-workstyle-detail.html` → 現在 `sample-seisakusho`
- `public/nagaoka-workstyle-detail-nagaoka-tech.html` → 現在 `nagaoka-tech`
- `public/nagaoka-workstyle-detail-echigo-foods.html` → 現在 `echigo-foods`

#### T-2-3: Resend 独自ドメイン認証

1. Resend ダッシュボード → Domains → ドメインを追加
2. DNS レコードを設定
3. 環境変数 `EMAIL_FROM` を設定
   ```
   EMAIL_FROM=Nagaoka Workstyle <noreply@your-domain.com>
   ```
4. Vercel に `EMAIL_FROM` を追加 → Redeploy

---

## 13. Manus 初回投入用プロンプト

以下をそのまま Manus に投入してください。

---

```
あなたは「長岡ワークスタイル（Nagaoka Workstyle）」という求人ポータルサイトの開発を継続するエンジニアです。

## 現在の状況

コアとなる実装はすべて完了し、Vercel にデプロイ済みです。

- 本番URL: https://nagaoka-workstyle.vercel.app
- リポジトリ: https://github.com/cantam2/nagaoka-workstyle

## 技術スタック

- Next.js 16.2.1（App Router）+ TypeScript
- Tailwind CSS v4
- Supabase（PostgreSQL + Auth）
- Resend（メール送信）
- Vercel（ホスティング）

## 重要な実装上の制約

- Next.js 16 では `middleware.ts` ではなく `src/proxy.ts` を使い、export 関数名は `proxy`
- React 19 ではフォームハンドラの型は `{ preventDefault(): void }`（React.FormEvent は非推奨）
- Supabase クライアントにジェネリクスを渡すと型が never になる。`as TypeName` でキャスト
- Tailwind CSS v4 では `@import "tailwindcss"` のみ（@tailwind base 等は不要）
- Resend は関数内で `new Resend(key)` する（モジュールレベルで初期化するとビルドエラー）

## ロール設計

- admin: 企業承認・ユーザー管理
- company: 求人・インターン管理・応募受付
- jobseeker: 求人閲覧・応募・お気に入り

## あなたが最初にやること

以下の順番でセットアップを確認・実施してください：

1. リポジトリをクローンし、`npm install` を実行
2. `.env.local` に以下の環境変数を設定：
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - RESEND_API_KEY
3. Supabase SQL Editor で以下を実行（未実施の場合）：
   - `supabase-schema.sql`（全テーブル作成）
   - `supabase-add-slug.sql`（slugカラム追加）
4. Supabase → Authentication → URL Configuration を設定
5. 初回管理者アカウントを作成（signup → profiles.role を admin に変更）
6. `npm run build` でビルドエラーがないことを確認

## 今後のタスク（優先度順）

1. 上記セットアップの完了・動作確認
2. 企業ロゴ画像アップロード機能（Supabase Storage 使用）
3. HTMLページのスラッグを実際の企業スラッグに書き換え
4. Resend の独自ドメイン認証設定

詳細な仕様は `SPEC_MANUS.md` を参照してください。
```

---

*ドキュメントバージョン: 1.0 / 作成日: 2026-03-23*
*原仕様書: SPEC.md v2.0 をベースに Manus 向けに再構成*
