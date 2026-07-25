-- Liquid Cities 홈페이지 — posts 테이블에 한국어(제목·본문) 컬럼 추가
-- Supabase 대시보드 → SQL Editor 에 붙여넣어 1회 실행.
-- 프로젝트: yntccmzrayqbvzusdlud
--
-- 기존 title/body는 영어(기본) 그대로 두고, KO 버전을 별도 컬럼에 저장한다.
-- KO 컬럼이 비어 있으면 홈페이지는 영어 원문으로 자동 폴백한다(코드에서 처리).

alter table public.posts
  add column if not exists title_ko text,
  add column if not exists body_ko  text;

-- 확인용: 컬럼이 잘 추가됐는지
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'posts'
  and column_name in ('title', 'title_ko', 'body', 'body_ko')
order by column_name;
