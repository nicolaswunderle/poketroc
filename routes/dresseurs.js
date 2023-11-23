import debugFactory from 'debug';
import express from "express";
import bcrypt from "bcrypt";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
import jwt from "jsonwebtoken";
import Dresseur from "../models/dresseur.js";
import { bcryptCostFactor } from "../config.js";

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
                    res.send({ token });
                });
                  

              });
      })
      .catch(next);
});

// Permet de se déconnecter
router.delete("/connexion", function (req, res, next) {
  // si le jwt existe alors on le supprime
  // si le jwt n'existe pas on renvoie une erreur qui dit que le jwt n'existe pas
});

export default router;
