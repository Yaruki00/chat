var http = require("http");
var url = require("url");

function start(route, handle) {
  http.createServer( function(request, response) {
    var pathname = url.parse(request.url).pathname;
    route(handle, pathname);
    response.writeHead(200, {"Content-Type":"text/plain"});
    response.write("Hello World");
    response.end();
      }).listen(8888);
}

exports.start = start;