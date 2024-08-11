const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const userModel = require("./models/user");
const postModel = require("./models/post");
const path = require('path');
const upload = require("./utils/multer");

const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/createaccount", async (req, res) => {
    const { name, username, age, email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (user) return res.send("user already exist");
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                name,
                email,
                age,
                username,
                password: hash,
            });
            const token = jwt.sign({ email, userid: user._id }, "secretKey");
            res.cookie("token", token);
            res.status(200).send("account created successfully ✅");
        });
    });
});

app.get("/login", async (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) return res.send("user not found");

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            const token = jwt.sign({ email, userid: user._id }, "secretKey");
            res.cookie("token", token);
            res.status(200).send("You are logged in successfully ✅");
        } else res.send("invalid cridentials ⚠️");
    });
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.send("Sad to see you go :(");
});

app.get("/profile", isLoggedIn, async (req, res) => {
    const userData = await userModel
        .findOne({ _id: req.user.userid })
        .populate("posts");
    res.render("profile", { user: userData });
});

app.post("/createPost", isLoggedIn, async (req, res) => {
    const { postData } = req.body;
    const userData = await userModel.findOne({ _id: req.user.userid });
    const post = await postModel.create({
        content: postData,
        user: userData._id,
    });
    userData.posts.push(post._id);
    await userData.save();
    console.log({ post, userData });
    res.redirect("/profile");
});

app.get("/like/:postId", isLoggedIn, async (req, res) => {
    const post = await postModel
        .findOne({ _id: req.params.postId })
        .populate("user");
    if (post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }
    await post.save();
    console.log(post);
    res.redirect('/profile');
});

app.get('/edit/:postId', isLoggedIn, async (req, res) => {
    const post = await postModel.findOne({_id: req.params.postId});
    res.render('edit', {post})
})

app.post('/updatePost/:id', isLoggedIn, async (req, res) => {
    const updatedPost = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.postData});
    res.redirect('/profile');
})

app.get('/delete/:id', isLoggedIn, async (req, res) => {
    console.log('from here ----------------------------------')
    const post = await postModel.findOneAndDelete({_id: req.params.id})
    console.log(post);
    res.redirect('/profile');
    const user = await userModel.findOne({_id: req.user.userid});
    console.log(user, user.posts.length);
    user.posts.splice(post._id, 1);
    await user.save()
    console.log(user.posts, user.posts.length)
    console.log('to here ----------------------------------')
})

app.get('/profilepic', async (req, res) => {
    res.render('profilepic');
})

app.post('/uploadprofilepic', isLoggedIn, upload.single("profilepic"), async (req, res) => {
    const user = await userModel.findOne({_id: req.user.userid});
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect('/profile');   
})


function isLoggedIn(req, res, next) {
    if (!req.cookies.token || req.cookies.token == "") return res.send("You must be logged in first");
    else {
        const data = jwt.verify(req.cookies.token, "secretKey");
        req.user = data;
        next();
    }
}

app.listen(3000);
