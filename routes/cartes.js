import debugFactory from "debug";
import express from "express";
import Carte from "../models/carte.js";
import {
  getPaginationParameters,
  authenticate,
  requireJson,
  supChampsCarte,
  loadCarteFromParams,
  editPermissionDresseur
} from "./utils.js";

const debug = debugFactory("poketroc:cartes");
const router = express.Router();

// Créer une carte
router.post("/", requireJson, authenticate, supChampsCarte, function (req, res, next) {
  const body = req.body;
  body.dresseur_id = req.dresseurCon._id;
  new Carte(req.body)
    .save()
    .then((carteSauve) => {
      res.status(201).send(carteSauve);
    })
    .catch(next);
});

// Afficher toutes les cartes du dresseur
router.get("/", authenticate, function (req, res, next) {
  const statut = req.query.statut;
  if (!statut) return res.status(400).send("Il manque le statut des cartes à afficher collectee ou souhaitee");
  if (statut !== "collectee" && statut !== "souhaitee") return res.status(400).send("Le statut des cartes à afficher n'est pas égal à collectee ou souhaitee");
  const { page, pageSize } = getPaginationParameters(req);
  // Oblige d'avoir l'état
  Carte.find()
    .where("dresseur_id")
    .equals(req.dresseurCon._id)
    .where("statut")
    .equals(statut)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .exec()
    .then((cartes) => {
      res.status(200).send(cartes);
    })
    .catch(next);
});

// Afficher une carte
router.get("/:carteId", authenticate, loadCarteFromParams, function (req, res, next) {
  res.status(200).send(req.carte);
});

// Modifier une carte
router.patch("/:carteId", requireJson, authenticate, loadCarteFromParams, editPermissionDresseur, function (req, res, next) {
  const carte = req.carte;
  const majCarte = req.body;
  let modification = false;

  Object.keys(majCarte).forEach((cle) => {
    if (carte[cle] !== majCarte[cle] && (cle !== "_id" || cle !== "__v" || cle !== "createdAt" || cle !== "updatedAt" || cle !== "id_api")) {
      // si la valeur n'est pas la même qu'avant alors on la change
      carte[cle] = majCarte[cle];
      if (!modification) modification = true;
    }
  });

  if (modification) {
    // Si il y a eu un changement 
    carte.updatedAt = new Date();
    carte.save().then(carteSauve => {
      res.status(200).send(carteSauve);
    })
    .catch(next);
  } else {
    res.status(304).send("La carte n'a pas été modifiée car aucun changement n'a été détecté");
  }
});

// Supprimer une carte
router.delete("/:carteId", authenticate, loadCarteFromParams, editPermissionDresseur, function (req, res, next) {
  Carte.deleteOne({ _id: req.carte.id })
    .exec()
    .then((valid) => {
      if (valid.deletedCount === 0) return res.status(404).send("Carte non trouvée");
      res.sendStatus(204);
    })
    .catch(next);
});



export default router;
