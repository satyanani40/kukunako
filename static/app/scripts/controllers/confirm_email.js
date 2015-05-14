'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:EmailCtrl
 * @description
 * # EmailCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('EmailCtrl', function($http, Restangular, $scope, $auth, $alert, $location, $routeParams) {

        Restangular.one('people',$routeParams.objectId).get({seed:Math.random()}).then(function(user) {
              //console.log('objectid', $routeParams.objectId)
              //console.log('user', user);
              $scope.user = user;
              if($routeParams.rand_string == $scope.user.random_string){
                //console.log('random stirng==>', $scope.user.random_string)
                if($scope.user.email_confirmed == true){
                    //console.log('iner true===>', $scope.user.email_confirmed)
                    $scope.user_email_confirmed = "your email is already activated";
                    return;
                }
                //console.log('email confirmed-->',$scope.user.email_confirmed)
                $scope.user.patch({
                        email_confirmed : true
                },{},{'If-Match': $scope.user._etag}).then(function(response){
                        //console.log('---------->', response);
                        //$location.path('/login');
                });
              }
        });
    });