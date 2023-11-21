import jwt from "jsonwebtoken";
import { promisify } from "util";
import { jwtSecret } from "../config.js";

const verifyJwt = promisify(jwt.verify);

export function authenticate(req, res, next) {
  // Ensure the header is present.
  const authorization = req.get("Authorization");
  if (!authorization) {
    return res.status(401).send("Authorization header is missing");
  }
  // Check that the header has the correct format.
  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).send("Authorization header is not a bearer token");
  }
  // Extract and verify the JWT.
  const token = match[1];
  verifyJwt(token, jwtSecret).then(payload => {
    req.currentUserId = payload.sub;
    next(); // Pass the ID of the authenticated user to the next middleware.
  }).catch(() => {
    res.status(401).send("Your token is invalid or has expired");
  });
}