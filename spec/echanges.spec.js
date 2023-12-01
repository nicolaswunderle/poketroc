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

// Test modification d'un échange
describe("PATCH /api/echanges/:{echangeId}", () => {
  it("Devrait modifier un échange", async () => {
    const echange = await Echange.findById(echangeId);
    let modification = false;

    if (echange) {
      const updatedEchangeData = { etat: "attente" };
      const response = await supertest(app)
        .patch(`/api/echanges/${echange._id}`)
        .send(updatedEchangeData)
        .expect(200)
        .expect("Content-Type", /json/);

      Object.keys(updatedEchangeData).forEach((cle) => {
        if (
          echange[cle] !== updatedEchangeData[cle] &&
          ![
            "_id",
            "__v",
            "createdAt",
            "dresseur_cree_id",
            "dresseur_concerne_id",
          ].includes(cle)
        ) {
          modification = true;
        }
      });

      expect(modification).toBeTruthy();
    } else {
      await supertest(app)
        .patch(`/api/echanges/${echangeId}`)
        .send({ message: `L'échange ${echangeId} n'a pas été trouvé.` })
        .expect(422)
        .expect("Content-Type", /json/);
    }
  });
});

// Test supprimer un échange
describe("DELETE /api/echanges/:{echangeId}", () => {
  it("Devrait supprimer un échange", async () => {
    const response = await supertest(app)
      .delete(`/api/echanges/${echangeId}`)
      .expect(204);
  });

  it("Devrait pas supprimer un échange", async () => {
    const response = await supertest(app)
      .delete(`/api/echanges/${echangeId}`)
      .expect(404)
      .expect("Content-Type", /json/);
  });
});

// Test d'affichage des échanges du dresseur en fonction de l'état
describe("GET /api/echanges/:{dresseurId}", function () {
  it("Devrait afficher les échanges du dresseur en fonction de l'état", async () => {
    const response = await supertest(app).get("/api/echanges/:{dresseurId}");
    //.set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
  });
  it("Devrait retourner une erreur 404 si le dresseur n'existe pas", async () => {
    const response = await supertest(app).get("/api/echanges/:{dresseurId}");
    //.set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(404);
    expect(response.headers["content-type"]).toMatch(/json/);
  });
});
afterAll(async () => {
  await mongoose.disconnect();
});
