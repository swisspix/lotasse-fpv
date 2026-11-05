/* Mode clair / sombre : suit le réglage de l'appareil, sauf si le visiteur a choisi avec le bouton du menu */
(function () {
  var KEY = "lfpv_theme";
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var isDark = function () { return root.dataset.theme ? root.dataset.theme === "dark" : mq.matches; };

  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.querySelector(".site-head .nav") || document.querySelector(".site-head .wrap");
    if (!nav) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "theme-btn";
    var paint = function () {
      var dark = isDark();
      b.innerHTML = dark ? SUN : MOON;
      b.setAttribute("aria-label", dark ? "Passer en mode clair" : "Passer en mode sombre");
      b.title = b.getAttribute("aria-label");
    };
    b.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) {}
      paint();
    });
    if (mq.addEventListener) mq.addEventListener("change", paint);
    paint();
    nav.appendChild(b);
  });
})();
