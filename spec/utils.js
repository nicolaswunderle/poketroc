import Dresseur from "../models/dresseur.js";
import Message from "../models/message.js";
import Echange from "../models/echange.js";
import Carte from "../models/carte.js";

export const cleanUpDatabase = async function () {
  await Promise.all([
    Dresseur.deleteMany(),
    Message.deleteMany(),
    Echange.deleteMany(),
    Carte.deleteMany(),
  ]);
};
