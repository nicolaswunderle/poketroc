import supertest from "supertest"
import app from "../app.js"
import mongoose from "mongoose"
import { cleanUpDatabase } from "./utils.js"
import Message from "../models/message.js"
import Echange from "../models/echange.js"
import message from "../models/message.js"

let message_id = "";
let dresseur_id = "";
let echange_id = "";
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
      const response = await supertest(app)
        .post('/api/messages')
        .set('Authorization', `Bearer YOUR_AUTH_TOKEN`)
        .send(messageData)
        .expect(201)
        .expect('Content-Type', /json/);
  
      const responseBody = response.body;
      message_id = responseBody._id;
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

       
  });
      it('should handle the case of an unprocessable entity (422)', async () => {
        // Assuming your API returns a 422 response for an unprocessable entity
        const invalidRecipientData = '';
        await supertest(app)
          .post('/api/messages')
          .send(invalidRecipientData)
          .expect(422);
      });
     

});

// Supprimer un message
describe('DELETE /api/messages/{messageId}', () => {
  it('should delete a message successfully', async () => {

    const message = await Message.findById(message_id);

    if(message){
      await supertest(app)
      .delete(`/api/messages/${message_id}`)
      .expect(204);

      expect(message).toBeNull();
    } else{
        const invalidRecipientData = `Le message avec l'id ${message_id} n'existe pas`;
        await supertest(app)
          .delete(`/api/messages/${message_id}`)
          .send(invalidRecipientData)
          .expect(404);
    }

  });

});

// Afficher une discution
describe('GET /messages/{echangeId}', () => {
    
    it('should retrieve the list of messages', async () => {
      
      const message = await Message.findById(message_id);

      if(message){
        createdMessageEchangeId = message.echange_id;
        if(createdMessageEchangeId === echange_id) {
          const response = supertest(app)
          .get(`api/message/${echange_id}`)
          .expect(201)
          .expect('Content-Type', /json/);
          const responseBody = response.body;
          expect(responseBody).toBeArray();
          responseBody.forEach(el => {
            expect(el).toContainAllKeys(['createdAt', 'contenu', 'dresseur_id', 'echange_id', '_id']);
            expect(el._id).toMatch(/^[0-9a-f]{24}$/); // Assuming it's an ObjectID
            expect(el.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
          });
        }
      }     
    });
});

afterAll(async () => {  
  await mongoose.disconnect(); 
});
