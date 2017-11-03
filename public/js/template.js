var config = {
    apiKey: "AIzaSyDYJuNTvtj-Z6qbffiWfVuXeYE9xhR6yho",
    authDomain: "pathwaytovictory-400c3.firebaseapp.com",
    databaseURL: "https://pathwaytovictory-400c3.firebaseio.com",
    projectId: "pathwaytovictory-400c3",
    storageBucket: "pathwaytovictory-400c3.appspot.com",
    messagingSenderId: "539080478131"
  };
  firebase.initializeApp(config);

$(document).ready(function(){

  firebase.auth().onAuthStateChanged(function(user){
    if (user) {
      startup(user);
    } else {
      $('#loginModal').modal({
        keyboard:false,
        backdrop:"static"
      });
    }
  });

  $('#login-button').on('click',function(){
    var email     = $('#login-email').val(),
        password  = $('#login-password').val();
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(err) {
      console.log(err)
      $('#error-message').text(err.message)
      $('#errorModal').modal({
        keyboard:false,
        backdrop:"static"
      });
    }).then(function(user){
      $('#loginModal').modal('hide');
      startup(user);
    });
  });

  $('#menu-myAccount').on('click',function(){
    $('#myAccountModal').modal();
  });

  $('#menu-switchCampaign').on('click',function(){
    $('#switchCampaign').modal();
    firebase.db.ref('/campaigns').once(function(snapshot){
      firebase.auth().onAuthStateChanged(function(user){
        var campaigns = snapshot.val();
          d3.select("#campaign-select").selectAll("option")
            .data(Object.keys(campaigns).filter(function(d){
              return user.campaigns.indexOf(d.name)>-1
            }).map(function(d){
              return {name:campaigns[d].name,id:d}
            }))
            .enter().append("option")
              .attr("value",function(d){
                return d.id
              })
              .text(function(d){
                return d.name
              })
      });
    })
  });

  $('#menu-logout').on('click',function(){
    firebase.auth().signOut().then(function() {
      reset();
      $('#loginModal').modal({
        keyboard:false,
        backdrop:"static"
      });
    }).catch(function(error) {
      $('#error-message').text(error.message)
      $('#errorModal').modal({
        keyboard:false,
        backdrop:"static"
      });
    });
  });

});

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function tooltipDisplay(html,elem,event){
  elem.style('opacity', .9).style("display","block")

  if((d3.select("body").node().getBoundingClientRect().width-event.clientX)<elem.node().getBoundingClientRect().width+50){
    var tooltipX = -(20 + elem.node().getBoundingClientRect().width)
  }else{var tooltipX = 20}

  if((d3.select("body").node().getBoundingClientRect().height-event.clientY)<elem.node().getBoundingClientRect().height+30){
    var tooltipY = -(elem.node().getBoundingClientRect().height-20)
  }else{var tooltipY = -15}

  elem.style('left', (event.clientX + tooltipX) + 'px').style('top',  (event.clientY + tooltipY) + 'px')

  elem.html(html)
}

var tooltipHide = function tooltipHide(elem){
  elem.style("display","none")
}
