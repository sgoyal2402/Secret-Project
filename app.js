//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const url = "mongodb://localhost:27017/userDB";
const options = {
useNewUrlParser: true,
useUnifiedTopology: true
};

mongoose.connect(url, options);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:['password']});

const User = mongoose.model("User", userSchema);



const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const user = new User({
        email: req.body.username,
        password: req.body.password
    });
    user.save((err)=> {
        if(err)
        console.log(err);
        else
        res.render("secrets");
    });
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, (err, doc) => {
        if(err)
        console.log(err);
        else{
            if(doc && doc.password === password){
                res.render("secrets");
            }
        }
        
    });
});


app.listen(3000, () => {
    console.log("Server running successfully on port 3000");
    
});