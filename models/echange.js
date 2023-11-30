import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma échange
const echangeSchema = new Schema({
    etat: {
        type: String,
        enum: {
            values: ['accepte', 'attente', 'refuse'],
            message: "L'état d'un échange doit être soit accepte, attente ou refuse."
        },
        default: 'attente',
        trim: true
    },
    dresseur_cree_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dresseur',
        required: [true, "L'id du dresseur qui crée l'échange est obligatoire."]
    },
    dresseur_concerne_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dresseur',
        default: null,
        validate: {
            validator: validateDresseurConcerneId,
            message: "dresseur_concerne_id ne peut pas avoir la même valeur que dresseur_cree_id"
        }
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
echangeSchema.index({dresseur_cree_id: 1, dresseur_concerne_id: 1 }, { unique: true });

// dresseur_concerne_id ne peut pas être identique à dresseur_cree_id
function validateDresseurConcerneId (value) {
    return this.dresseur_cree_id.toString() !== value.toString();
}

echangeSchema.set("toJSON", {
    transform: transformJsonDresseur
});
 
function transformJsonDresseur(doc, json, options) {
    delete json.updatedAt;
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('Echange', echangeSchema);