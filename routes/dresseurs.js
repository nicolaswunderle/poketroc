import debugFactory from 'debug';
import express from "express";
import bcrypt from "bcrypt";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
import jwt from "jsonwebtoken";
import Dresseur from "../models/dresseur.js";
import Message from "../models/message.js";
import Carte from "../models/carte.js";
import Echange from "../models/echange.js";
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";
import { bcryptCostFactor } from "../config.js";
import { 
  authenticate, 
  loadRessourceFromParams, 
  supChamps,
  requireJson,
  modificationsObject
} from "./utils.js";
import { broadcastDresseur } from '../websocket.js';

const debug = debugFactory('poketroc:dresseurs');
const router = express.Router();

const signJwt = promisify(jwt.sign);

// Créer un dresseur
router.post("/",
  requireJson,
  supChamps(['en_ligne', 'createdAt', 'updatedAt']),
  function (req, res, next) {
    const mdpBrut = req.body.mot_de_passe;
    if (!mdpBrut) return res.status(400).send(`Il manque le champs 'mot_de_passe' dans le body.`);
    
    const nouveauDresseur = new Dresseur(req.body);

    bcrypt.hash(mdpBrut, bcryptCostFactor)
      .then(mdpHashe => {
        nouveauDresseur.mot_de_passe = mdpHashe;
        return nouveauDresseur.save();
      })
      .then(dresseurSauve => {   
        return res.status(201).send(dresseurSauve);
      })
      .catch(next);
  }
);

// Modifie le dresseur
router.patch("/",
  requireJson,
  authenticate,
  supChamps(['_id', '__v', 'en_ligne', 'createdAt', 'updatedAt']),
  function (req, res, next) {
    const dresseur = req.dresseurCon;

    // ajoute le champ mot de passe si il a été modifié
    const { mot_de_passe } = req.body;
    if (mot_de_passe || modificationsObject(dresseur, req.body)) {
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
      return res.sendStatus(204);
    }
  }
);

// Supprime le dresseur
router.delete("/",
  authenticate,
  function (req, res, next) {
    const dresseurId = req.currentUserId;
    Dresseur.deleteOne({ _id: dresseurId })
      .then(valid => {
        if (valid.deletedCount !== 1) return res.status(404).send("Dresseur non trouvée");
        return Echange.find({$or: [
          { dresseur_cree_id: dresseurId },
          { dresseur_concerne_id: dresseurId }
        ]});
      })
      .then(echanges => {
        const echangesId = echanges.map(echange => echange._id);
        Promise.all([
          Message.deleteMany({ dresseur_id: dresseurId }),
          Echange.deleteMany({$or: [
            { dresseur_cree_id: dresseurId },
            { dresseur_concerne_id: dresseurId }
          ]}),
          EchangeConcerneCarte.deleteMany({ echange_id: { $in: echangesId } }),
          Carte.deleteMany({ dresseur_id: dresseurId })
        ])
        .then(() => {
          res.sendStatus(204);
        })
        .catch(next);
      })
      .catch(next);
  }
);

// Permet de se connecter
router.post("/connexion",
  requireJson,
  function (req, res, next) {
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
                res.status(200).send({ 
                  token,
                  dresseur: dresseurSauve
                });
              })
              .catch(next)
              
            })
            .catch(next);
        })
        .catch(next);
  }
);

// Permet de se déconnecter
router.delete("/connexion",
  authenticate, 
  function (req, res, next) {
    // si la personne est connectée et que son id est valide
    const dresseur = req.dresseurCon;
    dresseur.updatedAt = new Date();
    dresseur.en_ligne = false;
    dresseur.save().then(dresseurSauve => {
      if (!dresseurSauve) return res.status(400).send("Le dresseur n'a pas pu être modifié.");
      res.sendStatus(204);
    })
    .catch(next);
  }
);

// Affiche un dresseur
router.get("/:dresseurId",
  authenticate,
  loadRessourceFromParams('Dresseur'),
  function (req, res, next) {
    res.status(200).send(req.dresseur);
  }
);



export default router;