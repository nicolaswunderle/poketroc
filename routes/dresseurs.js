import debugFactory from 'debug';
import express from "express";
import bcrypt from "bcrypt";
import Dresseur from "../models/dresseur.js";
import { bcryptCostFactor } from "../config.js";

const debug = debugFactory('poketroc:dresseurs');
const router = express.Router();

router.post("/", function (req, res, next) {
  const mdpBrut = req.body.mot_de_passe;

  bcrypt.hash(mdpBrut, bcryptCostFactor)
    .then(mdpHashe => {
      const nouveauDresseur = new Dresseur(req.body);
      nouveauDresseur.mot_de_passe = mdpHashe;
      return nouveauDresseur.save();
    })
    .then(dresseurSauve => {   
      res.status(201).send(dresseurSauve);
    })
    .catch(next);
});



export default router;
