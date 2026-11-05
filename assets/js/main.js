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
    if (/\.(mp4|webm)(\?|$)/i.test(url) && !/^https?:/i.test(url)) return { type: "file", id: url };
    try {
      const u = new URL(url);
      const h = u.hostname.replace(/^(www|m)\./, "");
      if (h === "youtu.be") return { type: "yt", id: u.pathname.slice(1) };
      if (h.endsWith("youtube.com")) {
        if (u.searchParams.get("v")) return { type: "yt", id: u.searchParams.get("v") };
        const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]+)/);
        if (m) return { type: "yt", id: m[2] };
      }
      if (h.endsWith("instagram.com")) {
        const m = u.pathname.match(/\/(reel|p|tv)\/([\w-]+)/);
        if (m) return { type: "ig", id: m[2], kind: m[1] };
      }
      if (h.endsWith("vimeo.com")) {
        const m = u.pathname.match(/(\d+)/);
        if (m) return { type: "vimeo", id: m[1] };
      }
    } catch (e) {}
    return null;
  };
  // Lecteur épuré : son coupé, aucune commande YouTube/Vimeo, seulement lecture / pause
  const embedSrc = (s, start = 0) => {
    if (s.type === "yt") {
      const q = new URLSearchParams({
        autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, rel: 0,
        playsinline: 1, iv_load_policy: 3, loop: 1, playlist: s.id,
        enablejsapi: 1, origin: location.origin,
      });
      if (start) q.set("start", start);
      return `https://www.youtube-nocookie.com/embed/${s.id}?${q}`;
    }
    return `https://player.vimeo.com/video/${s.id}?autoplay=1&muted=1&controls=0&loop=1&dnt=1&title=0&byline=0&portrait=0${start ? `#t=${start}s` : ""}`;
  };
  const command = (iframe, type, play) => {
    if (type === "file") { play ? iframe.play().catch(() => {}) : iframe.pause(); return; }
    const msg = type === "yt"
      ? { event: "command", func: play ? "playVideo" : "pauseVideo", args: [] }
      : { method: play ? "play" : "pause" };
    iframe.contentWindow && iframe.contentWindow.postMessage(type === "yt" ? JSON.stringify(msg) : msg, "*");
  };

  const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5l14 8.5-14 8.5z" fill="#000"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="#000"/></svg>';
  const PLAY = `<span class="play">${ICON_PLAY}</span>`;

  let current = null; // une seule vidéo joue à la fois

  // Miniature cliquable : le lecteur ne se charge qu'au clic (page légère, pas de cookies avant)
  // Construit un lecteur épuré (son coupé, lecture / pause, plein écran)
  const buildLive = (video, imgEl) => {
    const box = document.createElement("div");
    box.className = "live is-playing is-loading";
    let f;
    if (video.src.type === "file") {
      f = document.createElement("video");
      Object.assign(f, { src: video.src.id, muted: true, loop: true, playsInline: true, autoplay: true, preload: "auto" });
      f.setAttribute("muted", "");
      if (video.poster) f.poster = video.poster;
      if (video.start) f.currentTime = Number(video.start);
      f.addEventListener("playing", () => box.classList.remove("is-loading"));
      f.addEventListener("pause", () => box.classList.add("is-loading"));
      box.classList.add("is-file");
    } else {
      f = document.createElement("iframe");
      f.src = embedSrc(video.src, Number(video.start) || 0);
      f.allow = "autoplay; picture-in-picture";
    }
    f.title = video.title;
    f.tabIndex = -1;
    // Image de couverture affichée tant que la vidéo ne tourne pas : masque l'interface YouTube
    const poster = document.createElement("div");
    poster.className = "poster";
    const img = imgEl;
    if (img) poster.appendChild(img.cloneNode());
    const t = document.createElement("button");
    t.type = "button";
    t.className = "toggle";
    t.innerHTML = `<span class="play">${ICON_PAUSE}</span>`;
    t.setAttribute("aria-label", "Mettre en pause : " + video.title);
    const ctl = {
      set(play) {
        command(f, video.src.type, play);
        box.classList.toggle("is-playing", play);
        if (!play) box.classList.add("is-loading");
        t.innerHTML = `<span class="play">${play ? ICON_PAUSE : ICON_PLAY}</span>`;
        t.setAttribute("aria-label", (play ? "Mettre en pause : " : "Lire : ") + video.title);
        if (play && current && current !== ctl) current.set(false);
        if (play) current = ctl;
      },
      playing: () => box.classList.contains("is-playing"),
    };
    // L'état réel du lecteur YouTube : on retire la couverture dès que l'image bouge
    if (video.src.type === "yt") {
      f.addEventListener("load", () => {
        f.contentWindow.postMessage(JSON.stringify({ event: "listening", id: video.src.id }), "*");
      });
      window.addEventListener("message", (m) => {
        if (m.source !== f.contentWindow) return;
        let d; try { d = typeof m.data === "string" ? JSON.parse(m.data) : m.data; } catch (e) { return; }
        const st = d && (d.event === "onStateChange" ? d.info : d.info && d.info.playerState);
        if (st === 1) box.classList.remove("is-loading");
        if (st === 2) box.classList.add("is-loading");
      });
    } else if (video.src.type !== "file") {
      setTimeout(() => box.classList.remove("is-loading"), 1500);
    }
    t.addEventListener("click", () => {
      const play = !ctl.playing();
      ctl.set(play);
      if (play && video.src.type === "vimeo") box.classList.remove("is-loading");
    });
    // Bouton plein écran
    const fs = document.createElement("button");
    fs.type = "button";
    fs.className = "fs-btn";
    fs.setAttribute("aria-label", "Plein écran : " + video.title);
    fs.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
    fs.addEventListener("click", () => {
      const el = box;
      const isFs = document.fullscreenElement || document.webkitFullscreenElement;
      if (isFs) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (f.webkitEnterFullscreen) f.webkitEnterFullscreen(); // iPhone : vidéo du site
    });
    if (current) current.set(false);
    current = ctl;
    box.append(f, poster, t, fs);
    return { box, t, ctl };
  };

  // Fenêtre de lecture en grand (page Vidéos)
  let modal = null;
  const openModal = (video, imgEl) => {
    if (!modal) {
      modal = document.createElement("dialog");
      modal.className = "vmodal";
      modal.innerHTML = '<div class="vmodal-bar"><strong class="vmodal-title"></strong><button type="button" class="vmodal-close" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.8"/></svg></button></div><div class="vmodal-stage"></div>';
      document.body.appendChild(modal);
      const close = () => modal.close();
      modal.querySelector(".vmodal-close").addEventListener("click", close);
      modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
      modal.addEventListener("close", () => {
        if (current) current.set(false);
        current = null;
        modal.querySelector(".vmodal-stage").innerHTML = "";
        if (modal._opener) modal._opener.focus();
      });
    }
    const stage = modal.querySelector(".vmodal-stage");
    stage.innerHTML = "";
    stage.classList.toggle("is-vertical", video.src.type === "file");
    modal.querySelector(".vmodal-title").textContent = video.title;
    const { box, t } = buildLive(video, imgEl);
    stage.appendChild(box);
    modal._opener = document.activeElement;
    modal.showModal();
    t.focus({ preventScroll: true });
  };

  const makePlayer = (video, opts = {}) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "player";
    b.setAttribute("aria-label", "Lire la vidéo : " + video.title);
    if (video.poster) {
      const img = document.createElement("img");
      img.src = video.poster;
      img.alt = "";
      img.loading = "lazy";
      b.appendChild(img);
    } else if (video.src.type === "yt") {
      const img = document.createElement("img");
      // Miniature YouTube en haute définition, repli sur la version standard si elle n'existe pas
      const hq = `https://i.ytimg.com/vi/${video.src.id}/hqdefault.jpg`;
      img.src = `https://i.ytimg.com/vi/${video.src.id}/maxresdefault.jpg`;
      img.alt = "";
      img.loading = "lazy";
      img.onload = () => { if (img.naturalWidth <= 120 && img.src !== hq) img.src = hq; };
      img.onerror = () => { if (img.src !== hq) img.src = hq; else img.remove(); };
      b.appendChild(img);
    }
    b.insertAdjacentHTML("beforeend", PLAY);
    if (video.src.type === "ig") {
      b.classList.add("is-ig");
      b.insertAdjacentHTML("afterbegin", '<span class="ig-label">Reel Instagram</span>');
      b.addEventListener("click", () => {
        // Instagram n'autorise ni son coupé ni commandes personnalisées : on affiche son lecteur en vertical
        const f = document.createElement("iframe");
        f.src = `https://www.instagram.com/${video.src.kind}/${video.src.id}/embed`;
        f.title = video.title;
        f.allow = "autoplay; encrypted-media";
        f.className = "ig-embed";
        const frame = b.parentElement;
        frame.classList.add("is-tall");
        if (current) current.set(false);
        b.replaceWith(f);
      });
      return b;
    }
    b.addEventListener("click", (ev) => {
      const img = b.querySelector("img");
      if (opts.modal) return openModal(video, img);
      const { box, t } = buildLive(video, img);
      b.replaceWith(box);
      if (ev.detail === 0) t.focus(); // focus seulement au clavier
    });
    return b;
  };

  const renderVideos = (list) => {
  const videos = list.map((v) => ({ ...v, src: parse(v.url) })).filter((v) => v.src);

  /* ---------- Carrousel de l'accueil ---------- */
  const reel = document.getElementById("showreel");
  let gridVideos = videos;
  if (reel) {
    const section = document.getElementById("travaux");
    if (!videos.length) {
      section.hidden = true;
    } else {
      let i = 0;
      const $ = (id) => document.getElementById(id);
      const show = (n) => {
        i = (n + videos.length) % videos.length;
        const v = videos[i];
        if (current) { current.set(false); current = null; }
        reel.innerHTML = "";
        reel.classList.toggle("is-vertical", !!v.poster && v.src.type === "file");
        reel.appendChild(makePlayer(v));
        $("reel-title").textContent = v.title;
        $("reel-cat").textContent = v.category || "";
        $("reel-desc").textContent = v.description || "";
        $("reel-count").textContent = `${i + 1} / ${videos.length}`;
      };
      $("reel-prev").addEventListener("click", () => show(i - 1));
      $("reel-next").addEventListener("click", () => show(i + 1));
      if (videos.length < 2) section.querySelectorAll(".arrow, .reel-count").forEach((e) => (e.hidden = true));
      // Flèches du clavier quand le carrousel a le focus
      section.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); show(i - 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); show(i + 1); }
      });
      // Glisser du doigt sur mobile
      let x0 = null;
      reel.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
      reel.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
        x0 = null;
      });
      show(0);
    }
  }

  /* ---------- Grilles de vidéos (accueil + page Vidéos) ---------- */
  const card = (v, opts = {}) => {
    const fig = document.createElement("figure");
    fig.className = "video";
    fig.innerHTML = '<div class="frame"></div><figcaption><strong></strong><span></span></figcaption><p class="desc"></p>';
    fig.querySelector(".frame").appendChild(makePlayer(v, opts));
    fig.querySelector("strong").textContent = v.title;
    fig.querySelector("figcaption span").textContent = v.category || "";
    const desc = fig.querySelector(".desc");
    if (v.description) desc.textContent = v.description; else desc.remove();
    return fig;
  };

  const setupGrid = (grid, list, filters, { limit = 0, urlParam = false, modal = false } = {}) => {
    const cats = [...new Set(list.map((v) => v.category).filter(Boolean))];
    const count = document.getElementById("video-count");
    const render = (cat) => {
      grid.innerHTML = "";
      let shown = list.filter((v) => !cat || v.category === cat);
      if (limit) shown = shown.slice(0, limit);
      shown.forEach((v) => grid.appendChild(card(v, { modal })));
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
      setupGrid(allGrid, videos, document.getElementById("video-filters"), { urlParam: true, modal: true });
    }
  }
  };

  // Les vidéos sont dans data/videos.json (modifiable depuis la page admin)
  fetch(`data/videos.json?t=${Math.floor(Date.now() / 60000)}`)
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])
    .then((list) => renderVideos(Array.isArray(list) ? list : []));

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
