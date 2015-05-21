'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:EmailCtrl
 * @description
 * # EmailCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('EmailCtrl', function($http, $timeout, $route, Restangular, $scope, $auth, $alert, $location, $routeParams) {

        Restangular.one('people',$routeParams.objectId).get({seed:Math.random()}).then(function(user) {
              $scope.user = user;
              if($routeParams.rand_string == $scope.user.random_string){
                if($scope.user.email_confirmed == true){
                    $scope.user_email_confirmed = "your email is already activated";
                    $location.path('/home');
                    return;
                }
                $scope.user.patch({
                        email_confirmed : true
                },{},{'If-Match': $scope.user._etag}).then(function(response){
                        var interestsAlert = $alert({
                            title: 'Success',
                            content: 'Email Confirmed',
                            placement: 'top',
                            type: 'success',
                            show: true
                        });
                        $timeout(function() {
                            interestsAlert.hide();
                        }, 5000);
                        $timeout(function(){
                            $location.path('/home');
                        })
                });
              }
        });
    });