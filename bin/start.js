#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from "../app.js";
import createDebugger from "debug";
import http from "http";
import { createWebSocketServer } from '../messaging.js';
import { port } from "../config.js";


const debug = createDebugger('poketroc:server')
/**
 * Get port from environment and store in Express.
 */
app.set("port", port);

/**
 * Create HTTP & WebSocket servers.
 */

const server = http.createServer(app);
createWebSocketServer(server);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  debug(`Listening on port ${port}`);
}
