import Message from '../models/message.js';
import Echange from '../models/echange.js';
import mongoose from "mongoose";

const verifEchangeId = async (echangeId, dresseur) => {
  if (!echangeId) throw new Error('Il manque le champ echangeId.');
  if (!mongoose.Types.ObjectId.isValid(echangeId)) throw new Error("L'id de l'échange est invalide.");
  const echange = await Echange.findOne({_id: echangeId, $or: [{ dresseur_cree_id: dresseur._id }, { dresseur_concerne_id: dresseur._id }] });
  if (!echange) throw new Error(`L'id ${echangeId} ne correspond à aucun échange.`);
  return echange;
}


export const getMessagesOfEchange = async (message, dresseur) => {
  const { echangeId } = message;
  try {
    await verifEchangeId(echangeId, dresseur);
    return await Message.find({ echange_id: echangeId })
  } catch (error) {
    throw new Error(error);
  }
}


export const sendMessageInEchange = async (message, dresseur, clients) => {
  const { echangeId, contenu } = message;
  try {
    if (!contenu) throw new Error('Il manque le champ contenu.');
    const echange = await verifEchangeId(echangeId, dresseur);
    const autreDresseur = echange.dresseur_cree_id.toString() === dresseur._id.toString() ? echange.dresseur_concerne_id : echange.dresseur_cree_id;
    // Créer le message dans la bdd
    const message = await new Message({
      contenu,
      dresseur_id: dresseur._id,
      echange_id: echangeId
    }).save();
    // Envoyer le message si l'autre utilisateur est connecté
    let messageEnvoye = false;
    clients.forEach(ws => {
      if (ws.dresseurId.toString() === autreDresseur.toString()) {
        ws.send(JSON.stringify(message));
        messageEnvoye = true;
      }
    })
    if (messageEnvoye) {
      return "L'autre dresseur est en ligne et le message lui a été envoyé.";
    } else {
      return "Le message a été enregistré.";
    }
  } catch (error) {
    throw new Error(error);
  }
}