import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";

beforeEach(cleanUpDatabase);

beforeEach(async function () {
  [nicolasWunderle] = await Promise.all([
    Dresseur.create({
      pseudo: "nicorhzuwr",
      mot_de_passe: "vivelaprog",
    }),
  ]);
});
/*
beforeEach(async () => {
  // Créez un dresseur directement dans le fichier de test
  const nicolasWunderle = await Dresseur.create({
    email: "nicolas.wunderle@gmail.com",
    password: "vivelaprog",
    // ... autres propriétés du dresseur
  });
*/
const response = await supertest(app).post("/api/dresseur/login").send({
  pseudo: "nicorhzuwr",
  mot_de_passe: "vivelaprog",
});

token = response.body.token;

let token;
let carteId;

describe("Tests des routes pour les cartes", () => {
  it("Devrait créer une nouvelle carte", async () => {
    const response = await supertest(app)
      .post("/api/carte")
      .send({
        id_api: "yourhb_id",
        etat: "neuve",
        desc_etat: "Description de l'état",
        type: "normale",
        statut: "collectee",
        quantite: 3,
        dresseur_id: "656776bf963e32e19a34787c",
      })
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(201);
    carteId = response.body._id;
  });

  // Test de création d'une carte
  it("Devrait créer une nouvelle carte", async () => {
    const response = await supertest(app)
      .post("/api/carte")
      .send({
        id_api: "yourpi_id",
        etat: "neuve",
        desc_etat: "Description de l'état",
        type: "normale",
        statut: "collectee",
        quantite: 3,
      })
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(201);
    carteId = response.body._id;
  });

  // Test d'affichage d'une carte
  it("Devrait afficher une carte spécifique", async () => {
    const response = await supertest(app)
      .get(`/api/carte/${carteId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("_id", carteId);
  });

  // Test de modification d'une carte
  it("Devrait modifier une carte existante", async () => {
    const response = await supertest(app)
      .patch(`/api/carte/${carteId}`)
      .send({})
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("_id", carteId);
  });

  // Test de suppression d'une carte
  it("Devrait supprimer une carte spécifique", async () => {
    const response = await supertest(app)
      .delete(`/api/carte/${carteId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(204);
  });

  // Test d'affichage de toutes les cartes
  it("Devrait afficher toutes les cartes", async () => {
    const response = await supertest(app)
      .get("/api/carte")
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});
