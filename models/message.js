import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma message
const messageSchema = new Schema({
    date: {
        type: Date,
        required: [true, "La date du message est obligatoire."]
    },
    contenu: {
        type: String,
        required: [true, "Le contenu du message est obligatoire."],
        minlength: [1, "Le contenu du message doit être plus long que 1 caractère."],
        maxlength: [255, "Le contenu du message doit être plus court que 60 caractères."]
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