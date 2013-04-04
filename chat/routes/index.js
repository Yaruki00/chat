 
/*
 * GET home page.
 */
var app = require('../app.js');

exports.index = function(req, res){
    if(req.session.name) {
        res.redirect('/lobby');
    } else {
        res.render('login', {message: ''});
    }
};

exports.login = function(req, res){
    res.render('login', {message: ''});
};

exports.signup = function(req, res){
    res.render('signup', {message: ''});
};

exports.auth = function(req, res){
    var userid = req.param('userid'), pass = req.param('pass');
    var user = {userid: userid, pass: pass};
    app.UserModel.findOne(user, function(err, doc) {
        if(doc) {
            req.session.name = userid;
            res.redirect('/lobby');
        } else {
            res.render('login', {message: 'invalid ID or pass'});
        }
    });
};

exports.regist = function(req, res){
    var userid = req.param('userid'), pass = req.param('pass');
    app.UserModel.findOne({userid: userid}, function(err, doc){
        if(doc) {
            res.render('signup', {message: 'userid already used'});
        } else {
            var user = new app.UserModel();
            user.userid = userid;
            user.pass = pass;
            user.state = [];
            user.save();
            req.session.name = user.userid;
            res.redirect('/lobby');
        }
    });
};

exports.logout = function(req, res){
    delete req.session.name;
    res.redirect('/login');
};

exports.lobby = function(req, res){
    if(typeof req.session.name === 'undefined') {
        res.redirect('/login');
    } else {
        app.RoomModel.find(function(err, items){
            if(err) {
                console.log(err);
            } else {
                res.render('lobby', {rooms: items, message: ''});
            }
        });
    }
};

exports.createRoom =  function(req, res){
    if(typeof req.session.name === 'undefined') {
        res.redirect('/login');
    } else {
        app.RoomModel.findOne({name: req.body.name}, function(err, doc){
            if(err) {
                console.log(err);
            } else if(doc) {
                app.RoomModel.find(function(err, items){
                    if(err) {
                        console.log(err);
                    } else {
                        res.render('lobby', {rooms: items, message: 'input name already used'});
                    }
                });
            } else {
                var room = new app.RoomModel();
                room.name = req.body.name;
                room.owner = req.session.name;
                room.createDate = new Date();
                room.save();
                res.redirect('/lobby');
            }
        });
    }
};

exports.room = function(req, res){
    if(typeof req.session.name === 'undefined') {
        res.redirect('/login');
    } else {
        app.RoomModel.findOne({name: req.params.id}, function(err, doc){
            if(err) {
                console.log(err);
            } else if(doc) {
                req.session.room = req.params.id;
                res.render('chat', {name: req.session.room});
            } else {
                res.send('not exist room');
            }
        });
    }
};