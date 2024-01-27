import Echange from '../models/echange.js';

export const getEchangesProposes = async (echangeId) => {
  try {
    // return await Message.find({ echange_id: echangeId })
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des échanges proposés.`)
  }
}