import debugFactory from 'debug';
import express from "express";
import Echange from "../models/echange.js";

const debug = debugFactory('poketroc:messages');
const router = express.Router();

// Créer un message
router.post("/", function (req, res, next) {
  const nouvelEchange = new Echange(req.body);

  nouvelEchange.save().then(echangeSauve => {   
      res.status(201).send(echangeSauve);
    })
    .catch(next);
    
});