import Dresseur from "../models/dresseur.js"
import Message from "../models/message.js"

export const cleanUpDatabase = async function() {
    await Promise.all([
        Dresseur.deleteMany(),
        Message.deleteMany()
    ]);
};