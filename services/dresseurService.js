import Dresseur from '../models/dresseur.js';

export const getDresseurAProximite = async (localisation) => {
  try {
    if (!localisation) throw new Error("Il n'y pas de localisation");
    let localisationArray;
    try {
      localisationArray = JSON.parse(localisation);
    } catch (error) {
      throw new Error("La localisation n'a pas pu être converti en tableau de nombre");
    }
    if (!Array.isArray(localisationArray)) throw new Error("La localisation n'est pas un tableau");
    if (localisationArray.length !== 2) throw new Error("La tableau localisation doit avoir deux données");
    if (typeof localisationArray[0] !== "number" || typeof localisationArray[1] !== "number") throw new Error("Les deux coordonnées doivent être des nombres");
    if ((localisationArray[0] < -90 || localisationArray[0] > 90) || (localisationArray[1] < -180 && localisationArray[1] > 180)) throw new Error("Le première coordonnée doit être en -90 et 90 et la deuxième entre -180 et 180."); 
    
    return await Dresseur.find({
      localisation: { 
        $near:{ 
          $geometry: { 
            type: "Point",
            coordinates: localisationArray
          }
        }
      }
    })
    .where("en_ligne")
    .equals(true)
  } catch (error) {
    throw new Error(error);
  }
}

// function valideLocalisation(localisation) {
//   if (!localisation) throw new Error("Il n'y pas de localisation");
//   let localisationArray;
//   try {
//     localisationArray = JSON.parse(localisation);
//   } catch (error) {
//     throw new Error("La localisation n'a pas pu être converti en tableau");
//   }
//   if (!Array.isArray(localisationArray)) throw new Error("La localisation n'est pas un tableau");
//   if (localisationArray.length !== 2) throw new Error("La tableau localisation doit avoir deux données");
//   if (typeof localisationArray[0] !== "number" || typeof localisationArray[1] !== "number") throw new Error("Les deux coordonnées doivent être des nombres");
//   if ((localisationArray[0] < -90 || localisationArray[0] > 90) || (localisationArray[1] < -180 && localisationArray[1] > 180)) throw new Error("Le première coordonnée doit être en -90 et 90 et la deuxième entre -180 et 180."); 
//   return localisationArray;  
// }