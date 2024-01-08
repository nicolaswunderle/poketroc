import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
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
  if (!mongoose.Types.ObjectId.isValid(dresseurId)) return res.status(400).send("L'id du dresseur dans les paramêtres est invalide.");

  Dresseur.findById(dresseurId)
    .exec()
    .then(dresseur => {
      if (!dresseur) return res.status(404).send(`Aucun dresseur ne possède l'id ${dresseurId}`);
      req.dresseur = dresseur;
      next();
    })
    .catch(next);
}

export function loadDresseurFromQuery(req, res, next) {
  const dresseurId = req.query.dresseurId;
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

export function supChampsDresseur(req, res, next) {
  // on enlève les champs qui ne peuvent pas être créé par l'utilisateur
  if (req.body.en_ligne) delete req.body.en_ligne;
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
  if (req.body.dresseur_cree_id) delete req.body.dresseur_cree_id;
  if (req.body.etat) delete req.body.etat;
  if (req.body.createdAt) delete req.body.createdAt;
  if (req.body.updatedAt) delete req.body.updatedAt;
  next();
}

export function loadCarteFromParams(req, res, next) {
  const carteId = req.params.carteId;
  // Vérification de la validité de l'ID dans les paramêtres
  if (!mongoose.Types.ObjectId.isValid(carteId)) return res.status(400).send("L'id de la carte est invalide.");

  Carte.findById(carteId)
    .exec()
    .then(carte => {
      if (!carte) return res.status(404).send(`Aucune carte ne possède l'id ${carteId}`);
      Dresseur.findById(carte.dresseur_id)
        .exec()
        .then(dresseur => {
          if (carte.dresseur_id.toString() !== req.dresseurCon._id.toString() && carte.statut === "collectee" && !dresseur.deck_visible) {
            return res.status(403).send(`Les cartes du dresseur avec l'id ${carte.dresseur_id} ne sont pas visible par tout le monde.`);
          } else {
            req.carte = carte;
            next();
          }
        })
        .catch(next)
    })
    .catch(next);
}

export function supChampsCarte(req, res, next) {
  if (req.body.dresseur_id) delete req.body.dresseur_id;
  if (req.body.createdAt) delete req.body.createdAt;
  if (req.body.updatedAt) delete req.body.updatedAt;
  next();
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

export function supChampsMessage(req, res, next) {
  if (req.body.createdAt) delete req.body.createdAt;
  if (req.body.updatedAt) delete req.body.updatedAt;
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
  let pageSize = parseInt(req.query.pageSize, 10);
  if (isNaN(pageSize) || pageSize < 0 || pageSize > 50) {
    pageSize = 50;
  }

  return { page, pageSize };
}
