import express from "express";
import { authenticate } from "./utils.js";

const router = express.Router();



router.post("/", authenticate, function (req, res, next) {
    // If we reach this function, the previous authentication middleware
    // has done its job, i.e. a valid JWT was in the Authorization header.
    const currentUserId = req.currentUserId;
    // Do what needs to be done...
    res.send("Salut "+currentUserId);
});



export default router;
