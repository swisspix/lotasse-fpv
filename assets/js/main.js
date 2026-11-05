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

  /* ---------- Grilles de vidéos (accueil + page Vidéos) ---------- */
  const card = (v) => {
    const fig = document.createElement("figure");
    fig.className = "video";
    fig.innerHTML = '<div class="frame"></div><figcaption><strong></strong><span></span></figcaption>';
    fig.querySelector(".frame").appendChild(makePlayer(v));
    fig.querySelector("strong").textContent = v.title;
    fig.querySelector("figcaption span").textContent = v.category || "";
    return fig;
  };

  const setupGrid = (grid, list, filters, { limit = 0, urlParam = false } = {}) => {
    const cats = [...new Set(list.map((v) => v.category).filter(Boolean))];
    const count = document.getElementById("video-count");
    const render = (cat) => {
      grid.innerHTML = "";
      let shown = list.filter((v) => !cat || v.category === cat);
      if (limit) shown = shown.slice(0, limit);
      shown.forEach((v) => grid.appendChild(card(v)));
      if (count) count.textContent = shown.length + (shown.length > 1 ? " vidéos" : " vidéo");
    };
    let initial = null;
    if (urlParam) {
      const c = new URLSearchParams(location.search).get("categorie");
      if (c && cats.includes(c)) initial = c;
    }
    if (filters && cats.length > 1) {
      ["Tout", ...cats].forEach((c, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = c;
        const active = (i === 0 && !initial) || c === initial;
        b.setAttribute("aria-pressed", active ? "true" : "false");
        b.addEventListener("click", () => {
          filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true");
          const cat = i === 0 ? null : c;
          if (urlParam) {
            const u = new URL(location.href);
            cat ? u.searchParams.set("categorie", cat) : u.searchParams.delete("categorie");
            history.replaceState(null, "", u);
          }
          render(cat);
        });
        filters.appendChild(b);
      });
    }
    render(initial);
  };

  // Accueil : 3 vidéos récentes + lien vers la page Vidéos
  const homeGrid = document.getElementById("video-grid");
  if (homeGrid) {
    const section = document.getElementById("travaux");
    if (!gridVideos.length) section.hidden = true;
    else setupGrid(homeGrid, gridVideos, null, { limit: 3 });
  }

  // Page Vidéos : toutes les vidéos, filtrables
  const allGrid = document.getElementById("all-videos");
  if (allGrid) {
    if (!videos.length) {
      document.getElementById("videos-empty").hidden = false;
      allGrid.hidden = true;
      document.querySelector(".toolbar").hidden = true;
    } else {
      setupGrid(allGrid, videos, document.getElementById("video-filters"), { urlParam: true });
    }
  }

  /* ---------- Formulaire de contact (Web3Forms) ---------- */
  const form = document.getElementById("contact-form");
  if (form) {
    const btn = document.getElementById("send-btn");
    const err = document.getElementById("form-error");
    document.getElementById("access-key").value = cfg.formKey || "";
    const showError = (html) => { err.innerHTML = html; err.hidden = false; };
    const fallback = `Vous pouvez aussi écrire directement à <a href="mailto:${cfg.email}">${cfg.email}</a>.`;
    const reset = () => { btn.disabled = false; btn.textContent = "Envoyer le message"; };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      form.querySelectorAll("[aria-invalid]").forEach((f) => f.removeAttribute("aria-invalid"));
      const missing = [...form.querySelectorAll("[required]")].filter((f) => !f.checkValidity());
      if (missing.length) {
        missing.forEach((f) => f.setAttribute("aria-invalid", "true"));
        const emailBad = missing.some((f) => f.type === "email" && f.value);
        showError(emailBad
          ? "L'adresse e-mail ne semble pas valide. Vérifiez-la puis renvoyez le message."
          : "Remplissez les champs marqués d'un astérisque : nom, e-mail et description du projet.");
        missing[0].focus();
        return;
      }
      err.hidden = true;
      if (!cfg.formKey) {
        showError("L'envoi depuis le site n'est pas encore activé. " + fallback);
        return;
      }
      const d = Object.fromEntries(new FormData(form));
      d.subject = `Demande ${d.type} — ${d.name}`;
      delete d.redirect;
      btn.disabled = true;
      btn.textContent = "Envoi en cours…";
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 15000);
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(d),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || res.status);
        form.hidden = true;
        document.getElementById("sent-email").textContent = d.email;
        const sent = document.getElementById("form-sent");
        sent.hidden = false;
        document.getElementById("sent-title").focus();
      } catch (ex) {
        reset();
        showError("Le message n'a pas pu partir, votre texte est toujours là. Réessayez dans un instant. " + fallback);
      }
    });
  }
})();
