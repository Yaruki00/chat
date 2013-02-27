 
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.login = function(req, res){
		res.render('login', {message: 'input id & pass'});
};

exports.signup = function(req, res){
		res.render('signup', {message: 'input new account information'});
};