import express from "express";
import createError from "http-errors";
import logger from "morgan";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import yaml from "js-yaml";
import { databaseUrl } from "./config.js";
//Router
import indexRouter from "./routes/index.js";
import dresseursRouter from "./routes/dresseurs.js";
import cartesRouter from "./routes/cartes.js";
import messagesRouter from "./routes/messages.js";
import echangesRouter from "./routes/echanges.js";

// Connect to the database (can be overriden from environment)
mongoose.connect(databaseUrl);

const app = express();

// Parse the OpenAPI document.
const openApiDocument = yaml.load(fs.readFileSync("./openapi.yml"));
// Serve the Swagger UI documentation.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Log requests (except in test mode).
if (process.env.NODE_ENV !== "test") {
  app.use(logger("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", indexRouter);
app.use("/api/dresseurs", dresseursRouter);
app.use("/api/cartes", cartesRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/echanges", echangesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.use("/api", function (err, req, res, next) {
  // Log the error on stderr
  //console.warn(err);

  // Respond with 422 Unprocessable Entity if it's a Mongoose validation error
  if (err.name == "ValidationError" && !err.status) {
    err.status = 422;
  }

  // lors d'une erreur 11000 de mongoose
  if (err.code === 11000) {
    err.status = 409;
    switch (req.path) {
      case "/dresseurs":
        err.message = `Le dresseur avec le pseudo ${req.body.pseudo} existe déjà.`;
        break;
      case "/messages":
        err.message = `Deux messages ne peuvent pas avoir la même valeur pour les champs createdAt, dresseur_id et echange_id`;
        break;
      case "/cartes":
        err.message = `Deux cartes ne peuvent pas avoir la même valeur pour les champs id_api, etat, desc_etat, type et dresseur_id.`;
        break;
      case "/echanges":
        err.message = `Deux échanges ne peuvent pas avoir la même valeur pour les champs createdAt, dresseur_cree_id et dresseur_concerne_id`;
        break;
    }
  }

  // lors d'une erreur 11000 de mongoose
  if (err.code === 16755) {
    err.status = 422;
    err.message = `Impossible d'extraire les clés géographiques et les sommets en double : ${req.body.localisation.coordinates[0]} et ${req.body.localisation.coordinates[1]}.`;
  }

  // Set the response status code
  res.status(err.status || 500);

  // Send the error message in the response
  const response = {
    message: err.message,
  };

  // If it's a validation error, also send the errors details from Mongoose
  if (err.status == 422) {
    response.errors = err.errors;
  }

  // Send the error response
  res.send(response.message);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});

//Configurer les websockets
const http = require("http");
const socketIO = require("socket.io");

const server = http.createServer(app);
const io = socketIO(server);



io.on("connection", (socket) => {
  console.log("Nouvelle connexion WebSocket");
  // Gérer les évenements
  socket.on("example-event", (data) =>{
   console.log("Reçu depuis le client : ",data);
   // Envoyer une réponse au client   
    socket.emit("example-event", "Données à envoyer au serveur");
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;
