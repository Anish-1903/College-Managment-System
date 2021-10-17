const passport = require('passport');
const Account = require('../models/account');
const router = require('express').Router();

const isLoggedInMiddleware = (req, res, next) => {
    if(req.user) {
        res.redirect("/");
    } else {
        next();
    }
}

router.get('/', function(req, res) {
    res.render('index', {user: req.user});
});

router.get('/register', isLoggedInMiddleware, function(req, res) {
    res.render('register', {user: req.user});
});

router.post('/register', function(req, res, next) {
    console.log('registering user');
    Account.register(new Account({
        type: req.body.type,
        fullName: req.body.fullName,
        gender: req.body.gender,
        username: req.body.username
    }), req.body.password, function(err) {
        if (err) {
            console.log('error while user register!', err);
            return next(err);
        }

        console.log('user registered!');

        res.redirect('/');
    });
});

router.get(
    '/login',
    isLoggedInMiddleware,
    (req, res) => {
        res.render('login', {user: req.user, message: req.flash('error')});
    }
);

router.get('/profile', function(req, res) {
    if( req.user.type === "Admin"){
        res.redirect('/admin');
    }else
        res.render('profile', {user: req.user});
});

const isAdmin = (req, res, next ) => {
    if( req.user && (req.user.type === 'Admin' ) ){
        next()
    }
    else{
        const err = new Error('Access Denied') ;
        err.message = 'your not authorized to use this page.';
        err.status = 401;
        throw err;
    }
}

router.get('/admin', isAdmin, function(req, res) {
    Account.find()
        .then(users => {
            res.render('admin', {users: users, user: req.user});
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving accounts."
            });
        });
});

router.post(
    '/login',
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    function(req, res) {
        if(req.user.type === 'Admin')
            res.redirect('/admin');
        else
            res.redirect('/profile');
});

router.post('/update/:id', function(req, res) {
    const id = req.params.id;

    if(req.user && (req.user.type === 'Admin' || req.user.id === req.params.id)){
        Account.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
            .then(data => {
                if (!data) {
                    res.status(404).send({
                        message: `Cannot update Tutorial with id=${id}. Maybe Tutorial was not found!`
                    });
                } else res.redirect("/profile")
            })
            .catch(err => {
                res.status(500).send({
                    message: "Error updating Tutorial with id=" + id
                });
            });
    } else{
        const err = new Error('Access Denied') ;
        err.message = 'your not authorized to use this page.';
        err.status = 401;
        throw err;
    }
});


router.get('/delete', function(req, res, next) {
    const id = req.query.id;

    Account.findByIdAndRemove(id)
        .then(users => {
            if (!users) {
                res.status(404).send({
                    message: `Cannot delete Tutorial with id=${id}. Maybe Accounts was not found!`
                });
            } else {
                if(req.user.type === "Admin"){
                    res.status(301).redirect('/Admin');
                }else{
                    res.status(301).redirect('/profile');
                }

            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Could not delete Accounts with id=" + id
            });
        })
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;