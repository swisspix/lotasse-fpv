(function () {
  const cfg = window.SITE_CONFIG || {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Adresse e-mail partout ---------- */
  document.querySelectorAll("[data-email]").forEach((el) => {
    el.textContent = cfg.email;
    if (el.tagName === "A") el.href = "mailto:" + cfg.email;
  });

  /* ---------- Année du pied de page ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Hero : armement + chrono + horizon ---------- */
  const hero = document.querySelector(".hero");
  if (hero) {
    if (cfg.heroVideo) {
      const v = document.createElement("video");
      Object.assign(v, { src: cfg.heroVideo, muted: true, loop: true, playsInline: true, autoplay: !reduced });
      v.className = "hero-video";
      v.setAttribute("aria-hidden", "true");
      hero.prepend(v);
      const scene = hero.querySelector(".hero-scene");
      if (scene) scene.remove();
    }

    const arm = hero.querySelector(".osd-arm");
    const timer = hero.querySelector(".osd-timer");
    let start = null;
    const tick = (t) => {
      if (start === null) start = t;
      const s = Math.floor((t - start) / 1000);
      timer.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      requestAnimationFrame(tick);
    };
    setTimeout(() => {
      arm.textContent = "ARMED";
      arm.classList.add("armed");
      if (!reduced) requestAnimationFrame(tick);
    }, reduced ? 0 : 1100);

    // Inclinaison de l'horizon au mouvement de la souris (roulis d'un drone)
    const scene = hero.querySelector(".hero-scene");
    if (scene && !reduced && window.matchMedia("(pointer: fine)").matches) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        scene.style.transform = `scale(1.12) rotate(${x * -6}deg) translateY(${y * -14}px)`;
      });
      hero.addEventListener("pointerleave", () => (scene.style.transform = "scale(1.12)"));
      scene.style.transform = "scale(1.12)";
    }
  }

  /* ---------- Vidéos ---------- */
  const grid = document.getElementById("video-grid");
  if (grid) {
    const parse = (url) => {
      try {
        const u = new URL(url);
        const h = u.hostname.replace("www.", "").replace("m.", "");
        if (h === "youtu.be") return { type: "yt", id: u.pathname.slice(1) };
        if (h.endsWith("youtube.com")) {
          if (u.searchParams.get("v")) return { type: "yt", id: u.searchParams.get("v") };
          const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]+)/);
          if (m) return { type: "yt", id: m[2] };
        }
        if (h.endsWith("vimeo.com")) {
          const m = u.pathname.match(/(\d+)/);
          if (m) return { type: "vimeo", id: m[1] };
        }
      } catch (e) {}
      return null;
    };
    const embedSrc = (v) =>
      v.type === "yt"
        ? `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`
        : `https://player.vimeo.com/video/${v.id}?autoplay=1&dnt=1`;

    const videos = (cfg.videos || []).map((v) => ({ ...v, src: parse(v.url) })).filter((v) => v.src);
    const filters = document.getElementById("video-filters");

    const render = (cat) => {
      grid.innerHTML = "";
      const list = cat ? videos.filter((v) => v.category === cat) : videos;
      if (!list.length) {
        grid.innerHTML = '<p class="empty">Les premières vidéos arrivent bientôt.</p>';
        return;
      }
      list.forEach((v) => {
        const art = document.createElement("article");
        art.className = "video";
        const thumb =
          v.src.type === "yt"
            ? `<img src="https://i.ytimg.com/vi/${v.src.id}/hqdefault.jpg" alt="" loading="lazy">`
            : "";
        art.innerHTML = `
          <figure>
            <div class="frame">
              <button type="button" aria-label="Lire la vidéo : ${v.title.replace(/"/g, "&quot;")}">
                ${thumb}
                <span class="corner c1"></span><span class="corner c2"></span>
                <span class="corner c3"></span><span class="corner c4"></span>
                <span class="play"><svg viewBox="0 0 24 24"><path d="M5 3l16 9-16 9z"/></svg></span>
              </button>
            </div>
            <figcaption><strong></strong><span></span></figcaption>
          </figure>`;
        art.querySelector("strong").textContent = v.title;
        art.querySelector("figcaption span").textContent = v.category || "";
        art.querySelector("button").addEventListener("click", function () {
          const f = document.createElement("iframe");
          f.src = embedSrc(v.src);
          f.title = v.title;
          f.allow = "autoplay; fullscreen; picture-in-picture";
          f.allowFullscreen = true;
          this.replaceWith(f);
        });
        grid.appendChild(art);
      });
    };

    const cats = [...new Set(videos.map((v) => v.category).filter(Boolean))];
    if (filters && cats.length > 1) {
      ["Tout", ...cats].forEach((c, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = c;
        b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        b.addEventListener("click", () => {
          filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true");
          render(i === 0 ? null : c);
        });
        filters.appendChild(b);
      });
    }
    render(null);
  }

  /* ---------- Formulaire de contact → messagerie ---------- */
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const subject = `[Site] ${d.get("type")} — ${d.get("name")}`;
      const body = [
        `Nom : ${d.get("name")}`,
        `E-mail : ${d.get("email")}`,
        d.get("phone") ? `Téléphone : ${d.get("phone")}` : null,
        `Type de projet : ${d.get("type")}`,
        d.get("date") ? `Date / période : ${d.get("date")}` : null,
        d.get("place") ? `Lieu : ${d.get("place")}` : null,
        "",
        d.get("message"),
      ].filter((l) => l !== null).join("\n");
      window.location.href =
        `mailto:${cfg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
