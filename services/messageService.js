import Message from '../models/message.js';
import Echange from '../models/echange.js';
import mongoose from "mongoose";

export const getMessagesOfEchange = async (message, dresseur) => {
  const { echangeId } = message;
  try {
    if (!echangeId) throw new Error('Il manque le champ echangeId.');
    if (!mongoose.Types.ObjectId.isValid(echangeId)) throw new Error("L'id de l'échange est invalide.");
    if (!await Echange.find({_id: echangeId, $or: [{ dresseur_cree_id: dresseur._id }, { dresseur_concerne_id: dresseur._id }] })) throw new Error(`L'id ${echangeId} ne correspond à aucun échange.`);
    return await Message.find({ echange_id: echangeId })
  } catch (error) {
    throw new Error(error);
  }
}
