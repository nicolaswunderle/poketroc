import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma échange
const echangeSchema = new Schema({
    date: {
        type: Date,
        required: [true, "Le date de l'échange est obligatoire."]
    },
    etat: {
        type: String,
        required: [true, "L'état de l'échange est obligatoire."],
        enum: ['accepté', 'attente', 'refusé']
    },
    dresseur_cree_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dresseur',
        required: [true, "L'id du dresseur qui crée l'échange est obligatoire."]
    },
    dresseur_accepte_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dresseur'
    }
});

// Crée une contrainte d'unicité sur plusieurs champs
echangeSchema.index({ date: 1, dresseur_cree_id: 1, dresseur_accepte_id: 1 }, { unique: true });

echangeSchema.set("toJSON", {
    transform: transformJsonDresseur
});
 
function transformJsonDresseur(doc, json, options) {
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('Echange', echangeSchema);