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
  loadQuery, 
  modifications,
  loadCartesFromBody
} from "./utils.js";

const debug = debugFactory('poketroc:echanges');
const router = express.Router();

// Créer un échange
router.post("/",
  requireJson,
  authenticate,
  supChamps(['dresseur_cree_id', 'etat', 'createdAt', 'updatedAt']),
  loadCartesFromBody('cartes_id'),
  loadCartesFromBody('cartes_id_dresseur_concerne'),
  function (req, res, next) {
    const cartesDresseurAuth = req.cartesDresseurAuth;
    const cartesIdDresseurAuth = req.cartesIdDresseurAuth;
    const cartesDresseurConcerne = req.cartesDresseurConcerne;
    const cartesIdDresseurConcerne = req.cartesIdDresseurConcerne;
    const dresseurAuthId = req.currentUserId;
    const dresseurConcerneId = cartesDresseurConcerne ? cartesDresseurConcerne[0].dresseur_id : '';
    
    req.body.dresseur_cree_id = dresseurAuthId;
    if (cartesDresseurConcerne) { req.body.dresseur_concerne_id = dresseurConcerneId }

    new Echange(req.body).save()
      .then(echange => {
        if (!echange) return res.status(400).send(`L'échange n'a pas pu être créé.`);
        const echangeId = echange._id;

        // Création dans la table intermédiaire
        const allCartesId = [...cartesIdDresseurAuth];
        if (cartesIdDresseurConcerne) { allCartesId.push(...cartesIdDresseurConcerne) }
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

// Affiche un échange
router.get("/:echangeId",
  authenticate,
  loadRessourceFromParams('Echange'),
  function (req, res, next) {
    res.status(200).send(req.echange);
  }
);

// Modifier un échange
router.patch("/:echangeId",
  requireJson,
  authenticate,
  loadRessourceFromParams('Echange'),
  editPermission('req.echange.dresseur_cree_id'),
  supChamps(['_id', '__v', 'dresseur_cree_id', 'createdAt', 'updatedAt']),
  function (req, res, next) {
    const echange = req.echange;
    const echangeMaj = req.body;

    if (modifications(echange, echangeMaj)) {
      // Si il y a eu un changement 
      echange.updatedAt = new Date();
      echange.save().then(echangeSauve => {
        res.status(200).send(echangeSauve);
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

// Affiche un échange
router.get("/dresseur/:dresseurId",
  authenticate,
  loadRessourceFromParams('Dresseur'),
  loadQuery({etat: false}),
  function (req, res, next) {
    const etat = req.etat;
    
    if (etat) {
      if (etat !== "accepte" && etat !== "attente" && etat !== "refuse") return res.status(400).send("Le statut des cartes à afficher n'est pas égal à accepte, attente ou refuse");
      Echange.find()
      .where("dresseur_cree_id")
      .equals(req.currentUserId)
      .where("etat")
      .equals(etat)
      .exec()
      .then((echange) => {
        res.status(200).send(echange);
      })
      .catch(next)
    } else {
      Echange.find()
      .where("dresseur_cree_id")
      .equals(req.currentUserId)
      .exec()
      .then((echange) => {
        res.status(200).send(echange);
      })
      .catch(next)
    }  
  }
);

export default router;