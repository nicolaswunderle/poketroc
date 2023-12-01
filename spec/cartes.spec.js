import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import Dresseur from "../models/dresseur.js";
import { cleanUpDatabase, generateValidJwt } from "./utils.js";

beforeEach(cleanUpDatabase);

let carteId;

describe("POST /api/cartes", () => {
  let johnDoe;
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
  });
  it("Devrait créer une nouvelle carte", async () => {
    const token = await generateValidJwt(johnDoe);
    const response = await supertest(app)
      .post("/api/cartes")
      .set("Authorization", `Bearer ${token}`)
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
      .expect("Content-Type", /json/);

    const body = response.body;
    expect(body).toBeObject();

    carteId = body._id;
  });

  it("Devrait pas créer une nouvelle carte", async () => {
    const response = await supertest(app)
      .post("/api/cartes")
      .send({
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
    const response = await supertest(app)
      .get(`/api/cartes/${carteId}`)
      // .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toHaveProperty("_id", carteId);
  });
  it("Devrait pas afficher une carte spécifique", async () => {
    const response = await supertest(app).get(`/api/cartes/${carteId}`);
    // .set("Authorization", `Bearer ${token}`);
    expect(404);
    expect("Content-Type", /json/);
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
