var include       = require('../include').include,
    client        = include('/lib/database'),
    Server        = include('/routes/app').server,
    async         = require('async'),
    wsServer      = require('ws').Server;
    require('dotenv').config();

var wss = new wsServer({server: Server});
console.log("websocket server created");

var routes = {
  util:{
    ping:function(req,msg,cb){
      msg.id = "pong";
      return cb(null,"pong");
    },
    title:function(req,msg,cb){
      return cb(null,process.env.TITLE);
    }
  },
  db:{
    read:function(req,msg,cb){
      async.series({
        data:function(callback){
          client.query("",[msg],function(err,data){
            if(err){console.log(err)}
            callback(err,data.rows)
          })
        }
      },function(err,data){
        if(err){console.log(err)}
        return cb(err,data)
      })
    },
    write:function(req,msg,cb){
      client.writeData(msg,function(){

      })
    }
  }

};

wss.on("connection",function(ws,req){
  var res = {writeHead: {}};
    ws.on("message",function(d){
      var msg = JSON.parse(d);
      routes[msg.type][msg.id](req,msg,function(err,data){
        if(err){
          console.log(err);
          console.log("ERROR - " + msg.type + "/" + msg.id);
          ws.send(JSON.stringify({id:"error",data:err}));
          ws.send(JSON.stringify({type:msg.type,id:msg.id,data:data}));
        }else{
          ws.send(JSON.stringify({type:msg.type,id:msg.id,data:data}));
        }
      });
    });
});
