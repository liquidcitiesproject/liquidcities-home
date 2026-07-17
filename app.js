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

/* ---- 공통 헤더 렌더 ---- */
function renderHeader(active) {
  // 로고(→ Liquid Cities Project)가 곧 홈 링크 — 메뉴에 별도 Home 없음
  const links = [
    { href: 'about.html', label: 'About', key: 'about' },
    { href: 'map.html', label: 'Map', key: 'map' },
    { href: 'blog.html', label: 'Blog', key: 'blog' },
    { href: 'essays.html', label: 'Essays', key: 'essays' },
  ];
  const el = document.getElementById('site-header');
  if (!el) return;
  el.className = 'hdr';
  el.innerHTML =
    '<div class="hdr-row hdr-logo"><span><a href="index.html" style="text-decoration:none">→ Liquid Cities Project</a></span>' +
    '<span id="hdrEdit"></span></div>' +
    '<nav class="hdr-row hdr-menu">' +
    links.map(l => `<a class="hdr-link${l.key === active ? ' active' : ''}" href="${l.href}">${l.label}</a>`).join('') +
    '</nav>';
  // 헤더 높이를 CSS 변수로 (맵 풀스크린용)
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--hdrH', el.offsetHeight + 'px');
  });
  // 관리자로 로그인돼 있을 때만 편집·로그아웃 링크 표시 (방문자에겐 안 보임)
  const client = sb();
  if (client) {
    client.auth.getSession().then(({ data }) => {
      if (!(data && data.session)) return;               // 비로그인 → 아무것도 안 넣음
      const slot = document.getElementById('hdrEdit');
      if (!slot) return;
      const st = 'text-decoration:underline; text-underline-offset:3px; font-size:12px; color:var(--dim)';
      slot.innerHTML =
        `<a href="manage-lc9x4k2.html" style="${st}">✎ Edit</a>` +
        `<a id="hdrSignout" href="#" style="${st}; margin-left:12px">Sign out</a>`;
      const so = document.getElementById('hdrSignout');
      if (so) so.addEventListener('click', async (ev) => {
        ev.preventDefault();
        try { await client.auth.signOut(); } catch (e) {}
        location.reload();
      });
    }).catch(() => {});
  }
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
    let q = client.from('posts').select('id, kind, title, body, cover, created_at')
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
