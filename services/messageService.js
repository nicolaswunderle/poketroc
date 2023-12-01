import Message from '../models/message.js';

export const getMessagesOfEchange = async (echangeId) => {
  try {
    return await Message.find({ echange_id: echangeId })
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des message de l’échange avec l'id ${echangeId}.`)
  }
}
