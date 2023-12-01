import debugFactory from 'debug';
import express from "express";
import mongoose from "mongoose";
import Echange from "../models/echange.js";
import Carte from "../models/carte.js";
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";
import { requireJson, authenticate, loadEchangeFromParams, supChampsEchange } from "./utils.js";

const debug = debugFactory('poketroc:messages');
const router = express.Router();

// Créer un échange
router.post("/", requireJson, authenticate, supChampsEchange, function (req, res, next) {
  const carteId = req.body.carte_id;
  const dresseurIdAuth = req.dresseurCon._id;
  if (!mongoose.Types.ObjectId.isValid(carteId)) return res.status(400).send("L'id de la carte est invalide.");

  Carte.findById(carteId)
    .where('dresseur_id')
    .equals(dresseurIdAuth)
    .where('statut')
    .equals('collectee')
    .exec()
    .then(carte => {
      if (!carte) return res.status(404).send(`Le dresseur ne possède pas la carte avec l'id ${carteId}`);
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
  
    // EchangeConcerneCarte.findOne()
    // .populate('echange_id')
    // .where("echange_id.etat")
    // .equals('attente')
    // .where("echange_id.dresseur_cree_id")
    // .equals(req.dresseurCon._id)
    // .where("carte_id")
    // .equals(carteIdVerif)
});

// Affiche un échange
router.get("/:echangeId", authenticate, loadEchangeFromParams, function (req, res, next) {
  res.status(200).send(req.echange);
  next();
});

router.post("/test", (req, res, next) => {
  EchangeConcerneCarte.find()
        .populate('echange_id')
        .where("echange_id: {etat:attente}")
        .equals('attente')
        // .where("echange_id.dresseur_cree_id")
        // .equals("6568af8e691a87ccee933440")
        // .where("carte_id")
        // .equals("6568d0ca0efc432ae16cc5c5")
        .exec()
        .then(echangeInterdit => {
          // if (echangeInterdit) return res.status(400).send(`Un échange en attente crée par le dresseur avec l'id ${dresseurIdAuth} avec la carte dont l'id est ${carteIdVerif} existe déjà.`);
          res.send(echangeInterdit)
        })
});


// LA CONTRAINTE d'unicité ne marche pas

export default router;