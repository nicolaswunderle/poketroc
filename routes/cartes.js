import debugFactory from "debug";
import express from "express";
import Carte from "../models/carte.js";
import {
  getPaginationParameters,
  authenticate,
  requireJson,
  supChampsCarte,
} from "./utils.js";

const debug = debugFactory("poketroc:cartes");
const router = express.Router();

// Créer une carte
router.post(
  "/",
  requireJson,
  authenticate,
  supChampsCarte,
  function (req, res, next) {
    const body = req.body;
    body.dresseur_id = req.dresseurCon._id;
    const nouvelleCarte = new Carte(req.body);
    nouvelleCarte
      .save()
      .then((carteSauve) => {
        res.status(201).send(carteSauve);
        next();
      })
      .catch(next);
  }
);

// Afficher une carte
router.get("/:carteId", authenticate, function (req, res, next) {
  const carteId = req.params.carteId;
  const { page, pageSize } = getPaginationParameters(req);
  Carte.findById(carteId)
    .exec()
    .then((carte) => {
      if (!carte) {
        return res.status(404).send("Carte non trouvée");
      }
      res.status(200).send(carte);
    })

    .catch(next);
});

// Modifier une carte
router.patch("/:carteId", authenticate, function (req, res, next) {
  const carteId = req.params.carteId;
  const majCarte = req.body;

  Carte.findById(carteId)
    .exec()
    .then((carte) => {
      if (!carte) {
        return res.status(404).send("Carte non trouvée");
      }

      // Mise à jour des données
      Object.keys(majCarte).forEach((cle) => {
        if (
          carte[cle] !== majCarte[cle] &&
          cle !== "_id" &&
          cle !== "__v" &&
          cle !== "createdAt" &&
          cle !== "updatedAt"
        ) {
          carte[cle] = majCarte[cle];
        }
      });

      // Enregistrement de la carte mise à jour
      return carte.save();
    })
    .then((carteSauve) => {
      res.status(200).send(carteSauve);
    })
    .catch(next);
});

// Supprimer une carte
router.delete("/:carteId", authenticate, function (req, res, next) {
  const carteId = req.params.carteId;

  Carte.deleteOne({ _id: carteId })
    .exec()
    .then((resultat) => {
      if (resultat.deletedCount === 0) {
        return res.status(404).send("Carte non trouvée");
      }
      res.status(204).send("Carte supprimée avec succès");
    })
    .catch(next);
});

// Afficher toutes les cartes

router.get("/{dresseurId}", authenticate, function (req, res, next) {
  const { page, pageSize } = getPaginationParameters(req);
  Carte.find()
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .exec()
    .then((cartes) => {
      res.status(200).send(cartes);
    })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .catch(next);
});

export default router;
