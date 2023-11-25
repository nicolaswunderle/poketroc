import debugFactory from 'debug';
import express from "express";
import bcrypt from "bcrypt";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
import jwt from "jsonwebtoken";
import Dresseur from "../models/dresseur.js";
import { bcryptCostFactor } from "../config.js";
import { authenticate, loadDresseurFromParams, editPermissionDresseur } from "./utils.js";

const debug = debugFactory('poketroc:dresseurs');
const router = express.Router();

const signJwt = promisify(jwt.sign);

// Créer un dresseur
router.post("/", function (req, res, next) {
    const mdpBrut = req.body.mot_de_passe;

    bcrypt.hash(mdpBrut, bcryptCostFactor)
      .then(mdpHashe => {
        const nouveauDresseur = new Dresseur(req.body);
        nouveauDresseur.mot_de_passe = mdpHashe;
        return nouveauDresseur.save();
      })
      .then(dresseurSauve => {   
        res.status(201).send(dresseurSauve);
      })
      .catch(next);
});

// Affiche un dresseur
router.get("/:dresseurId", authenticate, loadDresseurFromParams, function (req, res, next) {
  res.status(200).send(req.dresseur);
  next();
});

// Modifie le dresseur
router.patch("/:dresseurId", authenticate, loadDresseurFromParams, editPermissionDresseur, function (req, res, next) {
  const dresseur = req.dresseur;
  const majDresseur = req.body;
  // mise à jour des données 
  Object.keys(majDresseur).forEach((cle) => {
    if (dresseur[cle] !== majDresseur[cle] && cle !== "_id") {
      // si la valeur n'est pas la même qu'avant alors on la change
      dresseur[cle] = majDresseur[cle];
    }
  });
  // ajoute le champ mot de passe si il a été modifié
  const { mot_de_passe } = majDresseur;
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
  

});

// Supprime le dresseur
router.delete("/:dresseurId", authenticate, loadDresseurFromParams, editPermissionDresseur, function (req, res, next) {
  Dresseur.deleteOne({ _id: req.dresseur.id })
    .exec()
    .then(valid => {
      if (!valid) return res.sendStatus(401); // Unauthorized
      res.status(204).send(`Le dresseur avec l'id ${req.dresseur.id} a été supprimé.`);
    })
    .catch(next);
});

// Permet de se connecter
router.post("/connexion", function (req, res, next) {
  Dresseur.findOne({ pseudo: req.body.pseudo })
      .exec()
      .then(dresseur => {
          if (!dresseur) return res.sendStatus(401); // Unauthorized
          if (!req.body.mot_de_passe) return res.sendStatus(401); // Unauthorized
          return bcrypt.compare(req.body.mot_de_passe, dresseur.mot_de_passe)
              .then(valid => {
                if (!valid) return res.sendStatus(401); // Unauthorized
                // Login is valid...
                // Create the payload for the JWT including the user ID and expiration
                const payload = {
                  sub: dresseur._id.toString(),
                  // UNIX timstamp representing a date in 7 days.
                  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
                };
                // Create and sign a token.
                signJwt(payload, jwtSecret).then(token => {
                    res.status(201).send({ token });
                });
                  

              });
      })
      .catch(next);
});

// Permet de se déconnecter
router.delete("/connexion", authenticate, function (req, res, next) {
  // si la personne est connectée et que son id est valide
  res.status(204).send(`La connexion pour l'utilisateur avec l'id ${req.currentUserId} a bien été fermée.`);
  next();
});

export default router;