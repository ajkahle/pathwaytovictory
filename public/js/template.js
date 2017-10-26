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
