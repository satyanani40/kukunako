'use strict';
/**
 * @ngdoc function
 * @name weberApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('MainCtrl', function($scope, $auth, $rootScope, $socket, Restangular, InfinitePosts,questions,
	                                $alert, $http, CurrentUser,sortIListService, InterestsService,$location,
	                                UserService, fileUpload, MatchButtonService) {
		$scope.UserService = UserService;
        $scope.MatchButtonService = MatchButtonService;
        $scope.sortIListService = sortIListService;
        $scope.InterestsService = InterestsService;
        console.log("====interests service", $scope.InterestsService)
		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': $auth.getToken()
			}
		}).success(function(user_id) {
		    console.log('authorize token', $auth.getToken())
			Restangular.one('people',JSON.parse(user_id)).get({seed:Math.random()},{'Authorization': $auth.getToken()}).then(function(user) {
                console.log('user==>', user)
                $rootScope.currentUser = user;


                // checking enter minimum interests
                if($rootScope.currentUser.interests.length == 0 && $rootScope.currentUser.questions.length < 4){
                    console.log('interests length', $rootScope.currentUser.questions.length, $rootScope.currentUser.interests.length)
                    $location.path("/enter_interests")
                }



                //delete the post from infinite posts of the current user
                function checkdeletepost(post_id){
                    var status = false;
                    var post = null;
                    for(var k in $scope.infinitePosts.posts){
                        if($scope.infinitePosts.posts[k]._id == post_id &&
                            $scope.infinitePosts.posts[k].author == $rootScope.currentUser._id){
                                status = true;
                                post =  $scope.infinitePosts.posts[k];
                            }
                    }
                    return ({status:status, post:post});
                }
                $scope.confirm_delete = function(get_post_id){
                    var result = checkdeletepost(get_post_id);
                    if(result.status){
                        $scope.infinitePosts.deletePost(result.post);
                    }
                }
                // questions section functions
                $scope.questions = new questions($rootScope.currentUser);
                $scope.questions.getallquestions();


                $scope.answered = function(question, ans){
                    $scope.questions.updateAnswer(question, ans, $rootScope.currentUser._id);
                    console.log(question, ans)
                }

                $scope.checkAnswer = function(question_id){
                    data = $scope.questions.checkAnswer(question_id);
                    return data;
                }
                // end of questions section
				var loadPostIds = angular.copy($rootScope.currentUser.friends);
                loadPostIds.push($rootScope.currentUser._id);
                loadPostIds = "[\"" + loadPostIds.join("\",\"") + "\"]";

                $scope.infinitePosts = new InfinitePosts($rootScope.currentUser, loadPostIds);
                $scope.infinitePosts.getEarlyPosts();

				$scope.submit_post = function(){
                     if($scope.new_post) {
                        $scope.new_submit_busy_post = $http({
                            url: '/api/simwords',
                            method: "GET",
                            params: {querystring: $scope.new_post}
                        })
                            .success(function (similarwords) {

                                $scope.infinitePosts.addPost($scope.new_post, similarwords, $rootScope.server_file_path);
                                $scope.new_post = '';
                            });

                    }else{
                        return false;
                    }
				};
                $socket.on('postNotifications', function(data){

                    if(data.data.postnotific){
                        if($rootScope.currentUser.friends.indexOf(data.author) == -1){
                            //console.log('no a friend')
                        }else if($rootScope.currentUser.friends.indexOf(data.author != -1) && data.postid != 'undefined'){
                            $scope.infinitePosts.loadNotificPost(data.postid, data.author);
                        }else{
                            //console.log('nothing to do')
                        }
                    }
                });

                $scope.pushToPost = function(postauthor, postid){
                    //console.log('match user id', user._id)
                    var index = null;
                    var posts = $scope.infinitePosts.posts;
				    for(var temp in posts){
				        if(posts[temp]._id == postid){
                            index = temp;
				            postauthor = posts[temp].author;
				            postid = posts[temp]._id;

				            var iPeople = posts[temp].interestedPeople;
				            for(var i in iPeople){
				                if(iPeople[i].interested_person == $rootScope.currentUser._id){
				                    return true;
				                }
                            }
                            iPeople.push({'interested_person': $rootScope.currentUser._id, 'match_date': new Date()});
                            //console.log('post author-->', postauthor)
                            MatchButtonService.match(postauthor, postid , $rootScope.currentUser._id).then(function(data){
                                //console.log('match agree succesfully-->', data);
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
				                if(iPeople[i].interested_person == $rootScope.currentUser._id){
				                   iPeople.splice(i,1);
				                   MatchButtonService.unmatch(postauthor, postid, $rootScope.currentUser._id).then(function(data){
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
