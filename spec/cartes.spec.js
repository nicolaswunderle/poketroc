import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import Dresseur from "../models/dresseur.js";
import { cleanUpDatabase, generateValidJwt } from "./utils.js";

let carteId;
let token;
let johnDoe;

beforeEach(cleanUpDatabase);

describe("POST /api/cartes", () => {
  beforeEach(async function() {
    johnDoe = await Dresseur.create({ 
      prenom: "John", 
      nom: "Doe", 
      pseudo: "Jo", 
      email: "john.doe@gmail.com", 
      age: 24, 
      localisation: { 
        type: "Point", 
        coordinates: [ -74 , 7 ] 
      }, 
      mot_de_passe: "johdoe"
    });

    token = await generateValidJwt(johnDoe);
  });

  it("Devrait créer une nouvelle carte", async () => {
    const response = await supertest(app)
      .post("/api/cartes")
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_api: "yourhb_id",
        etat: "neuve",
        desc_etat: "Description de l'état",
        type: "normale",
        statut: "collectee",
        quantite: 3,
        dresseur_id: johnDoe.id,
      })
      .expect(201)
      .expect('Content-Type', /json/);
      
    const body = response.body;
    expect(body).toBeObject();

    carteId = body._id;
  });

  // ... Autres tests

});

// ... Reste du code

afterAll(async () => {
  await mongoose.disconnect();
});
