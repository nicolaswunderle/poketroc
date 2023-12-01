import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { cleanUpDatabase } from "../spec/utils.js";

beforeEach(cleanUpDatabase);

// Créer un échange
describe("POST /api/echanges", () => {
  const echangeData = {
    etat: "attente",
    dresseur_cree_id: "7fe91a9a41bc839033eedf0f",
    dresseur_concerne_id: "7fe91a9a41bc839033eedf1f",
    createdAt: "2020-01-02T10:00:00.000Z",
  };

  it("Devrait créer un échange", async () => {
    const response = await supertest(app)
      .post("/api/echanges")
      .send(echangeData)
      .expect(201)
      .expect("Content-Type", /json/);

    const responseBody = response.body;

    // Assertions
    expect(responseBody).toBeObject();
    expect(responseBody).toContainAllKeys([
      "etat",
      "dresseur_cree_id",
      "dresseur_concerne_id",
      "createdAt",
      "_id",
    ]);
    expect(responseBody._id).toMatch(/^[0-9a-f]{24}$/); // Assuming it's an ObjectID
    expect(responseBody.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
    Object.keys(responseBody).forEach((key) => {
      if (key !== "_id") {
        expect(responseBody[key]).toEqual(echangeData[key]);
      }
    });
  });
  it("Devrait pas créer un échange", async () => {
    const response = await supertest(app)
      .post("/api/échanges")
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

// Test d'affichage des échanges
describe("GET /api/cartes/:{dresseurId}", function () {
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
