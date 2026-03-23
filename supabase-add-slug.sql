-- companiesテーブルにslugカラムを追加
-- Supabase SQL Editor で実行してください

alter table public.companies add column if not exists slug text unique;

-- インデックスを追加（検索高速化）
create index if not exists companies_slug_idx on public.companies(slug);
