/*'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:NavbarCtrl
 * @description
 * # NavbarCtrl
 * Controller of the weberApp
 */
/*angular.module('weberApp')
.directive('getuserdata', function () {
    return {
        controller:function($scope, CurrentUser1,$http,Restangular,$auth){
            $http.get('/api/me', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': $auth.getToken()
                }
            }).success(function(user_id) {
                Restangular.one('people',JSON.parse(user_id)).get({seed: Math.random()}).then(function(user) {
                    $scope.currentUser = user;
                });
            });
        }
    }
});*/
