// ============================================================
// frantisekzeman.cz – videa
// Obsah se načítá z data/videa.json (editovatelné v /admin).
// Používá se na videa.html (všechny skupiny) i na index.html
// (ukázka z klipů v sekci #video).
// ============================================================

const escV = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Přijme buď samotné ID, nebo libovolnou YouTube URL (watch, youtu.be, shorts, embed).
function ytId(v) {
  const raw = String(v || "").trim();
  if (!raw) return "";
  if (!raw.includes("/") && !raw.includes("?")) return raw;
  const m = raw.match(/(?:youtu\.be\/|\/shorts\/|\/embed\/|[?&]v=)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : "";
}

function videoCard(v, format) {
  const id = ytId(v.youtube);
  if (!id) return "";
  const nahled = v.nahled ? escV(v.nahled) : `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const nazev = escV(v.nazev || "Video");
  const popis = v.popis ? `<p>${escV(v.popis)}</p>` : "";
  return `
    <article class="vid-card reveal" data-format="${format === "vyska" ? "vyska" : "sirka"}">
      <button class="vid-thumb" type="button" data-yt="${id}" aria-label="Přehrát video ${nazev}">
        <img src="${nahled}" alt="" loading="lazy" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'">
        <span class="vid-play" aria-hidden="true">
          <svg viewBox="0 0 68 48" width="60" height="42"><path class="vid-play-bg" d="M66.5 7.7a8 8 0 0 0-5.6-5.7C56 .7 34 .7 34 .7s-22 0-26.9 1.3A8 8 0 0 0 1.5 7.7 83 83 0 0 0 .2 24a83 83 0 0 0 1.3 16.3 8 8 0 0 0 5.6 5.7C12 47.3 34 47.3 34 47.3s22 0 26.9-1.3a8 8 0 0 0 5.6-5.7A83 83 0 0 0 67.8 24a83 83 0 0 0-1.3-16.3z"/><path d="M27.2 34.3 45.5 24 27.2 13.7z" fill="#fff"/></svg>
        </span>
      </button>
      <div class="vid-meta"><h3>${nazev}</h3>${popis}</div>
    </article>`;
}

function bindPlay(root) {
  root.querySelectorAll(".vid-thumb:not([data-bound])").forEach(btn => {
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      const id = btn.dataset.yt;
      const wrap = document.createElement("div");
      wrap.className = "vid-thumb vid-thumb--playing";
      wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      btn.replaceWith(wrap);
    });
  });
}

function renderSkupiny(skupiny) {
  const root = document.getElementById("videa-root");
  if (!root) return false;

  const naplnene = skupiny.filter(s => (s.videa || []).some(v => ytId(v.youtube)));
  const nav = naplnene.length > 1
    ? naplnene.map(s => `<a class="vid-jump" href="#${escV(s.id)}">${escV(s.nazev)}</a>`).join("")
    : "";

  root.innerHTML = `
    ${nav ? `<div class="vid-jumps">${nav}</div>` : ""}
    ${skupiny.map(s => {
      const videa = (s.videa || []).filter(v => ytId(v.youtube));
      if (!videa.length) return "";
      return `
      <section class="vid-group" id="${escV(s.id)}">
        <h2 class="section-title" style="font-size:30px;">${escV(s.nazev)}</h2>
        ${s.popis ? `<p class="lead" style="margin-bottom:26px;">${escV(s.popis)}</p>` : ""}
        <div class="vid-grid vid-grid--${s.format === "vyska" ? "vyska" : "sirka"}">
          ${videa.map(v => videoCard(v, s.format)).join("")}
        </div>
      </section>`;
    }).join("")}
  `;

  if (!root.querySelector(".vid-card")) {
    root.innerHTML = `<p class="gigs-empty">Videa se právě připravují.</p>`;
  }
  bindPlay(root);
  return true;
}

function renderHomeUkazka(skupiny) {
  const grid = document.getElementById("video-grid-home");
  if (!grid) return false;
  const klipy = (skupiny.find(s => s.id === "klipy") || skupiny[0] || {}).videa || [];
  grid.innerHTML = klipy.slice(0, 6).map(v => videoCard(v, "sirka")).join("");
  bindPlay(grid);
  return true;
}

(async function initVidea() {
  // Navigace + rok v patičce (na videa.html se main.js nenačítá)
  const jeSamostatnaStranka = !!document.getElementById("videa-root");
  if (jeSamostatnaStranka) {
    const navLinksEl = document.querySelector(".nav-links");
    document.querySelector(".nav-toggle")?.addEventListener("click", () => navLinksEl?.classList.toggle("open"));
    navLinksEl?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => navLinksEl.classList.remove("open")));
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  try {
    const res = await fetch("data/videa.json", { cache: "no-cache" });
    const data = res.ok ? await res.json() : { skupiny: [] };
    const skupiny = data.skupiny || [];
    renderSkupiny(skupiny);
    renderHomeUkazka(skupiny);
  } catch (e) {
    console.error("Nepodařilo se načíst videa:", e);
    const root = document.getElementById("videa-root");
    if (root) root.innerHTML = `<p class="gigs-empty">Videa se nepodařilo načíst. Zkus to prosím za chvíli znovu.</p>`;
  }
  // reveal animace (na videa.html není main.js)
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal:not(.visible)").forEach(el => obs.observe(el));
})();
