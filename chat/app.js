
/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, user = require('./routes/user')
, http = require('http')
, path = require('path')
, mongoStore = require('connect-mongo')(express)
, sessionStore = new mongoStore({db: 'db'})
, mongoose = require('mongoose');

// app configures
var app = express();
app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.cookieParser("secret"));
    app.use(express.session({
        secret: "secret",
        store: sessionStore
    }));
    app.use(app.router);
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

// routes
app.get('/', function(req, res){
    if(req.session.name) {
        res.redirect('/lobby');
    } else {
        res.render('login', {message: 'input id & pass'});
    }
});
app.get('/login', routes.login);
app.get('/users', user.list);
app.get('/auth', function(req, res){
    var requser = {userid: req.param('userid'), pass: req.param('pass')};
    UserModel.findOne(requser, function(err, doc) {
        if(doc) {
            req.session.name = req.param('userid');
            res.redirect('/lobby');
        } else {
            res.render('login', {message: 'invalid id or pass'});
        }
    });
});
app.get('/signup', routes.signup);
app.get('/regist', function(req, res){
    UserModel.findOne({userid: req.param('userid')}, function(err, doc){
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
});
app.get('/logout', function(req, res){
    delete req.session.name;
    res.redirect('/login');
});
app.get('/lobby', function(req, res){
    RoomModel.find(function(err, items){
        if(err) {
            console.log(err);
        } else {
            res.render('lobby', {rooms: items, message: 'choose or create room'});
        }
    });
});
app.post('/createRoom', function(req, res){
    if(req.body.name==null) {
        res.redirect('/lobby');
    } else {
        RoomModel.findOne({name: req.body.name}, function(err, doc){
            if(err) {
                console.log(err);
            } else if(doc) {
                RoomModel.find(function(err, items){
                    if(err) {
                        console.log(err);
                    } else {
                        res.render('lobby', {rooms: items, message: 'input name already used'});
                    }
                });
            } else {
                var room = new RoomModel();
                room.name = req.body.name;
                room.owner = req.session.name;
                room.createDate = new Date();
                room.save();
                
                res.redirect('/lobby');
            }
        });
    }
});
app.get('/room/:id', function(req, res){
    RoomModel.findOne({name: req.params.id}, function(err, doc){
        if(err) {
            console.log(err);
        } else if(doc) {
            req.session.room = req.params.id;
            res.render('chat', {name: req.session.room});
        } else {
            res.send('not exist room');
        }
    });
});

// DB
var db = mongoose.connect('mongodb://localhost/db');
var Schema = mongoose.Schema;
var User = new Schema({
    userid : String,
    pass : String,
});
mongoose.model('User', User);
var UserModel = mongoose.model('User');
var State = new Schema({
    user : String,
    state : String,
    date : Date
});
mongoose.model('State', State);
var StateModel = mongoose.model('State');
var Room = new Schema({
    name : String,
    owner : String,
    state : [State],
    createDate : Date
});
mongoose.model('Room', Room);
var RoomModel = mongoose.model('Room');

var server = http.createServer(app);
server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);

io.configure(function() {
    io.set('authorization', function(handshakeData, callback) {
        if(handshakeData.headers.cookie) {
            var cookie = require('express/node_modules/cookie').parse(decodeURIComponent(handshakeData.headers.cookie));
            cookie = require('express/node_modules/connect').utils.parseSignedCookies(cookie, 'secret');
            var sessionID = cookie['connect.sid'];
            sessionStore.get(sessionID, function(err, session) {
                if(err) {
                    callback(err.message, false);
                } else if(!session) {
                    callback('session not found', false);
                } else {
                    console.log("authorization success");
                    handshakeData.cookie = cookie;
                    handshakeData.sessionID = sessionID;
                    handshakeData.sessionStore = sessionStore;
                    handshakeData.session = new express.session.Session(handshakeData, session);
                    callback(null, true);
                }
            });
        } else {
            return callback('cookie not found', false);
        }
    });
});

io.sockets.on('connection', function(socket){
    var room;
    RoomModel.findOne({name:socket.handshake.session.room}, function(err, doc){
        if(err) {
            console.log(err);
        } else if(doc) {
            room = doc;
            for(var i=0;i<room.state.length;i++) {
                socket.emit('message', {user:room.state[i].user, text:room.state[i].state, date:room.state[i].date});
            }
        } else {
            console.log('connection: room not found');
        }
    });
    socket.on('message', function(data) {
        if(data && typeof data.text == 'string') {
            date = new Date();
            io.sockets.emit('message', {user:socket.handshake.session.name, text:data.text, date:date});
            room.state.push({user:socket.handshake.session.name, state:data.text, date:date});
            room.save();
        }
    });
});
