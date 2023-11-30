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
  if (!mongoose.Types.ObjectId.isValid(carteId)) return res.status(400).send("L'id de la carte est invalide.");

  Carte.findById(carteId)
    .exec()
    .then(carte => {
      if (!carte) return res.status(404).send(`Aucune carte ne possède l'id ${carteId}`);
      return carte._id;
    })
    .then(carteIdVerif => {
      return { echange: new Echange(req.body).save(), carteIdVerif}
    })
    .then(({echange, carteIdVerif}) => {
      new EchangeConcerneCarte(
        {
          carte_id: carteIdVerif,
          echange_id
        }
      )
    })
  
  new Echange(req.body)
    .save()
    .then(echangeSauve => {
        Carte.findById()
    })
    .catch(next);

    // res.status(201).send(echangeSauve);
    //     next();
});

// Affiche un échange
router.get("/:echangeId", authenticate, loadEchangeFromParams, function (req, res, next) {
  res.status(200).send(req.echange);
  next();
});



// LA CONTRAINTE d'unicité ne marche pas

export default router;