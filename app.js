const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Weather = require('./weather.js');
const User = require('./user.js');
const Session = require('./session.js');
const ejs = require('ejs');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const saltRounds = 10;

//Create an instance of the express application
const app = express();


//Set up the view engines
app.set('views', './views');
app.set('view engine', 'ejs');


//Set up the static files location
app.use(express.static('./public/images/'));
app.use(express.static('./public/css/'));
app.use(express.static('public'));


//Set up body-parser to parse incoming request bodies
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());


//Connect to the MongoDb Database
const url=`mongodb+srv://toddnash:Summer2023@cluster0.ypw5ypl.mongodb.net/weather`;


//Set connection params
const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true
};


//Connect
mongoose.connect(url,connectionParams)
.then( () => {
    console.log('Connected to the database');
})
.catch((err) => {
 console.error(`Error connecting to the database. ${err}`);
}
);


//Route to display weather data
app.get('/weather', async (req, res) =>{
    try {
      const weatherData = await Weather.find();
    } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while retrieving weather data.');
    }
});

//Define route for weather tracker form
app.get('/weathertracker', (req, res) =>{
res.render('index.ejs');
});


//Route to post weather data
app.post('/weather', async (req, res) =>{
const weatherData = new Weather({
city: req.body.city,
temperature: req.body.temperature,
humidity: req.body.humidity,
});


//Save weather input data to database
try {
   await weatherData.save();
   res.redirect('/view'); 
} catch (error) {
    res.status(500).send('An error occurred while saving weather data.');
}
});


//Route to display all weather data in HTML by passing data variables
app.get('/view', async (req, res) =>{

    try {
        const weatherData = await Weather.find();
        res.render('view.ejs', { weatherData });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while retrieving weather data.');
    }
})



//Route to display all weather data in JSON
app.get('/api/all', async (req, res) =>{

    try {
        const weatherData = await Weather.find();
        res.json(weatherData);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while retrieving weather data.');
    }

});

//Create a new register endpoint and display view
app.get('/register', (req, res) =>{
res.render('register.ejs');
});

//Define a new schema with Joi
const schema = Joi.object({
    email: Joi.string().email().required(),
    age: Joi.number().min(18).required(),
    password: Joi.string().min(8).required()
});


//Create a new user
//To-Do:  Create logic to stop users with existing emails to create another account
app.post('/register', (req, res) =>{

const {error, value} = schema.validate(req.body);

bcrypt.hash(req.body.password, saltRounds, function(err, hash){


const user = new User({
    email: req.body.email,
    age: req.body.age,
    password: hash,
});

user.save();

res.redirect('/login');

});
});


//Create a new login route
app.get('/login', (req, res) =>{
res.render('login.ejs');
});



//Post route for password & username submission
app.post('/login', async (req, res) =>{

const { email, password } = req.body;

const user = await User.findOne({ email });

if(!user){
    res.status(401).send({error: 'Invalid Credentials.'});
}

const isMatch = await bcrypt.compare(password, user.password);

if(!isMatch){
    res.status(401).send({error:'Invalid Credentials.'})
}

const token = jwt.sign({ userId: user._id}, 'secret_key');

const session = new Session({
    session_id: req.body.sessionId,
});

session.save();

res.render('index.ejs');    
});






//Define the port number
const port = process.env.PORT || 3000;


//Start the server
app.listen(port, () => {
console.log(`Weather service listening on port ${port}`);
});

