import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
// Il faut garder les imports car la fonction loadRessourceFromParams utilise dynmaiquement Dresseur, Echange, Carte et Message
import Dresseur from "../models/dresseur.js";
import Echange from "../models/echange.js";
import Carte from "../models/carte.js";
import Message from "../models/message.js";

const verifyJwt = promisify(jwt.verify);

export function authenticate(req, res, next) {
  // Ensure the header is present.
  const authorization = req.get("Authorization");
  if (!authorization) return res.status(401).send("Il manque l'autorisation dans le header");

  // Check that the header has the correct format.
  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).send("L'autorisation dans le header n'est pas un bearer token");
  
  // Extract and verify the JWT.
  const token = match[1];
  verifyJwt(token, jwtSecret)
  .then(payload => {
    if (!mongoose.Types.ObjectId.isValid(payload.sub)) {
      return res.status(400).send("L'id du dresseur dans le JWT est invalide.");
    }
    req.currentUserId = payload.sub;
    // Check if the Dresseur ID exists in the database.
    return Dresseur.findById(req.currentUserId);
  })
  .then(dresseur => {
    if (!dresseur) {
      return res.status(404).send(`L'id de dresseur ${req.currentUserId} ne correspond à rien dans le JWT`);
    }
    req.dresseurCon = dresseur;
    // Dresseur exists, proceed to the next middleware.
    next();
  }).catch(() => {
    return res.status(498).send("Votre token est invalide ou a expiré");
  });
}

export function editPermission(dresseurId) {
  return (req, res, next) => {
    // il faut que la personne qui est chargée soit la même que celle authentifiée
    if (req.currentUserId !== eval(dresseurId).toString()) {
      return res.status(403).send(`Vous n'avez pas les autorisations de modification.`);
    }
    next();
  }
}

export function requireJson(req, res, next) {
  if (req.is('application/json')) {
    return next();
  }

  const error = new Error('Cette ressource ne supporte que le format application/json');
  error.status = 415; // 415 Unsupported Media Type
  next(error);
}

export function loadRessourceFromParams(modelName) {
  return (req, res, next) => {
    const modelNameLowerCase = modelName.toLowerCase();
    const paramName = `${modelNameLowerCase}Id`
    const ressourceId = req.params[paramName];
    // Vérification de la validité de l'ID dans les paramêtres
    if (!mongoose.Types.ObjectId.isValid(ressourceId)) return res.status(400).send(`L'id de la ressource ${modelNameLowerCase} dans les paramêtres est invalide.`);

    // eval permet de "convertir" une chaine de caratctère en javascript
    eval(modelName).findById(ressourceId)
      .exec()
      .then(ressource => {
        // si aucune ressource n'a été trouvée
        if (!ressource) return res.status(404).send(`Aucune ressource ${modelNameLowerCase} ne possède l'id ${ressourceId}`);
        // s'il y a des choses à faire pour certain modèle en particulier
        switch (modelName) {
          case 'Carte':
            const dresseurId = ressource.dresseur_id;
            
            Dresseur.findById(dresseurId)
              .exec()
              .then(dresseur => {
                if (dresseurId.toString() !== req.dresseurCon._id.toString() && ressource.statut === "collectee" && !dresseur.deck_visible) {
                  return res.status(403).send(`Les cartes du dresseur avec l'id ${dresseurId} ne sont pas visible par tout le monde.`);
                } else {
                  req[modelNameLowerCase] = ressource;
                  next();
                }
              })
              .catch(next);
          break;
          default:
            req[modelNameLowerCase] = ressource;
            next();
          break;
        }
      })
      .catch(next);
  }
}

export function loadQuery(queryObject) {
  // format queryObject { nameOfQuery: (required or not) true | false }
  return (req, res, next) => {
    for (const queryName in queryObject) {
      if (queryObject[queryName] && !req.query[queryName]) return res.status(400).send(`Il manque la query '${queryName}' dans l'url.`);
      if (req.query[queryName]) {
        req[queryName] = req.query[queryName];
      }
    }
    next();
  }
}

export function getPaginationParameters(req) {
  // Parse the "page" URL query parameter indicating the index of the first element that should be in the response
  let page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Parse the "pageSize" URL query parameter indicating how many elements should be in the response
  let pageSize = parseInt(req.query.pageSize, 10);
  if (isNaN(pageSize) || pageSize < 0 || pageSize > 50) {
    pageSize = 50;
  }

  return { page, pageSize };
}

export function supChamps(tabChamps) {
  return (req, res, next) => {
    for (const champ of tabChamps) {
      if (req.body[champ]) delete req.body[champ];
    }
    next();
  }
}

export function loadDresseurFromQuery(req, res, next) {
  const dresseurId = req.dresseurId;
  // Si aucun id n'est donné alors par défaut c'est celui du dresseur connecté qui est utilisé
  if (!dresseurId) {
    req.dresseur = req.dresseurCon;
    next();
  } else {
    // Vérification de la validité de l'ID dans les paramêtres
    if (!mongoose.Types.ObjectId.isValid(dresseurId)) return res.status(400).send("L'id du dresseur dans la query est invalide.");

    Dresseur.findById(dresseurId)
      .exec()
      .then(dresseur => {
        if (!dresseur) return res.status(404).send(`Aucun dresseur ne possède l'id ${dresseurId}`);
        req.dresseur = dresseur;
        next();
      })
      .catch(next);
  }
}

export function tabCartesValidator(tabCartes) {
  // Vérification si c'est un tableau
  if (!Array.isArray(tabCartes)) return res.status(400).send("La propriété 'cartes_id' n'est pas un tableau valide.");
  if (tabCartes <= 0) return res.status(400).send("Le tableau 'cartes_id' doit contenir au moins un id de carte.");
  // vérification des cartes
  for (const carteId of tabCartes) {
    if (!mongoose.Types.ObjectId.isValid(carteId)) return res.status(400).send(`L'id ${carteId} n'est pas un id de carte valide.`);
  }
}


