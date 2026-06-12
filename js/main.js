// ============================================================
// frantisekzeman.cz – hlavní skript
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

// ---------- Koncerty (data z data/koncerty.js) ----------
const MESICE = ["led", "úno", "bře", "dub", "kvě", "čer", "čvc", "srp", "zář", "říj", "lis", "pro"];

function gigHTML(k, past) {
  const d = new Date(k.datum + "T00:00:00");
  const odkaz = k.odkaz
    ? `<a class="btn btn-ghost" href="${k.odkaz}" target="_blank" rel="noopener">${k.odkazText || "Více"}</a>`
    : "";
  return `
    <article class="gig${past ? " past" : ""} reveal">
      <div class="gig-date">
        <div class="day">${d.getDate()}. ${d.getMonth() + 1}.</div>
        <div class="month">${MESICE[d.getMonth()]} ${d.getFullYear()}</div>
      </div>
      <div class="gig-info">
        <h3>${k.nazev}</h3>
        <div class="place">${k.misto}${k.cas ? " · od " + k.cas : ""} · ${k.typ}</div>
        <p>${k.popis}</p>
      </div>
      ${odkaz}
    </article>`;
}

function renderGigs() {
  const upcomingEl = document.getElementById("gigs-upcoming");
  const pastEl = document.getElementById("gigs-past");
  if (!upcomingEl || typeof KONCERTY === "undefined") return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sorted = [...KONCERTY].sort((a, b) => a.datum.localeCompare(b.datum));
  const upcoming = sorted.filter(k => new Date(k.datum + "T00:00:00") >= today);
  const past = sorted.filter(k => new Date(k.datum + "T00:00:00") < today).reverse();

  upcomingEl.innerHTML = upcoming.length
    ? upcoming.map(k => gigHTML(k, false)).join("")
    : `<p class="gigs-empty">Právě teď nejsou v kalendáři žádné veřejné koncerty. Sledujte sociální sítě!</p>`;

  pastEl.innerHTML = past.map(k => gigHTML(k, true)).join("");

  // Banner v hero sekci – nejbližší koncert
  const next = upcoming[0];
  const banner = document.getElementById("next-gig");
  if (next && banner) {
    const d = new Date(next.datum + "T00:00:00");
    banner.innerHTML = `
      <div class="date">${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}</div>
      <div class="info">
        <strong>${next.nazev}</strong>
        <span>${next.misto}</span>
      </div>
      <a class="btn btn-primary" href="#koncerty">Detail</a>`;
  } else if (banner) {
    banner.style.display = "none";
  }

  observeReveals();
}

document.getElementById("toggle-past")?.addEventListener("click", function () {
  const pastEl = document.getElementById("gigs-past");
  const hidden = pastEl.style.display === "none";
  pastEl.style.display = hidden ? "flex" : "none";
  this.textContent = hidden ? "Skrýt proběhlé koncerty" : "Zobrazit proběhlé koncerty";
});

// ---------- Galerie / lightbox ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox?.querySelector("img");

document.querySelectorAll(".gallery-grid a").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    lightboxImg.src = a.href;
    lightbox.classList.add("open");
  });
});
lightbox?.addEventListener("click", () => lightbox.classList.remove("open"));
document.addEventListener("keydown", e => {
  if (e.key === "Escape") lightbox?.classList.remove("open");
});

// ---------- Animace při scrollu ----------
let observer;
function observeReveals() {
  observer = observer || new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("visible"); observer.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal:not(.visible)").forEach(el => observer.observe(el));
}

// ---------- Start ----------
renderGigs();
observeReveals();
document.getElementById("year").textContent = new Date().getFullYear();
