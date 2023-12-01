
import supertest from "supertest"
import app from "../app.js"
import mongoose from "mongoose"
import supertest from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import { cleanUpDatabase, generateValidJwt } from "./utils.js"

let dresseur_id = "";
let pseudo = "";
let mdp = "";
let loca = [];
let token;
let dresseur;
let enLigne;

beforeEach(cleanUpDatabase);

// Créer un dresseur
test("POST /api/dresseurs", async () => {
  const donnees = {
    prenom: "Nicolas",
    nom: "Wunderle",
    pseudo: "nico",
    email: "nicolas.wunderle@gmail.com",
    age: 24,
    localisation: { type: "Point", coordinates: [-73.97, 40.77] },
    mot_de_passe: "nicowun",
  };
  const donneesAttendues = {
    ...donnees,
    url_image_profil: "asset/image_profil_defaut.jpeg",
    en_ligne: false,
    deck_visible: true,
  };

  const res = await supertest(app)
    .post("/api/dresseurs")
    .send(donnees)
    .expect(201)
    .expect('Content-Type', /json/);
    // Check that the response body is a JSON object with exactly the properties we expect with jest-extended    
    const body = res.body;
    token = await generateValidJwt(body);
    dresseur_id = body._id;
    pseudo = body.pseudo;
    mdp = body.mot_de_passe;
    loca = body.localisation.coordinates;
    dresseur = body;
    enLigne = body.en_ligne;

    expect(body).toBeObject();
    expect(body).toContainAllKeys(['_id', 'prenom', 'nom', 'pseudo', 'email', 'age', 'localisation', 'url_image_profil', 'en_ligne', 'deck_visible']);
    expect(body._id).toMatch(/^[0-9a-f]{24}$/);
    expect(body.age).toBeNumber();
    expect(body.localisation).toBeObject();
    expect(body.localisation).toContainAllKeys(['type', 'coordinates']);
    expect(body.localisation.coordinates).toBeArray();
    expect(body.localisation.coordinates[0]).toBeNumber();
    expect(body.localisation.coordinates[1]).toBeNumber();
    expect(body.en_ligne).toBeBoolean();
    expect(body.deck_visible).toBeBoolean();
    Object.keys(body).forEach((cle) => {
        if (cle !== "mot_de_passe" && cle !== "_id") {
            expect(body[cle]).toEqual(donneesAttendues[cle]);
        }
    });
});

// Déconnexion
describe('DELETE /api/dresseurs/connexion', () => {
    it('should desconnect the user', async () => {
        if(dresseur && enLigne){
            if(enLigne=true){
                await supertest(app)
                .delete('/api/dresseurs/connexion')
                .expect(204);
                enLigne = false;
            } else{;
                await supertest(app)
                  .delete(`/api/dresseurs/connexion`)
                  .send(`Le dresseur n'a pas pu être décconecté`)
                  .expect(400);
            }
        }
    });
});

// Connexion
describe('POST /dresseurs/connexion', function() {
    it('should connect the user to her count', async function(){
        if(pseudo){
            if(mdp){
                await supertest(app)
                .post(`/api/dresseurs/connexion`)
                .send(`Connexion au compte ${dresseur_id} réussie`)
                .expect(201)
                token = await generateValidJwt(body);
                enLigne=true;
            }
        }else{
            await supertest(app)
            .get(`/api/dresseurs/connexion`)
            .send(`Mots de passe ou pseudo incorrect, connexion échouée.`)
            .expect(401);
        } 
    });
});

// Afficher tous les dresseurs à proximité
describe('GET /dresseurs?localisation={coordonnéesGeographique}&page=}number}&pageSize={number}', function() {
    
    it('should retrieve the list of users', async function() {
        if(dresseur && loca){
            if(dresseur.localisation.coordinates = loca){
                await supertest(app)
                .get(`/api/dresseurs?localisation=${dresseur.localisation.coordinates[0]},${dresseur.localisation.coordinates[1]}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .expect('Content-Type', /json/);
                const body = dresseur.body;
                expect(body).toContainAllKeys(['_id', 'prenom', 'nom', 'pseudo', 'email', 'age', 'localisation', 'url_image_profil', 'en_ligne', 'deck_visible']);
                expect(body._id).toMatch(/^[0-9a-f]{24}$/);
                expect(body.age).toBeNumber();
                expect(body.localisation).toBeObject();
                expect(body.localisation).toContainAllKeys(['type', 'coordinates']);
                expect(body.localisation.coordinates).toBeArray();
                expect(body.localisation.coordinates[0]).toBeNumber();
                expect(body.localisation.coordinates[1]).toBeNumber();
                expect(body.en_ligne).toBeBoolean();
                expect(body.deck_visible).toBeBoolean();
            }else{
                await supertest(app)
                .get(`/api/dresseurs?localisation=${dresseur.localisation.coordinates[0]},${dresseur.localisation.coordinates[1]}`)
                .send(`Il manque les coordonnées de la localisation.`)
                .expect(400);
            }
            
        }
        
    });
});

// Afficher le dresseur
describe('GET /dresseurs/{dresseurId}', () => {
    it('should retrieve the user profil', async () => {
        if (dresseur){
            
            const response = await supertest(app)
            .get(`/api/dresseur/${dresseur_id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /json/);

            console.log(dresseur);
            const body = dresseur.body;
            expect(body).toBeObject();
            expect(body).toContainAllKeys(['_id','prenom', 'nom', 'pseudo', 'email', 'age', 'localisation', 'url_image_profil', 'en_ligne', 'deck_visible']);
            expect(body._id).toMatch(/^[0-9a-f]{24}$/);
            expect(body.age).toBeNumber();
            expect(body.localisation).toBeObject();
            expect(body.localisation).toContainAllKeys(['type', 'coordinates']);
            expect(body.localisation.coordinates).toBeArray();
            expect(body.localisation.coordinates[0]).toBeNumber();
            expect(body.localisation.coordinates[1]).toBeNumber();
            expect(body.deck_visible).toBeBoolean();
        }
    });
});

// Modifier un dresseur
describe('PATCH /dresseurs/{dresseurId}', () => {
    it('should update a dresseur successfully', async () => {
        let modification = false;
        if (dresseur){
            const updatedDresseurData = [{prenom: 'Jane'}];
            const response = await supertest(app)
              .patch(`/api/dresseurs/${dresseur._id}`)
              .set('Authorization', `Bearer ${token}`)
              .send(updatedDresseurData)
              .expect(200)
              .expect('Content-Type', /json/);

            Object.keys(updatedDresseurData).forEach((cle) => {
              if (dresseur[cle] !== updatedDresseurData[cle] && (cle !== "_id" || cle !== "__v" || cle !== "createdAt" || cle !== "updatedAt")) {
                // si la valeur n'est pas la même qu'avant alors on la change
                dresseur[cle] = updatedDresseurData[cle];
                if (!modification) modification = true;
              }
            });
            const body = response.body;
            // Assertions
            expect(body).toBeObject();
            expect(body).toContainAllKeys(['prenom', 'nom', 'pseudo', 'age', 'url_image_profil', 'deck_visible', 'mot_de_passe', 'updatedAt']);

            // Check specific fields
            expect(body).toBeObject();
            expect(body).toContainAllKeys(['_id', 'prenom', 'nom', 'pseudo', 'email', 'age', 'localisation', 'url_image_profil', 'en_ligne', 'deck_visible']);
            expect(body._id).toMatch(/^[0-9a-f]{24}$/);
            expect(body.age).toBeNumber();
            expect(body.localisation).toBeObject();
            expect(body.localisation).toContainAllKeys(['type', 'coordinates']);
            expect(body.localisation.coordinates).toBeArray();
            expect(body.localisation.coordinates[0]).toBeNumber();
            expect(body.localisation.coordinates[1]).toBeNumber();
            expect(body.en_ligne).toBeBoolean();
            expect(body.deck_visible).toBeBoolean();

            // Check if the password has been hashed
            expect(updatedDresseur.mot_de_passe).not.toEqual(updatedDresseurData.mot_de_passe);
            expect(body).toEqual();
            console.log(dresseur);
        } else {
            supertest(app)
              .patch(`/api/dresseurs/${dresseur_id}`)
              .send(`Le dresseur n'a pas été modifié car aucun changement n'a été détecté`)
              .expect(304);
        }
      });
      const body = response.body;
      // Assertions
      expect(body).toBeObject();
      expect(body).toContainAllKeys([
        "prenom",
        "nom",
        "pseudo",
        "age",
        "url_image_profil",
        "deck_visible",
        "mot_de_passe",
        "updatedAt",
      ]);

      // Check specific fields
      expect(body).toBeObject();
      expect(body).toContainAllKeys([
        "_id",
        "prenom",
        "nom",
        "pseudo",
        "email",
        "age",
        "localisation",
        "url_image_profil",
        "en_ligne",
        "deck_visible",
      ]);
      expect(body._id).toMatch(/^[0-9a-f]{24}$/);
      expect(body.age).toBeNumber();
      expect(body.localisation).toBeObject();
      expect(body.localisation).toContainAllKeys(["type", "coordinates"]);
      expect(body.localisation.coordinates).toBeArray();
      expect(body.localisation.coordinates[0]).toBeNumber();
      expect(body.localisation.coordinates[1]).toBeNumber();
      expect(body.en_ligne).toBeBoolean();
      expect(body.deck_visible).toBeBoolean();

      // Check if the password has been hashed
      expect(updatedDresseur.mot_de_passe).not.toEqual(
        updatedDresseurData.mot_de_passe
      );
      expect(body).toEqual();
    } else {
      // Assuming your API returns a 422 response for an unprocessable entity
      const invalidRecipientData = `Le dresseurId ${dresseur_id} n'a pas été trouvé, modification invalide.`;
      await supertest(app)
        .patch("/api/dresseurs/{dresseurId}")
        .send(invalidRecipientData)
        .expect(404);
    }
  });
});

// Supprimer
describe('DELETE /api/dresseurs/{dresseurId}', () => {
    it('should delete the user', async () => {
        
        if(dresseur){
            await supertest(app)
            .delete(`/api/dresseurs/${dresseur._id}`)
            .expect(204);
            expect(dresseur).toBeNull();
        } else{;
            await supertest(app)
              .delete(`/api/messages/${message_id}`)
              .send(`Le message avec l'id ${message_id} n'existe pas`)
              .expect(404);
        }
    });
});

afterAll(async () => {
  await mongoose.disconnect();
});
