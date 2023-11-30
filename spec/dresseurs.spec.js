import supertest from "supertest"
import app from "../app.js"
import mongoose from "mongoose"
import { cleanUpDatabase } from "./utils.js"
import Dresseur from "../models/dresseur.js";

beforeEach(cleanUpDatabase);

test('POST /api/dresseurs', async () => {
    const donnees = {
        prenom: "Nicolas",
        nom: "Wunderle",
        pseudo: "nico",
        email: "nicolas.wunderle@gmail.com",
        age: 24,
        localisation: { type: 'Point', coordinates: [ -73.97, 40.77 ] },
        mot_de_passe: "nicowun"
    }
    const donneesAttendues = {
        ...donnees,
        url_image_profil: 'asset/image_profil_defaut.jpeg',
        en_ligne: false,
        deck_visible: true,
    }

    const res = await supertest(app)
    .post('/api/dresseurs')
    .send(donnees)
    .expect(201)
    .expect('Content-Type', /json/);
    // Check that the response body is a JSON object with exactly the properties we expect with jest-extended    
    const body = res.body;
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

// Afficher tous les dresseurs à proximité
//describe('GET /dresseurs?localisation={coordonnéesGeographique}&page=}number}&pageSize={number}', function() {
//    /**const dresseurs = [
//        {
//            "prenom": "John",
//            "nom": "Doe",
//            "pseudo": "john_doe",
//            "email": "john.doe@example.com",
//            "age": 25,
//            "localisation": {
//              "type": "Point",
//              "coordinates": [45.123456, -75.654321]
//            },
//            "url_image_profil": "path/vers/image.jpg",
//            "mot_de_passe": "mot_de_passe_securise"
//        },
//        {
//          "prenom": "John",
//          "nom": "Doe",
//          "pseudo": "john_doe",
//          "email": "john.doe@example.com",
//          "age": 26,  // Nouvelle valeur pour l'âge
//          "localisation": {
//            "type": "Point",
//            "coordinates": [45.123456, -75.654321]
//          },
//          "url_image_profil": "path/vers/nouvelle_image.jpg",
//          "mot_de_passe": "mot_de_passe_securise2",
//          "en_ligne": true,  // Nouvelle valeur pour l'état en ligne
//          "deck_visible": false  // Nouvelle valeur pour la visibilité du deck
//        } 
//    ]*/
//    //const thisDresseur = {"prenom": "John","nom": "Doe","pseudo": "john_doe","email": "john.doe@example.com","age": 35,"localisation": {"type": "Point","coordinates": [45.123456, -75.654321]},"url_image_profil": "path/vers/image.jpg","mot_de_passe": "mot_de_passe_securise"};
//
//    it('should retrieve the list of users', async function() { 
//        const dresseurs = await Dresseur.findOneAndDelete({});
//        const locaThisDresseur = dresseurs.localisation.coordinates;
//        dresseurs.forEach((dresseur) =>{
//            if(locaThisDresseur === dresseur.localisation.coordinates){
//                const res = supertest(app)
//                .get(`/api/dresseurs?localisation=${locaThisDresseur[0]},${locaThisDresseur[1]}`)
//                .expect(200)
//                .expect('Content-Type', /json/);
//                
//                const body = res.body;
//                expect(body).toBeObject();
//                expect(body).toContainAllKeys(['_id', 'prenom', 'nom', 'pseudo', 'email', 'age', 'localisation', 'url_image_profil', 'en_ligne', 'deck_visible']);
//                expect(body._id).toMatch(/^[0-9a-f]{24}$/);
//                expect(body.age).toBeNumber();
//                expect(body.localisation).toBeObject();
//                expect(body.localisation).toContainAllKeys(['type', 'coordinates']);
//                expect(body.localisation.coordinates).toBeArray();
//                expect(body.localisation.coordinates[0]).toBeNumber();
//                expect(body.localisation.coordinates[1]).toBeNumber();
//                expect(body.en_ligne).toBeBoolean();
//                expect(body.deck_visible).toBeBoolean();
//                
//            }
//        })
//    });
//});

// Afficher le dresseur
describe('GET /dresseurs/{dresseurId}', () => {
    it('should retrieve the user profil', async () => {
        const dresseur = await Dresseur.find({});
        if (dresseur.length>0){
            const response = supertest(app)
            .get(`api/dresseur/${dresseur[0]._id}`)
            .expect(201)
            .expect('Content-Type', /json/)

            const responseBody = response.body;
            expect(responseBody).toBeObject();
            expect(responseBody).toContainAllKeys(['_id', 'prenom', 'nom', 'pseudo', 'email', 'age', 'localisation', 'url_image_profil', 'en_ligne', 'deck_visible']);
            expect(body._id).toMatch(/^[0-9a-f]{24}$/);
            expect(body.age).toBeNumber();
            expect(body.localisation).toBeObject();
            expect(body.localisation).toContainAllKeys(['type', 'coordinates']);
            expect(body.localisation.coordinates).toBeArray();
            expect(body.localisation.coordinates[0]).toBeNumber();
            expect(body.localisation.coordinates[1]).toBeNumber();
            expect(body.en_ligne).toBeBoolean();
            expect(body.deck_visible).toBeBoolean();
        }
    })
})

// Modifier un dresseur
describe('PATCH /dresseurs/{dresseurId}', () => {

      it('should update a dresseur successfully', async () => {
        const dresseur = await Dresseur.find();
        const response = await supertest(app)
          .patch(`/api/dresseurs/${dresseur._id}`)
          .expect(401)
          .expect('Content-Type', /json/);

          const body = response.body;
          expect(body).toBeObject();
          expect(body).toContainAllKeys(['_id', 'prenom', 'nom', 'pseudo', 'email', 'age', 'url_image_profil', 'deck_visible']);
          expect(body._id).toMatch(/^[0-9a-f]{24}$/);
          expect(body.age).toBeNumber();
          expect(body.deck_visible).toBeBoolean();
      });


      // Ajoutez d'autres tests selon vos besoins

})

afterAll(async () => {  
    await mongoose.disconnect(); 
});