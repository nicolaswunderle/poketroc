import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import Dresseur from "../models/dresseur.js";
import { cleanUpDatabase, generateValidJwt } from "./utils.js";

let carteId;
let token;
let johnDoe;

beforeEach(cleanUpDatabase);
//test création cartes
describe("POST /api/cartes", () => {
  beforeEach(async function () {
    johnDoe = await Dresseur.create({
      prenom: "John",
      nom: "Doe",
      pseudo: "Jo",
      email: "john.doe@gmail.com",
      age: 24,
      localisation: {
        type: "Point",
        coordinates: [-74, 7],
      },
      mot_de_passe: "johdoe",
    });

    token = await generateValidJwt(johnDoe);
  });

  it("Devrait créer une nouvelle carte", async () => {
    const response = await supertest(app)
      .post("/api/cartes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        id_api: "yourpi_id",
        etat: "neuve",
        desc_etat: "Description de l'état",
        type: "normale",
        statut: "collectee",
        quantite: 3,
      })
      .expect(201)
      .expect("Content-Type", /json/);
    //.set("Authorization", `Bearer ${token}`);
    carteId = response.body._id;
  });

  it("Devrait pas créer une nouvelle carte", async () => {
    const response = await supertest(app)
      .post("/api/cartes")
      .send({
        etat: "neuve",
        desc_etat: "Description de l'état",
        type: "normale",
        statut: "collectee",
        quantite: 3,
      })
      .expect(422)
      .expect("Content-Type", "text/plain");
    //.set("Authorization", `Bearer ${token}`);
    carteId = response.body._id;
  });
});

// Test d'affichage d'une carte
describe("GET /api/cartes/:carteId", function () {
  it("Devrait afficher une carte spécifique", async () => {
    const response = await supertest(app).get(`/api/cartes/${carteId}`);
    // .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200).expect("Content-Type", /json/);
    expect(response.body).toHaveProperty("_id", carteId);
  });
  it("Devrait pas afficher une carte spécifique", async () => {
    const response = await supertest(app).get(`/api/cartes/${carteId}`);
    // .set("Authorization", `Bearer ${token}`);
    expect(404);
    expect("Content-Type", "text/plain");
  });
});
// Test de modification d'une carte
describe("PATCH /api/cartes/:carteId", function () {
  it("Devrait modifier une carte existante", async () => {
    const response = await supertest(app)
      .patch(`/api/cartes/:carteId/${carteId}`)
      .send({});
    // .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200).expect("Content-Type", /json/);
    //expect erreurs
    expect(response.body).toHaveProperty("_id", carteId);
  });
  it("Devrait pas modifier une carte existante", async () => {
    const response = await supertest(app)
      .patch(`/api/cartes/:carteId/${carteId}`)
      .send({});
    // .set("Authorization", `Bearer ${token}`);
    expect(404);
    expect("Content-Type", "text/plain");
  });
  it("Devrait pas modifier une carte existante", async () => {
    const response = await supertest(app)
      .patch(`/api/cartes/:carteId/${carteId}`)
      .send({});
    // .set("Authorization", `Bearer ${token}`);
    expect(422);
    expect("Content-Type", "text/plain");
  });
});
// Test de suppression d'une carte
describe("DELETE /api/cartes/:carteId", function () {
  it("Devrait supprimer une carte spécifique", async () => {
    const response = await supertest(app).delete(
      `/api/cartes/:carteId/${carteId}`
    );
    //.set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(204);
  });
  it("Devrait pas supprimer une carte spécifique", async () => {
    const response = await supertest(app).delete(
      `/api/cartes/:carteId/${carteId}`
    );
    //.set("Authorization", `Bearer ${token}`);
    expect(404);
    expect("Content-Type", "text/plain");
  });
});
// Test d'affichage de toutes les cartes
describe("GET /api/cartes/:{dresseurId}?statut={collectee, souhaitee}&page={number}&pageSize={number}", function () {
  it("Devrait afficher toutes les cartes", async () => {
    const response = await supertest(app).get("/api/cartes/:{dresseurId}");
    //.set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200).expect("Content-Type", /json/);
  });
  it("Devrait pas afficher toutes les cartes", async () => {
    const response = await supertest(app).get("/api/cartes/:{dresseurId}");
    //.set("Authorization", `Bearer ${token}`);
    expect(404);
    expect("Content-Type", "text/plain");
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});
