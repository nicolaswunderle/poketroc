import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma dresseur
const dresseurSchema = new Schema({
    prenom: {
        type: String,
        required: [true, "Le prénom du dresseur est obligatoire."],
        minlength: [1, "Le prénom du dresseur doit être plus long que 1 caractère."],
        maxlength: [40, "Le prénom du dresseur doit être plus court que 40 caractères."]
    },
    nom: {
        type: String,
        required: [true, "Le nom du dresseur est obligatoire."],
        minlength: [1, "Le nom du dresseur doit être plus long que 1 caractère."],
        maxlength: [40, "Le nom du dresseur doit être plus court que 40 caractères."]
    },
    pseudo: {
        type: String,
        required: [true, "Le pseudo du dresseur est obligatoire."],
        minlength: [1, "Le pseudo du dresseur doit être plus long que 1 caractère."],
        maxlength: [40, "Le pseudo du dresseur doit être plus court que 40 caractères."],
        unique: [true, "Le pseudo du dresseur existe déjà."]
    },
    email: {
        type: String,
        required: [true, "L'adresse email du dresseur est obligatoire."],
        lowercase: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "L'adresse email du dresseur n'est pas valide."]
    },
    age: {
        type: Number,
        required: [true, "L'âge du dresseur est obligatoire."],
        min: [1, "L'âge du dresseur doit être plus grand que 1."],
        max: [200, "L'âge du dresseur doit être plus petit que 200."]
    },
    ville: {
        type: String,
        required: [true, "La ville du dresseur est obligatoire."],
        minlength: [1, "La ville du dresseur doit être plus longue que 1 caractère."],
        maxlength: [60, "La ville du dresseur doit être plus courte que 60 caractères."]
    },
    url_image_profil: {
        type: String,
        default: 'asset/image_profil_defaut.jpeg'
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


dresseurSchema.set("toJSON", {
    transform: transformJsonDresseur
});
 
function transformJsonDresseur(doc, json, options) {
    // Enlève le mot de passe hashé lorsqu'on génère le JSON
    delete json.mot_de_passe;
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('Dresseur', dresseurSchema);