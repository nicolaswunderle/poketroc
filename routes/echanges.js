import debugFactory from 'debug';
import express from "express";
import Echange from "../models/echange.js";
import { authenticate, requireJson } from "./utils.js";

const debug = debugFactory('poketroc:echanges');
const router = express.Router();

// Créer un échange
router.post("/", requireJson, authenticate, function (req, res, next) {
  new Echange(req.body).save()
    .then(echangeSauve => {
        res.status(201).send(echangeSauve);
        next();
    })
    .catch(next);
    
});


// LA CONTRAINTE d'unicité ne marche pas

export default router;