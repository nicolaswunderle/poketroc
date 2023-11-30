import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma dresseur
const dresseurSchema = new Schema({
    prenom: {
        type: String,
        required: [true, "Le prénom du dresseur est obligatoire."],
        maxlength: [40, "Le prénom du dresseur doit être plus court ou égal à 40 caractères."],
        trim: true
    },
    nom: {
        type: String,
        required: [true, "Le nom du dresseur est obligatoire."],
        maxlength: [40, "Le nom du dresseur doit être plus court ou égal à 40 caractères."],
        trim: true
    },
    pseudo: {
        type: String,
        required: [true, "Le pseudo du dresseur est obligatoire."],
        maxlength: [40, "Le pseudo du dresseur doit être plus court ou égal à 40 caractères."],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, "L'adresse email du dresseur est obligatoire."],
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "L'adresse email du dresseur n'est pas valide."],
        lowercase: true,
        trim: true
    },
    age: {
        type: Number,
        required: [true, "L'âge du dresseur est obligatoire."],
        min: [1, "L'âge du dresseur doit être plus grand ou égal à 1."],
        max: [200, "L'âge du dresseur doit être plus petit ou égal à 200."]
    },
    localisation: {
        type: {
            type: String,
            required: true,
            enum: {
                values: [ 'Point' ],
                message: "Le type de la localisation d'une carte ne peut être que Point"
            },
            trim: true
        },
        coordinates: {
            type: [ Number ],
            required: true,
            validate: {
                validator: validateGeoJsonCoordinates,
                message: "{VALUE} n'est pas un tableau de coordonnées de longitude/latitude valide."
            }
        }
    },
    url_image_profil: {
        type: String,
        default: 'asset/image_profil_defaut.jpeg',
        trim: true
    },
    en_ligne: {
        type: Boolean,
        default: false
    },
    deck_visible: {
        type: Boolean,
        default: true
    },
    mot_de_passe: {
        type: String,
        required: [true, "Le mot de passe du dresseur est obligatoire."],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create a geospatial index on the location property.
dresseurSchema.index({ localisation: '2dsphere' });


// Validate a GeoJSON coordinates array (longitude, latitude and optional altitude).
function validateGeoJsonCoordinates(value) {
    return Array.isArray(value) && value.length == 2 && isLatitude(value[0]) && isLongitude(value[1]);
}

function isLatitude(value) {
    return value >= -90 && value <= 90;
}

function isLongitude(value) {
    return value >= -180 && value <= 180;
}


dresseurSchema.set("toJSON", {
    transform: transformJsonDresseur
});
 
function transformJsonDresseur(doc, json, options) {
    // Enlève le mot de passe hashé lorsqu'on génère le JSON
    delete json.mot_de_passe;
    delete json.createdAt;
    delete json.updatedAt;
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('Dresseur', dresseurSchema);