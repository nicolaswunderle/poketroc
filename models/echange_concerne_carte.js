import mongoose from 'mongoose';
// crée un schéma mongoose
const Schema = mongoose.Schema;

// crée le schéma echange_concerne_carte
const echConCarSchema = new Schema({
    carte_id: {
        type: Schema.Types.ObjectId,
        ref: 'Carte',
        required: [true, "L'id de la carte qui va être échangée est obligatoire."],
        immutable: [true, "L'id de la carte n'est pas modifiable."],
        validate: {
            validator: validateCarteInEchange,
            message: "Cette carte fait déjà parti d'un échange en attente."
        },
    },
    echange_id: {
        type: Schema.Types.ObjectId,
        ref: 'Echange',
        required: [true, "L'id de l'échange qui va concerner une ou plusieurs cartes est obligatoire."],
        immutable: [true, "L'id de l'échange n'est pas modifiable."]
    }
});

// Crée une contrainte d'unicité sur plusieurs champs
echConCarSchema.index({ carte_id: 1, echange_id: 1 }, { unique: true });

function validateCarteInEchange (value) {
    this.constructor.find()
        .exec()
        .then(respons => {
            return false
        });
}

echConCarSchema.set("toJSON", {
    transform: transformJson
});
 
function transformJson(doc, json, options) {
    delete json.__v;
    return json;
}

// Crée le model à partir du schéma et l'exporte
export default mongoose.model('EchangeConcerneCarte', echConCarSchema);