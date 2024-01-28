import Dresseur from '../models/dresseur.js';

export const getDresseurAProximite = async (message, dresseur) => {
  try {
    return await Dresseur.find({
      localisation: { 
        $near:{ 
          $geometry: { 
            type: "Point",
            coordinates: dresseur.localisation.coordinates
          }
        }
      }
    })
    .where("en_ligne")
    .equals(true)
    .where("_id")
    .ne(dresseur._id)
  } catch (error) {
    throw new Error(error);
  }
}