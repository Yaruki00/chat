function route(handle, pathname) {
		if(typeof handle[pathname] === 'function') {
				handle[pathname]();
		} else {
				console.log("no request handler");
		}
}

exports.route = route;