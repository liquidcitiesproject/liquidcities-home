-- Liquid Cities 홈페이지 — 블로그/에세이 글 테이블
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 1회 실행.
-- 프로젝트: yntccmzrayqbvzusdlud

-- 1) posts 테이블
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid default auth.uid(),
  kind        text not null default 'blog' check (kind in ('blog','essay')),
  title       text not null,
  body        text not null default '',   -- 마크다운
  cover       text,                        -- 커버 이미지 URL (선택)
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) RLS 켜기
alter table public.posts enable row level security;

-- 3) 정책
--   읽기: 발행된 글은 누구나(anon 포함) 볼 수 있음
--   쓰기/수정/삭제: 로그인한 관리자 계정(작성자)만
drop policy if exists posts_read_published on public.posts;
drop policy if exists posts_insert_own     on public.posts;
drop policy if exists posts_update_own      on public.posts;
drop policy if exists posts_delete_own      on public.posts;

create policy posts_read_published on public.posts
  for select using (published = true or auth.uid() = author_id);
create policy posts_insert_own on public.posts
  for insert with check (auth.uid() = author_id);
create policy posts_update_own on public.posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy posts_delete_own on public.posts
  for delete using (auth.uid() = author_id);

-- ⚠️ 참고: 이 정책은 "로그인한 아무 계정이나 자기 글을 쓸 수 있음"입니다.
-- 오직 관리자(예: thinkjanepark)만 쓰게 더 좁히려면, 아래처럼 특정 uid로 제한하세요
-- (uid는 Authentication → Users 에서 확인):
--   create policy posts_insert_admin on public.posts
--     for insert with check (auth.uid() = 'ADMIN-UID-여기');
-- (이 경우 위 posts_insert_own은 drop 후 대체)
