/* =========================================================
   CONFIGURATION DU SITE — c'est le seul fichier à modifier
   pour ajouter des vidéos ou changer l'adresse de contact.
   ========================================================= */

window.SITE_CONFIG = {
  // Adresse vers laquelle le formulaire de contact redirige
  email: "contact@lotasse-fpv.ch",

  // Vidéo de fond du bandeau d'accueil (facultatif).
  // Déposez un fichier MP4 court et léger (idéalement < 8 Mo, sans son)
  // dans assets/video/ puis indiquez son chemin, ex. "assets/video/showreel.mp4".
  // Laissez "" pour garder le fond graphique.
  heroVideo: "",

  // ---------------------------------------------------------
  // VOS VIDÉOS
  // Collez simplement le lien YouTube ou Vimeo.
  // Formats acceptés :
  //   https://www.youtube.com/watch?v=XXXX
  //   https://youtu.be/XXXX
  //   https://www.youtube.com/shorts/XXXX
  //   https://vimeo.com/123456789
  // "category" est libre (ex. Immobilier, Événement, Sport…)
  // ---------------------------------------------------------
  videos: [
    {
      title: "Exemple — remplacez par votre première vidéo",
      category: "Showreel",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
    // ,{
    //   title: "Survol d'un chalet à Verbier",
    //   category: "Immobilier",
    //   url: "https://youtu.be/XXXXXXXXXXX"
    // }
  ]
};
