import debugFactory from 'debug';
import express from "express";
import Message from "../models/message.js";
import { requireJson, authenticate } from "./utils.js";

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
router.delete("/:messageId", authenticate, function (req, res, next) {
    Message.deleteOne({ _id: req.message.id })
      .exec()
      .then(message => {
        if (!message) return res.status(404).send("Le message à supprimer n'existe pas"); // Unauthorized
        res.sendStatus(204);
        next();
      })
      .catch(next);
});

// Afficher une conversation
router.get("/:echangeId",authenticate, function (req, res, next){
    res.status(200).send(req.message);
    next();
})

export default router;