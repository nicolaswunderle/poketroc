import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import createDebugger from 'debug';
import { WebSocketServer } from 'ws';
import { promisify } from "util";
import { jwtSecret } from "./config.js";
import Dresseur from "./models/dresseur.js";
import { getDresseurAProximite } from './services/dresseurService.js';
import { getEchangesProposes } from './services/echangeService.js';
import { getMessagesOfEchange } from './services/messageService.js';

const verifyJwt = promisify(jwt.verify);

const debug = createDebugger('express-api:websocket');

// const clients = [];
const clients = {};

const messageHandlers = {
  'getDresseurAProximite': getDresseurAProximite,
  // 'getEchangesProposes': getEchangesProposes,
  'getMessagesOfEchange': getMessagesOfEchange
};

export function createWebSocketServer(httpServer) {
  debug('Creating WebSocket server');
  const wss = new WebSocketServer({
    server: httpServer,
  });

  // Handle new client connections.
  wss.on('connection', function (ws) {
    debug('New WebSocket client connected');

    // Keep track of clients.
    // clients.push(ws);
    clients[ws] = ws;

    // Listen for messages sent by clients.
    ws.on('message', (message) => {
      // Make sure the message is valid JSON.
      let parsedMessage;
      try {
        parsedMessage = JSON.parse(message);
      } catch (error) {
        // Send an error message to the client with "ws" if you want...
        return ws.send(JSON.stringify({ error: error.message }))
      }

      // Handle the message.
      onMessageReceived(ws, parsedMessage);
    });

    // Clean up disconnected clients.
    ws.on('close', () => {
      // clients.splice(clients.indexOf(ws), 1);
      delete clients[ws];
      debug('WebSocket client disconnected');
    });

  });
}

export function broadcastDresseur(nouveauDresseur) {
  Object.keys(clients).forEach((client) => {
    client.send(JSON.stringify(nouveauDresseur))
  });
}

function onMessageReceived(ws, message) {
  const token = clients[ws].token ? clients[ws].token : message.token;
  const { type } = message;
  let dresseurId;
  
  if (!token) return ws.send(JSON.stringify({ error: 'Il manque le token.' }));
  // Vérification du token
  verifyJwt(token, jwtSecret)
    .then(payload => {
      if (!mongoose.Types.ObjectId.isValid(payload.sub)) return ws.send(JSON.stringify({ error: "L'id du dresseur dans le JWT est invalide." }));
      dresseurId = payload.sub;

      clients[ws].token = token;

      return Dresseur.findById(dresseurId);
    })
    .then(dresseur => {
      if (!dresseur) return ws.send(JSON.stringify({ error: `L'id ${dresseurId} ne correspond à aucun dresseur`}));
      
      const handler = messageHandlers[type];

      if (handler) {
        handler(message, dresseur)
        .then(result => {
          return ws.send(JSON.stringify({result}));
        })
        .catch(error => {
          return ws.send(JSON.stringify({ error: error.message }));
        });
      } else if (type) {
        ws.send(JSON.stringify({ error: 'La propriété "type" ne correspond à aucune action.' }));
      }
    })

  // const {type, token, localisation, echangeId} = message;

  // if (type === 'getDresseurAProximite') {
  //   let dresseurId;

  //   // Vérifier le token
  //   if (!token) return ws.send(JSON.stringify({ error: 'Il manque le token.' }));
  //   verifyJwt(token, jwtSecret)
  //     .then(payload => {
  //       if (!mongoose.Types.ObjectId.isValid(payload.sub)) return ws.send(JSON.stringify({ error: "L'id du dresseur dans le JWT est invalide." }));
  //       dresseurId = payload.sub;
  //       // Check if the Dresseur ID exists in the database.
  //       return Dresseur.findById(dresseurId);
  //     })
  //     .then(dresseur => {
  //       if (!dresseur) return ws.send(JSON.stringify({ error: `L'id ${dresseurId} ne correspond à aucun dresseur`}));
  //       return getDresseurAProximite(localisation);
  //     })
  //     .then(dresseursProches => {
  //       return ws.send(JSON.stringify({dresseursProches}));
  //     })
  //     .catch(error => {
  //       return ws.send(JSON.stringify({ error: error.message }));
  //     });
  // } else if (type === 'getMessagesOfEchange') {
  //   let dresseurId;
  //   if (!token) return ws.send(JSON.stringify({ error: 'Il manque le token' }));
  //   verifyJwt(token, jwtSecret)
  //     .then(payload => {
  //       if (!mongoose.Types.ObjectId.isValid(payload.sub)) return ws.send(JSON.stringify({ error: "L'id du dresseur dans le JWT est invalide." }));
  //       dresseurId = payload.sub;
  //       // Check if the Dresseur ID exists in the database.
  //       return Dresseur.findById(dresseurId);
  //     })
  //     .then(dresseur => {
  //       if(!dresseur) return ws.send(JSON.stringify({ error: `L'id ${dresseurId} ne correspond à aucun dresseur`}));
  //       if(!echangeId) return ws.send(JSON.stringify({ error: 'Il manque le champs echangeId' }));
  //       if (!mongoose.Types.ObjectId.isValid(echangeId)) return ws.send(JSON.stringify({ error: "L'id de l'échange est invalide." }));
  //       return Echange.findById(echangeId);
  //     })
  //     .then(echange => {
  //       if(!echange) return ws.send(JSON.stringify({ error: `L'id ${echangeId} ne correspond à aucun échange`}));
  //       return echange.dresseur_cree_id == dresseurId;
  //     })
  //     .then(echangeValid => {
  //       if(!echangeValid) return ws.send(JSON.stringify({ error: `Le dresseur n'a pas créé cet échange`}));
  //       return Message.find()
  //         .where("dresseur_id")
  //         .equals(dresseurId)
  //         .where("echange_id")
  //         .equals(echangeId)
  //     })
  //     .then(messages => {
  //       return ws.send(JSON.stringify({messages}));
  //     })
  //     .catch(error => {
  //       return ws.send(JSON.stringify({ error: error.message }));
  //     });
  // }
  
  
}