
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
app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/users', user.list);
app.get('/auth', routes.auth);
app.get('/signup', routes.signup);
app.get('/regist', routes.regist);
app.get('/logout', routes.logout);
app.get('/lobby', routes.lobby);
app.post('/createRoom',routes.createRoom);
app.get('/room/:id', routes.room);

// DB
var db = mongoose.connect('mongodb://localhost/db');
var Schema = mongoose.Schema;
var User = new Schema({
    userid : String,
    pass : String,
});
mongoose.model('User', User);
var UserModel = mongoose.model('User');
exports.UserModel = UserModel;
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
exports.RoomModel = RoomModel;

// start server
var server = http.createServer(app);
server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

// web socket
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
