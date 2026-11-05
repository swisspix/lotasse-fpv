(function () {
  const cfg = window.SITE_CONFIG || {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Adresse e-mail et année ---------- */
  document.querySelectorAll("[data-email]").forEach((el) => {
    el.textContent = cfg.email;
    el.href = "mailto:" + cfg.email;
  });
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Outils vidéo ---------- */
  const parse = (url) => {
    try {
      const u = new URL(url);
      const h = u.hostname.replace(/^(www|m)\./, "");
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
  const embedSrc = (s) =>
    s.type === "yt"
      ? `https://www.youtube-nocookie.com/embed/${s.id}?autoplay=1&rel=0&playsinline=1`
      : `https://player.vimeo.com/video/${s.id}?autoplay=1&dnt=1`;

  const PLAY = '<span class="play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l16 9-16 9z" fill="#000"/></svg></span>';

  // Miniature cliquable qui charge le lecteur seulement au clic (page légère, pas de cookies avant lecture)
  const makePlayer = (video) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "player";
    b.setAttribute("aria-label", "Lire la vidéo : " + video.title);
    if (video.src.type === "yt") {
      const img = document.createElement("img");
      img.src = `https://i.ytimg.com/vi/${video.src.id}/hqdefault.jpg`;
      img.alt = "";
      img.loading = "lazy";
      img.onerror = () => img.remove();
      b.appendChild(img);
    }
    b.insertAdjacentHTML("beforeend", PLAY);
    b.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = embedSrc(video.src);
      f.title = video.title;
      f.allow = "autoplay; fullscreen; picture-in-picture";
      f.allowFullscreen = true;
      b.replaceWith(f);
    });
    return b;
  };

  const videos = (cfg.videos || []).map((v) => ({ ...v, src: parse(v.url) })).filter((v) => v.src);

  /* ---------- Showreel ---------- */
  const reel = document.getElementById("showreel");
  let gridVideos = videos;
  if (reel) {
    const caption = document.getElementById("showreel-caption");
    if (cfg.heroVideo) {
      const v = document.createElement("video");
      v.src = cfg.heroVideo;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.autoplay = !reduced;
      v.setAttribute("aria-label", "Showreel");
      reel.appendChild(v);
      caption.innerHTML = "<span>Showreel</span>";
    } else if (videos.length) {
      const first = videos[0];
      reel.appendChild(makePlayer(first));
      caption.innerHTML = "<span></span><span></span>";
      caption.children[0].textContent = first.title;
      caption.children[1].textContent = first.category && first.category !== first.title ? first.category : "";
      gridVideos = videos.slice(1);
    } else {
      reel.parentElement.hidden = true;
    }
  }

  /* ---------- Grille des vidéos ---------- */
  const grid = document.getElementById("video-grid");
  if (grid) {
    const section = document.getElementById("travaux");
    if (!gridVideos.length) {
      section.hidden = true;
    } else {
      const render = (cat) => {
        grid.innerHTML = "";
        gridVideos
          .filter((v) => !cat || v.category === cat)
          .forEach((v) => {
            const fig = document.createElement("figure");
            fig.className = "video";
            fig.innerHTML = '<div class="frame"></div><figcaption><strong style="font-weight:400"></strong><span></span></figcaption>';
            fig.querySelector(".frame").appendChild(makePlayer(v));
            fig.querySelector("strong").textContent = v.title;
            fig.querySelector("figcaption span").textContent = v.category || "";
            grid.appendChild(fig);
          });
      };
      const filters = document.getElementById("video-filters");
      const cats = [...new Set(gridVideos.map((v) => v.category).filter(Boolean))];
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
