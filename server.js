/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./movies');
var Reviews = require('./reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    .post(authJwtController.isAuthenticated, function (req, res) {
            if(!req.body.Title || !req.body.Year || !req.body.Genre || !req.body.Actors) {
                res.json({success: false, message: "Include a Title, Year, Genre, and at least 3 Actors"});
            }
            else {
            if(req.body.Actors.length <3){
                res.json({success: false, message: "Please include at least 3 actors"})
            }
            else{
                var mov = new Movie();
                mov.Title = req.body.Title;
                mov.Year = req.body.Year;
                mov.Genre = req.body.Genre;
                mov.Actors = req.body.Actors;
                mov.imageUrl = req.body.imageUrl;
                mov.save(function(err){
                    if(err){
                        if (err.code == 11000)
                            return res.json({success: false, message: "Movie already exists"});
                        else
                            return res.send(err);
                    }
                    res.json({message: "Movie is created"});
                });
            }}
    })

    .put(authJwtController.isAuthenticated, function (req, res) {
        if(!req.body.Title)
        {
            res.json({success: false, message: "Enter a movie to update please"});
        }
        else
        {
            if(req.body.newTitle){
                Movie.findOneAndUpdate({Title: req.body.Title}, {Title: req.body.newTitle}, function(err, mov){
                    if(err){
                        res.status(403).json({success:false, message: "Cannot update movie"});
                    }
                    else{
                        res.status(200).json({success:true, message:"Movie has been update"});
                    }
                });
            }
            if(req.body.newYear){
                Movie.findOneAndUpdate({Title: req.body.Title}, {Year: req.body.newYear}, function(err, mov) {
                    if(err) {
                        res.status(403).json({success:false, message: "Cannot update movie"});
                    }
                    else{
                        res.status(200).json({success:false, message: "Updated the movie year"});
                    }
                });
            }
            if(req.body.newGenre){
                Movie.findOneAndUpdate({TItle: req.body.Title}, {Genre: req.body.newGenre}, function(err, mov){
                    if(err){
                        res.status(403).json({success:false, message: "Cannot update movie"});
                    }
                    else{
                        res.status(200).json({success:true, message: "Genre has been updated"});
                    }
                });
            }
        }
    })

    .get(authJwtController.isAuthenticated, async (req, res) => {
            if (req.query && req.query.reviews && req.query.reviews === 'true') {
                if (err) throw err;
                if (!req.body.Title) {
                    Movie.aggregate([{
                        $match: {Title: req.body.Title}
                            },
                        {
                        $lookup: {
                            from: 'reviews',
                            localField: 'Title',
                            foreignField: 'Title',
                            as: 'reviews',
                        }
                    }]).exec(function (err, mov) {
                        if (err) {
                            return res.json(err);
                        } else {
                            return res.json({mov});
                        }
                    })
                } else {
                    Movie.findOne({Title: req.body.Title}).exec(function (err, movie) {
                        return res.json(movie);
                    })
                }
            }
            else {
             Movie.find({}, function(err, movies){
                 if(err){
                     res.send(err);
                 }
                 res.json({Movie:movies});
             })
        }
    })

    .delete(authJwtController.isAuthenticated, function(req, res) {
        if (!req.body.Title) {
            res.json({success: false, message: "Please Include a title"})
        }
        else{
            Movie.findOne({Title: req.body.Title}).exec(function(err,result){
                if(result != null){
                    Movie.remove({Title: req.body.Title}).exec(function(err){
                        if(err) {
                            res.json({success: false, message: "Couldn't find the title of the movie"});
                        }
                        else if(!Movie){
                            res.json({success:false, message: "Movie not found"});
                        }
                        else {
                            res.json({success: true, message: "Movie Deleted"});
                        }
                    })
                }
            });
        }
    });

router.route('/reviews')
    .post(authJwtController.isAuthenticated, function (req, res) {
        if(!req.body.Title || !req.body.Name || !req.body.Review || !req.body.Ratings) {
            res.json({success: false, message: "Include, a Title, Name, Review, and Rating"});
        }
        else{
            Movie.findOne({Title: req.body.Title}, (err, mov) => {
                if(!mov) {
                    return res.status(403).json({success: false, message: "Unable to find movie"})
                }
                else {
                    var review = new Reviews();
                    review.Title = req.body.Title;
                    review.Name = req.body.Name;
                    review.Ratings = req.body.Ratings;
                    review.Review = req.body.Review;
                    review.save(function (err) {
                        if (err) {
                            if (err.code == 11000)
                                return res.json({success: false, message: "Review already exists"});
                            else
                                return res.send(err);
                        }
                        res.json({message: "Review is created"});
                    });
                }
            })
        }
    })
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try{
            if(!req.body.Title){
                res.status(400).json({success:false, msg: "Please Insert a Title"});
            }
            const reviews = await Reviews.find()
            if (!reviews) {
                return res.json(500).json("No review for ${movie}");
            }
            res.status(200).json({success: true, Review: reviews});
        }
        catch(error){
            if (error.message){
                res.status(400).json({success: false, msg: 'Issue with Database/Unable to read database'});
                console.log(error.message);
            }
            else{
                res.status(400).json({success: false, msg: error});
            }
        }
    });
app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


