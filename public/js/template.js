var config = {
    apiKey: "AIzaSyDYJuNTvtj-Z6qbffiWfVuXeYE9xhR6yho",
    authDomain: "pathwaytovictory-400c3.firebaseapp.com",
    databaseURL: "https://pathwaytovictory-400c3.firebaseio.com",
    projectId: "pathwaytovictory-400c3",
    storageBucket: "pathwaytovictory-400c3.appspot.com",
    messagingSenderId: "539080478131"
  },
  state = new Object;
  firebase.initializeApp(config);

$(document).ready(function(){

  firebase.auth().onAuthStateChanged(function(user){
    if (user) {
      checkCampaigns(user)
    } else {
      reset();
      $('#loginModal').modal({
        keyboard:false,
        backdrop:"static"
      });
    }
  },function(err){
    if(err){
      console.log(err)
    }
  });

  $('#login-button').on('click',function(){
    var email     = $('#login-email').val(),
        password  = $('#login-password').val();
    firebase.auth().signInWithEmailAndPassword(email, password).then(function(user){
      $('#loginModal').modal('hide');
    }).catch(function(err) {
      console.log(err)
      $('#error-message').text(err.message)
      $('#errorModal').modal();
    });
  });

  $('#menu-myAccount').on('click',function(){
    firebase.auth().onAuthStateChanged(function(user){
      if (user) {
        firebase.database().ref('/users/'+user.uid).once("value",function(snapshot){
          var userData = snapshot.val()
          $('#account-fname').val(userData.fname)
          $('#account-lname').val(userData.lname)
          $('#account-email').val(userData.email)
          $('#myAccountModal').modal();
        })
      } else {
        reset();
        $('#loginModal').modal({
          keyboard:false,
          backdrop:"static"
        });
      }
    },function(err){
      if(err){
        console.log(err)
      }
    });
  });

  $('#accountSaveButton').on('click',function(){
    firebase.auth().onAuthStateChanged(function(user){
      var userAccount = firebase.auth().currentUser;
      if (user) {
        var push = {
          fname:$('#account-fname').val(),
          lname:$('#account-lname').val()
        }

        firebase.database().ref('/users/'+user.uid).update(push).then(function(){
          $('#myAccountModal').modal('hide')
        })
        /*
        userAccount.updateEmail(push.email).then(function(){
          $('#myAccountModal').modal('hide')
        }).catch(function(err){
          console.log(err)
        })
        */
      } else {
        reset();
        $('#loginModal').modal({
          keyboard:false,
          backdrop:"static"
        });
      }
    },function(err){
      if(err){
        console.log(err)
      }
    });
  })

  $('#accountCancelButton').on('click',function(){
    $('#myAccountModal').modal('hide')
  })

  $('#menu-switchCampaign').on('click',function(){
    firebase.auth().onAuthStateChanged(function(user){
      if (user) {
        checkCampaigns(user)
      } else {
        reset();
        $('#loginModal').modal({
          keyboard:false,
          backdrop:"static"
        });
      }
    },function(err){
      if(err){
        console.log(err)
      }
    });
  });

  $('#campaignChangeButton').on('click',function(){
    state.campaign = $('#campaign-select').val()
    reset()
    startup($('#campaign-select').val());
    $('#switchCampaign').modal('hide')
  })

  $('#menu-addNewScenario').on('click',function(){
    $('#newScenario').modal()
  })

  $('#scenarioSaveButton').on('click',function(){
    saveScenario($('#scenario-name').val(),state.campaign);
    $('#newScenario').modal('hide')
  })

  $('#scenarioCancelButton').on('click',function(){
    $('#newScenario').modal('hide')
  })

  $('#menu-logout').on('click',function(){
    firebase.auth().signOut().then(function() {
      $('#loginModal').modal({
        keyboard:false,
        backdrop:"static"
      });
    }).catch(function(error) {
      $('#error-message').text(error.message)
      $('#errorModal').modal();
    });
  });
});

var checkCampaigns = function(user){
  firebase.database().ref('/users/'+user.uid+"/campaigns").once("value",function(snapshot){
    var data = snapshot.val()
    if(data.length>1){
      setCampaignModal(data,null)
    }else{
      startup(data[0])
    }
  })
}

var setCampaignModal = function(campaigns,selected){
  firebase.database().ref('/campaigns').once("value",function(snapshot){
    var data = snapshot.val(),
        options = campaigns.map(function(d){
                    return {key:d,name:data[d].name}
                  })
    d3.select("#campaign-select").selectAll("option").remove()
    d3.select("#campaign-select").selectAll("option")
      .data(options)
      .enter().append("option")
      .attr("value",function(d){
        return d.key
      })
      .text(function(d){
        return d.name
      })
      .attr("selected",function(d){
        if(d.key===selected){
          return "selected"
        }
      })
    $('#switchCampaign').modal()
  })
}

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

var generateId = function(length) {
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}
