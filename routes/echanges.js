import debugFactory from 'debug';
import express from "express";
import Echange from "../models/echange.js";
import { authenticate, requireJson } from "./utils.js";

const debug = debugFactory('poketroc:echanges');
const router = express.Router();

// Créer un échange
// router.post("/", requireJson, authenticate, function (req, res, next) {
//   new Echange(req.body)
//     .save()
//     .then(echangeSauve => {
//         res.status(201).send(echangeSauve);
//         next();
//     })
//     .catch(next);
    
// });


router.post("/", requireJson, authenticate, async function (req, res, next) {
  const { dresseur_cree_id, dresseur_concerne_id } = req.body;

  try {
    // Vérifier si un échange avec ces dresseurs existe déjà
    const existingEchange = await Echange.findOneAndUpdate(
      { dresseur_cree_id, dresseur_concerne_id },
      req.body,
      { upsert: false }
    );

    if (existingEchange) {
      return res.status(409).send("Violation de l'unicité détectée.");
    }

    // Créer un nouvel échange si aucun échange correspondant n'est trouvé
    const nouvelEchange = await Echange.create(req.body);
    res.status(201).send(nouvelEchange);
  } catch (error) {
    next(error);
  }
});





// LA CONTRAINTE d'unicité ne marche pas

export default router;