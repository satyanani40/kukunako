'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:UserprofileCtrl
 * @description
 * # UserprofileCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('UserprofileCtrl', function($scope, $routeParams,$templateCache, sortIListService, questions,
	                                        Restangular, InfinitePosts, UserService,MatchButtonService,
	                                        CurrentUser, InterestsService, friendsActivity) {

		$scope.UserService = UserService;
		$scope.MatchButtonService = MatchButtonService;
		$scope.sortIListService = sortIListService;
		$scope.InterestsService = InterestsService;
		$scope.show_only_profile_pic = false;
        $scope.show_only_p_user_pic = true;
        $scope.show_c_user_info = false;
        $scope.show_p_user_info = true;

        Restangular.one('people', $routeParams.username)
        .get({ seed : Math.random()}).then(function(profileuser) {
    		// profile user information
	    	$scope.profileuser = profileuser;
            // questions section functions
            $scope.questions = new questions(profileuser);
            //$scope.questions.getcquestions();
            $scope.questions.getUserQuestions();

            if ( $scope.profileuser.friends.length !== 0) {
                var params = '{"_id": {"$in":["'+($scope.profileuser.friends).join('", "') + '"'+']}}'
                Restangular.all('people').getList({
                    where:params,
                    seed:Math.random()
                }).then(function(friends) {
                    $scope.friends = friends;
                });
            }

            var loadPostIds = [];
            loadPostIds.push(profileuser._id);
            loadPostIds = "[\"" + loadPostIds.join("\",\"") + "\"]";
            $scope.infinitePosts = new InfinitePosts($scope.profileuser, loadPostIds);
            $scope.infinitePosts.getEarlyPosts();

            $scope.checkAnswer = function(question_id){
                data = $scope.questions.checkAnswer(question_id);
                return data;
            }

             $scope.answered = function(question, ans){
                 $scope.questions.updateAnswer(question, ans);
                 console.log(question, ans)
             }

        // end of profile user information
        var currentuserobj = new CurrentUser();
        currentuserobj.getUserId()
            .then(function(){
                currentuserobj.getCUserDetails(currentuserobj.userId).then(function(user){

                        $scope.checkYouAnswered = function(question_id){
                            data = $scope.questions.checkYouAnswered(question_id, user);
                            return data;
                        }

                        $scope.youAnswered = function(question, ans){
                            $scope.questions.updateUser2(question, ans);
                            console.log(question, ans)
                        }
                         // end of questions section
                        $scope.user = user;

                        if($scope.user._id !== $scope.profileuser._id){
                            var friendsactivity = new friendsActivity($scope.user, $scope.profileuser);
                            //console.log(friendsactivity)
                            $scope.check_relation = function(){
                                $scope.relation = friendsactivity.getRelation();
                                return $scope.relation;
                            }
                        }

                        $scope.pushToPost = function(postauthor, postid){
                            //console.log('match user id', user._id)
                            var posts = $scope.infinitePosts.posts;
                            for(var temp in posts){
                                if(posts[temp]._id == postid){
                                    postauthor = posts[temp].author;
                                    postid = posts[temp]._id;

                                    var iPeople = posts[temp].interestedPeople;
                                    for(var i in iPeople){
                                        if(iPeople[i].interested_person == user._id){
                                            return true;
                                        }
                                    }
                                    iPeople.push({'interested_person': user._id, 'match_date': new Date()});
                                    //console.log('post author-->', postauthor)
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
                                                console.log('unmatch disagree succesfully-->', data);
                                           });
                                        }
                                    }

                                }
                            }
                        }


                    //
                });
           });
	});
});