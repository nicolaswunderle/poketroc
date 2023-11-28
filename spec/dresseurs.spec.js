import supertest from "supertest"
import app from "../app.js"
import mongoose from "mongoose"
import { cleanUpDatabase } from "./utils.js"

beforeEach(cleanUpDatabase);

test('POST /api/dresseurs', async () => {
    const donnees = {
        prenom: "Nicolas",
        nom: "Wunderle",
        pseudo: "nico",
        email: "nicolas.wunderle@gmail.com",
        age: 24,
        ville: "Apples",
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
    expect(body).toContainAllKeys(['_id', 'prenom', 'nom', 'pseudo', 'email', 'age', 'ville', 'url_image_profil', 'en_ligne', 'deck_visible']);
    expect(body._id).toMatch(/^[0-9a-f]{24}$/);
    Object.keys(body).forEach((cle) => {
        if (cle !== "mot_de_passe" && cle !== "_id") {
            expect(body[cle]).toEqual(donneesAttendues[cle]);
        }
    });
    
});

/*describe('GET /dresseurs', function() {
    let johnDoe;
    let janeDoe;
    
    beforeEach(async function() {
        // Create 2 users before retrieving the list.  
        [ johnDoe, janeDoe ] = await Promise.all([
            User.create({ name: 'John Doe', password: '1233' }),
            User.create({ name: 'Jane Doe', password: '1233' })
        ]);
    });
    it('should retrieve the list of users', async function() {  
        const res = await supertest(app)
            .get('/users')
            .expect(200)
            .expect('Content-Type', /json/);

            expect(res.body).toBeArray();
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toBeObject();
            expect(res.body[0]._id).toEqual(janeDoe.id);
            expect(res.body[0].name).toEqual('Jane Doe');
            expect(res.body[0].name).toEqual('1233');
            expect(res.body[0]).toContainAllKeys(['_id', '__v', 'name', 'password']);
            expect(res.body[1]).toBeObject();
            expect(res.body[1]._id).toEqual(johnDoe.id);
            expect(res.body[1].name).toEqual('John Doe');
            expect(res.body[1].name).toEqual('1233');
            expect(res.body[1]).toContainAllKeys(['_id', '__v', 'name', 'password']); 
    });
});*/


afterAll(async () => {  
    await mongoose.disconnect(); 
});