import supertest from "supertest"
import app from "../app.js"
import mongoose from "mongoose"
import { cleanUpDatabase } from "../spec/utils.js"

beforeEach(cleanUpDatabase);

// Créer un échange
describe('POST /api/echanges', () => {
  const echangeData = {
    "etat": "attente",
    "dresseur_cree_id": "5f7c5e11b36b5ef7a0f9df78", 
    "dresseur_concerne_id": "5f7c5e11b36b5ef7a0f9df79", 
    "createdAt": "2023-11-28T12:00:00.000Z",
    "updatedAt": "2023-11-28T12:30:00.000Z" 
  };

  it('Echange créé', async () => {
    const response = await supertest(app)
      .post('/api/echanges')
      .set('Authorization', `Bearer YOUR_AUTH_TOKEN`)
      .send(echangeData)
      .expect(201)
      .expect('Content-Type', /json/);

    const responseBody = response.body;

    // Assertions
    expect(responseBody).toBeObject();
    expect(responseBody).toContainAllKeys(['etat', 'dresseur_cree_id', 'dresseur_concerne_id', 'createdAt', 'updatedAt', '_id']);
    expect(responseBody._id).toMatch(/^[0-9a-f]{24}$/);
    expect(responseBody.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    Object.keys(responseBody).forEach((key) => {
      if(key !== "_id") {
        expect(responseBody[key]).toEqual(echangeData[key]);
      }
    });
  });
  it("N'a pas pu être crée", async () => {
    await supertest(app)
      .post('/api/echanges')
      .send(`L'échange n'a pas pu être créé`)
      .expect(400);
  });

});

afterAll(async () => {  
    await mongoose.disconnect(); 
});