import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma carte
const carteSchema = new Schema({
    id_api: {
        type: String,
        required: [true, "L'identifiant API de la carte est obligatoire."]
    },
    etat: {
        type: String,
        required: [true, "L'état de la carte est obligatoire."],
        enum: ['neuve', 'excellente', 'très bonne', 'bonne', 'moyenne', 'mauvaise']
    },
    desc_etat: {
        type: String,
        maxlength: [255, "La description de l'état de la carte doit être plus courte ou égale à 255 caractères."]
    },
    type: {
        type: String,
        required: [true, "Le type de la carte est obligatoire."],
        enum: ['normale', 'reverse', 'holo']
    },
    statut: {
        type: String,
        required: [true, "Le statut de la carte est obligatoire."],
        enum: ['collectee', 'souhaitee']
    },
    quantite: {
        type: Number,
        required: [true, "La quantité de la carte est obligatoire."],
        min: [1, "La quantité de la carte doit être plus grande ou égale à 1."],
        max: [1000, "La quantité de la carte doit être plus petite ou égale à 1000."],
    },
    dresseur_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dresseur',
        required: [true, "L'id du dresseur de la carte est obligatoire."]
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

// Crée une contrainte d'unicité sur plusieurs champs
carteSchema.index({ id_api: 1, etat: 1, desc_etat: 1, type: 1, dresseur_id: 1 }, { unique: true });

carteSchema.set("toJSON", {
    transform: transformJsonDresseur
});
 
function transformJsonDresseur(doc, json, options) {
    delete json.createdAt;
    delete json.updatedAt;
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('Carte', carteSchema);