import debugFactory from "debug";
import express from "express";
import Carte from "../models/carte.js";
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";
import {
  getPaginationParameters,
  authenticate,
  requireJson,
  supChamps,
  loadRessourceFromParams,
  editPermission,
  loadDresseurFromQuery,
  loadQuery
} from "./utils.js";

const debug = debugFactory("poketroc:cartes");
const router = express.Router();

// Créer une carte
router.post("/", requireJson, authenticate, supChamps(['dresseur_id', 'createdAt', 'updatedAt']), function (req, res, next) {
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
router.get("/", authenticate, loadQuery({ statut: true, dresseurId: false }), loadDresseurFromQuery, function (req, res, next) {
  const statut = req.statut;
  if (statut !== "collectee" && statut !== "souhaitee") return res.status(400).send("Le statut des cartes à afficher n'est pas égal à 'collectee' ou 'souhaitee'");
  const { page, pageSize } = getPaginationParameters(req);
  // Oblige d'avoir l'état
  // Si le dresseur connecté veut voir ses cartes il n'y a aucune restriction
  if (req.dresseurCon._id.toString() === req.dresseur._id.toString()) { 
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
  } else {
    // Dans le cas où le dresseur connecté regarde un autre deck que le siens
    if (statut === "souhaitee") {
      // Affiche uniquement les carte souhaité que le dresseur connecté possède
      Carte.aggregate([
        {
          $match: {
            dresseur_id: req.dresseurCon._id,
            statut: 'collectee'
          }
        },
        {
          $lookup: {
            from: 'cartes', // Nom de la collection de cartes
            let: { id_api: '$id_api' },
            pipeline: [
              {
                $match: {
                  dresseur_id: req.dresseur._id,
                  statut: 'souhaitee',
                  $expr: { $eq: ['$id_api', '$$id_api'] }
                }
              }
            ],
            as: 'cartesDeuxiemeDresseur'
          }
        },
        {
          $match: {
            cartesDeuxiemeDresseur: { $ne: [] } // Filtrer les cartes avec des correspondances
          }
        },
        // Étape de remplacement de la racine par les champs de la deuxième collection
        {
          $replaceRoot: { newRoot: { $arrayElemAt: ['$cartesDeuxiemeDresseur', 0] } }
        }
      ])
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec()
      .then((cartes) => {
        res.status(200).send(cartes);
      })
      .catch(next);
    } else {
      if (req.dresseur.deck_visible) {
        Carte.aggregate([
          {
            $match: {
              dresseur_id: req.dresseur._id,
              statut: statut,
            }
          },
          {
            $lookup: {
              // permet de joindre la table intermédiaire
              from: 'echangeconcernecartes',
              localField: '_id',
              foreignField: 'carte_id',
              as: 'echange_attente',
            }
          },
          {
            $lookup: {
              // permet d'avoir les infos des champs de la table echanges pour pouvoir filtrer à l'étape d'après
              from: 'echanges',
              localField: 'echange_attente.echange_id',
              foreignField: '_id',
              as: 'details_echanges_attente',
            }
          },
          {
            $match: {
              'details_echanges_attente.etat': { $ne: 'attente' },
            }
          },
          {
            $project: {
              // plus besoins de voir les tableau qui ont été utilisé pour filtrer
              echange_attente: 0,
              details_echanges_attente: 0,
            }
          },
        ])
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec()
        .then((cartes) => {
          res.status(200).send(cartes);
        })
        .catch(next);
      } else {
        res.status(403).send(`Les cartes du dresseur avec l'id ${req.dresseur._id} ne sont pas visible par tout le monde.`);
      }
    }
    
  }
  
});

// Afficher une carte
router.get("/:carteId", authenticate, loadRessourceFromParams('Carte'), function (req, res, next) {
  res.status(200).send(req.carte);
});

// Modifier une carte
router.patch("/:carteId", requireJson, authenticate, loadRessourceFromParams('Carte'), editPermission('req.carte.dresseur_id'), supChamps(['_id', '__v', 'id_api', 'createdAt', 'updatedAt']), function (req, res, next) {
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
router.delete("/:carteId", authenticate, loadRessourceFromParams('Carte'), editPermission('req.carte.dresseur_id'), function (req, res, next) {
  Carte.deleteOne({ _id: req.carte.id })
    .exec()
    .then((valid) => {
      if (valid.deletedCount === 0) return res.status(404).send("Carte non trouvée");
      res.sendStatus(204);
    })
    .catch(next);
});



export default router;
