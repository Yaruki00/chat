
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/users', user.list);
app.get('/auth', function(req, res){
				var res_error = function(){
						res.render('login', {message: 'invalid id or pass'});
				};
				var res_success = function(){
						res.render('success', {userid: userid, pass: pass});
				};
				var userid = req.param('userid');
				var pass = req.param('pass');
				var User = mongoose.model('User');
				var i = {userid: userid, pass: pass};
				User.findOne(i, function(err, doc){
								if(doc==null) {
										res_error();
								} else {
										res_success();
								}
						});
		});
app.get('/signup', routes.signup);
app.get('/regist', function(req, res){
				var res_error = function(){
						res.render('login', {message: 'invalid id or pass'});
				};
				var res_success = function(){
						res.render('success', {userid: userid, pass: pass});
				};
				var userid = req.param('userid');
				var pass = req.param('pass');
				var User = mongoose.model('User');
				var i = {userid: userid, pass: pass};
				User.findOne(i, function(err, doc){
								if(doc==null) {
										var user = new User();
										user.userid = userid;
										user.pass = pass;
										user.save();
										res_success();
								} else {
										res_error();
								}
						})
		});

var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/db');
var Schema = mongoose.Schema;
var User = new Schema({
				userid : String,
				pass : String
		});
mongoose.model('User', User);

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

