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
import loginRouter from "./routes/login.js";
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

app.use("/", indexRouter);
app.use("/dresseurs", dresseursRouter);
app.use("/login", loginRouter);
app.use("/things", thingsRouter);



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
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
