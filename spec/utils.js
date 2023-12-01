import jwt from "jsonwebtoken"
import { promisify } from "util";
import { jwtSecret } from "../config.js";
import Dresseur from "../models/dresseur.js";
import Message from "../models/message.js";
import Echange from "../models/echange.js";
import Carte from "../models/carte.js";

const signJwt = promisify(jwt.sign);

export const cleanUpDatabase = async function () {
  await Promise.all([
    Dresseur.deleteMany(),
    Message.deleteMany(),
    Echange.deleteMany(),
    Carte.deleteMany(),
  ]);
};

export function generateValidJwt(dresseur) {
  // Generate a valid JWT which expires in 7 days.
  const payload = { 
    sub: dresseur._id.toString(),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
  };
  return signJwt(payload, jwtSecret);
}