-- =====================================================
-- Nagaoka Workstyle — Database Schema
-- Supabase SQL Editor で実行してください
-- =====================================================

-- Enum types（既存でもエラーにならない）
do $$ begin
  create type public.role as enum ('admin', 'company', 'jobseeker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('pending', 'reviewing', 'accepted', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.employment_type as enum ('fulltime', 'parttime', 'contract', 'internship');
exception when duplicate_object then null; end $$;

-- =====================================================
-- profiles（ユーザープロフィール）
-- auth.users と 1:1 で対応
-- =====================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.role not null default 'jobseeker',
  name        text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- profiles を auth.users 登録時に自動作成
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'jobseeker')::public.role,
    new.raw_user_meta_data->>'name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- companies（企業情報）
-- =====================================================
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
  is_approved     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =====================================================
-- job_listings（求人情報）
-- =====================================================
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

-- =====================================================
-- internship_programs（インターンシップ）
-- =====================================================
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

-- =====================================================
-- applications（応募）
-- =====================================================
create table public.applications (
  id              uuid primary key default gen_random_uuid(),
  jobseeker_id    uuid not null references public.profiles(id) on delete cascade,
  job_listing_id  uuid references public.job_listings(id) on delete cascade,
  internship_id   uuid references public.internship_programs(id) on delete cascade,
  status          public.application_status not null default 'pending',
  message         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- 求人かインターンシップのどちらか必須
  constraint applications_target_check check (
    (job_listing_id is not null) or (internship_id is not null)
  )
);

-- =====================================================
-- bookmarks（お気に入り）
-- =====================================================
create table public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  jobseeker_id  uuid not null references public.profiles(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(jobseeker_id, company_id)
);

-- =====================================================
-- updated_at 自動更新トリガー
-- =====================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_companies_updated_at
  before update on public.companies
  for each row execute procedure public.set_updated_at();

create trigger set_job_listings_updated_at
  before update on public.job_listings
  for each row execute procedure public.set_updated_at();

create trigger set_internship_programs_updated_at
  before update on public.internship_programs
  for each row execute procedure public.set_updated_at();

create trigger set_applications_updated_at
  before update on public.applications
  for each row execute procedure public.set_updated_at();

-- =====================================================
-- RLS（Row Level Security）ポリシー
-- =====================================================

-- profiles
alter table public.profiles enable row level security;

create policy "自分のプロフィールは誰でも閲覧可"
  on public.profiles for select using (true);

create policy "自分のプロフィールのみ編集可"
  on public.profiles for update using (auth.uid() = id);

-- companies
alter table public.companies enable row level security;

create policy "承認済み企業は誰でも閲覧可"
  on public.companies for select using (is_approved = true);

create policy "管理者は全企業を閲覧可"
  on public.companies for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "企業担当者は自社のみ更新可"
  on public.companies for update using (profile_id = auth.uid());

create policy "企業ロールは企業情報を作成可"
  on public.companies for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'company')
  );

-- job_listings
alter table public.job_listings enable row level security;

create policy "公開求人は誰でも閲覧可"
  on public.job_listings for select using (is_published = true);

create policy "自社求人は企業担当者が全件閲覧可"
  on public.job_listings for select using (
    exists (
      select 1 from public.companies
      where id = company_id and profile_id = auth.uid()
    )
  );

create policy "自社求人のみ作成・更新・削除可"
  on public.job_listings for all using (
    exists (
      select 1 from public.companies
      where id = company_id and profile_id = auth.uid()
    )
  );

-- internship_programs
alter table public.internship_programs enable row level security;

create policy "公開インターンは誰でも閲覧可"
  on public.internship_programs for select using (is_published = true);

create policy "自社インターンのみ作成・更新・削除可"
  on public.internship_programs for all using (
    exists (
      select 1 from public.companies
      where id = company_id and profile_id = auth.uid()
    )
  );

-- applications
alter table public.applications enable row level security;

create policy "自分の応募のみ閲覧・作成可（求職者）"
  on public.applications for select using (jobseeker_id = auth.uid());

create policy "応募は求職者のみ作成可"
  on public.applications for insert with check (jobseeker_id = auth.uid());

create policy "自社への応募は企業担当者が閲覧可"
  on public.applications for select using (
    exists (
      select 1 from public.job_listings jl
      join public.companies c on jl.company_id = c.id
      where jl.id = job_listing_id and c.profile_id = auth.uid()
    )
    or
    exists (
      select 1 from public.internship_programs ip
      join public.companies c on ip.company_id = c.id
      where ip.id = internship_id and c.profile_id = auth.uid()
    )
  );

create policy "企業担当者は応募ステータスを更新可"
  on public.applications for update using (
    exists (
      select 1 from public.job_listings jl
      join public.companies c on jl.company_id = c.id
      where jl.id = job_listing_id and c.profile_id = auth.uid()
    )
  );

-- bookmarks
alter table public.bookmarks enable row level security;

create policy "自分のお気に入りのみ操作可"
  on public.bookmarks for all using (jobseeker_id = auth.uid());
