import Dresseur from "../models/dresseur.js"

export const cleanUpDatabase = async function() {
    await Promise.all([
        Dresseur.deleteMany()
    ]);
};