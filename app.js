import express from "express";
import createError from "http-errors";
import logger from "morgan";
import mongoose from "mongoose";
import swaggerUi from 'swagger-ui-express';
import openApiDocument from './openapi.json' assert { type: "json" };
import { databaseUrl } from './config.js';
//Router
import indexRouter from "./routes/index.js";
import dresseursRouter from "./routes/dresseurs.js";
import thingsRouter from "./routes/things.js";

// Connect to the database (can be overriden from environment)
mongoose.connect(databaseUrl);

const app = express();


// Serve the Swagger UI documentation.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Log requests (except in test mode).
if (process.env.NODE_ENV !== 'test') { 
  app.use(logger('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", indexRouter);
app.use("/api/dresseurs", dresseursRouter);
app.use("/api/things", thingsRouter);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.use('/api/dresseurs', function (err, req, res, next) {
  if (err.code === 11000) {
    const rep = `Le dresseur avec le pseudo ${req.body.pseudo} existe déjà.`;
    res.status(409).send(rep);
  }
  if (err.code === 16755) {
    const rep = `Impossible d'extraire les clés géographiques et les sommets en double : ${req.body.localisation.coordinates[0]} et ${req.body.localisation.coordinates[1]}.`;
    res.status(422).send(rep);
  }
  // Si c'est une erreur de validation mongoose
  if (err.name === "ValidationError") {
    res.status(422).send(err.message);
  }
  res.send(err);
  next();
});

app.use('/api/messages', function (err, req, res, next) {
  if (err.code === 11000) {
    const rep = `Le destinataire et l'expediteur ne peuvent pas envoyer un message exactement à la même date.`;
    res.status(409).send(rep);
  }
  // Si c'est une erreur de validation mongoose
  if (err.name === "ValidationError") {
    res.status(422).send(err.message);
  }
  next();
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

export default app;
