import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { promisify } from "util";
import { jwtSecret } from "../config.js";
// Il faut garder les imports car la fonction loadRessourceFromParams utilise dynmaiquement Dresseur, Echange, Carte et Message
import Dresseur from "../models/dresseur.js";
import Echange from "../models/echange.js";
import Carte from "../models/carte.js";
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";
import Message from "../models/message.js";

const verifyJwt = promisify(jwt.verify);

export function authenticate(req, res, next) {
  // Ensure the header is present.
  const authorization = req.get("Authorization");
  if (!authorization) return res.status(401).send("Il manque l'autorisation dans le header");

  // Check that the header has the correct format.
  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).send("L'autorisation dans le header n'est pas un bearer token");
  
  // Extract and verify the JWT.
  const token = match[1];
  verifyJwt(token, jwtSecret)
  .then(payload => {
    if (!mongoose.Types.ObjectId.isValid(payload.sub)) {
      return res.status(400).send("L'id du dresseur dans le JWT est invalide.");
    }
    req.currentUserId = payload.sub;
    // Check if the Dresseur ID exists in the database.
    return Dresseur.findById(req.currentUserId);
  })
  .then(dresseur => {
    if (!dresseur) {
      return res.status(404).send(`L'id de dresseur ${req.currentUserId} ne correspond à rien dans le JWT`);
    }
    req.dresseurCon = dresseur;
    // Dresseur exists, proceed to the next middleware.
    next();
  }).catch(() => {
    return res.status(498).send("Votre token est invalide ou a expiré");
  });
}

export function editPermission(dresseurId) {
  return (req, res, next) => {
    // il faut que la personne qui est chargée soit la même que celle authentifiée
    if (req.currentUserId !== eval(dresseurId).toString()) {
      return res.status(403).send(`Vous n'avez pas les autorisations de modification.`);
    }
    next();
  }
}

export function requireJson(req, res, next) {
  if (req.is('application/json')) {
    return next();
  }

  const error = new Error('Cette ressource ne supporte que le format application/json');
  error.status = 415; // 415 Unsupported Media Type
  next(error);
}

export function loadRessourceFromParams(modelName) {
  return (req, res, next) => {
    const modelNameLowerCase = modelName.toLowerCase();
    const paramName = `${modelNameLowerCase}Id`
    const ressourceId = req.params[paramName];
    // Vérification de la validité de l'ID dans les paramêtres
    if (!mongoose.Types.ObjectId.isValid(ressourceId)) return res.status(400).send(`L'id de la ressource ${modelNameLowerCase} dans les paramêtres est invalide.`);

    // eval permet de "convertir" une chaine de caratctère en javascript
    eval(modelName).findById(ressourceId)
      .exec()
      .then(ressource => {
        // si aucune ressource n'a été trouvée
        if (!ressource) return res.status(404).send(`Aucune ressource ${modelNameLowerCase} ne possède l'id ${ressourceId}`);
        // s'il y a des choses à faire pour certain modèle en particulier
        switch (modelName) {
          case 'Carte':
            const dresseurId = ressource.dresseur_id;
            
            Dresseur.findById(dresseurId)
              .exec()
              .then(dresseur => {
                if (dresseurId.toString() !== req.currentUserId && ressource.statut === "collectee" && !dresseur.deck_visible) {
                  return res.status(403).send(`Les cartes du dresseur avec l'id ${dresseurId} ne sont pas visible par tout le monde.`);
                } else {
                  req[modelNameLowerCase] = ressource;
                  next();
                }
              })
              .catch(next);
          break;
          default:
            req[modelNameLowerCase] = ressource;
            next();
          break;
        }
      })
      .catch(next);
  }
}

export function loadQuery(queryObject) {
  // format queryObject { nameOfQuery: (required or not) true | false }
  return (req, res, next) => {
    for (const queryName in queryObject) {
      if (queryObject[queryName] && !req.query[queryName]) return res.status(400).send(`Il manque la query '${queryName}' dans l'url.`);
      if (req.query[queryName]) {
        req[queryName] = req.query[queryName];
      }
    }
    next();
  }
}

export function getPaginationParameters(req) {
  // Parse the "page" URL query parameter indicating the index of the first element that should be in the response
  let page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Parse the "pageSize" URL query parameter indicating how many elements should be in the response
  let pageSize = parseInt(req.query.pageSize, 10);
  if (isNaN(pageSize) || pageSize < 0 || pageSize > 50) {
    pageSize = 50;
  }

  return { page, pageSize };
}

export function supChamps(tabChamps) {
  return (req, res, next) => {
    for (const champ of tabChamps) {
      if (req.body[champ]) delete req.body[champ];
    }
    next();
  }
}

export function modificationsObject(ressource, ressourceMaj) {
  if (typeof ressourceMaj !== 'object') return false;
  let modifications = false;
  Object.keys(ressource.toObject()).forEach((cle) => {
    if (ressource[cle] !== ressourceMaj[cle] && ressourceMaj[cle] !== undefined) {
      // si la valeur n'est pas la même qu'avant alors on la change
      ressource[cle] = ressourceMaj[cle];
      if (!modifications) modifications = true;
    }
  });
  return modifications;
}

export function loadDresseurFromQuery(req, res, next) {
  const dresseurId = req.dresseurId;
  // Si aucun id n'est donné alors par défaut c'est celui du dresseur connecté qui est utilisé
  if (!dresseurId) {
    req.dresseur = req.dresseurCon;
    next();
  } else {
    // Vérification de la validité de l'ID dans les paramêtres
    if (!mongoose.Types.ObjectId.isValid(dresseurId)) return res.status(400).send("L'id du dresseur dans la query est invalide.");

    Dresseur.findById(dresseurId)
      .exec()
      .then(dresseur => {
        if (!dresseur) return res.status(404).send(`Aucun dresseur ne possède l'id ${dresseurId}`);
        req.dresseur = dresseur;
        next();
      })
      .catch(next);
  }
}

export function loadCartesFromBody(cartesAppartenance) {
  return (req, res, next) => {
    let tabCartesId = [];
    if (cartesAppartenance === 'cartes_id') {
      tabCartesId = req.body.cartes_id;
      if (!tabCartesId) return res.status(400).send("Il manque La propriété 'cartes_id'.");
    } else if (cartesAppartenance === 'cartes_id_dresseur_concerne') {
      tabCartesId = req.body.cartes_id_dresseur_concerne;
      // si cartes_id_dresseur_concerne est vide on peut passer au prochain middleware
      if (tabCartesId === undefined) return next();
    }
    // Vérification si c'est un tableau rempli
    if (!Array.isArray(tabCartesId)) return res.status(400).send(`Le tableau '${cartesAppartenance}' n'est pas valide.`);
    if (tabCartesId.length === 0) return res.status(400).send(`Le tableau '${cartesAppartenance}' doit contenir au moins un id de carte.`);
    // vérification si l'id est valide
    for (const carteId of tabCartesId) {
      if (!mongoose.Types.ObjectId.isValid(carteId)) return res.status(400).send(`L'id ${carteId} n'est pas un id de carte valide.`);
    }
    Carte.find({
      _id: { $in: tabCartesId }
    })
    .then(tabCartes => {
      if (tabCartes.length !== tabCartesId.length) return res.status(400).send(`Les cartes n'ont pas toutes été trouvées dans la base de données.`)
      const dresseurAuthId = req.currentUserId;
      let dresseurConcerneId = "";
      for (const carte of tabCartes) {
        // vérfie que le statut ne soit pas souhaitee
        if (carte.statut === 'souhaitee') return res.status(400).send(`La carte avec l'id ${carte._id} ne peut pas être échangée car son statut est 'souhaitee' et non 'collectee'.`);
        // vérfie que toutes les cartes appartiennent au même dresseur
        if (dresseurConcerneId) {
          if (dresseurConcerneId.toString() !== carte.dresseur_id.toString()) return res.status(400).send(`La carte avec l'id ${carte._id} n'a pas le même propriétaire que la carte précédente.`);
        } else {
          dresseurConcerneId = carte.dresseur_id;
        }
        // Vérification change en fonction du tableau de cartes traité
        if (cartesAppartenance === 'cartes_id') {
          // si on traite le tableau de cartes du dresseur connecté alors il faut que ce soit lui le propriétaire des cartes
          if (carte.dresseur_id.toString() !== dresseurAuthId) return res.status(400).send(`La carte avec l'id ${carte._id} n'appartient pas au dresseur connecté qui crée l'échange.`);
        } else if (cartesAppartenance === 'cartes_id_dresseur_concerne') {
          // si on traite le tableau de cartes du dresseur concerné il ne faut pas que ce soit le même que le dresseur connecté
          if (carte.dresseur_id.toString() === dresseurAuthId) return res.status(400).send(`Un dresseur ne peut pas échanger des cartes avec lui-même.`)
        }
      }
      // Vérifie si la carte ne se trouve pas déjà dans un échange
      EchangeConcerneCarte.find({ 
        carte_id: { $in: tabCartesId } 
      })
      .then(cartesDansEchange => {
        if (cartesDansEchange.length > 0) return res.status(400).send(`Le tableau ${cartesAppartenance} contient un ou plusieurs id de carte qui sont déjà liées à un échange : ${cartesDansEchange.map(echangeCarte => echangeCarte.carte_id).join(', ')}`);
        
        if (cartesAppartenance === 'cartes_id') {
          req.cartesDresseurAuth = tabCartes;
          req.cartesIdDresseurAuth = tabCartesId;
        } else if (cartesAppartenance === 'cartes_id_dresseur_concerne') {
          req.cartesDresseurConcerne = tabCartes;
          req.cartesIdDresseurConcerne = tabCartesId;
        }
        next();
      })
      .catch(next)
    })
    .catch(next);
  }
}

export function loadCompletedEchange(req, res, echangeRecu) {
  return new Promise((resolve, reject) => {
    const echange = echangeRecu.toObject();
    if (!echange) return res.status(400).send("Il n'y a pas d'échange à chargé.")
    
    const cartes_dresseur = [];
    const cartes_autre_dresseur = [];
    let autreDresseurId = "";
    if (req.currentUserId === echange.dresseur_cree_id.toString()) {
      autreDresseurId = echange.dresseur_concerne_id;
      echange.etat_dresseur = echange.etat_dresseur_cree;
      echange.etat_autre_dresseur = echange.etat_dresseur_concerne;
    } else {
      autreDresseurId = echange.dresseur_cree_id;
      echange.etat_dresseur = echange.etat_dresseur_concerne;
      echange.etat_autre_dresseur = echange.etat_dresseur_cree;
    }
    
    EchangeConcerneCarte.find({ echange_id: echange._id })
      .populate("carte_id")
      .then(echangesConcerneCartes => {
        for (const echangeConcerneCartes of echangesConcerneCartes) {
          const carte = echangeConcerneCartes.carte_id;
          if (echange.dresseur_concerne_id === null && carte.dresseur_id.toString() !== echange.dresseur_cree_id.toString()) return res.status(400).send(`Il n'y a pas de dresseur concerné dans l'échange avec l'id ${echange._id} mais une carte est possédée par un autre dresseur que celui qui à créé cet échange. Id du dresseur qui a créé l'échange ${echange.dresseur_cree_id}. Id du dresseur qui n'a pas créé l'échange ${carte.dresseur_id}.`)
          if (carte.dresseur_id.toString() === req.currentUserId) {
            cartes_dresseur.push(carte);
          } else {
            cartes_autre_dresseur.push(carte);
          }
        }
        return Dresseur.findById(autreDresseurId);
      })
      .then(autre_dresseur => {
        if (!autre_dresseur) return res.status(404).send(`Le dresseur avec l'id ${autreDresseurId} n'a pas été trouvé dans la base de données.`)
        delete echange.dresseur_cree_id;
        delete echange.dresseur_concerne_id;
        delete echange.etat_dresseur_cree;
        delete echange.etat_dresseur_concerne;
        delete echange.__v;
        delete echange.updatedAt;
        
        resolve({ 
          echange,
          autre_dresseur,
          cartes_dresseur,
          cartes_autre_dresseur
        });
      })
      .catch(error => {
        reject(error);
      });
  });
}

export function loadEchangeCartesId(req, res, next) {
  const echange = req.echange;
  if (!echange) return res.status(400).send("Il n'y a pas d'échange à chargé.")
    
  const cartes_id_dresseur_cree = [];
  const cartes_id_dresseur_concerne = [];
  
  EchangeConcerneCarte.find({ echange_id: echange._id })
    .populate('carte_id')
    .then(echangesConcerneCartes => {
      for (const echangeConcerneCartes of echangesConcerneCartes) {
        const carte = echangeConcerneCartes.carte_id;
        if (carte.dresseur_id.toString() === echange.dresseur_cree_id.toString()) {
          cartes_id_dresseur_cree.push(carte._id);
        } else {
          cartes_id_dresseur_concerne.push(carte._id);
        }
      }
      req.cartesIdDresseurCree = cartes_id_dresseur_cree;
      req.cartesIdDresseurConcerne = cartes_id_dresseur_concerne;
      next();
    })
    .catch(next);
}

export function editPermissionEchange(req, res, next) {
  // Si dresseur_cree_id et dresseur_concerne_id alors c'est seulement ces deux personnes qui peuvent modifier un échange
  if (req.echange.dresseur_concerne_id !== null) {
    if (req.currentUserId !== req.echange.dresseur_cree_id.toString() && req.currentUserId !== req.echange.dresseur_concerne_id.toString()) {
      return res.status(403).send(`Vous n'avez pas les autorisations de modification ou de visualisation.`);
    }
  }
  next();
}

export function verifTabCartesId(cartesId) {
  if (cartesId !== undefined) {
    if (!Array.isArray(cartesId)) return { error: 'Les paramêtres "supression" et "ajout" dans le body doivent être des tableaux.' };
    if (cartesId.length <= 0) return { error: 'Les tableaux "supression" et "ajout" doivent avoir au moins un id de carte.' };
    for (const carteId of cartesId) {
      if (!mongoose.Types.ObjectId.isValid(carteId)) return { error: `L'id de la carte ${carteId} est invalide.` };
    }
    return cartesId;
  } else {
    return false;
  }
}