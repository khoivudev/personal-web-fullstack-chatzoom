var LocalStrategy = require("passport-local").Strategy;
var GitHubStrategy = require("passport-github").Strategy;
var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");

//Load User Model
var User = require("../models/User");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      //Match User
      User.findOne({ email: email })
        .then((user) => {
          if (!user) {
            return done(null, false, {
              message: "That email is not registered",
            });
          }
          // Match password
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Password incorrect" });
            }
          });
        })
        .catch((err) => console.log(err));
    })
  );

  // passport.use(
  //     new GitHubStrategy({
  //             clientID: process.env.GITHUB_CLIENT_ID,
  //             clientSecret: process.env.GITHUB_CLIENT_SECRET,
  //             callbackURL: "https://vuhuykhoi.herokuapp.com/user/auth/github/callback"
  //         },
  //         async(accessToken, refreshToken, profile, done) => {
  //             console.log(profile);
  //             //Database logic here with callback containing our user object
  //             const newUser = {
  //                 githubId: profile.id,
  //                 username: profile.displayName || 'A github User',
  //                 photo: profile.photos[0].value || '',
  //                 email: Array.isArray(profile.emails) ? profile.emails[0].value : 'No public email',
  //                 provider: profile.provider || ''
  //             }

  //             try {
  //                 let user = await User.findOne({ githubId: profile.id });
  //                 if (user) {
  //                     done(null, user);
  //                 } else {
  //                     user = await User.create(newUser);
  //                     done(null, user);
  //                 }
  //             } catch (err) {
  //                 console.log(err);
  //             }
  //         }
  //     ));

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
};
