'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:FriendsCtrl
 * @description
 * # FriendsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
  .controller('FriendsCtrl', function($scope, $auth, Restangular, InterestsService,
                InfinitePosts, $alert, $http, CurrentUser, UserService) {
		$scope.UserService = UserService;
		$scope.InterestsService = InterestsService;
		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function(user_id) {

		    var embedded = '{"send_add_requests":1}';
			Restangular.one('people',JSON.parse(user_id)).get({ embeddded: embedded, seed:Math.random()}).then(function(user) {

                $scope.suggested_people = [];
				$scope.user = user;
				$scope.show_only_profile_pic = true;
                $scope.show_only_p_user_pic = false;

                if (user.friends.length !== 0) {
				    var params = '{"_id": {"$in":["'+($scope.user.friends).join('", "') + '"'+']}}';
					Restangular.all('people').getList({where :params}).then(function(friend) {
					   // console.log('===friends====')
					   // console.log(friend)
						$scope.friends = friend;
					});
				}
                // getting suggested friends

                 console.log('before request', $scope.currentUser)
                 var req = {

                        method: 'POST',
                        url: '/api/suggestedFriends',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: {
                            location: $scope.currentUser['location']['state'],
                            friends: $scope.currentUser['friends'],
                            username: $scope.currentUser['username'],
                            _id: $scope.currentUser['_id'],
                            seed: Math.random()
                        }
                 }
                 $http(req).then(function(data){
                     console.log('-----------at suggested people', data)
                     if(data.data.status != false){
                        console.log("user suggestion", data.data.data)
                        $scope.suggested_people = data.data.data;
                        console.log($scope.suggested_people)
                     }
                 })



			});
		});

		$scope.filterFunction = function(element) {
            return element.name.match(/^$scope.searchFriend/) ? true : false;
        };
	});