var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var passport = require('passport');

var User = require('../models/User');
const { ensureAuthenticated } = require('../config/auth');

//Login Page
router.get('/login', (req, res) => {
    res.render('pages/user/login', { title: 'Login | K-Zone' });
});

//Register Page
router.get('/register', (req, res) => {
    res.render('pages/user/register', { title: 'Register | K-Zone' });
});

//Register Handle
router.post('/register', (req, res) => {
    const { username, email, password, password2 } = req.body;
    let errors = [];

    //Check required field
    if (!username || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all feilds' });
    }

    //Check password match
    if (password !== password2) {
        errors.push({ msg: 'Passworld does not match' });
    }

    //Check pass length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('pages/user/register', {
            title: "Register",
            errors,
            username,
            password,
            password2
        });
    } else {
        //Validation passed
        User.findOne({ email: email })
            .then(user => {
                if (user) {
                    //User exist
                    errors.push({ msg: "Email is already registered" });
                    res.render('pages/user/register', {
                        title: "Register",
                        errors,
                        username,
                        password,
                        password2
                    });
                } else {
                    const newUser = new User({
                        username,
                        email,
                        password
                    });

                    //Hash password
                    bcrypt.genSalt(10, (err, salt) =>
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            //Set password to hash
                            newUser.password = hash;
                            //Save user
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registed and can log in');
                                    res.redirect('/user/login');
                                    console.log(user);
                                })
                                .catch(err => console.log(err));
                        }))
                }
            })

    }
})

//Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/user/login',
        failureFlash: true
    })(req, res, next);
})

//Login with Github
router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/user/login', }), (req, res) => {
    req.session.user_id = req.user._id
    res.redirect('/');
});

//Logout Handle
router.get('/logout', ensureAuthenticated, (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/user/login');
});

module.exports = router;