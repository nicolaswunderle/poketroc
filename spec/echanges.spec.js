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
  it('Devrait créer un échange avec succès', async () => {
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
  it('Ne devrait pas créer un échange avec succès', async () => {
    const response = await supertest(app)
      .post('/api/echanges')
      .send(echangeData)
      .expect(422)
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

//Afficher tous les échanges proposés
// describe('GET /api/echanges/proposes', () => {
//   it('Devrait afficher tous les échanges proposés', async () => {
//     const response = await supertest(app)
//       .get('/api/echanges/proposes')
//       .expect(200)
//       .expect('Content-Type', /json/);
//     const responseBody = response.body;
//     // Assertions
//     expect(responseBody).toHaveLengthGreaterThan(0); 
//   });
//   it('Ne devrait pas afficher tous les échanges proposés', async () => {
//     const response = await supertest(app)
//       .get('/api/echanges/proposes')
//       .expect(404)
//       .expect('Content-Type', /json/);
//     const responseBody = response.body;
//     // Assertions
//     expect(responseBody).toHaveLengthGreaterThan(0);
//   }); 
// });

// Afficher un échange
describe('GET /api/echanges/{echangeId}', () => {
  it('Devrait afficher un échange spécifique', async () => {
    const response = await supertest(app)
      .get('/api/echanges/{echangeId}')
      .set('Authorization', 'Bearer ' ) // + le jeton utilisateur (token)
      .expect(200)
      .expect('Content-Type', /json/);
    const responseBody = response.body;
    // Assertions
    expect(responseBody).toHaveLengthGreaterThan(0); // on s'attend à ce qu'il y en ai plus qu un
  });
  it('Ne devrait pas afficher un échange spécifique', async () => {
    const response = await supertest(app)
      .get('/api/echanges/{echangeId}')
      .set('Authorization', 'Bearer ' ) // + le jeton utilisateur (token)
      .expect(404)
      .expect('Content-Type', /json/);
    const responseBody = response.body;
    // Assertions
    expect(responseBody).toHaveLength(0); 
  });
});

afterAll(async () => {  
    await mongoose.disconnect(); 
});