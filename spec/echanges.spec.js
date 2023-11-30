import supertest from "supertest"
import app from "../app.js"
import mongoose from "mongoose"
import { cleanUpDatabase } from "../spec/utils.js"

beforeEach(cleanUpDatabase);

// Créer un échange
describe('POST /api/echanges', () => {
  const echangeData = {
    etat: 'attente',
    dresseur_cree_id: '7fe91a9a41bc839033eedf0f',
    dresseur_concerne_id: '7fe91a9a41bc839033eedf1f',
    createdAt: '2020-01-02T10:00:00.000Z',
  };

  it('should create an exchange successfully', async () => {
    const response = await supertest(app)
      .post('/api/echanges')
      .send(echangeData)
      .expect(201)
      .expect('Content-Type', /json/);

    const responseBody = response.body;

    // Assertions
    expect(responseBody).toBeObject();
    expect(responseBody).toContainAllKeys(['etat', 'dresseur_cree_id', 'dresseur_concerne_id', 'createdAt', '_id']);
    expect(responseBody._id).toMatch(/^[0-9a-f]{24}$/); // Assuming it's an ObjectID
    expect(responseBody.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    Object.keys(responseBody).forEach((key) => {
      if(key !== "_id") {
        expect(responseBody[key]).toEqual(echangeData[key]);
      }
    });
  });

});

afterAll(async () => {  
    await mongoose.disconnect(); 
});