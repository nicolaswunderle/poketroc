import debugFactory from "debug";
import express from "express";
import mongoose from "mongoose";
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
  loadQuery,
  modificationsObject
} from "./utils.js";

const debug = debugFactory("poketroc:cartes");
const router = express.Router();

// Créer une carte
router.post("/", 
  requireJson, 
  authenticate, 
  supChamps(['dresseur_id', 'createdAt', 'updatedAt']), 
  function (req, res, next) {
    const { body } = req;
    body.dresseur_id = req.currentUserId;
    new Carte(req.body)
      .save()
      .then((carteSauve) => {
        res.status(201).send(carteSauve);
      })
      .catch(next);
  }
);

// Afficher toutes les cartes du dresseur
router.get("/", 
  authenticate, 
  loadQuery({ statut: true, dresseurId: false }), 
  loadDresseurFromQuery, 
  function (req, res, next) {
    const { statut } = req;
    if (statut !== "collectee" && statut !== "souhaitee") return res.status(400).send("Le statut des cartes à afficher n'est pas égal à 'collectee' ou 'souhaitee'");
    const { page, pageSize } = getPaginationParameters(req);
    // Oblige d'avoir l'état
    // Si le dresseur connecté veut voir ses cartes il n'y a aucune restriction
    if (req.currentUserId === req.dresseur._id.toString()) { 
      Carte.find()
      .where("dresseur_id")
      .equals(req.currentUserId)
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
            // Liste toutes les cartes souhaitées du dresseur
            $match: {
              dresseur_id: req.dresseur._id,
              statut: 'souhaitee'
            }
          },
          {
            // Ajoute un champs matchingCollectees à toutes les cartes contenant toutes les cartes qui corressponde au localField
            $lookup: {
              from: 'cartes',
              localField: 'id_api',
              foreignField: 'id_api',
              as: 'matchingCollectees'
            }
          },
          {
            // permet de "déplier" le champs matchingCollectees pour qu'il n'y ait plus qu'une carte à l'intérieur
            $unwind: '$matchingCollectees'
          },
          {
            // refait un filtre
            $match: {
              'matchingCollectees.dresseur_id': new mongoose.Types.ObjectId(req.currentUserId),
              'matchingCollectees.statut': 'collectee'
            }
          },
          {
            // enlève les champs pas nécessaire
            $project: {
              matchingCollectees: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0
            }
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
          // Affiche les cartes du dresseur qui ne sont pas dans un échange
          Carte.aggregate([
            {
                $match: {
                    dresseur_id: req.dresseur._id,
                    statut: statut,
                }
            },
            {
                $lookup: {
                    from: "echangeconcernecartes",
                    localField: "_id",
                    foreignField: "carte_id",
                    as: "echangeConcerneCartes"
                }
            },
            {
                $match: {
                    "echangeConcerneCartes": { $eq: [] } // Filtre les cartes liées à un échange
                }
            },
            {
                $project: {
                    echangeConcerneCartes: 0, // Exclure le champ echangeConcerneCartes
                    createdAt: 0,
                    updatedAt: 0,
                    __v: 0
                }
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
          return res.status(403).send(`Les cartes du dresseur avec l'id ${req.dresseur._id} ne sont pas visible par tout le monde.`);
        }
      }
      
    }
  
  }
);

// Afficher une carte
router.get("/:carteId",
  authenticate,
  loadRessourceFromParams('Carte'),
  function (req, res, next) {
    res.status(200).send(req.carte);
  }
);

// Modifier une carte
router.patch("/:carteId",
  requireJson,
  authenticate,
  loadRessourceFromParams('Carte'),
  editPermission('req.carte.dresseur_id'),
  supChamps(['_id', '__v', 'id_api', 'statut', 'dresseur_id', 'createdAt', 'updatedAt']),
  function (req, res, next) {
    const { carte } = req;

    if (modificationsObject(carte, req.body)) {
      // Si il y a eu un changement 
      carte.updatedAt = new Date();
      carte.save().then(carteSauve => {
        res.status(200).send(carteSauve);
      })
      .catch(next);
    } else {
      return res.sendStatus(204);
    }
  }
);

// Supprimer une carte
router.delete("/:carteId",
  authenticate,
  loadRessourceFromParams('Carte'),
  editPermission('req.carte.dresseur_id'),
  function (req, res, next) {
    EchangeConcerneCarte.findOne({
      carte_id: req.carte.id
    })
    .then(carteDansEchange => {
      if (carteDansEchange) return res.status(400).send(`La carte avec l'id ${carteDansEchange.carte_id} ne peut pas être supprimée car elle est déjà dans un échange.`);
      return Carte.deleteOne({ _id: req.carte.id });
    })
    .then(valid => {
      if (valid.deletedCount !== 1) return res.status(404).send("Carte non trouvée");
      res.sendStatus(204);
    })
    .catch(next);
  }
);



export default router;