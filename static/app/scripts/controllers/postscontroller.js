'use strict';
/**
 * @ngdoc function
 * @name weberApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('PostLoadController', function($http, $auth, Restangular, $scope,
	                                           $routeParams, PostService, InfinitePosts,MatchButtonService) {

	    $scope.postid = $routeParams.postid;
	    $scope.MatchButtonService = MatchButtonService;
	    $http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': $auth.getToken()
			}
		}).success(function(user_id) {
			Restangular.one('people',JSON.parse(user_id)).get({seed:Math.random()}).then(function(user) {

                $scope.user = user;
				var loadPostIds = angular.copy(user.friends);

                if (user.friends.length !== 0) {

				    var params = '{"_id": {"$in":["'+($scope.user.friends).join('", "') + '"'+']}}';

					Restangular.all('people').getList({where :params}).then(function(friend) {
						$scope.friends = friend;
					});
				}

				$scope.infinitePosts = new InfinitePosts(user, []);
				$scope.infinitePosts.getSpecificPost($routeParams);

                $scope.confirm_delete = function(){
                    $scope.infinitePosts.deletePost($scope.infinitePosts.posts[0], user);
                }

                $scope.pushToPost = function(postauthor, postid){
                    var posts = $scope.infinitePosts.posts;

                    for(var temp in posts){
                        if(posts[temp]._id == postid){
                            var iPeople = posts[temp].interestedPeople;
                            for(var i in iPeople){
                                if(iPeople[i].interested_person == user._id){
                                    return true;
                                }
                            }
                            iPeople.push({'interested_person': user._id, 'match_date': new Date()});
                            //console.log('post author-->', postauthor)
                            //console.log('postauthor-->', postauthor)
                            //console.log('postid -->', postid)
                            //console.log('user id-->', user._id)
                            MatchButtonService.match(postauthor, postid , user._id).then(function(data){
                                console.log('match agree succesfully-->', data);
                            });

                        }
                    }
	            }

                $scope.deleteFromPost = function(postauthor, postid){

                    //console.log('unmatch user id', user._id)
                    var posts = $scope.infinitePosts.posts;

                    for(var temp in posts){
                        // if post contains with post id
                        if(posts[temp]._id == postid){
                            var iPeople = posts[temp].interestedPeople;
                            for(var i in iPeople){
                                if(iPeople[i].interested_person == user._id){
                                   iPeople.splice(i,1);
                                   MatchButtonService.unmatch(postauthor, postid, user._id).then(function(data){
                                        //console.log('unmatch disagree succesfully-->', data);
                                   });
                                }
                            }

                        }
                    }
                }


			});
		});

	});