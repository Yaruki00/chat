
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
            res.render('index', {title: 'chat'});
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
                    res.redirect('/');
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
                    res.redirect('/');
                }
            });
    });
app.get('/logout', function(req, res){
        delete req.session.name;
        res.redirect('/');
    });

// DB
var db = mongoose.connect('mongodb://localhost/db');
var Schema = mongoose.Schema;
var User = new Schema({
        userid : String,
        pass : String,
        state : [State]
    });
mongoose.model('User', User);
var UserModel = mongoose.model('User');
var State = new Schema({
        state : String,
        date : Date
    });
mongoose.model('State', State);
var StateModel = mongoose.model('State');

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
        var user;
        UserModel.findOne({userid:socket.handshake.session.name}, function(err, doc){
                if(err) {
                    console.log(err);
                } else {
                    if(doc) {
                        user = doc;
                    } else {
                        console.log('connection: user not found');
                    }
                }
            });
        UserModel.find(function(err, items) {
                for(var i=0;i<items.length;i++) {
                    for(var j=0;j<items[i].state.length;j++) {
                        socket.emit('message', {user:items[i].userid, text:items[i].state[j].state, date:items[i].state[j].date});
                    }
                }
            });
        socket.on('message', function(data) {
                if(data && typeof data.text == 'string') {
                    date = new Date();
                    io.sockets.emit('message', {user:socket.handshake.session.name, text:data.text, date:date});
                    user.state.push({state:data.text, date:date});
                    user.save();
                }
            });
    });
