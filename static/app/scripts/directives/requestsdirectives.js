angular.module('weberApp')

.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
})

.directive('chatdivdir', function () {
    return {
        restrict: 'A',
        replace: true,
        controller:function($scope, $element, $attrs){
            $scope.chatroomdiv = function(id){
                if($element[0].offsetHeight == 364){
                    $element.css('height', '40px');
                    var data = JSON.parse(sessionStorage.getItem(id));
                    var json = {
                                      name:data.name,
                                      id: data.id,
                                      minimize:true,
                                      maximize:false,
                                      right:0,
                                      height:'40px'
                    }
                    sessionStorage.removeItem(id);
                    sessionStorage.setItem(data.id, JSON.stringify(json));

                }else{

                    $element.css('height', '364px');
                    $scope.chatdivnotification = [];

                    var data = JSON.parse(sessionStorage.getItem(id));
                    var json = {
                                      name:data.name,
                                      id: data.id,
                                      minimize:false,
                                      maximize:true,
                                      right:0,
                                      height:'364px'
                          }

                    sessionStorage.removeItem(id);
                    sessionStorage.setItem(data.id, JSON.stringify(json));
                    //console.log('chat div notifications============')
                    // make message notifications on div seen
                    $scope.newMessageSeen(data.id);
                }
            }

        }


    };
})


.directive('cancelrequest', function ($compile, $timeout, CurrentUser, Restangular, $rootScope,
                                        $routeParams, $route,friendsActivity, Friends) {
    return {
        restrict: 'E',
        replace: true,

        link: function ($scope, element, attrs ) {},
         controller:function($scope, $element, $attrs, $transclude){
         $scope.frndaddrequest = function(profileuser_id, fromRequest){

             $scope.load_cancel_request = $timeout(function() {
                    var html = '';
                    var e = null;
                    $element.html(html);
                    $compile($element.contents())($scope);
                    var data = Friends.addFriend($rootScope.currentUser._id, profileuser_id);
                    data.then(function(data){
                        if(data.data && !(fromRequest)){
                             var html ='<addfriend><button ng-click="frndcancelrequest(\''+profileuser_id+'\', 0)"'
                             +'class="btn  btn-sm btn-primary">cancel request</button></addfriend>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                                /*if($scope.currentUser.send_add_requests.indexOf(id) == -1){
                                    $scope.currentUser.send_add_requests.push(id);

                                }*/
                        }else if(data.data && fromRequest) {
                             var html ='<button  class="btn btn-sm btn-primary">Successfully Added</button>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                               /* if($scope.currentUser.send_add_requests.indexOf(id) == -1){
                                    $scope.currentUser.send_add_requests.push($scope.profileuser);
                                }*/


                        }else{
                             var html ='<b>unable to process</b>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                             $route.reload();
                        }
                    });
                },2000);
             }

         }

    };
})

.directive('addfriend', function ($compile, $timeout, CurrentUser, Restangular,$route, $routeParams,
                                                                $rootScope,friendsActivity, Friends) {
    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, $element, attrs) {},
         controller:function($scope, $element, $attrs, $transclude){
         $scope.frndcancelrequest = function(profile_user_id, requestFrom){
               $scope.load_cancel_request = $timeout(function() {
                   var html = '';
                   var e = null;
                   $element.html(html);
                   $compile($element.contents())($scope);

                   var data = Friends.cancelRequest($rootScope.currentUser._id, profile_user_id);

                   data.then(function(data){
                        if(data.data && !(requestFrom)){
                             var html ='<cancelrequest><button  ng-click="frndaddrequest( \''+profile_user_id+'\', 0)"'
                             +'class="btn btn-sm btn-primary">Add Friend</button></cancelrequest>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                             /*if($scope.currentUser.send_add_requests.indexOf(id) !== -1){
                                $scope.currentUser.send_add_requests.splice($scope.currentUser.send_add_requests.indexOf(id), 1);
                              }*/

                        }else if(data.data && requestFrom) {
                             var html ='<b> request has been cancelled </b>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                        }else{

                             var html ='<b>unable to process</b>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                             $route.reload();
                        }
                    });
                    /*$scope.load_add_friend = $timeout(function() {

                        if(profileuser !== 'undefined'){
                            $scope.profileuser = profileuser;
                        }

                        var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                        var e = null;
                        $element.html(html);
                        $compile($element.contents())($scope);

                        var data = Friends.cancelRequest($scope.user._id, $scope.profileuser._id);
                        //console.log('data----------->', data)
                        data.then(function(data){
                            //console.log('data123--------->', data)
                            if(data.data){
                                 var html ='<cancelrequest><button  ng-click="frndaddrequest(\''+id+'\', \''+profileuser+'\')"  class="btn btn-primary btn-sm">AddFriend</button></cancelrequest>';
                                 e =$compile(html)($scope);
                                 $element.replaceWith(e);
                                    console.log("---------------")
                                    for(var temp in $scope.currentUser.send_add_requests){
                                        if($scope.currentUser.send_add_requests[temp]._id == id){
                                            $scope.currentUser.send_add_requests.splice(temp, 1);
                                            return;
                                        }

                                    }

                                 //$route.reload();
                            }else{
                                 var html ='<b>unable to process</b>';
                                 e =$compile(html)($scope);
                                 $element.replaceWith(e);
                                 $route.reload();
                            }
                        });
                    },2000);*/
                   },2000);
               }
         }
    };
})

.directive('acceptreject', function ($compile, $timeout, $window, CurrentUser, Restangular,$route, $routeParams,
                    Friends, $rootScope, friendsActivity) {
    return {
        restrict: 'E',
        replace: true,
        link: function (scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){

            $scope.acceptrequest = function(profile_user_id, navbar_request){
                $scope.load_cancel_request = $timeout(function(){

                    var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                    var e = null;
                    $element.html(html);
                    $compile($element.contents())($scope);
                    console.log("----------------------->", $rootScope.currentUser._id, profile_user_id)
                    var data = Friends.acceptRequest($rootScope.currentUser._id, profile_user_id);
                    data.then(function(data){
                        if(data.data){
                             if(navbar_request){
                                html = '<b> friends </b>';
                                e =$compile(html)($scope);
                                $element.replaceWith(e);
                             }else{
                                html ='<unaddfriend><button ng-click="friendunfriend(\''+profile_user_id+'\', 0)"'+
                                    'class="btn btn-sm btn-primary">unfriend</button></unaddfriend>';
                                e =$compile(html)($scope);
                                $element.replaceWith(e);
                                //$window.location.reload();
                                /*for(var temp in $scope.currentUser.send_add_requests){
                                    if($scope.currentUser.send_add_requests[temp]._id == id){
                                        return;
                                    }
                                }*/
                                //$scope.currentUser.send_add_requests.push($scope.profileuser)
                             }
                        }else{
                             var html ='<b>unable to process</b>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                             $route.reload();
                        }
                    });
                },2000);
            }

            $scope.rejectrequest = function(profile_user_id, requestFrom){
                $scope.load_cancel_request = $timeout(function(){
                    var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                    var e = null;
                    $element.html(html);
                    $compile($element.contents())($scope);
                    console.log("----------------------->", $rootScope.currentUser._id, profile_user_id)
                    var data = Friends.rejectRequest($rootScope.currentUser._id, profile_user_id);
                    data.then(function(data){
                        if(data.data){
                            if(requestFrom){
                                html = '<b>rejected</b>';
                            }else{
                                html ='<cancelrequest><button ng-click="frndaddrequest(\''+profile_user_id+'\', 0)" \
                                class="btn btn-sm btn-sm btn-primary">Add Friend</button></cancelrequest>';
                            }
                            e =$compile(html)($scope);
                            $element.replaceWith(e);
                        }else{
                             html ='<b>unable to process</b>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                             $route.reload();
                        }
                    });
                },2000);
            }
        }
    };
})
.directive('unaddfriend', function ($compile, $timeout, CurrentUser,$window, Restangular, $routeParams,
                                    Friends, $rootScope, friendsActivity,$route) {
    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){
            $scope.friendunfriend = function(profile_user_id, requestFrom){
                $scope.load_cancel_request = $timeout(function(){
                    var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                    var e = null;
                    $element.html(html);
                    $compile($element.contents())($scope);
                    var data = Friends.unFreind($rootScope.currentUser._id, profile_user_id);
                    data.then(function(data){
                        if(data.data){
                            if(requestFrom){
                                html = '<b> successfully processed</b>'
                            }else{
                             html ='<cancelrequest><button ng-click="frndaddrequest(\''+profile_user_id+'\', 0)"'+
                             'class="btn btn-sm btn-primary">Add Friend</button></cancelrequest>';
                             }
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                        }else{
                             html ='<b>unable to process</b>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                             $route.reload();
                        }
                    });
                },2000);
            }
        }
    };
});
