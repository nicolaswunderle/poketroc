import debugFactory from 'debug';
import express from "express";
import Message from "../models/message.js";
import { requireJson, authenticate, loadEchangeFromParams } from "./utils.js";

const debug = debugFactory('poketroc:messages');
const router = express.Router();

// Créer un message
router.post("/", function (req, res, next) {
  const nouveauMessage = new Message(req.body);

  nouveauMessage.save().then(messageSauve => {   
    res.status(201).send(messageSauve);
  })
  .catch(next);
    
});

//Supprimer un message
router.delete("/:messageId",authenticate, function (req, res, next) {
  const messageId = req.params.messageId;
    Message.deleteOne({ _id: messageId })
      .exec()
      .then(message => {
        if (!message) return res.status(404).send("Le message à supprimer n'existe pas"); // Unauthorized
        res.sendStatus(204).send("Le message à été supprimé");
        next();
      })
      .catch(next);
});

// Afficher une conversation
router.get("/:echangeId",authenticate, loadEchangeFromParams, function (req, res, next){
  const echangeId = req.params.echangeId;
  Message.find()
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