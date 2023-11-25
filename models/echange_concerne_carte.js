import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma echange_concerne_carte
const echConCarSchema = new Schema({
    carte_id: {
        type: Schema.Types.ObjectId,
        ref: 'Carte',
        required: [true, "L'id de la carte qui va être échangée est obligatoire."]
    },
    echange_id: {
        type: Schema.Types.ObjectId,
        ref: 'Echange',
        required: [true, "L'id de l'échange qui va concerner une ou plusieurs cartes est obligatoire."]
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
echConCarSchema.index({ carte_id: 1, echange_id: 1 }, { unique: true });

echConCarSchema.set("toJSON", {
    transform: transformJsonDresseur
});
 
function transformJsonDresseur(doc, json, options) {
    delete json.createdAt;
    delete json.updatedAt;
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('EchangeConcerneCarte', echConCarSchema);