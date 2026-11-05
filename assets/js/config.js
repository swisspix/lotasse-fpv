/* =========================================================
   CONFIGURATION DU SITE — c'est le seul fichier à modifier
   pour ajouter des vidéos ou changer l'adresse de contact.
   ========================================================= */

window.SITE_CONFIG = {
  // Adresse vers laquelle le formulaire de contact redirige
  email: "contact@lotasse-fpv.ch",

  // Clé Web3Forms reçue par e-mail sur contact@lotasse-fpv.ch (formulaire de contact)
  formKey: "922b38ad-96e0-4000-9821-cebafccfef95",

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
  //   un fichier du site : "assets/video/nom.mp4" + poster: "assets/img/nom.jpg" (lecteur épuré)
  //   https://www.instagram.com/reel/XXXX/ (lecteur Instagram, son et commandes d'Instagram)
  // "category" : reprendre un des services du site pour que les filtres restent cohérents :
  //   "Visites en un seul plan", "Sport et outdoor", "Événements", "Clips et publicité"
  // "description" : une phrase affichée sous la vidéo (facultatif)
  // "start" : seconde à laquelle la vidéo démarre (facultatif, ex. start: 8 pour 0:08)
  // ---------------------------------------------------------
  videos: [
    {
      title: "Hyundai — Châtel",
      category: "Clips et publicité",
      description: "Poursuite d'une Hyundai sur une route de col : le drone colle à la voiture dans les lacets, entre forêt et voie ferrée.",
      url: "https://www.youtube.com/watch?v=K6g6iPONp0s",
      start: 8
    },
    {
      title: "Visite d'appartement",
      category: "Visites en un seul plan",
      description: "Un seul plan continu à travers l'appartement : entrée, salle de bain, puis le séjour ouvert sur la cuisine.",
      url: "https://youtu.be/aDxbl25mkjQ"
    },
    {
      title: "Cornettes de Bise",
      category: "Sport et outdoor",
      description: "Vol en rase-mottes sur les pâturages puis le long des crêtes rocheuses des Cornettes de Bise, dans les Préalpes.",
      url: "https://www.youtube.com/watch?v=AEcJ6QWoRsE"
    },
    {
      title: "Île de la Réunion — Volcan",
      category: "Sport et outdoor",
      description: "Au ras des coulées de lave du Piton de la Fournaise, jusqu'à l'équipe restée au bord de la route.",
      url: "https://www.youtube.com/watch?v=u-jIxZrmmrw"
    },
    {
      title: "Trail Blonay – St-Légier 2025",
      category: "Clips et publicité",
      description: "Annonce de la course du 17 mai 2025 : vol en rase-mottes sur les pâturages au-dessus du Léman, jusqu'aux coureurs.",
      url: "assets/video/trail-blonay-2025.mp4",
      poster: "assets/img/trail-blonay-2025.jpg"
    }
    // ,{ title: "Titre", category: "Catégorie", description: "Une phrase.", url: "https://youtu.be/XXXXXXXXXXX" }
  ]
};
