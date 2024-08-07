const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index');
})

app.post('/createaccount', async (req, res) => {
    const {name, username, age, email, password} = req.body;
    console.log(email);
    res.send('done')
})

app.listen(3000)