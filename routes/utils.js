import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
import Dresseur from "../models/dresseur.js";
import Echange from "../models/echange.js";
//import Carte from "../models/carte.js";
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

export function editPermissionDresseur(req, res, next) {
  // il faut que la personne qui est chargée soit la même que celle authentifiée
  if (req.params.dresseurId !== req.currentUserId) {
    return res.status(403).send(`Vous n'avez pas les autorisations pour modifier un autre compte`);
  }
  next();
}

export function loadDresseurFromParams(req, res, next) {
  const dresseurId = req.params.dresseurId;
  // Vérification de la validité de l'ID dans les paramêtres
  if (!mongoose.Types.ObjectId.isValid(dresseurId)) return res.status(400).send("L'id du dresseur est invalide.");

  Dresseur.findById(dresseurId)
    .exec()
    .then(dresseur => {
      if (!dresseur) return res.status(404).send(`Aucun dresseur ne possède l'id ${dresseurId}`);
      req.dresseur = dresseur;
      next();
    })
    .catch(next);
}

export function supChampsDresseur(req, res, next) {
  // on enlève les champs qui ne peuvent pas être créé par l'utilisateur
  if (req.body.createdAt) delete req.body.createdAt;
  if (req.body.updatedAt) delete req.body.updatedAt;
  next();
}

export function loadEchangeFromParams(req, res, next) {
  const echangeId = req.params.echangeId;
  // Vérification de la validité de l'ID dans les paramêtres
  if (!mongoose.Types.ObjectId.isValid(echangeId)) return res.status(400).send("L'id de l'échange est invalide.");

  Echange.findById(echangeId)
    .exec()
    .then(echange => {
      if (!echange) return res.status(404).send(`Aucun échange ne possède l'id ${echangeId}`);
      req.echange = echange;
      next();
    })
    .catch(next);
}

export function supChampsEchange(req, res, next) {
  if (req.body.etat) delete req.body.etat;
  if (req.body.createdAt) delete req.body.createdAt;
  if (req.body.updatedAt) delete req.body.updatedAt;
  next();
}

export function supChampsCarte(req, res, next) {
  if (req.body.dresseur_id) delete req.body.dresseur_id;
  if (req.body.createdAt) delete req.body.createdAt;
  if (req.body.updatedAt) delete req.body.updatedAt;
  next();
}

export function supChampsMessage(req, res, next) {
  if (req.body.createdAt) delete req.body.createdAt;
  if (req.body.updatedAt) delete req.body.updatedAt;
  next();
}

export function loadLocationFromParams(req, res, next) {
  const localisation = req.query.localisation;
  if (localisation) {
    let localisationArray = [];
    try {
      localisationArray = JSON.parse(localisation);
    } catch {
      return res.status(400).send("Le tableau n'est pas valide.");
    }
    if (Array.isArray(localisationArray)) {
      if (localisationArray.length == 2) {
        if (typeof localisationArray[0] === "number" && typeof localisationArray[1] === "number") {
          if ((localisationArray[0] >= -90 && localisationArray[0] <= 90) && (localisationArray[1] >= -180 && localisationArray[1] <= 180)) {
            req.localisation = localisationArray;
          } else {
            return res.status(400).send("Le première coordonnée doit être en -90 et 90 et la deuxième entre -180 et 180.")
          }
        } else {
          return res.status(400).send("Les coordonnées ne sont pas des nombres.")
        }
      } else {
        return res.status(400).send("Le tableau de coordonnées doit contenir deux coordonées.")
      }
    } else {
      return res.status(400).send("Le paramètre localisation n'est pas un tableau.")
    }
  } else {
    return res.status(400).send("Il manque le paramètre localisation.");
  }
  next();
}

export function requireJson(req, res, next) {
  if (req.is('application/json')) {
    return next();
  }

  const error = new Error('Cette ressource ne supporte que le format application/json');
  error.status = 415; // 415 Unsupported Media Type
  next(error);
}

export function getPaginationParameters(req) {
  // Parse the "page" URL query parameter indicating the index of the first element that should be in the response
  let page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Parse the "pageSize" URL query parameter indicating how many elements should be in the response
  let pageSize = parseInt(req.query.pagesize, 10);
  if (isNaN(pageSize) || pageSize < 0 || pageSize > 50) {
    pageSize = 50;
  }

  return { page, pageSize };
}

export function loadMessageFromParams(req, res, next) {
  const messageId = req.params.messageId;
  // Vérification de la validité de l'ID dans les paramêtres
  if (!mongoose.Types.ObjectId.isValid(messageId)) return res.status(400).send("L'id du message est invalide.");

  Message.findById(messageId)
    .exec()
    .then(message => {
      if (!message) return res.status(404).send(`Aucun message ne possède l'id ${messageId}`);
      req.message = message;
      next();
    })
    .catch(next);
}
