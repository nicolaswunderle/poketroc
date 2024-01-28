import debugFactory from 'debug';
import express, { response } from "express";
import mongoose from "mongoose";
import Echange from "../models/echange.js";
import Dresseur from "../models/dresseur.js";
import Carte from "../models/carte.js";
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";
import { 
  requireJson, 
  authenticate, 
  loadRessourceFromParams, 
  supChamps,
  loadCartesFromBody,
  loadCompletedEchange,
  loadEchangeCartesId,
  editPermissionEchange,
  verifTabCartesId
} from "./utils.js";
import { broadcast } from '../websocket.js';

const debug = debugFactory('poketroc:echanges');
const router = express.Router();

// Créer un échange
router.post("/",
  requireJson,
  authenticate,
  supChamps(['dresseur_cree_id', 'etat_dresseur_cree', 'etat_dresseur_concerne', 'createdAt', 'updatedAt']),
  loadCartesFromBody('cartes_id'),
  loadCartesFromBody('cartes_id_dresseur_concerne'),
  async function (req, res, next) {
    const { cartesDresseurAuth, cartesIdDresseurAuth, cartesDresseurConcerne, cartesIdDresseurConcerne } = req;
    const dresseurAuthId = req.currentUserId;
    const dresseurConcerneId = cartesDresseurConcerne ? cartesDresseurConcerne[0].dresseur_id : '';
    
    req.body.dresseur_cree_id = dresseurAuthId;
    if (cartesDresseurConcerne) { req.body.dresseur_concerne_id = dresseurConcerneId }

    
    // liste de tous les id des cartes
    const allCartesId = [...cartesIdDresseurAuth];
    if (cartesIdDresseurConcerne) {
      allCartesId.push(...cartesIdDresseurConcerne) 
      // SI DEUX CARTES SONT IDENTIQUES DANS LES TABLEAUX ELLE NE PEUVENT PAS ÊTRE ECHANGE
      const cartes = await Carte.find({_id: {$in : allCartesId}});
      for (const carteI of cartes) {
        for (const carteJ of cartes) {
          if (carteI._id !== carteJ._id) {
            if (
              carteI.id_api === carteJ.id_api &&
              carteI.etat === carteJ.etat &&
              carteI.desc_etat === carteJ.desc_etat &&
              carteI.type === carteJ.type &&
              carteI.statut === carteJ.statut
            ) {
              return res.status(400).send(`Les cartes avec les id ${carteI._id} et ${carteJ._id} ont les même propriété 'id_api', 'etat', 'desc_etat', 'type', 'statut' et ne peuvent donc pas être échangée.`);
            }
          }
        }
      }
    }


    new Echange(req.body).save()
      .then(echange => {
        if (!echange) return res.status(400).send(`L'échange n'a pas pu être créé.`);
        const echangeId = echange._id;
        // Création dans la table intermédiaire
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
            broadcast({nouvelEchange: echangeEntier});
            res.status(201).send(echangeEntier);
          })
          .catch(next);
      })
      .catch(next);
  }
);

// Affiche tous les échange d'un dresseur
router.get("/",
  authenticate,
  function (req, res, next) {
    const dresseurAuthId = req.currentUserId;
    Echange.find({
      $or: [
          { dresseur_cree_id: dresseurAuthId },
          { dresseur_concerne_id: dresseurAuthId }
      ]
    })
    .then(echanges => {
      const completedEchangesPromises = [];
      for (const echange of echanges) {
        completedEchangesPromises.push(loadCompletedEchange(req, res, echange))
      }
      return Promise.all(completedEchangesPromises);
    })
    .then(completedEchanges => {
      return res.status(200).send(completedEchanges);
    })
    .catch(next);
  }
);

// Affiche un échange
router.get("/:echangeId",
  authenticate,
  loadRessourceFromParams('Echange'),
  editPermissionEchange,
  function (req, res, next) {
    loadCompletedEchange(req, res, req.echange)
      .then(completedEchange => {
        res.status(200).send(completedEchange);
      })
      .catch(next); 
  }
);

// Modifier un échange
router.patch("/:echangeId",
  requireJson,
  authenticate,
  loadRessourceFromParams('Echange'),
  editPermissionEchange,
  loadEchangeCartesId,
  supChamps(['_id', '__v', 'dresseur_cree_id', 'createdAt', 'updatedAt']),
  async function (req, res, next) {
    // MODIFICATIONS DE L'ECHANGE
    const echange = req.echange;
    const dresseurType = req.currentUserId === echange.dresseur_cree_id.toString() ? 'dresseur_cree' : 'dresseur_concerne';
    const creationEchangeConcerne = [];
    const allChanges = [];
    
    const etatEchange = req.body.echange?.etat;
    const suppressionCartesId = verifTabCartesId(req.body.cartes_id?.suppression);
    const ajoutCartesId = verifTabCartesId(req.body.cartes_id?.ajout);
    
    if (suppressionCartesId?.error) return res.status(400).send(suppressionCartesId.error);
    if (ajoutCartesId?.error) return res.status(400).send(ajoutCartesId.error);

    // Si une carte se retrouve dans les deux tableau on ne fait rien
    if (suppressionCartesId && ajoutCartesId) {
      for (const suppressionCarteId of suppressionCartesId) {
        if (ajoutCartesId.includes(suppressionCarteId)) return res.status(400).send(`Il ne peut pas y avoir la même carte dans le tableau de suppression et dans le tableau d'ajout de carte.`);
      }
    }

    // Si la personne qui modifie l'échange n'est pas celle qui l'a créé et que la personne concernée est null alors on l'a met en tant que dresseurConcerne
    if (dresseurType === 'dresseur_concerne' && echange.dresseur_concerne_id === null) {
      // Si un dresseur est ajouté il faut absolument qu'il ajoute des cartes
      if (!ajoutCartesId) return res.status(400).send(`Si un dresseur est ajouté à l'échange il doit obligaoirement y mettre une carte au minimum.`);
      echange.dresseur_concerne_id = req.currentUserId;
      allChanges.push('echange');
    }
    
    if (etatEchange) {
      if (echange.dresseur_concerne_id === null) return res.status(400).send(`L'état de l'échange ne peut pas être modifié tant qu'il n'y a pas de dresseur concerné par l'échange.`);
      // Si l'échange n'est pas en attente et qu'il n'est pas modifié au statut en attente, on ne peut pas modifier les cartes qui sont dans l'échange.
      if (etatEchange !== 'attente' && (suppressionCartesId || ajoutCartesId)) return res.status(400).send(`Il faut que l'échange soit en attente du côté du dresseur qui veut modifier les cartes d'un échange.`);
      if (echange["etat_"+dresseurType] !== etatEchange) {
        echange["etat_"+dresseurType] = etatEchange;
        if (!allChanges.includes('echange')) allChanges.push('echange');
      }
    } else {
      // Si l'échange n'est pas en attente, on ne peut pas modifier les cartes qui sont dans l'échange.
      if (echange["etat_"+dresseurType] !== 'attente' && (suppressionCartesId || ajoutCartesId)) return res.status(400).send(`Il faut que l'échange soit en attente du côté du dresseur qui veut modifier les cartes d'un échange.`);
    }

    echange.updatedAt = new Date();
    
    
    // MODIFICATION DES CARTES INCLUSES DANS L'ECHANGE

    const cartes = await EchangeConcerneCarte.aggregate([
      {
        $match: {
          echange_id: echange._id
        }
      },
      {
        $lookup: {
          from: 'cartes',
          localField: 'carte_id',
          foreignField: '_id',
          as: 'carte'
        }
      },
      {
        $unwind: '$carte'
      },
      {
        $match: {
          'carte.dresseur_id': new mongoose.Types.ObjectId(req.currentUserId)
        }
      },
      {
        $replaceRoot: { newRoot: { $mergeObjects: ['$carte', '$$ROOT'] } }
      },
      {
        $project: {
          carte: 0, // Exclure le champ 'carte' de l'objet résultant
          echange_id: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
          _id: 0
        }
      }
    ]);
    cartes.forEach(carte => {
      carte._id = carte.carte_id;
      delete carte.carte_id;
    });

    if (suppressionCartesId) {
      if (cartes.length === suppressionCartesId.length) return res.status(400).send(`Vous ne pouvez pas enlever toutes les cartes d'un échange.`);
      for (const carteId of suppressionCartesId) {
        const indexCarteASupprimer = cartes.findIndex(carte => carte._id.toString() === carteId);
        if (indexCarteASupprimer === -1) return res.status(404).send(`La carte avec l'id ${carteId} n'existe pas dans l'échange ou elle n'appartient pas au dreseur connecté mais à l'autre dresseur dans l'échange.`);
        cartes.splice(indexCarteASupprimer, 1);
      }
      allChanges.push('suppressionCartes');
    }

    if (ajoutCartesId) {
      for (const carteId of ajoutCartesId) {
        const carte = await Carte.findById(carteId);
        if (!carte) return res.status(404).send(`La carte avec l'id ${carteId} n'existe pas.`);
        for (const carteJ of cartes) {
          if (
            carte.id_api === carteJ.id_api &&
            carte.etat === carteJ.etat &&
            carte.desc_etat === carteJ.desc_etat &&
            carte.type === carteJ.type &&
            carte.statut === carteJ.statut
          ) {
            return res.status(400).send(`Les cartes avec les id ${carte._id} et ${carteJ._id} ont les même propriété 'id_api', 'etat', 'desc_etat', 'type', 'statut' et ne peuvent donc pas être échangée.`);
          }
        }
        if (carte.statut === "souhaitee") return res.status(400).send(`La carte avec l'id ${carteId} a le statut 'souhaitee' et ne peut donc pas être mis dans un échange.`);
        if (req.currentUserId !== carte.dresseur_id.toString()) return res.status(400).send(`La carte avec l'id ${carteId} n'appartient pas au dresseur avec l'id ${req.currentUserId}`);
        creationEchangeConcerne.push({carte_id: carteId, echange_id: echange._id});
        cartes.push(carte);
      }
      allChanges.push('ajoutCartes');
    }


    if (allChanges.length > 0) {

      try {
        for (const change of allChanges) {
          switch (change) {
            case 'echange':
                await echange.save();
            break;
            case 'suppressionCartes':
              await EchangeConcerneCarte.deleteMany({carte_id : {$in : suppressionCartesId}});
            break;
            case 'ajoutCartes':
              await EchangeConcerneCarte.insertMany(creationEchangeConcerne);
            break;
          }
          
        }
      } catch (error) {
        return next(error);
      }
      
      // Si c'est un échange où le dresseur_concerne est null alors on l'envoie en websocket
      if (echange.dresseur_concerne_id === null) {
        
      }

      // si les changments ont réussi
      res.status(200).send({
        echange,
        cartes
      });

    } else {
      return res.sendStatus(204);
    }
  }
);

// Supprime l'échange
router.delete("/:echangeId",
  authenticate,
  loadRessourceFromParams('Echange'),
  editPermissionEchange,
  async function (req, res, next) {
    const echange = req.echange;
    
    // Des première vérifications sont faites dans editPermissionsEchange
    if (echange.dresseur_concerne_id === null && echange.dresseur_cree_id.toString() !== req.currentUserId) return res.status(403).send(`Vous n'avez pas les autorisations pour supprimer cet échange.`);
    
    if (echange.dresseur_concerne_id !== null && (echange.etat_dresseur_cree === 'attente' || echange.etat_dresseur_concerne === 'attente')) return res.status(400).send(`Un des deux dresseurs n'a pas accepté ou refusé l'échange.`);
    if (echange.dresseur_concerne_id !== null && echange.etat_dresseur_cree !== echange.etat_dresseur_concerne) return res.status(400).send(`Les deux dresseurs n'ont pas fait le même choix entre accepter ou refuser l'échange.`);
    
    const etat = echange.etat_dresseur_cree;

    // Supprime l'échange
    const validEchange = await Echange.deleteOne({ _id: echange._id });
    if (validEchange.deletedCount <= 0) return res.status(400).send("L'échange n'a pas pu être supprimé.");

    if (etat === 'refuse' || echange.dresseur_concerne_id === null) {
      
      const validEchangeConcerneCarte = await EchangeConcerneCarte.deleteMany({echange_id : echange._id});
      if (validEchangeConcerneCarte.deletedCount <= 0) return res.status(400).send("Echange qui concerne les cartes n'ont pas pu être supprimé.");
      if (echange.dresseur_concerne_id === null) broadcast({echangeSupprime: echange._id});
      return res.sendStatus(204);

    } else if (etat === 'accepte') {

      const findEchangeConcerneCarte = await EchangeConcerneCarte.find({echange_id : echange._id});
      if (!findEchangeConcerneCarte) return res.status(404).send(`Echange qui concerne les cartes n'ont pas été trouvée avec l'id d'échange ${echange._id}.`);
      
      // Supprime les echangeConcerneCarte
      const validEchangeConcerneCarte = await EchangeConcerneCarte.deleteMany({echange_id : echange._id});
      if (validEchangeConcerneCarte.deletedCount <= 0) return res.status(400).send("Echange qui concerne les cartes n'ont pas pu être supprimé.");

      const findCartes = await Carte.find({_id: {$in : findEchangeConcerneCarte.map(echangeConcerneCarte => echangeConcerneCarte.carte_id)}});
      if (!findCartes) return res.status(404).send(`Aucune carte n'a été trouvée avec l'id d'échange ${echange._id}.`);

      const cartesPromises = [];
      for (const carte of findCartes) {
        const dresseurOppose = carte.dresseur_id.toString() === echange.dresseur_cree_id.toString() ? echange.dresseur_concerne_id : echange.dresseur_cree_id;
        const carteDejaPossedeeParDresseur = await Carte.findOne({
          id_api: carte.id_api,
          etat: carte.etat,
          $or: [
            { desc_etat: carte.desc_etat }, // Inclut le critère si desc_etat est défini
            { desc_etat: { $exists: false } } // Inclut le critère si desc_etat n'est pas défini
          ],
          type: carte.type,
          dresseur_id: dresseurOppose
        });

        if (carte.quantite > 1 && !carteDejaPossedeeParDresseur) {
          carte.quantite--;
          carte.updatedAt = new Date();
          const cartePrecedente = carte.toObject();
          delete cartePrecedente._id;
          delete cartePrecedente.__v;
          delete cartePrecedente.createdAt;
          delete cartePrecedente.updatedAt;
          const nouvelleCarte = new Carte({ ...cartePrecedente, quantite: 1, dresseur_id: dresseurOppose });
          cartesPromises.push(carte.save(), nouvelleCarte.save());
        } else if (carte.quantite > 1 && carteDejaPossedeeParDresseur) {
          carte.quantite--;
          carte.updatedAt = new Date();
          cartesPromises.push(carte.save());
          if (carteDejaPossedeeParDresseur.statut === 'collectee') {
            carteDejaPossedeeParDresseur.quantite++;
            carteDejaPossedeeParDresseur.updatedAt = new Date();
            cartesPromises.push(carteDejaPossedeeParDresseur.save());
          } else {
            const cartePrecedente = carte.toObject();
            delete cartePrecedente._id;
            delete cartePrecedente.__v;
            delete cartePrecedente.createdAt;
            delete cartePrecedente.updatedAt;
            const nouvelleCarte = new Carte({ ...cartePrecedente, quantite: 1, dresseur_id: dresseurOppose });
            cartesPromises.push(nouvelleCarte.save());
            if (carteDejaPossedeeParDresseur.quantite > 1) {
              carteDejaPossedeeParDresseur.quantite--;
              carteDejaPossedeeParDresseur.updatedAt = new Date();
              cartesPromises.push(carteDejaPossedeeParDresseur.save());
            } else {
              cartesPromises.push(Carte.deleteOne({_id: carteDejaPossedeeParDresseur._id}))
            }
          }
        } else if (carte.quantite <= 1 && !carteDejaPossedeeParDresseur) {
          carte.dresseur_id = dresseurOppose;
          carte.updatedAt = new Date();
          cartesPromises.push(carte.save());
        } else if (carte.quantite <= 1 && carteDejaPossedeeParDresseur) {
          if (carteDejaPossedeeParDresseur.statut === 'collectee') {
            carteDejaPossedeeParDresseur.quantite++;
            carteDejaPossedeeParDresseur.updatedAt = new Date();
            cartesPromises.push(carteDejaPossedeeParDresseur.save());
          } else {
            const cartePrecedente = carte.toObject();
            delete cartePrecedente._id;
            delete cartePrecedente.__v;
            delete cartePrecedente.createdAt;
            delete cartePrecedente.updatedAt;
            const nouvelleCarte = new Carte({ ...cartePrecedente, dresseur_id: dresseurOppose });
            cartesPromises.push(nouvelleCarte.save());
            if (carteDejaPossedeeParDresseur.quantite > 1) {
              carteDejaPossedeeParDresseur.quantite--;
              carteDejaPossedeeParDresseur.updatedAt = new Date();
              cartesPromises.push(carteDejaPossedeeParDresseur.save());
            } else {
              cartesPromises.push(Carte.deleteOne({_id: carteDejaPossedeeParDresseur._id}))
            }
          }
          cartesPromises.push(Carte.deleteOne({_id: carte._id}));
        }
      }


      const cartesSauve = await Promise.all(cartesPromises);
      if (!cartesSauve) return res.status(404).send(`Les cartes n'ont pas pu être sauvées.`);
      
      return res.sendStatus(204);
    }
  }
);

export default router;