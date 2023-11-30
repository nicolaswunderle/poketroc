import supertest from "supertest"
import app from "../app.js"
import mongoose from "mongoose"
import { cleanUpDatabase } from "./utils.js"
import Message from "../models/message.js"
import Echange from "../models/echange.js"
import { authenticate } from "../routes/utils.js"

beforeEach(cleanUpDatabase);

// Créer un message
describe('POST /api/messages', () => {
  const messageData = {
    createdAt: '2020-01-02T10:00:00.000Z',
    contenu: 'Salut!',
    dresseur_id: '7fe91a9a41bc839033eedf0f',
    echange_id: '7fe91a9a41bc839033eedf1f'
  };

  it('should create a message successfully', async () => {
    if (authenticate){
      const response = await supertest(app)
        .post('/api/messages')
        .set('Authorization', `Bearer YOUR_AUTH_TOKEN`)
        .send(messageData)
        .expect(201)
        .expect('Content-Type', /json/);
  
      const responseBody = response.body;
  
      // Assertions
      expect(responseBody).toBeObject();
      expect(responseBody).toContainAllKeys(['createdAt', 'contenu', 'dresseur_id', 'echange_id', '_id']);
      expect(responseBody._id).toMatch(/^[0-9a-f]{24}$/); // Assuming it's an ObjectID
      expect(responseBody.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      Object.keys(responseBody).forEach((key) => {
        if(key !== "_id") {
          expect(responseBody[key]).toEqual(messageData[key]);
        }
      });

    } else {
      it('should handle the case of an unprocessable entity (422)', async () => {
        // Assuming your API returns a 422 response for an unprocessable entity
        const invalidRecipientData = '{ /* Some data that triggers a 422 error */ }';
        await supertest(app)
          .post('/api/messages')
          .send(invalidRecipientData)
          .expect(422);
      });
    }
  });

});

// Supprimer un message
describe('DELETE /api/messages/{messageId}', () => {
  it('should delete a message successfully', async () => {

    const messages = await Message.find({});
    let createdMessageId;

    if(messages.length > 0){
      createdMessageId = messages[0]._id;

      const response = await supertest(app)
      .delete(`/api/messages/${createdMessageId}`)
      .expect(204);

      const deletedMessage = await Message.findById(createdMessageId);
      expect(deletedMessage).toBeNull();
    }

  });

});

// Afficher une discution
describe('GET /messages/{echangeId}', () => {
    
    it('should retrieve the list of messages', async () => {
      
      const messages = await Message.find({});
      const echange = await Echange.find({});

      if(messages.length > 0){
        createdMessageEchangeId = messages[0].echange_id;
        if(createdMessageEchangeId === echange._id) {
          const response = supertest(app)
          .get(`api/message/${echange._id}`)
          .expect(201)
          .expect('Content-Type', /json/);
          const responseBody = response.body;
          expect(responseBody).toBeArray();
          responseBody.forEach(message => {
            expect(message).toContainAllKeys(['createdAt', 'contenu', 'dresseur_id', 'echange_id', '_id']);
            expect(message._id).toMatch(/^[0-9a-f]{24}$/); // Assuming it's an ObjectID
            expect(message.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
          });
        }
      }     
    });
});

afterAll(async () => {  
  await mongoose.disconnect(); 
});
