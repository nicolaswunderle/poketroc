# poketroc

Pokétroc est une API REST conçue pour stocker son deck de cartes Pokémon ainsi que gérer des échanges de cartes avec des personnes à proximité de soi, intégrant des fonctionnalités de notification via WebSocket.


## Fonctionnaliés

    - Gestion des utilisateurs : inscription, suppression, connexion, déconnexion, modification du profil.
    - Gestion des cartes : Créer, Afficher, Modifier, supprimer.
    - Gestion des échanges : Créer, Afficher, Modifier, supprimer.
    - Intégration des données Pokémon depuis le site https://pokemontcg.io/ pour chaque carte.
    - Notification Websocket pour des mises à jour des cartes, des échanges et des messages.
    - Filtrage avancé et pagination des données.
    - Authentication JWT pour sécuriser l'accès aux endepoints.


## Technologies utiliées
    - Node.js
    - MongoDB
    - WebSocket


## Usage

### Cloner le repository
git clone https://github.com/nicolaswunderle/poketroc.git

### Installer les dépendances
cd poketroc
npm i

### Lancer l'application en mode développement
npm run dev

### Lancer l'application en mode production
npm run start


## Configuration

L'application est configurée via les variables d'environnement suivantes :

| Variable             | Default value                     | Description                                                                           |
| :------------------- | :-------------------------------- | :------------------------------------------------------------------------------------ |
| `BCRYPT_COST_FACTOR` | `10`                              | Facteur de coût pour le hachage de mot de passe.                                      |
| `DATABASE_URL`       | `mongodb://localhost/poketroc`    | L'URI de la connexion MongoDB                                                         |
| `JWT_SECRET`         | `letmein`                         | Le secret utilisé pour signer les JWT. Ce devrait être une longue chaîne aléatoire.   |
| `PORT`               | `3000`                            | Le port sur lequel le serveur écoutera.                                               |


## Tests

Exécutez les tests unitaires et d'intégration :
```bash
npm run test (npm run testw pour les utilsateurs de Windows)
```
Exécuter les tests unitaires et d'intégration avec coverage :
```bash
npm run coverage
```
 

## WebSocket

Utilisez WebSocket pour recevoir des notifications en temps réel sur les joueurs à proximité et les demandes de messages.

Il faut se connecter au ws://localhost:3000 

Il y a deux façons de l'utiliser : Envoyer un objet via un token et get un dresseur à proximité :

1. Exemple :{type : 'getDresseurAProximite', 
            token : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTZhNDlhODM0NmRmNjcyMGYwZWRjNzkiLCJleHAiOjE3MDIwNjkzMDcsImlhdCI6MTcwMTQ2NDUwN30.Gb3bfD6tw0tLCeUAn_AXYVnurWjP8Ugcd4OEENtk0r8', 
            localisation : [27.435, 50.357]} 
Lorsque un dresseur se connect, on reçoit son profil en entier.

2. Exemple :{type : 'getDresseurAProximite', 
            token : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTZhNDlhODM0NmRmNjcyMGYwZWRjNzkiLCJleHAiOjE3MDIwNjkzMDcsImlhdCI6MTcwMTQ2NDUwN30.Gb3bfD6tw0tLCeUAn_AXYVnurWjP8Ugcd4OEENtk0r8', 
            echangeId : '656a05bf928eaba27efa0b96'} 
Donne la liste de tous les messages de cet échange. Lorsque le dresseur répond, on reçoit le nouveau message.


## Documentation API

Consultez la documentation Swagger pour une liste complète des endpoints et modèles de données : [Swagger](https://poketroc.onrender.com/api-docs)