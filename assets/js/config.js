/* =========================================================
   CONFIGURATION DU SITE — c'est le seul fichier à modifier
   pour ajouter des vidéos ou changer l'adresse de contact.
   ========================================================= */

window.SITE_CONFIG = {
  // Adresse vers laquelle le formulaire de contact redirige
  email: "contact@lotasse-fpv.ch",

  // Clé Web3Forms reçue par e-mail sur contact@lotasse-fpv.ch (formulaire de contact)
  formKey: "",

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
  // "description" : une phrase affichée sous la vidéo (facultatif)
  // ---------------------------------------------------------
  videos: [
    {
      title: "Hyundai — Châtel",
      category: "Automobile",
      description: "Poursuite d'une Hyundai sur une route de col : le drone colle à la voiture dans les lacets, entre forêt et voie ferrée.",
      url: "https://www.youtube.com/watch?v=K6g6iPONp0s"
    },
    {
      title: "Cornettes de Bise",
      category: "Montagne",
      description: "Vol en rase-mottes sur les pâturages puis le long des crêtes rocheuses des Cornettes de Bise, dans les Préalpes.",
      url: "https://www.youtube.com/watch?v=AEcJ6QWoRsE"
    },
    {
      title: "Île de la Réunion — Volcan",
      category: "Voyage",
      description: "Au ras des coulées de lave du Piton de la Fournaise, jusqu'à l'équipe restée au bord de la route.",
      url: "https://www.youtube.com/watch?v=u-jIxZrmmrw"
    },
    {
      title: "Visite d'appartement",
      category: "Immobilier",
      description: "Un seul plan continu à travers l'appartement : entrée, salle de bain, puis le séjour ouvert sur la cuisine.",
      url: "https://youtu.be/aDxbl25mkjQ"
    }
    // ,{ title: "Titre", category: "Catégorie", description: "Une phrase.", url: "https://youtu.be/XXXXXXXXXXX" }
  ]
};
