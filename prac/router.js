function route(handle, pathname) {
		if(typeof handle[pathname] === 'function') {
				handle[pathname](response);
		} else {
				response.writeHead(404, {"Content-Type":"text/plain"});
				response.write("404 Not Found");
				response.end();
		}
}

exports.route = route;