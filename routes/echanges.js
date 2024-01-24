import debugFactory from 'debug';
import express from "express";
import mongoose from "mongoose";
import Echange from "../models/echange.js";
import Carte from "../models/carte.js";
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";
import { 
  requireJson, 
  authenticate, 
  loadRessourceFromParams, 
  supChamps, 
  editPermission,
  modificationsObject,
  loadCartesFromBody,
  loadCompletedEchange,
  loadEchangeCartesId,
  editPermissionEchange,
  modificationsArray
} from "./utils.js";

const debug = debugFactory('poketroc:echanges');
const router = express.Router();

// Créer un échange
router.post("/",
  requireJson,
  authenticate,
  supChamps(['dresseur_cree_id', 'etat_dresseur_cree', 'etat_dresseur_concerne', 'createdAt', 'updatedAt']),
  loadCartesFromBody('cartes_id'),
  loadCartesFromBody('cartes_id_dresseur_concerne'),
  function (req, res, next) {
    const { cartesDresseurAuth, cartesIdDresseurAuth, cartesDresseurConcerne, cartesIdDresseurConcerne } = req;
    const dresseurAuthId = req.currentUserId;
    const dresseurConcerneId = cartesDresseurConcerne ? cartesDresseurConcerne[0].dresseur_id : '';
    
    req.body.dresseur_cree_id = dresseurAuthId;
    if (cartesDresseurConcerne) { req.body.dresseur_concerne_id = dresseurConcerneId }

    new Echange(req.body).save()
      .then(echange => {
        if (!echange) return res.status(400).send(`L'échange n'a pas pu être créé.`);
        const echangeId = echange._id;
        // liste de tous les id des cartes
        const allCartesId = [...cartesIdDresseurAuth];
        if (cartesIdDresseurConcerne) { allCartesId.push(...cartesIdDresseurConcerne) }
        // Création dans la table intermédiaire
        const EchangeConcernepromises = allCartesId.map(carteId => {
          const nouvelEchangeConcerneCarte = new EchangeConcerneCarte({
            carte_id: carteId,
            echange_id: echangeId
          });
          return nouvelEchangeConcerneCarte.save();
        });

        Promise.all(EchangeConcernepromises)
          .then((creationEchangeConcerne) => {
            if (!creationEchangeConcerne) return res.status(400).send(`L'échange dans la table intermédiaire n'a pas pu être créé.`);
            
            const echangeEntier = { 
              echange, 
              cartes_dresseur_cree: cartesDresseurAuth 
            }
            if (cartesDresseurConcerne) {
              echangeEntier.cartes_dresseur_concerne = cartesDresseurConcerne;
            }
            res.status(201).send(echangeEntier);
          })
          .catch(next);
      })
      .catch(next);
  }
);

// Affiche tous les échange d'un dresseur
router.get("/",
  authenticate,
  function (req, res, next) {
    const dresseurAuthId = req.currentUserId;
    Echange.find({
      $or: [
          { dresseur_cree_id: dresseurAuthId },
          { dresseur_concerne_id: dresseurAuthId }
      ]
    })
    .then(echanges => {
      const completedEchangesPromises = [];
      for (const echange of echanges) {
        completedEchangesPromises.push(loadCompletedEchange(res, echange))
      }
      return Promise.all(completedEchangesPromises);
    })
    .then(completedEchanges => {
      return res.status(200).send(completedEchanges);
    })
    .catch(next);
  }
);

// Affiche un échange
router.get("/:echangeId",
  authenticate,
  loadRessourceFromParams('Echange'),
  editPermissionEchange,
  function (req, res, next) {
    loadCompletedEchange(res, req.echange)
      .then(completedEchange => {
        res.status(200).send(completedEchange);
      })
      .catch(next); 
  }
);

// Modifier un échange
router.patch("/:echangeId",
  requireJson,
  authenticate,
  loadRessourceFromParams('Echange'),
  editPermissionEchange,
  loadEchangeCartesId,
  supChamps(['_id', '__v', 'dresseur_cree_id', 'createdAt', 'updatedAt']),
  function (req, res, next) {
    const echange = req.echange;
    const echangeMaj = modificationsObject(echange, req.body.echange)
    
    const cartesIdDresseurCreeMaj = req.cartesIdDresseurCree;
    const cartesIdDresseurConcerneMaj = req.cartesIdDresseurConcerne;
    const cartesIdDresseurCreeMajModif = modificationsArray(cartesIdDresseurCreeMaj, req.body.cartes_id_dresseur_cree);
    const cartesIdDresseurConcerneMajModif = modificationsArray(cartesIdDresseurConcerneMaj, req.body.cartes_id_dresseur_concerne);
    req.echangeModif = {};

    if (echangeMaj || cartesIdDresseurCreeMajModif || cartesIdDresseurConcerneMajModif) {
      
      // FAIRE TOUTES LES VERIFICATIONS
      
      // Si il y a eu un changement
      const completedEchangePromises = [];

      echange.updatedAt = new Date();
      completedEchangePromises.push(echange.save());

      if (cartesIdDresseurCreeMajModif) {
        req.echangeModif.cartes_id_dresseur_cree = [...cartesIdDresseurCreeMaj, ...cartesIdDresseurCreeMajModif];
        for (const carteIdMaj of cartesIdDresseurCreeMajModif) {
          completedEchangePromises.push(
            new EchangeConcerneCarte({
              echange_id: echange._id,
              carte_id:  carteIdMaj
            }).save()
          );
        }
      }
      if (cartesIdDresseurConcerneMajModif) {
        req.echangeModif.cartes_id_dresseur_concerne = [...cartesIdDresseurConcerneMaj, ...cartesIdDresseurConcerneMajModif];
        for (const carteIdMaj of cartesIdDresseurConcerneMajModif) {
          completedEchangePromises.push(
            new EchangeConcerneCarte({
              echange_id: echange._id,
              carte_id:  carteIdMaj
            }).save()
          );
        }
      }
      
      Promise.all(completedEchangePromises)
        .then(echangeSauve => {
          req.echangeModif.echange = echangeSauve[0];
          res.status(200).send(req.echangeModif);
        })
        .catch(next);
    } else {
      return res.status(304).send("L'échange n'a pas été modifié car aucun changement n'a été détecté");
    }
  }
);

// Supprime l'échange
router.delete("/:echangeId",
  authenticate,
  loadRessourceFromParams('Echange'),
  editPermission('req.echange.dresseur_cree_id'),
  function (req, res, next) {
    Echange.deleteOne({ _id: req.echange.id })
      .exec()
      .then((valid) => {
        if (valid.deletedCount === 0) return res.status(404).send("Echange non trouvé");
        res.sendStatus(204);
      })
      .catch(next);
  }
);

export default router;