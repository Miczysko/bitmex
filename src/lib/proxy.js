var httpProxy = require('http-proxy');
var apiURL = 'https://www.bitmex.com';
var port = 2080;
var http = require('http');

var proxy = httpProxy.createProxyServer({});

export default function bitmexProxy(cb) {
  var server = http.createServer(function(req, res) {
    // API validates origin and referer to prevent certain types of csrf attacks, so delete them
    delete req.headers['origin'];
    delete req.headers['referer'];
    res.setHeader('Access-Control-Allow-Origin', '*');
    req.url = '/api/v1' + req.url;
    proxy.web(req, res, { target: apiURL, changeOrigin: true });
  });
  server.listen(port);
  console.log('Started BitMEX proxy on port', port);
}
