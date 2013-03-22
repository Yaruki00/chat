 
/*
 * GET home page.
 */
var app = require('../app.js');

exports.index = function(req, res){
    if(req.session.name) {
        res.redirect('/lobby');
    } else {
        res.render('login', {message: 'input id & pass'});
    }
};

exports.login = function(req, res){
    res.render('login', {message: 'input id & pass'});
};

exports.signup = function(req, res){
    res.render('signup', {message: 'input new account information'});
};

exports.auth = function(req, res){
    var requser = {userid: req.param('userid'), pass: req.param('pass')};
    app.UserModel.findOne(requser, function(err, doc) {
        if(doc) {
            req.session.name = req.param('userid');
            res.redirect('/lobby');
        } else {
            res.render('login', {message: 'invalid id or pass'});
        }
    });
};

exports.regist = function(req, res){
    app.UserModel.findOne({userid: req.param('userid')}, function(err, doc){
        if(doc) {
            res.render('signup', {message: 'userid already used'});
        } else {
            var user = new UserModel();
            user.userid = req.param('userid');
            user.pass = req.param('pass');
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
    app.RoomModel.find(function(err, items){
        if(err) {
            console.log(err);
        } else {
            res.render('lobby', {rooms: items, message: 'choose or create room'});
        }
    });
};

exports.createRoom =  function(req, res){
    if(req.body.name==null) {
        res.redirect('/lobby');
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
};