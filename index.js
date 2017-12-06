var express     = require('express'),
    Promise       = require('es6-promise').Promise,
    bodyParser    = require('body-parser'),
    cookieParser  = require('cookie-parser'),
    http          = require('http'),
    url           = require('url');
    firebase      = require('./lib/firebase');
    require('dotenv').config();


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

app.get('/goals',function(req,res){
  res.sendFile(__dirname+'/public/static/goals.html');
});

app.get('/admin',function(req,res){
  res.sendFile(__dirname+'/public/static/admin.html');
});

app.post('/admin/createuser',function(req,res){
  firebase.auth().createUser({
    email:req.body.email,
    password:generateId(15),
    displayName:req.body.fname+' '+req.body.lname
  })
    .then(function(userRecord){
      firebase.database().ref('/users/'+userRecord.uid).set({
        fname:req.body.fname,
        lname:req.body.lname,
        email:req.body.email,
        campaigns:[req.body.campaign]
      }).then(function(){
        res.redirect('/admin')
      })
    })
})

var generateId = function(length) {
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}
