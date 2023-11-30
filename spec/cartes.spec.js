import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { cleanUpDatabase } from "./utils.js";

beforeEach(cleanUpDatabase);

describe("Tests des routes pour les cartes", () => {
  //créer un dresseur

  //se connecter en tant que dresseur
  let carteId; // Vous utiliserez cet ID dans les tests

  // Test de création d'une carte
  it("Devrait créer une nouvelle carte", async () => {
    const response = await supertest(app)
      .post("/api/carte")
      .send({
        // Vos données de carte ici
      })
      .set("Authorization", "Bearer VOTRE_JWT_TOKEN"); // Assurez-vous de remplacer VOTRE_JWT_TOKEN par un vrai token valide
    expect(response.statusCode).toBe(201);
    carteId = response.body._id; // Sauvegardez l'ID de la carte créée pour les tests ultérieurs
  });

  // Test d'affichage d'une carte
  it("Devrait afficher une carte spécifique", async () => {
    const response = await supertest(app)
      .get(`/api/carte/${carteId}`)
      .set("Authorization", "Bearer VOTRE_JWT_TOKEN");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("_id", carteId);
  });

  // Test de modification d'une carte
  it("Devrait modifier une carte existante", async () => {
    const response = await supertest(app)
      .patch(`/api/carte/${carteId}`)
      .send({
        // Vos données de mise à jour ici
      })
      .set("Authorization", "Bearer VOTRE_JWT_TOKEN");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("_id", carteId);
    // Ajoutez d'autres assertions en fonction de vos besoins
  });

  // Test de suppression d'une carte
  it("Devrait supprimer une carte spécifique", async () => {
    const response = await supertest(app)
      .delete(`/api/carte/${carteId}`)
      .set("Authorization", "Bearer VOTRE_JWT_TOKEN");
    expect(response.statusCode).toBe(204);
  });

  // Test d'affichage de toutes les cartes
  it("Devrait afficher toutes les cartes", async () => {
    const response = await supertest(app)
      .get("/api/carte")
      .set("Authorization", "Bearer VOTRE_JWT_TOKEN");
    expect(response.statusCode).toBe(200);
    // Ajoutez d'autres assertions en fonction de vos besoins
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});
