const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const userModel = require('./models/user')

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
    const user = await userModel.findOne({email});
    if(user) return res.send('user already exist');

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                name, email, age, username, password: hash
            })
            const token = jwt.sign({email, userid: user._id}, 'secretKey');
            res.cookie('token', token);
            res.status(200).send('account created successfully ✅');
        })
    })
})

app.get('/login', async(req, res) => {
    res.render('login');
})

app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const user = await userModel.findOne({email});
    if(!user) return res.send('user not found');

    bcrypt.compare(password, user.password, (err, result) => {
        if(result){
            const token = jwt.sign({email, userid: user._id}, 'secretKey');
            res.cookie('token', token);
            res.status(200).send('You are logged in successfully ✅');
        } else res.send('invalid cridentials ⚠️')
    })
})

app.get('/logout', (req, res) => {
    res.cookie('token', '');
    res.send('Sad to see you go :(');
})

app.get('/post', isLoggedIn, (req, res) => {
    console.log(req.user);
    res.send('done');
})

function isLoggedIn(req, res, next){
    if(req.cookies.token == '') return res.send('You must be logged in first');
    else{
        const data = jwt.verify(req.cookies.token, 'secretKey');
        req.user = data;
        next();
    }
}

app.listen(3000)