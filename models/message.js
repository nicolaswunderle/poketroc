import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma message
const messageSchema = new Schema({
    contenu: {
        type: String,
        required: [true, "Le contenu du message est obligatoire."],
        maxlength: [255, "Le contenu du message doit être plus court ou égal à 255 caractères."],
        trim: true
    },
    dresseur_id: {
        type: Schema.Types.ObjectId,
        ref: 'Dresseur',
        required: [true, "L'id du dresseur du message est obligatoire."]
    },
    echange_id: {
        type: Schema.Types.ObjectId,
        ref: 'Echange',
        required: [true, "L'id de l'échange du message est obligatoire."]
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
messageSchema.index({ createdAt: 1, dresseur_id: 1, echange_id: 1}, { unique: true });

messageSchema.set("toJSON", {
    transform: transformJsonDresseur
});
 
function transformJsonDresseur(doc, json, options) {
    delete json.updatedAt;
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('Message', messageSchema);