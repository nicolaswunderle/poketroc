import Echange from '../models/echange.js';
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";

export const getEchangesProposes = async () => {
  try {
    // const echanges = await Echange.find({ dresseur_concerne_id: null });
    // if (!echanges) throw new Error(`La recherche dans les échanges n'a pas pu être faite.`);
    // const echangesConcerneCarte = await 
    // for (const echange of echanges) {
      
    // }
    return await EchangeConcerneCarte.find()
      .populate("echange_id")
      .populate("carte_id")
    // return 
  } catch (error) {
    throw new Error(error)
  }
}