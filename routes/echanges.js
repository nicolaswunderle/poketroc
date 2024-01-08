import debugFactory from 'debug';
import express from "express";
import mongoose from "mongoose";
import Echange from "../models/echange.js";
import Carte from "../models/carte.js";
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";
import { requireJson, authenticate, tabCartesValidator, loadDresseurFromParams, loadEchangeFromParams, supChampsEchange, editPermissionDresseur } from "./utils.js";

const debug = debugFactory('poketroc:echanges');
const router = express.Router();

// Créer un échange
router.post("/", requireJson, authenticate, supChampsEchange, function (req, res, next) {
  const dresseurIdAuth = req.dresseurCon._id;
  // on obtient un tableau de une ou plusieurs carte que le dresseur veut échanger et cette propriété est obligatoire
  const cartesId = req.body.cartes_id;
  if (!cartesId) return res.status(400).send("Il manque La propriété 'cartes_id'.");
  // on obtient un tableau de une ou plusieurs carte que le dresseur veut échanger
  const dresseurConcerneCartesId = req.body.cartes_id_dresseur_concerne;
  // Si le deuxième paramêtre a été ajouté
  if (dresseurConcerneCartesId) {
    tabCartesValidator(dresseurConcerneCartesId);
    Carte.find({
      _id: { $in: dresseurConcerneCartesId },
      statut: "collectee"
    })
    .then(cartesADresseur => {
      const dresseurId = cartesADresseur[0].dresseur_id;
      // enlève tous les dresseurs qui ne sont pas les mêmes que le premier (si il en enlève la vérification de la taille des tableaux ne passera pas)
      const cartesADresseurVerif = cartesADresseur.filter(carte => carte.dresseur_id.toString() === dresseurId.toString());
      const cartesIdVerifDresseur = dresseurConcerneCartesId.length === cartesADresseurVerif.length;
      if (!cartesIdVerifDresseur) return res.status(404).send(`Soit les id de cartes concernées n'appartiennent pas toutes au même dresseur ou alors une des cartes n'est pas collectée mais souhaitée par le dresseur.`);
      
      // Vérification si les cartes sont déjà dans un échange en attente
      EchangeConcerneCarte.find({ carte_id: { $in: dresseurConcerneCartesId } })
      .populate({
        path: 'echange_id',
        match: { etat: 'attente' }
      })
      .then(cartesEnAttente => {
        for (const carteEnAttente of cartesEnAttente) {
          if (carteEnAttente.echange_id?.etat === "attente") {
            return res.status(400).send(`Certaines cartes du dresseur concerné sont déjà liées à un échange en attente.`);
          }
        }
      })
      .catch(next)
    })
    .catch(next);
  }
  
  tabCartesValidator(cartesId);
  Carte.find({
    _id: { $in: cartesId },
    statut: "collectee",
    dresseur_id: dresseurIdAuth
  })
  .then(cartesADresseurAuth => {
    const cartesIdVerifDresseurAuth = cartesId.length === cartesADresseurAuth.length;
    if (!cartesIdVerifDresseurAuth) return res.status(404).send(`Le dresseur avec l'id ${dresseurIdAuth} ne possède pas une des cartes se trouvant dans le tableau 'cartes_id' ou la carte est de type 'souhaitee' alors qu'elle devrait être en type 'collectee'.`);
    
    // Vérification si les cartes sont déjà dans un échange en attente
    EchangeConcerneCarte.find({ carte_id: { $in: cartesId } })
    .populate({
      path: 'echange_id',
      match: { etat: 'attente' }
    })
    .then(cartesEnAttente => {
      for (const carteEnAttente of cartesEnAttente) {
        if (carteEnAttente.echange_id?.etat === "attente") {
          return res.status(400).send(`Certaines cartes du dresseur connecté sont déjà liées à un échange en attente.`);
        }
      }

      // Aucune carte n'est liée à un échange en attente
      req.body.dresseur_cree_id = dresseurIdAuth;
      const nouvelEchange = new Echange(req.body);

      nouvelEchange.save()
        .then(echange => {
          if (!echange) return res.status(400).send(`L'échange n'a pas pu être créé.`);
          const echangeId = echange._id;

          // Création dans la table intermédiaire
          const promises = cartesId.map(carteId => {
            const nouvelEchangeConcerneCarte = new EchangeConcerneCarte({
              carte_id: carteId,
              echange_id: echangeId
            });

            return nouvelEchangeConcerneCarte.save();
          });

          Promise.all(promises)
            .then((creationEchangeConcerne) => {
              if (!creationEchangeConcerne) return res.status(400).send(`L'échange dans la table intermédiaire n'a pas pu être créé.`);
              
              res.status(201).send({ echange, cartes_dresseur_cree: cartesADresseurAuth });
            })
            .catch(next);
        })
        .catch(next);
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