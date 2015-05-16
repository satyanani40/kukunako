'use strict';

angular.module('weberApp')
    .controller('indexCtrl', function($auth,$scope, $window, CurrentUser,$route,
                                      $alert,$timeout,InstanceSearchHistory, PostService,
                                      Friends,$location, $http, Restangular,ChatActivity,UserService,
                                      CurrentUser1,SearchActivity, friendsActivity,$socket) {

        $scope.isAuthenticated = function() {
            return $auth.isAuthenticated();
        };

        $scope.get_screen_height = window.innerHeight-52;
        $scope.get_inner_div_height = (window.innerHeight-210)/2;
        $scope.UserService = UserService;
        $scope.notifications_count = 0;
        $scope.instanceSearchHistory = {};
        $scope.PostService = PostService;
        $scope.chatdivnotification = [];

        // socket functions execution
        function socket_operations(){
            $socket.emit('connecting', {id:$scope.currentUser._id});

            $socket.on('joiningstatus', function(data) {
                console.log('joing==>', data)
            });

            $socket.on('FMnotific', function(data){
                if(data.data.FMnotific){
                    Restangular.one('people',JSON.parse(user_id)).get({seed: Math.random()})
                    .then(function(user) {
                            $scope.currentUser = user;
                            console.log('got notifications to this user', user.name.first)
                            get_friend_notifications(user);
                    });
                }
            });

             $socket.on('receive_messages', function(msg) {
                //console.log('message received', msg)
                var new_message = {};
                var details = JSON.parse(sessionStorage.getItem(msg.senderid));
                if($scope.currentUser._id == msg.senderid){

                }else if($scope.currentUser._id != msg.senderid){
                    // no chat rooms opened push message into latest Notifications
                    if(sessionStorage.getItem(msg.senderid) == null){
                       // console.log('no chat div opened')
                        $scope.chatactivity.pushLatestMessage(msg);
                    }
                    else{
                    //console.log('yes chat room opened')
                    new_message = {
                          sender :{
                            name:{
                                first:details.name
                            },
                            picture :{
                                medium:details.image

                            },
                            _id:msg.senderid
                          },

                          receiver:{
                            _id:msg.receiverid
                          },
                          message:msg.message
                    }

                    if(JSON.parse(sessionStorage.getItem(msg.senderid)).minimize){
                        $scope.chatdivnotification.push({ id:msg.senderid,message: true});
                    }
                     $scope.chatactivity.pushMessage(msg.senderid, new_message);
                     msg = null;
                   }
                }else{}

             });
        }

        function get_friend_notifications(user){
            console.log('calling get friend notifications', user.notifications)
            for(var k in user.notifications){
                if(user.notifications[k].seen == false){
                    $scope.notifications_count += 1;
                }
            }
        }
        $scope.loadLatestMessages = function(){
            //console.log('load message')
            $scope.chatactivity.loadLatestMessages();
        }

        // opens new chat room
        $scope.openchatroom = function(room_user){
            document.getElementById("show_div").style.display="block";
            if(!(sessionStorage.getItem(room_user._id))){
                // check room alredy open
                var json = {
                    name:room_user.name.first,
                    id: room_user._id,
                    image:room_user.picture.medium,
                    minimize:false,
                    maximize:true,
                    right:0,
                    height:'364px'
                }
                $scope.chatactivity.loadMessages($scope.currentUser._id, room_user._id, json);
                sessionStorage.setItem(room_user._id, JSON.stringify(json));
                $socket.emit('connect', {data:room_user._id});
                // load messages into new open chat room
            };
         }
         // send message while pressing enter in room
        $scope.send_message = function(Recept){
            var text = this.SendMessage;
            this.SendMessage = null;
            if(text){
                var pushNewMessage = {
                    sender :{
                        name:{
                            first:$scope.currentUser.name.first
                        },
                        picture :{
                            medium:$scope.currentUser.picture.medium

                        },
                        _id:$scope.currentUser._id
                    },

                    receiver:{
                        _id:Recept
                    },

                    message:text,
                    _created: new Date()
                }

                $scope.chatactivity.pushMessage(Recept, pushNewMessage);

                //$scope.chatactivity.messages = data;

                $socket.emit('send_message', {receiverid: Recept, senderid :$scope.currentUser._id  ,message: text});
                $scope.chatactivity.sendMessage(Recept, text);
            }else{
                return false;
            }
        }

        $scope.addToConversations = function(id){
            $scope.chatactivity.addToConversations(id);
        }

        $scope.deleteConversation = function(id){
            $scope.chatactivity.deleteConversation(id);
            sessionStorage.removeItem(id);
        }

        $scope.send_feedback = function(){
            console.log('data')
            sessionStorage.setItem(room_user._id, JSON.stringify(json));
            $socket.emit('connect', {data:room_user._id});
        };


         // closing open div
        $scope.close_div = function(id){
            for(var k in $scope.chatactivity.messages){
                if($scope.chatactivity.messages[k].id == id){
                    // remove get chat room
                    $scope.chatactivity.messages.splice(k,1);
                }
            }

            for(var i in $scope.chatactivity.pages){
                if($scope.chatactivity.pages[i].id == id){
                    $scope.chatactivity.pages.splice(k,1);
                }
            }
            // remove from chat room
            sessionStorage.removeItem(id);
        }

         $scope.MessageNotifcations = function(){
           $scope.chatactivity.getMessageNotifcations();
         }


        $scope.makeMessagesSeen = function(senderid){
            $scope.chatactivity.makeMessagesSeen(senderid);
        }

        $scope.checknotific = function(id){
               for(k in $scope.chatdivnotification){

                   if($scope.chatdivnotification[k].id == id && $scope.chatdivnotification[k].message == true){
                     return true;
                     }else{
                        //console.log("not equal")
                     }
               }
        }

        $scope.makeSeen = function(){
             //console.log('--------called make seen-------------')
             if($scope.notifications_count){
                $scope.notifications_count = 0;
                for(var k in $scope.currentUser.notifications){
                    if($scope.currentUser.notifications[k].seen == false){
                        $scope.currentUser.notifications[k].seen = true;
                    }

                    Friends.makeSeen($scope.currentUser._id).then(function(data){
                        return true;
                    });
                }
             }
        }

        $scope.loadSearchHistory = function(){
            $scope.searchActivity.getMysearches();
        }

        $scope.newMessageSeen = function(id){
            for(var k in $scope.chatdivnotification){
                if($scope.chatdivnotification[k].id == id){
                    $scope.chatdivnotification.splice(k,1);
                }
            }
        }

        var getValue = function(){
            return sessionStorage.length;
        }

        var getData = function(){
          var json = [];

          $.each(sessionStorage, function(i, v){
            if(sessionStorage.hasOwnProperty(i)){
                //console.log('attrib==>', i ,'value==>',v)
                json.push(angular.fromJson(v));
             }
          });
          return json;
        }

        function loadintodivs(){
            var chatrooms = getData();
            console.log('chat room opened previously', chatrooms)
            for(var k in  chatrooms){
                $scope.chatactivity.loadMessages($scope.currentUser._id, chatrooms[k].id, chatrooms[k]);
           }
          

        }
        function get_location(){
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position){
                    $scope.$apply(function(){
                       $scope.position = position;
                       var geocodingAPI = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+position.coords.latitude +","+ position.coords.longitude;
                           $.getJSON(geocodingAPI, function (json) {
                            if (json.status == "OK") {
                                for(var temp in json.results){
                                    for(var k in json.results[temp].address_components){
                                        for(var i in json.results[temp].address_components[k].types){
                                            if(json.results[temp].address_components[k].types[i] == "sublocality_level_1"){

                                              $scope.location = json.results[temp].address_components[k].long_name;
                                              return true;
                                            }
                                        }
                                    }
                                }
                            }

                       });
                    });
                });
            }
            return false;
         }

        get_location();
        $scope.doSomething = function(typedthings){
            if(typedthings){
                $scope.movies = [];
                var data = InstanceSearchHistory.get(typedthings);
                if (typeof data.then !== 'undefined') {
                    data.then(function(data){
                    //console.log('if part')
                    $scope.movies = data.data;
                    InstanceSearchHistory.pushToHistory(data.data, typedthings);
                    });
                }else{
                    $scope.movies = data;
                }
            }
        }

        $scope.doSomethingElse = function(suggestion){
            //console.log("Suggestion selected: ", suggestion._id);
            $location.path('profile/'+suggestion._id.$oid);
        }

    /* end of auto complete code and remember factory of this code is there at the bottom of the page*/
        $scope.selectedAddress = '';
        $scope.getAddress = function(viewValue) {
            var params = {address: viewValue, sensor: false};
            return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {params: params})
            .then(function(res) {
                 return res.data.results;
            });
        };

        /* login functionality code goes here*/
        $scope.submitLogin = function() {
            $auth.login({
				email: this.formData.email,
				password: this.formData.password
			}).then(function(response) {
			    console.log('-----------index user--------------', response)
			    $auth.setToken(response.data.token);
				$scope.currentUser = response.data.user;
				$scope.chatactivity = new ChatActivity($scope.currentUser);
			}, function(error) {
				$scope.loginError = error;
				$alert({
					title: 'Login Failed:',
					content: error.data.error,
					placement: 'top',
					type: 'danger',
					show: true
				});
			});
		};
        /* end of login functionality*/

        //$scope.isAdmin = true;
        /* starting code of signup goes here */
        $scope.registerUser = function() {
            var self = this;
            $scope.signupBusy = $auth.signup({
                email: self.formData.email,
                password: self.formData.password,
                firstname: self.formData.firstname,
                lastname: self.formData.lastname,
                username: self.formData.firstname + self.formData.lastname,
            }).then(function (response) {
                if(response.data.status == 200){
                    $auth.setToken(response.data.token);
                    $scope.currentUser = response.data.user;
                    $scope.currentUser._id = response.data.user._id.$oid;
                    $location.path('/enter_interests/' + self.formData.email);
                }

            }, function (signuperror) {
                $scope.signUpError = signuperror;
                $alert({
                    title: 'Registration Failed:',
                    content: signuperror.data.error,
                    placement: 'top',
                    type: 'danger',
                    show: true
                });
            });
        };

        /* ending of signup code */

        $scope.dropdown = [{
            "text": "Friends",
            "href": "#/friends"
        },{
            "text": "Settings",
            "href": "#/settings"
        },{
            "text": "Logout",
            "click": "logout()"
        }];

        $scope.logout = function() {
        //CurrentUser.reset();
            $window.sessionStorage.clear();
            $auth.logout();
            $location.path("/search");
        };


        // check user empty or not at controller load
        if(typeof $scope.currentUser !== 'undefined'){
            // checking questions answered or not and place interests or not
            if($scope.currentUser.interests.length == 0 && $scope.currentUser.questions.length < 4){
                $location.path("/enter_interests")
            }

             $scope.chatactivity = new ChatActivity(user);
             $scope.searchActivity = new SearchActivity($scope.currentUser);
             get_friend_notifications($scope.currentUser);

             $scope.MessageNotifcations();
             if($scope.currentUser.friends.length !== 0){
                $scope.chatactivity.getChatFriends();
             }
             socket_operations();
             loadintodivs();
        }else{
             $http.get('/api/me', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': $auth.getToken()
                }
            }).success(function(user_id) {
                var params = '{"send_add_requests":1}';
                Restangular.one('people',JSON.parse(user_id)).get({embedded:params, seed: Math.random()})
                .then(function(user) {

                   $scope.currentUser = user;
                   if($scope.currentUser.interests.length == 0 && $scope.currentUser.questions.length < 4){
                        $location.path("/enter_interests")
                   }

                   $scope.chatactivity = new ChatActivity(user);
                   $scope.searchActivity = new SearchActivity($scope.currentUser);
                   get_friend_notifications($scope.currentUser);

                   $scope.MessageNotifcations();
                   if($scope.currentUser.friends.length !== 0){
                    $scope.chatactivity.getChatFriends();
                   }
                   socket_operations();
                   loadintodivs();
                });
            });
        }
    })
 .directive('scroll', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
        var raw = element[0];
        raw.scrollTop = 450;
        $timeout(function() {

        });
    },
     controller : function($scope, $element){


        $element.bind('scroll', function(){

            if($element[0].scrollTop == 0){
                $scope.chatactivity.nextPage($element[0].id);
            }
         });

         this.setElement = function(ele){
                $element[0].scrollTop = ($element[0].scrollTop+ele.getBoundingClientRect().top+16);


         }
     }
  }
})
.directive('scrollitem', function($timeout) {
  return {
    require : "^scroll",
    link: function(scope, element, attr, scrollCtrl) {
        scrollCtrl.setElement(element[0]);
      }
  }
})
.directive('upwardsScoll', function ($timeout) {
    return {
        link: function (scope, elem, attr, ctrl) {
            var raw = elem[0];

            elem.bind('scroll', function() {
                if(raw.scrollTop <= 0) {
                    var sh = raw.scrollHeight;
                    scope.$apply(attr.upwardsScoll);

                    $timeout(function() {
                        elem.animate({
                            scrollTop: raw.scrollHeight - sh
                        },500);
                    }, 0);
                }
            });

            //scroll to bottom
            $timeout(function() {
                scope.$apply(function () {
                    elem.scrollTop( raw.scrollHeight );
                });
            }, 500);
        }
    }
})
.controller('feedBackController', function($scope, $timeout, $alert, Restangular){
    $scope.send_feedback = function(){
        $scope.load_add_friend = $timeout(function() {
            if($scope.feedback_data){
                var data = $scope.feedback_data;
                $scope.feedback_data = "";
                Restangular.one('sendfeedback').get({
                        feedback_data : data,
                }).then(function(data){
                    var myAlert = $alert({
                        title: 'Successfully Submitted! :)',
                        placement: 'top',
                        type: 'success',
                        show: true
                    });
                    $timeout(function() {
                        myAlert.hide();
                    }, 5000);
                });
            }
        },200);
    }
})
.controller('CareersCtrl', function($scope, $http, $alert, $timeout, Restangular){
    $scope.position = [
        {name:'Python', guid:'Python'}
    ];
    $scope.selectedPosition = $scope.position[0].guid;

    $scope.Qualification = [
        {name:'Graduate', guid:'Graduate'},
        {name:'Post Graduate', guid:'Post Graduate'},
        {name:'Doctorate', guid:'Doctorate'}
    ];
    $scope.selectedQualification = $scope.Qualification[0].guid;

    $scope.Applying = [
        {name:'Intern', guid:'Intern'},
        {name:'Full Time', guid:'Full Time'}
    ];
    $scope.selectedApplying = $scope.Applying[0].guid;

    $scope.send_eng_career = function(){
        $scope.formCareerSubmit = function(){
            $scope.load_careers_eng = $timeout(function() {
                var first_career = $scope.first_career;
                $scope.first_career = "";

                var last_career = $scope.last_career;
                $scope.last_career = "";

                var selectedQualification = $scope.selectedQualification;
                var selectedPosition = $scope.selectedPosition;
                var selectedApplying = $scope.selectedApplying;

                var email_career = $scope.email_career;
                $scope.email_career = "";

                var phone_career = $scope.phone_career;
                $scope.phone_career = "";
                Restangular.one('send_eng_career').get({
                        first_career : first_career,
                        last_career : last_career,
                        selectedQualification : selectedQualification,
                        selectedPosition : selectedPosition,
                        selectedApplying : selectedApplying,
                        email_career : email_career,
                        phone_career : phone_career
                }).then(function(data){
                    console.log("dataaaaaa", data)
                    var careerAlert = $alert({
                        title: 'Successfully Submitted! :)',
                        placement: 'top',
                        type: 'success',
                        show: true
                    });
                    $timeout(function() {
                        careerAlert.hide();
                    }, 5000);
                });
            },2000);
        }
    }
});