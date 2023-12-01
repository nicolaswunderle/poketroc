import debugFactory from 'debug';
import express from "express";
import mongoose from "mongoose";
import Echange from "../models/echange.js";
import Carte from "../models/carte.js";
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";
import { requireJson, authenticate, loadDresseurFromParams, loadEchangeFromParams, supChampsEchange, editPermissionDresseur } from "./utils.js";

const debug = debugFactory('poketroc:messages');
const router = express.Router();

// Créer un échange
router.post("/", requireJson, authenticate, supChampsEchange, function (req, res, next) {
  const carteId = req.body.carte_id;
  const dresseurIdAuth = req.dresseurCon._id;
  if (!mongoose.Types.ObjectId.isValid(carteId)) return res.status(400).send("Le champ carte_id est invalide.");

  Carte.findById(carteId)
    .where('dresseur_id')
    .equals(dresseurIdAuth)
    .where('statut')
    .equals('collectee')
    .exec()
    .then(carte => {
      if (!carte) return res.status(404).send(`Le dresseur avec l'id ${dresseurIdAuth} ne possède pas la carte avec l'id ${carteId}`);
      return carte._id;
    })
    .then(carteIdVerif => {
      EchangeConcerneCarte.findOne()
        .populate('echange_id')
        .where("echange_id.etat")
        .equals('attente')
        .where("echange_id.dresseur_cree_id")
        .equals(dresseurIdAuth)
        .where("carte_id")
        .equals(carteIdVerif)
        .exec()
        .then(echangeInterdit => {
          if (echangeInterdit) return res.status(400).send(`Un échange en attente crée par le dresseur avec l'id ${dresseurIdAuth} avec la carte dont l'id est ${carteIdVerif} existe déjà.`);
          return true;
        })
        .then(() => {
          req.body.dresseur_cree_id = dresseurIdAuth;
          return new Echange(req.body).save();
        })
        .then(echangeSauve => {
          if (!echangeSauve) return res.status(400).send(`L'échange n'a pas pu être créé.`);
          return new EchangeConcerneCarte({
              carte_id: carteIdVerif,
              echange_id: echangeSauve._id
          }).save();
        })
        .then(echangeConcerneCarteSauve => {
          if (!echangeConcerneCarteSauve) return res.status(400).send(`L'échange dans la table intermédiaire n'a pas pu être créé.`);
          return EchangeConcerneCarte
            .findById(echangeConcerneCarteSauve._id)
            .populate('echange_id')
            .populate('carte_id')
        })
        .then(echangeFinalSauve => {
          res.status(201).send(echangeFinalSauve);
          next();
        })
        .catch(next);
    })
    .catch(next);
});

// Affiche un échange
router.get("/:echangeId", authenticate, loadEchangeFromParams, function (req, res, next) {
  res.status(200).send(req.echange);
});

// Modifier un échange
router.patch("/:echangeId", requireJson, authenticate, loadEchangeFromParams, editPermissionDresseur, function (req, res, next) {
  const echange = req.echange;
  const majEchange = req.body;
  let modification = false;

  Object.keys(majEchange).forEach((cle) => {
    if (echange[cle] !== majEchange[cle] && (cle !== "_id" || cle !== "__v" || cle !== "createdAt" || cle !== "updatedAt")) {
      // si la valeur n'est pas la même qu'avant alors on la change
      echange[cle] = majEchange[cle];
      if (!modification) modification = true;
    }
  });

  if (modification) {
    // Si il y a eu un changement 
    echange.updatedAt = new Date();
    echange.save().then(echangeSauve => {
      res.status(200).send(echangeSauve);
    })
    .catch(next);
  } else {
    res.status(304).send("L'échange n'a pas été modifié car aucun changement n'a été détecté");
  }
});

// Supprime l'échange
router.delete("/:echangeId", authenticate, loadEchangeFromParams, editPermissionDresseur, function (req, res, next) {
  Echange.deleteOne({ _id: req.echange.id })
    .exec()
    .then((valid) => {
      if (valid.deletedCount === 0) return res.status(404).send("Echange non trouvé");
      res.sendStatus(204);
    })
    .catch(next);
});

// Affiche un échange
router.get("/dresseur/:dresseurId", authenticate, loadDresseurFromParams, function (req, res, next) {
  const etat = req.query.etat;
  
  if (etat) {
    if (etat !== "accepte" && etat !== "attente" && etat !== "refuse") return res.status(400).send("Le statut des cartes à afficher n'est pas égal à accepte, attente ou refuse");
    Echange.find()
    .where("dresseur_cree_id")
    .equals(req.dresseurCon._id)
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
    .equals(req.dresseurCon._id)
    .exec()
    .then((echange) => {
      res.status(200).send(echange);
    })
    .catch(next)
  }
  
  
});

export default router;