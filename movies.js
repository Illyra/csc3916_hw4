var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

try{
    mongoose.connect(process.env.DB, {useNewUrlParser: true}, () =>
        console.log("connected"));
}
catch(error){
    console.log("Couldn't connect");

}
mongoose.set('useCreateIndex', true);


var MovieSchema = new Schema({
    Title: {type:String, required: true},
    Year: {type:Date, required: true},
    Genre: {type: String, required: true, enum:["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Thriller", "Western"]},
    Actors: {type:[{ActorName:String, CharacterName: String}], required: true}
});

module.exports = mongoose.model('Movie', MovieSchema);