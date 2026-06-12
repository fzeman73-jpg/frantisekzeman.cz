// ============================================================
// frantisekzeman.cz – hlavní skript
// Obsah (koncerty, galerie) se načítá z data/*.json,
// které lze upravovat v administraci /admin.
// ============================================================

// ---------- Navigace ----------
const nav = document.querySelector(".nav");
const navLinks = document.querySelector(".nav-links");
const navToggle = document.querySelector(".nav-toggle");

window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 30);
});

navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => navLinks.classList.remove("open"))
);

// ---------- Pomocné ----------
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let observer;
function observeReveals() {
  observer = observer || new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("visible"); observer.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal:not(.visible)").forEach(el => observer.observe(el));
}

// ---------- Lightbox ----------
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
document.addEventListener("keydown", e => {
  if (e.key === "Escape") lightbox?.classList.remove("open");
});

// ---------- Koncerty ----------
const MESICE = ["led", "úno", "bře", "dub", "kvě", "čer", "čvc", "srp", "zář", "říj", "lis", "pro"];

function gigHTML(k, past) {
  const d = new Date(k.datum + "T00:00:00");
  const odkaz = k.odkaz
    ? `<a class="btn btn-ghost" href="${esc(k.odkaz)}" target="_blank" rel="noopener">${esc(k.odkazText) || "Více"}</a>`
    : "";
  return `
    <article class="gig${past ? " past" : ""} reveal">
      <div class="gig-date">
        <div class="day">${d.getDate()}. ${d.getMonth() + 1}.</div>
        <div class="month">${MESICE[d.getMonth()]} ${d.getFullYear()}</div>
      </div>
      <div class="gig-info">
        <h3>${esc(k.nazev)}</h3>
        <div class="place">${esc(k.misto)}${k.cas ? " · od " + esc(k.cas) : ""} · ${esc(k.typ)}</div>
        <p>${esc(k.popis)}</p>
      </div>
      ${odkaz}
    </article>`;
}

function renderGigs(koncerty) {
  const upcomingEl = document.getElementById("gigs-upcoming");
  const pastEl = document.getElementById("gigs-past");
  if (!upcomingEl) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sorted = [...koncerty].sort((a, b) => a.datum.localeCompare(b.datum));
  const upcoming = sorted.filter(k => new Date(k.datum + "T00:00:00") >= today);
  const past = sorted.filter(k => new Date(k.datum + "T00:00:00") < today).reverse();

  upcomingEl.innerHTML = upcoming.length
    ? upcoming.map(k => gigHTML(k, false)).join("")
    : `<p class="gigs-empty">Právě teď nejsou v kalendáři žádné veřejné koncerty. Sledujte sociální sítě!</p>`;

  pastEl.innerHTML = past.map(k => gigHTML(k, true)).join("");

  const next = upcoming[0];
  const banner = document.getElementById("next-gig");
  if (next && banner) {
    const d = new Date(next.datum + "T00:00:00");
    banner.innerHTML = `
      <div class="date">${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}</div>
      <div class="info">
        <strong>${esc(next.nazev)}</strong>
        <span>${esc(next.misto)}</span>
      </div>
      <a class="btn btn-primary" href="#koncerty">Detail</a>`;
  } else if (banner) {
    banner.style.display = "none";
  }

  // SEO: strukturovaná data nadcházejících koncertů
  if (upcoming.length) {
    const events = upcoming.map(k => ({
      "@context": "https://schema.org",
      "@type": "MusicEvent",
      "name": k.nazev,
      "startDate": k.datum + (k.cas ? "T" + k.cas : ""),
      "location": { "@type": "Place", "name": k.misto, "address": k.misto },
      "performer": { "@type": "MusicGroup", "name": "František Zeman" },
      "description": k.popis,
      ...(k.odkaz ? { "url": k.odkaz } : {})
    }));
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(events);
    document.head.appendChild(s);
  }
}

document.getElementById("toggle-past")?.addEventListener("click", function () {
  const pastEl = document.getElementById("gigs-past");
  const hidden = pastEl.style.display === "none";
  pastEl.style.display = hidden ? "flex" : "none";
  this.textContent = hidden ? "Skrýt proběhlé koncerty" : "Zobrazit proběhlé koncerty";
});

// ---------- Galerie ----------
function renderGallery(fotky) {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;
  grid.innerHTML = fotky.map(f =>
    `<a href="${esc(f.obrazek)}"><img src="${esc(f.obrazek)}" alt="${esc(f.popisek) || "František Zeman"}" loading="lazy"></a>`
  ).join("");
}

// ---------- Start ----------
async function init() {
  bindLightbox(); // statické galerie (pro-media)
  observeReveals();
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  try {
    const [kr, gr] = await Promise.all([
      fetch("data/koncerty.json", { cache: "no-cache" }),
      fetch("data/galerie.json", { cache: "no-cache" })
    ]);
    if (kr.ok) renderGigs((await kr.json()).koncerty || []);
    if (gr.ok) renderGallery((await gr.json()).fotky || []);
  } catch (e) {
    console.error("Nepodařilo se načíst data:", e);
  }
  bindLightbox();
  observeReveals();
}
init();
