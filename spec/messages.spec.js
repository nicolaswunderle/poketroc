import supertest from "supertest"
import app from "../app.js"
import mongoose from "mongoose"
import { cleanUpDatabase } from "./utils.js"

beforeEach(cleanUpDatabase);

describe('POST /api/messages', () => {
  const messageData = {
    id: '7fe91a9a41bc839033eedf0f',
    date: '2020-01-02T10:00:00.000Z',
    contenu: 'Salut!',
    expéditeur: 'Nerak',
    destinataire: 'Salocin',
  };

  it('should create a message successfully', async () => {
    const response = await supertest(app)
      .post('/api/messages')
      .send(messageData)
      .expect(201)
      .expect('Content-Type', /json/);

    const responseBody = response.body;

    // Assertions
    expect(responseBody).toBeObject('object');
    expect(responseBody).toContainAllKeys('id', 'date', 'contenu', 'expéditeur', 'destinataire');
    expect(responseBody.id).toMatch(/^[0-9a-f]{24}$/); // Assuming it's an ObjectID
    expect(responseBody.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(responseBody).toEqual(messageData);
  });

  it('should handle the case where the resource is not found (404)', async () => {
    // Assuming your API returns a 404 response for resource not found
    const invalidMessageData = { /* Some invalid data */ };
    await supertest(app)
      .post('/api/messages')
      .send(invalidMessageData)
      .expect(404);
  });

  it('should handle the case of an unprocessable entity (422)', async () => {
    // Assuming your API returns a 422 response for an unprocessable entity
    const invalidRecipientData = { /* Some data that triggers a 422 error */ };
    await supertest(app)
      .post('/api/messages')
      .send(invalidRecipientData)
      .expect(422);
  });
});