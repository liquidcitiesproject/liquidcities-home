/* Liquid Cities 홈페이지 공통 스크립트
   - Supabase(공개 키)로 shared_boards(공유 기록) / posts(블로그·에세이) 읽기
   - 헤더 렌더, 스크롤 등장 옵저버 */

const SB_URL = 'https://yntccmzrayqbvzusdlud.supabase.co';
const SB_KEY = 'sb_publishable_JyyBBJXaB2KW15biPR-8tA_ar3M3KO4'; // 공개 가능 키 (RLS가 보호)

// 앱 공유 보드 뷰어 주소 (Map iframe 및 링크에 사용) — 앱 도메인 liquidcities.io
const APP_BASE = 'https://liquidcities.io/';
// Map에 노출할 대표 보드 uid — 값이 없으면 map 페이지가 안내를 표시.
const FEATURED_BOARD_UID = '310d9356-cd15-42cd-8c85-4e9988233a64'; // thinkjanepark 대표 보드

let _sb = null;
function sb() {
  if (!_sb && window.supabase) _sb = window.supabase.createClient(SB_URL, SB_KEY);
  return _sb;
}

/* ---- 언어(EN/KO) ---- */
// 저장된 선택이 있으면 그것, 없으면 브라우저 언어 자동 감지(ko* → ko, 그 외 → en).
const I18N = {
  // 헤더/메뉴 — 새 상위 메뉴(라벨은 KO에서도 영어 유지)
  navAbout:    { en: 'About',         ko: 'About' },
  navProjects: { en: 'Projects',      ko: 'Projects' },
  navFieldwork:{ en: 'Fieldwork',     ko: 'Fieldwork' },
  fieldworkSoon:{ en: 'Fieldwork — coming soon.', ko: 'Fieldwork — 준비 중입니다.' },
  navContact:  { en: 'Contact',       ko: 'Contact' },
  navMaking:   { en: 'Making Spaces', ko: 'Making Spaces' },
  navResearcher: { en: 'Researcher', ko: 'Researcher' },
  // (구 메뉴 라벨 — 리다이렉트 스텁 등에서 참조 가능하게 유지)
  navMap:     { en: 'Map',     ko: '지도' },
  navBlog:    { en: 'Blog',    ko: '블로그' },
  navEssays:  { en: 'Essays',  ko: '에세이' },
  edit:       { en: '✎ Edit',  ko: '✎ 편집' },
  signout:    { en: 'Sign out', ko: '로그아웃' },
  // Projects 페이지 (필터 라벨은 영어 유지)
  pfAll:          { en: 'All',           ko: 'All' },
  pfExhibitions:  { en: 'Autoethnographic Archiving', ko: 'Autoethnographic Archiving' },
  pfEmotionalMap: { en: 'Emotional map', ko: 'Emotional map' },
  pfVol1:         { en: 'Vol.1',         ko: 'Vol.1' },
  projComingSoon: { en: 'Coming soon.',  ko: '준비 중입니다.' },
  // Making Spaces 페이지 (필터 라벨은 영어 유지)
  wfAll:      { en: 'All',      ko: 'All' },
  wfEssays:   { en: 'Essays',   ko: 'Essays' },
  wfBlog:     { en: 'Blog',     ko: 'Blog' },
  writingsSub:{ en: 'Essays and notes from the project.',
                ko: '프로젝트의 에세이와 기록.' },
  // Contact 페이지
  contactTitle: { en: 'Contact',      ko: 'Contact' },
  contactSub:   { en: 'Get in touch.', ko: '연락 주세요.' },
  contactEmail: { en: 'Email →',       ko: '이메일 →' },
  contactInsta: { en: 'Instagram →',   ko: '인스타그램 →' },
  cfEmail:     { en: 'Email',     ko: 'Email' },
  cfInstagram: { en: 'Instagram', ko: 'Instagram' },
  // index (홈)
  introQ:     { en: 'Where are you from?', ko: '당신은 어디에서 왔나요?' },
  outro:      { en: 'Liquid Cities.',       ko: 'Liquid Cities.' },
  scroll:     { en: '↓ scroll',             ko: '↓ 스크롤' },
  footerHome: { en: 'Liquid Cities Project — building identity through the moments people map onto the city.',
                ko: 'Liquid Cities Project — 도시에 매핑한 순간들로 정체성을 쌓아갑니다.' },
  aboutLink:  { en: 'About the project →',  ko: '프로젝트 소개 →' },
  noMoments:  { en: 'No shared moments yet — be the first to map one in the app.',
                ko: '아직 공유된 순간이 없어요 — 앱에서 첫 순간을 매핑해 보세요.' },
  // about
  aboutTitle: { en: 'About', ko: '소개' },
  aboutSub:   { en: 'Liquid Cities is a project about building identity — the moments people map onto the buildings of a city.',
                ko: 'Liquid Cities는 정체성을 쌓아가는 프로젝트입니다 — 사람들이 도시의 건물에 매핑하는 순간들.' },
  aboutP1:    { en: "Every day we move through cities that seem fixed — concrete, glass, stone. But a city is also liquid: it is remade by the feelings, memories and moments each of us pours into it. Liquid Cities asks a simple question — where are you from? — and lets people answer not with a place name, but with a moment.",
                ko: '우리는 매일 고정된 것처럼 보이는 도시를 지나갑니다 — 콘크리트, 유리, 돌. 하지만 도시는 유동적이기도 합니다. 우리 각자가 쏟아붓는 감정과 기억, 순간으로 다시 만들어집니다. Liquid Cities는 단순한 질문을 던집니다 — 당신은 어디에서 왔나요? — 그리고 지명이 아니라 하나의 순간으로 답하게 합니다.' },
  aboutH2:    { en: 'How it works', ko: '어떻게 작동하나요' },
  aboutP2:    { en: "In the app, you search for a building, confirm its real 3D mass, and map a photo or a short video of a moment onto it. Each mapped moment becomes a node on a shared map — a board, a flat map, or a rotating globe — where your city meets everyone else's.",
                ko: '앱에서 건물을 검색하고, 실제 3D 형태를 확인한 뒤, 어떤 순간의 사진이나 짧은 영상을 그 위에 매핑합니다. 매핑된 순간은 공유 지도의 노드가 됩니다 — 보드, 평면 지도, 또는 회전하는 지구본 위에서 당신의 도시가 모두의 도시와 만납니다.' },
  openApp:    { en: 'Open the app →', ko: '앱 열기 →' },
  // About 페이지 2행 필터
  afAbout:      { en: 'About',      ko: 'About' },
  afProjects:   { en: 'Project',    ko: 'Project' },
  afResearch:   { en: 'Researcher', ko: 'Researcher' },
  researchSoon: { en: 'Researcher — coming soon.', ko: 'Researcher — 준비 중입니다.' },
  // blog
  blogTitle:  { en: 'Blog', ko: '블로그' },
  blogSub:    { en: 'Notes and updates from the project.', ko: '프로젝트의 기록과 소식.' },
  noPosts:    { en: 'No posts yet.', ko: '아직 글이 없어요.' },
  // essays
  essaysTitle:{ en: 'Essays', ko: '에세이' },
  essaysSub:  { en: 'Longer writing on cities, identity, and the moments in between.',
                ko: '도시와 정체성, 그 사이의 순간들에 관한 긴 글.' },
  noEssays:   { en: 'No essays yet.', ko: '아직 에세이가 없어요.' },
  // map
  mapTitle:   { en: 'Map', ko: '지도' },
  mapNotConn: { en: 'The shared board is not connected yet.', ko: '공유 보드가 아직 연결되지 않았어요.' },
  mapHint:    { en: 'Open the app, share a board, and the map will appear here.',
                ko: '앱을 열고 보드를 공유하면 여기에 지도가 나타납니다.' },
  // post
  loading:    { en: 'Loading…', ko: '불러오는 중…' },
  postNotFound:{ en: 'Post not found.', ko: '글을 찾을 수 없어요.' },
  back:       { en: '← Back', ko: '← 뒤로' },
};
function detectLang() {
  try {
    const saved = localStorage.getItem('lc_home_lang');
    if (saved === 'en' || saved === 'ko') return saved;
  } catch (e) {}
  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return nav.startsWith('ko') ? 'ko' : 'en';
}
let LANG = detectLang();
function t(key) {
  const e = I18N[key];
  return e ? (e[LANG] || e.en) : key;
}
function setLang(lang) {
  if (lang !== 'en' && lang !== 'ko') return;
  LANG = lang;
  try { localStorage.setItem('lc_home_lang', lang); } catch (e) {}
  document.documentElement.lang = lang;
  applyI18n();               // data-i18n 정적 텍스트 갱신
  if (window._lcRerender) window._lcRerender(); // 각 페이지의 동적 콘텐츠 다시 그리기
}
// data-i18n="key" 가 붙은 요소의 textContent를 현재 언어로 채운다.
function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.documentElement.lang = LANG;
}
// 글(posts) 항목에서 현재 언어에 맞는 제목/본문을 고른다. KO인데 한국어본이 없으면 영어로 폴백.
function pickLangTitle(p) {
  return (LANG === 'ko' && p.title_ko && p.title_ko.trim()) ? p.title_ko : p.title;
}
function pickLangBody(p) {
  return (LANG === 'ko' && p.body_ko && p.body_ko.trim()) ? p.body_ko : p.body;
}

/* ---- 공통 헤더 렌더 ---- */
function renderHeader(active) {
  // 로고(→ Liquid Cities Project)가 곧 홈 링크 — 메뉴에 별도 Home 없음
  const links = [
    { href: 'about',         i18n: 'navAbout',    key: 'about' },
    { href: 'projects',      i18n: 'navProjects', key: 'projects' },
    { href: 'fieldwork',     i18n: 'navFieldwork', key: 'fieldwork' },
    { href: 'making-spaces', i18n: 'navMaking',   key: 'making-spaces' },
    { href: 'contact',       i18n: 'navContact',  key: 'contact' },
  ];
  const el = document.getElementById('site-header');
  if (!el) return;
  el.className = 'hdr';
  // 우측 상단 언어 토글(EN / KO) — 현재 언어는 굵게, 다른 언어는 클릭해 전환
  const langToggle =
    '<span class="hdr-lang">' +
    `<a href="#" data-setlang="en" class="lang-btn${LANG === 'en' ? ' active' : ''}">EN</a>` +
    '<span class="lang-sep">/</span>' +
    `<a href="#" data-setlang="ko" class="lang-btn${LANG === 'ko' ? ' active' : ''}">KO</a>` +
    '</span>';
  // marazuest 3단 레이아웃:
  //  1행(검정 배경): 로고(좌) · 언어토글(우)
  //  2행: 메뉴(중앙)  /  3행(필터 바)은 각 페이지가 렌더
  el.innerHTML =
    '<div class="hdr-row hdr-top">' +
    '<span class="hdr-brand"><a href="/" style="text-decoration:none">→ Liquid Cities Project</a></span>' +
    '<span class="hdr-right">' + langToggle + '</span>' +
    '</div>' +
    '<nav class="hdr-row hdr-menu">' +
    links.map(l => `<a class="hdr-link${l.key === active ? ' active' : ''}" href="${l.href}" data-i18n="${l.i18n}">${t(l.i18n)}</a>`).join('') +
    '</nav>';
  // 언어 토글 클릭 → setLang (선택 기억 + 화면 갱신)
  el.querySelectorAll('[data-setlang]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const lang = btn.getAttribute('data-setlang');
      if (lang === LANG) return;
      setLang(lang);
      renderHeader(active); // 헤더의 토글 active 상태·메뉴 라벨 갱신
    });
  });
  // 헤더 높이를 CSS 변수로 (맵 풀스크린용)
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--hdrH', el.offsetHeight + 'px');
  });
  // 편집·로그아웃 링크는 헤더에서 제거했다 — 관리는 manage-lc9x4k2.html URL로 직접 접근.
  // (예전엔 로그인 세션이 있으면 표시했으나, 세션 잔존 시 방문자 화면에도 노출돼 제거)
}

/* ---- 공통 필터 바 (marazuest식 상단 카테고리 필터) ----
   Projects / Making Spaces 페이지에서 헤더 바로 아래에 sticky로 붙는다.
   hostId: 필터 바를 그릴 요소 id
   items:  [{ key, i18n }] 배열
   activeKey: 현재 선택된 필터 key
   onSelect(key): 필터 클릭 시 콜백 (URL 갱신 + 콘텐츠 재렌더는 호출부 책임) */
function renderFilterBar(hostId, items, activeKey, onSelect) {
  const bar = document.getElementById(hostId);
  if (!bar) return;
  bar.className = 'filter-bar';
  bar.innerHTML = items.map(it =>
    `<a class="filter-link${it.key === activeKey ? ' active' : ''}" href="#" ` +
    `data-fkey="${it.key}" data-i18n="${it.i18n}">${t(it.i18n)}</a>`
  ).join('');
  bar.querySelectorAll('[data-fkey]').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const key = a.getAttribute('data-fkey');
      if (typeof onSelect === 'function') onSelect(key);
    });
  });
  // 필터 바 높이를 CSS 변수로 (Projects의 iframe top 계산용)
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--filterH', bar.offsetHeight + 'px');
  });
}

/* ---- 스크롤 등장 옵저버 ---- */
function observeReveal(selector = '.photo-item') {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(selector).forEach(el => io.observe(el));
}

/* ---- 공유 보드(공개 기록)에서 사진 데이터 모으기 ----
   shared_boards 전체를 anon으로 읽어 각 record의 massThumb+word+address 반환. */
async function loadSharedPhotos(limit = 60) {
  const client = sb();
  if (!client) return [];
  try {
    const { data, error } = await client.from('shared_boards').select('payload');
    if (error) throw error;
    const out = [];
    (data || []).forEach(row => {
      const recs = (row.payload && row.payload.records) || [];
      recs.forEach(r => {
        if (r.massThumb) out.push({
          thumb: r.massThumb,
          word: r.momentWordEn || r.momentWord || '',
          address: r.address || '',
          savedAt: r.savedAt || 0,
        });
      });
    });
    // 최신순 섞기(간단): savedAt 내림차순
    out.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    return out.slice(0, limit);
  } catch (e) {
    console.warn('loadSharedPhotos failed:', e.message);
    return [];
  }
}

/* ---- posts(블로그·에세이) ---- */
async function loadPosts(kind) {
  const client = sb();
  if (!client) return [];
  try {
    let q = client.from('posts').select('id, kind, title, title_ko, body, body_ko, cover, created_at')
      .eq('published', true).order('created_at', { ascending: false });
    if (kind) q = q.eq('kind', kind);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('loadPosts failed:', e.message);
    return [];
  }
}
async function loadPost(id) {
  const client = sb();
  if (!client) return null;
  try {
    const { data, error } = await client.from('posts').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (e) { return null; }
}
// About 같은 단일 페이지 글 — kind='page' 중 최신 발행본 하나
async function loadPage() {
  const client = sb();
  if (!client) return null;
  try {
    const { data, error } = await client.from('posts').select('*')
      .eq('kind', 'page').eq('published', true)
      .order('updated_at', { ascending: false }).limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
  } catch (e) { return null; }
}

/* ---- 아주 작은 마크다운 렌더 (제목·굵게·기울임·링크·이미지·인용·목록·문단) ---- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function renderMarkdown(md) {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
  let html = '', inList = false, inQuote = false;
  const inline = (t) => escapeHtml(t)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  const closeQuote = () => { if (inQuote) { html += '</blockquote>'; inQuote = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); closeQuote(); continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      closeList(); closeQuote();
      const lvl = m[1].length; html += `<h${lvl + 1}>${inline(m[2])}</h${lvl + 1}>`;
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      closeList(); if (!inQuote) { html += '<blockquote>'; inQuote = true; } html += inline(m[1]) + ' ';
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      closeQuote(); if (!inList) { html += '<ul>'; inList = true; } html += `<li>${inline(m[1])}</li>`;
    } else {
      closeList(); closeQuote(); html += `<p>${inline(line)}</p>`;
    }
  }
  closeList(); closeQuote();
  return html;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
