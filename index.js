var express     = require('express'),
    Promise       = require('es6-promise').Promise,
    bodyParser    = require('body-parser'),
    cookieParser  = require('cookie-parser'),
    session       = require('express-session'),
    http          = require('http'),
    redis         = require('redis'),
    redisStore    = require('connect-redis')(session),
    url           = require('url');
    require('dotenv').config();


if (process.env.REDISTOGO_URL) {
    var rtg   = url.parse(process.env.REDISTOGO_URL);
    console.log(rtg)
    var redClient = redis.createClient(rtg.port, rtg.hostname);
    redClient.auth(rtg.auth.split(":")[1]);
  } else {
    var redClient = redis.createClient();
  }

var app = express(),
    server = http.createServer(app),
    port = process.env.PORT || 5000;

server.listen(port);
console.log("http server listening on %d", port);

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); // default is changing in future, so set to true for now so it can handle nested stuff to parse
app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){
  res.sendFile(__dirname+'/public/static/home.html');
});
