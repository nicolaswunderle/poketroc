import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma carte
const carteSchema = new Schema({
    id_api: {
        type: String,
        required: [true, "L'identifiant API de la carte est obligatoire."],
    },
    etat: {
        type: String,
        required: [true, "L'état de la carte est obligatoire."],
        enum: ['neuve', 'excellente', 'très bonne', 'bonne', 'moyenne', 'mauvaise']
    },
    desc_etat: {
        type: String,
        maxlength: [255, "La description de l'état ne doit pas dépasser 255 caractères."]
    },
    type: {
        type: String,
        required: [true, "Le type de la carte est obligatoire."],
        enum: ['normal', 'reverse', 'holo']
    },
    statut: {
        type: String,
        required: [true, "Le statut de la carte est obligatoire."],
        enum: ['collectée', 'souhaitée']
    },
    quantite: {
        type: Number,
        required: [true, "La quantité de la carte est obligatoire."],
        min: [1, "Si on possède la carte c'est qu'on en a au minimum 1."]
    },
    dresseur_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dresseur',
        required: [true, "L'id du dresseur qui possède la carte est obligatoire."]
    }
});

// Crée une contrainte d'unicité sur plusieurs champs
carteSchema.index({ id_api: 1, etat: 1, desc_etat: 1, type: 1, dresseur_id: 1 }, { unique: true });

carteSchema.set("toJSON", {
    transform: transformJsonDresseur
});
 
function transformJsonDresseur(doc, json, options) {
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('Carte', carteSchema);