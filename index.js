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
var sessionHandler = session({
  store: new redisStore({ host: 'localhost', port: 6379, client: redClient }),
  secret:'pocket_square',
  resave: false, // default is changing in the future, so set now explicitly to a safe default
  saveUninitialized: false}); // default is changing in the future, so set now explicitly to a safe default
app.use(sessionHandler);
app.use(express.static(__dirname + '/public'));

app.use(function(req,res,next){
  if(req.session.user){
    if(req.session.user.pages.indexOf(req.path)>-1||req.get('host')==='localhost:5000'){
      next();
    }
    else{
      res.redirect('/');
    }
  }else if(req.get('host')==='localhost:5000'){
    next()
  }else{
    res.redirect('/');
  }
});

app.get('/',function(req,res){
  res.sendFile(__dirname+'/public/static/home.html');
});
