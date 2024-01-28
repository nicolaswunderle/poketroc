import Echange from '../models/echange.js';
import EchangeConcerneCarte from "../models/echange_concerne_carte.js";

export const getEchangesProposes = async () => {
  try {
    return await EchangeConcerneCarte.aggregate([
      {
        $lookup: {
          from: 'echanges',
          localField: 'echange_id',
          foreignField: '_id',
          as: 'echange'
        }
      },
      {
        // même s'il y a forcément qu'un échange ça permet de ne pas l'avoir dans un tableau
        $unwind: '$echange'
      },
      {
        $match: {
          'echange.dresseur_concerne_id': null
        }
      },
      {
        $lookup: {
          from: 'dresseurs',
          localField: 'echange.dresseur_cree_id',
          foreignField: '_id',
          as: 'dresseur'
        }
      },
      {
        $unwind: '$dresseur'
      },
      {
        $lookup: {
          from: 'cartes',
          localField: 'carte_id',
          foreignField: '_id',
          as: 'cartes'
        }
      },
      {
        $unwind: '$cartes'
      },
      {
        $group: {
          _id: '$echange._id',
          createdAt: { $first: '$echange.createdAt'},
          dresseur: { $first: '$dresseur' },
          cartes: { $push: '$cartes' }
        }
      },
      {
        $sort: {
          'createdAt': -1
        }
      }
    ]);
  } catch (error) {
    throw new Error(error)
  }
}