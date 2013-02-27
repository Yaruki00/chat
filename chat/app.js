
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoStore = require('connect-mongo')(express)
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
	app.use(express.cookieParser('your secret here'));
	app.use(express.session({
							secret: "secret",
						  store: auth = new mongoStore({ db: 'db'})
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
				pass : String
		});
mongoose.model('User', User);
var UserModel = mongoose.model('User');


var server = http.createServer(app);
server.listen(app.get('port'), function(){
				console.log("Express server listening on port " + app.get('port'));
		});

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket){
				socket.on('message', function(data) {
								if(data && typeof data.text == 'string') {
										socket.broadcast.json.emit('message', {text:data.text});
								}
						});
		});

