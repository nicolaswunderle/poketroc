import createDebugger from "debug";

const debug = createDebugger("poketroc:config");

try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch {
  throw new Error("Le fichier .env n'existe pas.");
}

export const databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost/poketroc';
export const port = process.env.PORT || '3000';
export const jwtSecret = process.env.JWT_SECRET;
export const bcryptCostFactor = 10;

if (!jwtSecret) {
  throw new Error("La variable d'environemment $JWT_SECRET est requise.");
}

// Valide que le port est un nombre positif
if (process.env.PORT) {
  const parsedPort = parseInt(process.env.PORT, 10);
  if (!Number.isInteger(parsedPort)) {
    throw new Error("La variable d'environement $PORT doit être de type integer");
  } else if (parsedPort < 1 || parsedPort > 65535) {
    throw new Error("La variable d'environement $PORT doit être un numéro de port valide (1-65535).");
  }
}

debug(`Le facteur de Bcrypt est de ${bcryptCostFactor}`);