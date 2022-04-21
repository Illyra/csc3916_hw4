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

var reviewSchema = new Schema({
    Title: {type:String, required: true},
    Name: {type:String, required: true},
    Review: {type:String, required: true},
    Ratings: {type:Number, min: 0, max: 5, required:true}
})

module.exports = mongoose.model('reviews', reviewSchema);