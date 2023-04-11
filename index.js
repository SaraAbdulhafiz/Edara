const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.static('upload'));
const cors = require('cors');
app.use (cors()); // allow http request by local host

const movies = require('./routes/movies.js');
const supervisor = require('./routes/supervisor.js');
const req = require('express/lib/request.js');
const auth = require('./routes/Auth.js')

// API routes end points
app.use('/auth',auth);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// here the string is refers to the parent route
// it's the route that repeats in all request
app.use("/movies", movies);
app.use("",supervisor);

app.listen(4000, 'localhost', () => {
    console.log("SERVER IS RUNNING");
});
