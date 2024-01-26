import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma carte
const carteSchema = new Schema({
    id_api: {
        type: String,
        required: [true, "L'identifiant API de la carte est obligatoire."],
        immutable: [true, "L'identifiant API de la carte ne peut pas être modifié."],
        trim: true
    },
    etat: {
        type: String,
        required: [true, "L'état de la carte est obligatoire."],
        enum: {
            values: ['neuve', 'excellente', 'très bonne', 'bonne', 'moyenne', 'mauvaise'],
            message: "L'état de la carte doit être soit neuve, excellente, très bonne, bonne, moyenne ou mauvaise."
        },
        trim: true
    },
    desc_etat: {
        type: String,
        maxlength: [255, "La description de l'état de la carte doit être plus courte ou égale à 255 caractères."],
        trim: true
    },
    type: {
        type: String,
        required: [true, "Le type de la carte est obligatoire."],
        enum: {
            values: ['normale', 'reverse', 'holo'],
            message: "Le type de la carte doit être soit normale, reverse ou holo."
        },
        trim: true
    },
    statut: {
        type: String,
        required: [true, "Le statut de la carte est obligatoire."],
        enum: {
            values: ['collectee', 'souhaitee'],
            message: "Le statut de la carte doit être soit collectee ou souhaitee."
        },
        trim: true
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
        default: Date.now,
        immutable: [true, "La date de création de la carte n'est pas modifiable."]
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Crée une contrainte d'unicité sur plusieurs champs
carteSchema.index({ id_api: 1, etat: 1, desc_etat: 1, type: 1, statut: 1, dresseur_id: 1 }, { unique: true });

carteSchema.set("toJSON", {
    transform: transformJson
});
 
function transformJson(doc, json, options) {
    delete json.createdAt;
    delete json.updatedAt;
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('Carte', carteSchema);