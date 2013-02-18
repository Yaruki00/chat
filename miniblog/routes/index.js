
/*
 * GET home page.
 */

var items = [{"text": "1st post"}, {"text": "2nd post"}];

exports.index = function(req, res) {
		res.render('index', { title: 'Entries', items: items})
};

exports.form = function(req, res) {
		res.render('form', {});
};

exports.create = function(req, res) {
		items.push({"text": req.body.text});
		res.redirect('/');
};