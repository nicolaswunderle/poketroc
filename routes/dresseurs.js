import debugFactory from 'debug';
import express from "express";
import bcrypt from "bcrypt";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
import jwt from "jsonwebtoken";
import Dresseur from "../models/dresseur.js";
import { bcryptCostFactor } from "../config.js";
import { authenticate, loadDresseurFromParams, supChampsDresseur, editPermissionDresseur, requireJson } from "./utils.js";
import { broadcastDresseur } from '../websocket.js';

const debug = debugFactory('poketroc:dresseurs');
const router = express.Router();

const signJwt = promisify(jwt.sign);

// Créer un dresseur
router.post("/", requireJson, supChampsDresseur, function (req, res, next) {
  const mdpBrut = req.body.mot_de_passe;
  const nouveauDresseur = new Dresseur(req.body);

  if (mdpBrut) {
    bcrypt.hash(mdpBrut, bcryptCostFactor)
      .then(mdpHashe => {
        nouveauDresseur.mot_de_passe = mdpHashe;
        return nouveauDresseur.save();
      })
      .then(dresseurSauve => {   
        res.status(201).send(dresseurSauve);
        next();
      })
      .catch(next);
  } else {
    // ne va jamais créer le dressseur car il manque le mot de passe mais permet d'avoir toutes les erreurs de validation si d'autres champs ne sont pas valides
    nouveauDresseur.save().then(dresseurSauve => {   
      res.status(201).send(dresseurSauve);
    })
    .catch(next);
  }
    
});

// Permet de se connecter
router.post("/connexion", requireJson, function (req, res, next) {
  if (!req.body.pseudo) return res.status(400).send("Il manque le pseudo");
  if (!req.body.mot_de_passe) return res.status(400).send("Il manque le mot de passse");
  Dresseur.findOne({ pseudo: req.body.pseudo })
      .exec()
      .then(dresseur => {
        if (!dresseur) return res.status(404).send(`Aucun dresseur ne correpsond à l'id ${req.body.pseudo}`);
        return { valid: bcrypt.compare(req.body.mot_de_passe, dresseur.mot_de_passe), dresseur: dresseur };
      })
      .then(({valid, dresseur}) => {
        if (!valid) return res.status(401).send("Le mot de passe n'est pas valide");
        // Login is valid...
        // Create the payload for the JWT including the user ID and expiration
        const payload = {
          sub: dresseur._id.toString(),
          // UNIX timstamp representing a date in 7 days.
          exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
        };
        // Create and sign a token.
        signJwt(payload, jwtSecret)
          .then(token => {
            if (!token) return res.status(400).send("Le token n'a pas pu être créé.");
            dresseur.updatedAt = new Date();
            dresseur.en_ligne = true;
            dresseur.save().then(dresseurSauve => {
              if (!dresseurSauve) return res.status(400).send("Le dresseur n'a pas pu être modifié.");
              broadcastDresseur({nouveauDresseur: dresseurSauve})
              res.status(201).send({ 
                token,
                dresseur: dresseurSauve
              });
            })
            .catch(next)
            
          })
          .catch(next);
      })
      .catch(next);
});

// Permet de se déconnecter
router.delete("/connexion", authenticate, function (req, res, next) {
  // si la personne est connectée et que son id est valide
  const dresseur = req.dresseurCon;
  dresseur.updatedAt = new Date();
  dresseur.en_ligne = false;
  dresseur.save().then(dresseurSauve => {
    if (!dresseurSauve) return res.status(400).send("Le dresseur n'a pas pu être modifié.");
    res.sendStatus(204);
  })
  .catch(next);
});

// Affiche un dresseur
router.get("/:dresseurId", authenticate, loadDresseurFromParams, function (req, res, next) {
  res.status(200).send(req.dresseur);
});

// Modifie le dresseur
router.patch("/:dresseurId", requireJson, authenticate, loadDresseurFromParams, editPermissionDresseur, function (req, res, next) {
  const dresseur = req.dresseur;
  const majDresseur = req.body;
  let modification = false;
  // mise à jour des données 
  Object.keys(majDresseur).forEach((cle) => {
    if (dresseur[cle] !== majDresseur[cle] && (cle !== "_id" || cle !== "__v" || cle !== "createdAt" || cle !== "updatedAt")) {
      // si la valeur n'est pas la même qu'avant alors on la change
      dresseur[cle] = majDresseur[cle];
      if (!modification) modification = true;
    }
  });

  // ajoute le champ mot de passe si il a été modifié
  const { mot_de_passe } = majDresseur;
  if (mot_de_passe || modification) {
    // Si il y a eu un changement 
    dresseur.updatedAt = new Date();
    if (mot_de_passe) {
      bcrypt.hash(mot_de_passe, bcryptCostFactor)
        .then(mdpHashe => {
          dresseur.mot_de_passe = mdpHashe;
          return dresseur.save();
        })
        .then(dresseurSauve => {   
          res.status(200).send(dresseurSauve);
        })
        .catch(next);
    } else {
      dresseur.save().then(dresseurSauve => {   
        res.status(200).send(dresseurSauve);
      })
      .catch(next);
    }
  } else {
    res.status(304).send("Le dresseur n'a pas été modifié car aucun changement n'a été détecté");
  }
  

});

// Supprime le dresseur
router.delete("/:dresseurId", authenticate, loadDresseurFromParams, editPermissionDresseur, function (req, res, next) {
  Dresseur.deleteOne({ _id: req.dresseur.id })
    .exec()
    .then((valid) => {
      if (valid.deletedCount === 0) return res.status(404).send("Dresseur non trouvée");
      res.sendStatus(204);
    })
    .catch(next);
});



export default router;