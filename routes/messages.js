import debugFactory from 'debug';
import express from "express";
import mongoose from "mongoose";
import Message from "../models/message.js";
import Echange from "../models/echange.js";
import { requireJson, authenticate, loadRessourceFromParams, supChamps } from "./utils.js";

const debug = debugFactory('poketroc:messages');
const router = express.Router();

// Créer un message A FAIRE DANS WEBSOCKET
router.post("/", requireJson, authenticate, supChamps(['dresseur_id', 'createdAt', 'updatedAt']), function (req, res, next) {
  const body = req.body;
  const echangeId = body.echange_id
  body.dresseur_id = req.dresseurCon._id;

  if (!mongoose.Types.ObjectId.isValid(echangeId)) return res.status(400).send("L'id de l'échange est invalide.");
  
  // Il faut vérifier que l'utilisateurs connecté se trouve soit dans dresseur_cree_id ou dans dresseur_concerne
  Echange.findById(echangeId)
    .exec()
    .then(echange => {
      if (!echange) return res.status(404).send(`Aucun échange ne possède l'id ${echangeId}`);
      new Message(body)
        .save()
        .then(messageSauve => {   
          if (!messageSauve) return res.status(400).send(`Le message n'a pas pu être créé`);
          res.status(201).send(messageSauve);
        })
        .catch(next);
    })
    .catch(next);
  
    
});

// Afficher une conversation A FAIRE DANS WEBSOCKET
router.get("/:echangeId", authenticate, loadRessourceFromParams('Echange'), function (req, res, next){
  Message.find()
    .where
    .then((messages) => {
      messages.forEach((message) => {
        if(message.echange_id === echangeId){
          res.status(200).send(message);
        }
      })
    })
    next();
})

export default router;