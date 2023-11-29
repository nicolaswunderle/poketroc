import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
import Dresseur from "../models/dresseur.js";

const verifyJwt = promisify(jwt.verify);

export function authenticate(req, res, next) {
  // Ensure the header is present.
  const authorization = req.get("Authorization");
  if (!authorization) {
    return res.status(401).send("Il manque l'autorisation dans le header");
  }
  // Check that the header has the correct format.
  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).send("L'autorisation dans le header n'est pas un bearer token");
  }
  // Extract and verify the JWT.
  const token = match[1];
  verifyJwt(token, jwtSecret).then(payload => {
    if (!mongoose.Types.ObjectId.isValid(payload.sub)) {
      return res.status(400).send("L'id du dresseur est invalide.");
    }
    req.currentUserId = payload.sub;
    // Check if the Dresseur ID exists in the database.
    return Dresseur.findById(req.currentUserId);
  })
  .then(dresseur => {
    if (!dresseur) {
      return res.status(404).send(`L'id de dresseur ${req.currentUserId} ne correspond à rien dans le JWT`);
    }
    // Dresseur exists, proceed to the next middleware.
    next();
  }).catch(() => {
    res.status(498).send("Votre token est invalide ou a expiré");
  });
}

export function loadDresseurFromParams(req, res, next) {
  // Vérification de la validité de l'ID dans les paramêtres
  if (!mongoose.Types.ObjectId.isValid(req.params.dresseurId)) {
    return res.status(400).send("L'id du dresseur est invalide.");
  }
  Dresseur.findById(req.params.dresseurId)
    .exec()
    .then(dresseur => {
      if (!dresseur) {
        return res.status(404).send(`Aucun dresseur ne possède l'id ${req.params.dresseurId}`);
      }
      req.dresseur = dresseur;
      next();
    })
    .catch(err => next(err));
}

export function loadPaginationFromParams(req, res, next) {
  const page = Math.trunc(Number(req.query.page)) ? Math.trunc(Number(req.query.page)) : 1;
  const pagesize = Math.trunc(Number(req.query.pagesize)) ? Math.trunc(Number(req.query.pagesize)) : 30;
  if (page >= 1) {
    req.page = page;
  } else {
    return res.status(401).send("Le numéro de page ne peut pas être en dessous de 1.");
  }
  if (pagesize > 1 || pagesize < 30) {
    req.pagesize = pagesize;
  } else {
    return res.status(401).send("La taille de page ne peut pas être en dessous de 1 et au dessus de 30.");
  }
  next();
}

export function editPermissionDresseur(req, res, next) {
  // il faut que la personne qui est chargée soit la même que celle authentifiée
  if (req.params.dresseurId !== req.currentUserId) {
    return res.status(403).send(`Vous n'avez pas les autorisations pour modifier un autre compte`);
  }
  next();
}

export function loadLocationFromParams(req, res, next) {
  const localisation = req.query.localisation;
  if (localisation) {
    let localisationArray = [];
    try {
      localisationArray = JSON.parse(localisation);
    } catch {
      res.status(400).send("Le tableau n'est pas valide.");
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