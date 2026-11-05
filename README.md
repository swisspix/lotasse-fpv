# lotasse-fpv.ch

Site vitrine statique, hébergé sur GitHub Pages.

## Ajouter une vidéo
Ouvrir `assets/js/config.js` et ajouter un bloc dans `videos` :

```js
{ title: "Survol d'un chalet", category: "Immobilier", url: "https://youtu.be/XXXXXXXXXXX" },
```
YouTube (vidéo, youtu.be, Shorts) et Vimeo sont acceptés. La première vidéo de la liste s'affiche en grand.
Les boutons de filtre apparaissent automatiquement dès qu'il y a au moins deux catégories.

## Vidéo de fond dans le bandeau d'accueil (facultatif)
Déposer un MP4 court et léger dans `assets/video/` et renseigner `heroVideo` dans `config.js`.

## Changer l'adresse de contact
`email` dans `assets/js/config.js`.

## Structure
- `index.html` — accueil, services, vidéos, déroulé
- `contact.html` — formulaire qui ouvre la messagerie vers l'adresse pro
- `CNAME` — domaine personnalisé (lotasse-fpv.ch), ne pas supprimer
