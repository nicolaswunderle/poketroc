import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma message
const messageSchema = new Schema({
    date: {
        type: Date,
        required: [true, "Le date du message est obligatoire."]
    },
    contenu: {
        type: String,
        required: [true, "Le contenu du message est obligatoire."]
    },
    dresseur_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dresseur',
        required: [true, "L'id du dresseur qui envoie le message est obligatoire."]
    },
    echange_id: {
        type: Schema.Types.ObjectId,
        ref: 'Echange',
        required: [true, "L'id de l'échange dans lequel a été envoyé le message est obligatoire."]
    }
});

// Crée une contrainte d'unicité sur plusieurs champs
messageSchema.index({ date: 1, dresseur_id: 1, echange_id: 1}, { unique: true });

messageSchema.set("toJSON", {
    transform: transformJsonDresseur
});
 
function transformJsonDresseur(doc, json, options) {
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('Message', messageSchema);