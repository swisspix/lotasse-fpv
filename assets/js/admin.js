/* Admin des vidéos : lit et enregistre data/videos.json dans le dépôt GitHub
   avec une clé GitHub (fine-grained token) gardée seulement dans ce navigateur. */
(function () {
  const REPO = "swisspix/lotasse-fpv";
  const PATH = "data/videos.json";
  const API = `https://api.github.com/repos/${REPO}/contents/${PATH}`;
  const KEY = "lfpv_admin_token";

  const $ = (id) => document.getElementById(id);
  const store = {
    get() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };

  let token = store.get();
  let sha = null;
  let videos = [];
  let dirty = false;
  let editing = -1; // index en cours de modification, -1 = ajout

  // ---------- Outils ----------
  const b64decode = (s) => decodeURIComponent(escape(atob(s.replace(/\n/g, ""))));
  const b64encode = (s) => btoa(unescape(encodeURIComponent(s)));

  const gh = async (method, body) => {
    const res = await fetch(API + (method === "GET" ? `?ref=main&t=${Date.now()}` : ""), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || `Erreur ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return json;
  };

  const ytId = (url) => {
    try {
      const u = new URL(url);
      const h = u.hostname.replace(/^(www|m)\./, "");
      if (h === "youtu.be") return u.pathname.slice(1);
      if (h.endsWith("youtube.com")) {
        if (u.searchParams.get("v")) return u.searchParams.get("v");
        const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]+)/);
        if (m) return m[2];
      }
    } catch (e) {}
    return null;
  };
  const isVideoUrl = (url) => {
    if (ytId(url)) return true;
    try { return new URL(url).hostname.replace(/^www\./, "").endsWith("vimeo.com"); } catch (e) { return false; }
  };
  const thumb = (v) => {
    if (v.poster) return v.poster;
    const id = ytId(v.url || "");
    return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : "";
  };

  const setStatus = (text, kind = "") => {
    const s = $("status");
    s.textContent = text;
    s.className = "admin-msg" + (kind ? " " + kind : "");
  };
  const markDirty = () => {
    dirty = true;
    $("publish").disabled = false;
    setStatus("Changements non publiés");
  };

  // ---------- Écrans ----------
  const showLogin = (msg = "") => {
    $("login").hidden = false;
    $("manager").hidden = true;
    $("logout").hidden = true;
    $("login-msg").textContent = msg;
    $("login-msg").className = "admin-msg" + (msg ? " err" : "");
  };
  const showManager = () => {
    $("login").hidden = true;
    $("manager").hidden = false;
    $("logout").hidden = false;
  };

  const load = async () => {
    try {
      const file = await gh("GET");
      sha = file.sha;
      videos = JSON.parse(b64decode(file.content));
      if (!Array.isArray(videos)) videos = [];
      dirty = false;
      $("publish").disabled = true;
      setStatus("");
      showManager();
      render();
    } catch (e) {
      if (e.status === 401 || e.status === 403 || e.status === 404) {
        store.clear();
        token = "";
        showLogin("Clé refusée par GitHub. Vérifie qu'elle donne accès au dépôt lotasse-fpv avec la permission Contents en lecture et écriture.");
      } else {
        showLogin("Impossible de joindre GitHub : " + e.message);
      }
    }
  };

  // ---------- Liste ----------
  let dragFrom = null;
  const render = () => {
    const list = $("vlist");
    list.innerHTML = "";
    if (!videos.length) {
      list.innerHTML = '<li class="vitem" style="grid-template-columns:1fr"><span class="admin-msg">Aucune vidéo. Ajoute la première avec le formulaire ci-dessous.</span></li>';
      return;
    }
    videos.forEach((v, i) => {
      const li = document.createElement("li");
      li.className = "vitem";
      li.draggable = true;
      li.innerHTML = `
        <span class="handle" aria-hidden="true" title="Glisser pour déplacer">⋮⋮</span>
        <img class="vthumb" alt="">
        <div class="vmeta"><strong></strong><span></span><p></p></div>
        <div class="vactions">
          <span class="vnum">${i + 1}</span>
          <button type="button" data-a="up" aria-label="Monter">↑</button>
          <button type="button" data-a="down" aria-label="Descendre">↓</button>
          <button type="button" data-a="edit">Modifier</button>
          <button type="button" data-a="del" class="del">Supprimer</button>
        </div>`;
      const img = li.querySelector("img");
      const t = thumb(v);
      img.onerror = () => { img.removeAttribute("src"); img.onerror = null; };
      if (t) img.src = t;
      li.querySelector("strong").textContent = v.title || "(sans titre)";
      li.querySelector(".vmeta span").textContent = v.category || "";
      li.querySelector(".vmeta p").textContent = v.description || "";
      li.querySelector('[data-a="up"]').disabled = i === 0;
      li.querySelector('[data-a="down"]').disabled = i === videos.length - 1;
      li.querySelectorAll("button").forEach((b) => b.setAttribute("aria-label", (b.getAttribute("aria-label") || b.textContent) + " : " + (v.title || "")));

      li.addEventListener("click", (e) => {
        const a = e.target.closest("button")?.dataset.a;
        if (!a) return;
        if (a === "up") move(i, i - 1);
        if (a === "down") move(i, i + 1);
        if (a === "edit") startEdit(i);
        if (a === "del" && confirmDelete(v)) { videos.splice(i, 1); if (editing === i) resetForm(); markDirty(); render(); }
      });
      // Glisser-déposer
      li.addEventListener("dragstart", () => { dragFrom = i; li.classList.add("dragging"); });
      li.addEventListener("dragend", () => li.classList.remove("dragging"));
      li.addEventListener("dragover", (e) => { e.preventDefault(); li.classList.add("over"); });
      li.addEventListener("dragleave", () => li.classList.remove("over"));
      li.addEventListener("drop", (e) => { e.preventDefault(); li.classList.remove("over"); if (dragFrom !== null) move(dragFrom, i); dragFrom = null; });
      list.appendChild(li);
    });
  };

  // La suppression est annulable tant qu'on n'a pas publié : on demande simplement confirmation dans la page
  const confirmDelete = (v) => {
    setStatus(`« ${v.title} » retirée de la liste. Publie pour confirmer, ou recharge la page pour annuler.`);
    return true;
  };

  const move = (from, to) => {
    if (to < 0 || to >= videos.length || from === to) return;
    const [item] = videos.splice(from, 1);
    videos.splice(to, 0, item);
    if (editing === from) editing = to;
    markDirty();
    render();
  };

  // ---------- Formulaire ----------
  const fields = { url: $("f-url"), title: $("f-title"), cat: $("f-cat"), desc: $("f-desc"), start: $("f-start") };
  const formMsg = (t, kind = "err") => { $("form-msg").textContent = t; $("form-msg").className = "admin-msg " + kind; };

  const ensureCategory = (cat) => {
    if (cat && ![...fields.cat.options].some((o) => o.value === cat)) {
      const o = document.createElement("option");
      o.textContent = cat;
      fields.cat.appendChild(o);
    }
  };

  const resetForm = () => {
    editing = -1;
    $("edit-form").reset();
    fields.url.disabled = false;
    $("form-title").textContent = "Ajouter une vidéo";
    $("f-submit").textContent = "Ajouter à la liste";
    $("f-cancel").hidden = true;
    formMsg("", "");
  };

  const startEdit = (i) => {
    const v = videos[i];
    editing = i;
    fields.url.value = v.url || "";
    // Une vidéo hébergée sur le site (fichier MP4) garde son lien
    fields.url.disabled = !/^https?:/i.test(v.url || "");
    fields.title.value = v.title || "";
    ensureCategory(v.category);
    fields.cat.value = v.category || fields.cat.options[0].value;
    fields.desc.value = v.description || "";
    fields.start.value = v.start || "";
    $("form-title").textContent = "Modifier la vidéo";
    $("f-submit").textContent = "Enregistrer dans la liste";
    $("f-cancel").hidden = false;
    formMsg("", "");
    $("edit-form").scrollIntoView({ behavior: "smooth", block: "start" });
    fields.title.focus({ preventScroll: true });
  };

  // Titre proposé automatiquement à partir du lien YouTube / Vimeo
  fields.url.addEventListener("change", async () => {
    const url = fields.url.value.trim();
    if (!isVideoUrl(url) || fields.title.value) return;
    try {
      const r = await fetch("https://noembed.com/embed?url=" + encodeURIComponent(url));
      const j = await r.json();
      if (j.title && !fields.title.value) fields.title.value = j.title;
    } catch (e) {}
  });

  $("f-cancel").addEventListener("click", resetForm);

  $("edit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const url = fields.url.value.trim();
    const title = fields.title.value.trim();
    if (!fields.url.disabled && !isVideoUrl(url)) return formMsg("Colle un lien YouTube (watch, youtu.be ou Shorts) ou Vimeo."), fields.url.focus();
    if (!title) return formMsg("Ajoute un titre."), fields.title.focus();

    const base = editing >= 0 ? { ...videos[editing] } : {};
    const v = { ...base, title, category: fields.cat.value, url: fields.url.disabled ? base.url : url };
    const desc = fields.desc.value.trim();
    if (desc) v.description = desc; else delete v.description;
    const start = parseInt(fields.start.value, 10);
    if (start > 0) v.start = start; else delete v.start;

    if (editing >= 0) videos[editing] = v; else videos.push(v);
    const added = editing < 0;
    resetForm();
    markDirty();
    render();
    formMsg(added ? "Ajoutée en fin de liste. Déplace-la si besoin, puis publie." : "Modifications enregistrées dans la liste. Publie pour les mettre en ligne.", "ok");
  });

  // ---------- Publication ----------
  $("publish").addEventListener("click", async () => {
    const btn = $("publish");
    btn.disabled = true;
    btn.textContent = "Publication…";
    try {
      const res = await gh("PUT", {
        message: "Vidéos : mise à jour depuis l'admin",
        content: b64encode(JSON.stringify(videos, null, 2) + "\n"),
        sha,
        branch: "main",
      });
      sha = res.content.sha;
      dirty = false;
      setStatus("Publié. Le site sera à jour d'ici 1 à 2 minutes.", "ok");
    } catch (e) {
      btn.disabled = false;
      if (e.status === 409) setStatus("La liste a changé ailleurs entre-temps. Recharge la page puis refais tes changements.", "err");
      else if (e.status === 401 || e.status === 403) setStatus("GitHub refuse l'enregistrement : la clé n'a pas la permission Contents en écriture.", "err");
      else setStatus("Échec de la publication : " + e.message, "err");
    } finally {
      btn.textContent = "Publier les changements";
    }
  });

  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  // ---------- Connexion ----------
  $("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    token = $("token").value.trim();
    if (!token) return;
    store.set(token);
    $("token").value = "";
    load();
  });
  $("logout").addEventListener("click", () => {
    if (dirty && !window.confirm("Des changements ne sont pas publiés. Se déconnecter quand même ?")) return;
    store.clear();
    token = "";
    dirty = false;
    showLogin();
  });

  if (token) load(); else showLogin();
})();
