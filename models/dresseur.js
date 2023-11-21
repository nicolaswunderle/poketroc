import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma dresseur
const dresseurSchema = new Schema({
    prenom: {
        type: String,
        required: [true, "Le prénom du dresseur est obligatoire."],
        maxlength: [30, "Le prénom ne doit pas dépasser 30 caractères."]
    },
    nom: {
        type: String,
        required: [true, "Le nom du dresseur est obligatoire."],
        maxlength: [30, "Le nom ne doit pas dépasser 30 caractères."]
    },
    pseudo: {
        type: String,
        required: [true, "Le pseudo du dresseur est obligatoire."],
        minlength: [3, "Le pseudo ne doit être plus court que 3 caractères."],
        maxlength: [50, "Le pseudo ne doit pas dépasser 50 caractères."],
        unique: true
    },
    email: {
        type: String,
        required: [true, "L'email du dresseur est obligatoire."],
        lowercase: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Entrer une adresse email valide.']
    },
    age: {
        type: Number,
        required: [true, "L'âge du dresseur est obligatoire."],
        min: [1, "On ne peut pas avoir moins de 1 année."]
    },
    ville: {
        type: String,
        required: [true, "La ville du dresseur est obligatoire."],
        maxlength: [40, "La ville ne doit pas dépasser 40 caractères."]
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