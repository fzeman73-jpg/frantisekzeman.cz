// ============================================================
// frantisekzeman.cz – blog
// Obsah článků se načítá z data/blog.json (editovatelné v /admin).
// ============================================================

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- Navigace (shodné chování jako na hlavní stránce) ----------
const nav = document.querySelector(".nav");
const navLinks = document.querySelector(".nav-links");
const navToggle = document.querySelector(".nav-toggle");
window.addEventListener("scroll", () => nav?.classList.toggle("scrolled", window.scrollY > 30 || true));
navToggle?.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => navLinks.classList.remove("open")));

const MESICE_DL = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
function formatDatum(datum) {
  const d = new Date(datum + "T00:00:00");
  return `${d.getDate()}. ${MESICE_DL[d.getMonth()]} ${d.getFullYear()}`;
}

// ---------- Lightbox (pro galerii uvnitř článku) ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox?.querySelector("img");
function bindLightbox() {
  document.querySelectorAll(".gallery-grid a:not([data-lb])").forEach(a => {
    a.dataset.lb = "1";
    a.addEventListener("click", e => {
      e.preventDefault();
      lightboxImg.src = a.href;
      lightbox.classList.add("open");
    });
  });
}
lightbox?.addEventListener("click", () => lightbox.classList.remove("open"));
document.addEventListener("keydown", e => { if (e.key === "Escape") lightbox?.classList.remove("open"); });

// ---------- Listing (blog.html) ----------
function renderBlogGrid(clanky) {
  const grid = document.getElementById("blog-grid");
  if (!grid) return false;
  const sorted = [...clanky].sort((a, b) => b.datum.localeCompare(a.datum));
  grid.innerHTML = sorted.length
    ? sorted.map(c => `
      <a class="blog-card reveal" href="blog-clanek.html?slug=${encodeURIComponent(c.slug)}">
        <div class="blog-card-img"><img src="${esc(c.obrazek)}" alt="${esc(c.nadpis)}" loading="lazy"></div>
        <div class="blog-card-body">
          <span class="blog-card-date">${formatDatum(c.datum)}</span>
          <h2>${esc(c.nadpis)}</h2>
          <p>${esc(c.perex)}</p>
          <span class="blog-card-more">Číst dál →</span>
        </div>
      </a>`).join("")
    : `<p class="gigs-empty">Zatím tu nic není, ale brzy se to změní.</p>`;
  return true;
}

// ---------- Detail článku (blog-clanek.html) ----------
function renderArticle(clanek, siteUrl) {
  const root = document.getElementById("article-root");
  if (!root || !clanek) return;

  document.title = `${clanek.nadpis} – František Zeman`;
  document.getElementById("meta-description")?.setAttribute("content", clanek.perex);
  document.getElementById("og-title")?.setAttribute("content", clanek.nadpis);
  document.getElementById("og-description")?.setAttribute("content", clanek.perex);
  document.getElementById("twitter-title")?.setAttribute("content", clanek.nadpis);
  document.getElementById("twitter-description")?.setAttribute("content", clanek.perex);
  const articleUrl = `${siteUrl}/blog-clanek.html?slug=${encodeURIComponent(clanek.slug)}`;
  document.getElementById("canonical-link")?.setAttribute("href", articleUrl);
  document.getElementById("og-url")?.setAttribute("content", articleUrl);
  const ogImage = `${siteUrl}/${clanek.obrazekOg || clanek.obrazek}`;
  document.getElementById("og-image")?.setAttribute("content", ogImage);
  document.getElementById("twitter-image")?.setAttribute("content", ogImage);

  const stitky = (clanek.stitky || []).map(s => `<span class="blog-tag">${esc(s)}</span>`).join("");
  const galerie = (clanek.galerie || []).map(f =>
    `<a href="${esc(f.obrazek)}"><img src="${esc(f.obrazek)}" alt="${esc(f.popisek) || esc(clanek.nadpis)}" loading="lazy"></a>`
  ).join("");

  root.innerHTML = `
    <span class="section-label">${formatDatum(clanek.datum)}</span>
    <h1 class="section-title">${esc(clanek.nadpis)}</h1>
    <div class="blog-tags">${stitky}</div>
    <div class="article-cover reveal"><img src="${esc(clanek.obrazek)}" alt="${esc(clanek.nadpis)}"></div>
    <div class="story-text article-body reveal">${clanek.obsah}</div>
    ${galerie ? `<h2 class="section-title" style="font-size:28px; margin-top:56px;">Fotky z akce</h2><div class="gallery-grid">${galerie}</div>` : ""}
    <p style="margin-top:48px;"><a class="btn btn-ghost" href="blog.html">← Zpět na blog</a></p>
  `;

  // SEO: strukturovaná data BlogPosting
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": clanek.nadpis,
    "description": clanek.perex,
    "image": ogImage,
    "datePublished": clanek.datum,
    "author": { "@type": "Person", "name": "František Zeman" },
    "publisher": { "@type": "Person", "name": "František Zeman" },
    "mainEntityOfPage": articleUrl
  });
  document.head.appendChild(s);

  bindLightbox();
  observeReveals();
}

let observer;
function observeReveals() {
  observer = observer || new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("visible"); observer.unobserve(en.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal:not(.visible)").forEach(el => observer.observe(el));
}

async function init() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  try {
    const res = await fetch("data/blog.json", { cache: "no-cache" });
    const data = res.ok ? await res.json() : { clanky: [] };
    const clanky = data.clanky || [];

    const isListing = renderBlogGrid(clanky);
    if (!isListing) {
      const params = new URLSearchParams(location.search);
      const slug = params.get("slug");
      const clanek = clanky.find(c => c.slug === slug) || clanky[0];
      const siteUrl = "https://frantisekzeman.cz";
      if (clanek) {
        renderArticle(clanek, siteUrl);
      } else {
        const root = document.getElementById("article-root");
        if (root) root.innerHTML = `<p class="lead">Tenhle článek jsme nenašli. <a href="blog.html">Zpět na blog</a></p>`;
      }
    }
  } catch (e) {
    console.error("Nepodařilo se načíst blog:", e);
  }
  observeReveals();
}
init();
