'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:EmailDetailsCtrl
 * @description
 * # EmailDetailsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('enterInterestsCtrl', function($timeout, questions, InterestsService, $http, Restangular, $scope, $auth, $alert, $location, $routeParams) {

        //var element = $routeParams.userId;
        //console.log(element)

        $scope.email = $routeParams.email;
        //console.log($scope.user);
        $scope.show_interests = true;
        $scope.show_questions = false;
        $scope.final_interests_array = [];

        $scope.$watchCollection('data.tags',function(val){
            $scope.final_interests_array = val;
        });

        $http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': $auth.getToken()
			}
		}).success(function(userId) {
            Restangular.one('people', JSON.parse(userId)).get({seed:Math.random()}).then(function(user) {

                $scope.currentUser = user;

                $scope.afterFinishQuestions = function(){
                    $location.path('/home');
                }
                // questions section functions
                $scope.questions = new questions(user);
                $scope.questions.getallquestions();

                $scope.answered = function(question, ans){

                    for(var temp in $scope.currentUser.questions){
                        if($scope.currentUser.questions[temp].questionid == question){
                            $scope.currentUser.questions[temp].answer = ans;
                            $scope.questions.updateAnswer(question, ans, $scope.currentUser._id);
                            return;
                        }
                    }

                    $scope.currentUser.questions.push({'questionid':question, 'answer': ans});
                    console.log('pushed answereds', $scope.currentUser.questions)
                    $scope.questions.updateAnswer(question, ans, $scope.currentUser._id);
                    return;
                }

                $scope.checkAnswer = function(question_id){
                    data = $scope.questions.checkAnswer(question_id);
                    return data;
                }
                // end of questions section

                if($scope.currentUser.interests.length){
                    // success show
                    $scope.show_interests = false;
                    $scope.show_questions = true;
                }
                else{
                    // success hide
                    $scope.show_interests = true;
                    $scope.show_questions = false;
                }
                $scope.newUserInterests = function(){
                    for(var temp in $scope.currentUser.interests){
                        $scope.final_interests_array.push(InterestsService.get($scope.currentUser.interests[temp]).interest_string)
                    }
                    $scope.Interests_busy = $timeout(function() {
                        $http.post('/get_interested_ids',
                        {
                            interests: $scope.final_interests_array,
                            username: $scope.currentUser.username
                        })
                        .success(function(data, status, headers, config) {
                            console.log("======return success of interests of ids",data);
                            $scope.currentUser.interests = data.interests;
                            $scope.show_interests = false;
                            $scope.show_questions = true;
                            var interestsAlert = $alert({
                                title: 'Success',
                                content: 'Updated your Interests',
                                placement: 'top',
                                type: 'success',
                                show: true
                            });
                            $timeout(function() {
                                interestsAlert.hide();
                            }, 5000);
                        })
                        .error(function(data, status, headers, config) {
                            //console.log("====error of interests", data.data)
                        });
                    },2000);
                }

            });
        });
    });'use strict';

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
    });'use strict';

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
	});'use strict';
/**
 * @ngdoc function
 * @name weberApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('PostLoadController', function($http, $auth, InterestsService, Restangular, $scope,
	                                           $routeParams, PostService, InfinitePosts,MatchButtonService) {

	    $scope.postid = $routeParams.postid;
	    $scope.MatchButtonService = MatchButtonService;
	    $scope.InterestsService = InterestsService;
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

	});'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:NavbarCtrl
 * @description
 * # NavbarCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
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
});
'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:WeberSearchCtrl
 * @description
 * # WeberSearchCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
    .controller('WeberSearchCtrl', function($scope, $timeout, $q, $auth, Restangular,$route,$window, InterestsService,
	 										InfinitePosts, $alert, $http,$location,$socket,
	 										CurrentUser, UserService,CurrentUser1,$rootScope,
	 										SearchActivity, $routeParams, MatchMeResults) {
	 	$scope.searched = false;
	 	$scope.UserService = UserService;
	 	$scope.InterestsService = InterestsService;

        if(typeof $scope.currentUser === 'undefined' && !($scope.isAuthenticated())){
            $http.get('/api/me', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': $auth.getToken()
                }
            }).success(function(user_id) {
                var params = '{"send_add_requests":1}';
                Restangular.one('people',JSON.parse(user_id)).get({embedded:params, seed: Math.random()}).then(function(user) {
                    $scope.currentUser = user;
                    // check interests and questions answered or not
                    if($scope.currentUser.interests.length == 0 &&
                        $scope.currentUser.questions.length < 4){

                        console.log($scope.currentUser.interests.length,'==>', $scope.currentUser.interests)
                        console.log($scope.currentUser.questions.length,'==>', $scope.currentUser.questions)
                        //$location.path("/enter_interests")
                    }

                    //console.log($scope.currentUser);
                    $scope.searchActivity = new SearchActivity($scope.currentUser);
                    $scope.searchActivity.getMysearches();
                    store_search_text($routeParams.query);

                });
            });

        }else{
            if($scope.currentUser.interests.length == 0 &&
                $scope.currentUser.questions.length < 4){
                console.log($scope.currentUser.interests.length,'==>', $scope.currentUser.interests)
                console.log($scope.currentUser.questions.length,'==>', $scope.currentUser.questions)
                //$location.path("/enter_interests")
            }
            //console.log($scope.currentUser);
            $scope.searchActivity = new SearchActivity($scope.currentUser);
            $scope.searchActivity.getMysearches();
            store_search_text($routeParams.query);
        }

        // delete search history item
        $scope.delete_searchHistoryItem = function(id){
            $scope.delete_searchHistory = $timeout(function(){
                $scope.searchActivity.deleteItem(id);
            },2000);
        }

        $scope.perfomSearch = function(){
            $scope.load_data = $timeout(function(){
                $scope.search = true;
                if($scope.present_search_query == $scope.query) return;
                if($scope.query){
                    // alredy present searched query no need to search again
                    $location.search('query', $scope.query);
                    $scope.matchResults = new MatchMeResults($scope.query, $scope.location);
                    $scope.matchResults.newSearchResults();
                    if($scope.isAuthenticated()){
                        store_search_text($scope.query);
                    }
                }
                $scope.present_search_query = $scope.query;
            },2000);
        }

        $scope.storequestion = function(){
            var question = $scope.enterquestion;
            $scope.enterquestion = null;
            Restangular.all('questions').post({
                'question':question
            }).then(function(data){
                console.log('questions posted',data)
            });
        }

        $scope.go = function(query){
            $scope.query = query;
            $scope.perfomSearch($scope.query);
        }

        function combine_ids(ids) {
   				return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        if($routeParams.query){
            $scope.search = $routeParams.query;
            $scope.query = $routeParams.query;
            $scope.matchResults = new MatchMeResults($routeParams.query,$scope.location);
            $scope.matchResults.newSearchResults();
            $scope.searched=true;
        }

        function store_search_text(searchText){
            if(searchText){
                $scope.searchActivity.addSearchText(searchText);
            }
        }
 	});



'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('SettingsCtrl',
	    function($route, $location, $timeout, $window, $scope, $auth, $q, $rootScope,InterestsService,
	                Restangular, InfinitePosts, $alert, $http, CurrentUser, UserService) {


        $scope.searched = false;
	 	$scope.searchBusy = false;
		$scope.UserService = UserService;
        $scope.InterestsService = InterestsService;
        console.log("interests", $scope.InterestsService)

        $scope.$watchCollection('data.tags',function(val){
            console.log("----->>>> this controller")
            console.log(val);


            $scope.final_interests_array = val;
            console.log("array of interests====>>>>>", $scope.final_interests_array);
        });

		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
                'Authorization':$auth.getToken()
			}
		}).success(function(user_id) {

			var passReq = Restangular.one("people", JSON.parse(user_id)).get({seed:Math.random()})
			.then(function(result) {
               $scope.user = result;
               // --------------------------start of image croping----------------------
               $scope.myImage='';
               $scope.myCroppedImage='';
               var handleFileSelect=function(evt) {
                  var file=evt.currentTarget.files[0];
                  var reader = new FileReader();
                  reader.onload = function (evt) {
                    $scope.$apply(function($scope){
                      $scope.myImage=evt.target.result;
                        console.log($scope.myImage)
                    });
                  };
                  reader.readAsDataURL(file);
               };

               angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);

               $scope.$watch('myCroppedImage',function(){
                    console.log('ddd')
                    console.log('Res image==->', $scope.myCroppedImage);
               });

               $scope.update_image = function(){
                    console.log('called')
                    console.log('---------->',    $scope.myImage)
                    console.log('=============>', $scope.myCroppedImage)

                    $scope.UploadImage_busy = $timeout(function() {
                       var req = {
                            method: 'POST',
                            url: '/api/imagecrop',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: {
                                cropped_image: $scope.myCroppedImage,
                                original_image: $scope.myImage,
                                user_id : $scope.user._id
                            }
                       }

                       $http(req).success(function (people) {
                            var userNameAlert = $alert({
                                title: 'Success',
                                content: 'Updated your Image',
                                placement: 'top',
                                type: 'success',
                                show: true
                            });
                            $timeout(function() {
                                userNameAlert.hide();
                            }, 5000);
                            $timeout(function(){
                                $window.location.reload();
                            },1000);
                            //console.log(self.InstancesearchResult)
                       });

                    },2000);
               }

                // -------------------end of image croping------------------


                $scope.updateUsername = function() {
                    $scope.Username_busy = $timeout(function() {
                        var Get_User_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_User_details.then(function(response){
                            $scope.user = response;
                            $scope.user.username = $scope.u_username;
                            $scope.user.patch({
                                'username':$scope.u_username
                            }).then(function(response){
                                $scope.u_username = '';
                                var userNameAlert = $alert({
                                    title: 'Success',
                                    content: 'Updated your Username',
                                    placement: 'top',
                                    type: 'success',
                                    show: true
                                });
                                $timeout(function() {
                                    userNameAlert.hide();
                                }, 5000);
                                $timeout(function(){
                                    $('#1').collapse("hide");
                                },1000);
                            });
                        });
                    },2000);
                };

                $scope.updateFirstLastName = function() {
                    $scope.FirstLast_busy = $timeout(function() {
                        var Get_first_last_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                            Get_first_last_details.then(function(response){
                            $scope.user = response;
                            $scope.user.name.first = $scope.edit_first_name;
                            $scope.user.name.last = $scope.edit_last_name;
                            //console.log("=========before patch========")
                            $scope.user.patch({
                                'name':{
                                    'first':$scope.edit_first_name,
                                    'last':$scope.edit_last_name
                                }
                            }).then(function(response){
                                $scope.edit_first_name = '';
                                $scope.edit_last_name = '';
                                var userNameAlert = $alert({
                                    title: 'Success',
                                    content: 'Updated your Name',
                                    placement: 'top',
                                    type: 'success',
                                    show: true
                                });
                                $timeout(function() {
                                    userNameAlert.hide();
                                }, 5000);
                                $timeout(function(){
                                    $('#2').collapse("hide");
                                },1000);
                            });
                        });
                    },2000);
                };

                $scope.updateEmail = function() {
                    $scope.Email_busy = $timeout(function(){
                        var Get_first_last_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                            Get_first_last_details.then(function(response){
                            $scope.user = response;
                            $scope.user.username = $scope.u_username;

                            $scope.user.patch({
                                'email':$scope.u_email
                            }).then(function(response){
                                var userNameAlert = $alert({
                                    title: 'Success',
                                    content: 'Updated your Email',
                                    placement: 'top',
                                    type: 'success',
                                    show: true
                                });
                                $timeout(function() {
                                    userNameAlert.hide();
                                }, 5000);
                                $timeout(function(){
                                    $('#2').collapse("hide");
                                },1000);
                            });
                        });
                    },2000);
                };

                $scope.checkUserCurrentPassword = function(){

                    $http.post('/check_user_current_password',
                        {
                            user_name:$scope.user.username,
                            old_password:$scope.formData.cPassword
                        })
                        .success(function(data, status, headers, config) {
                            $scope.if_user_password_is_incorrect = false;
                        })
                        .error(function(error, status, headers, config) {
                            $scope.if_user_password_is_incorrect = error.error;
                        });
                }


                $scope.updatePassword = function() {
                    console.log("scope----", $scope.if_user_password_is_incorrect)
                    if ($scope.if_user_password_is_incorrect == false) {
                        $scope.Password_busy = $timeout(function(){

                            $http.post('/get_new_hash_password',{
                                user_name:$scope.user.username,
                                new_password:$scope.formData.password
                            })
                            .success(function(data, status, headers, config) {


                                $scope.get_hash_new_password = data;



                                var updating_user_password = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                                updating_user_password.then(function(response){


                                    $scope.user_updated_data = response;
                                    $scope.user.password.password_updated = new Date();
                                    $scope.user_updated_data.patch({
                                        'password':{
                                            'password':$scope.get_hash_new_password,
                                            'password_test':$scope.formData.password,
                                            'password_updated':new Date()
                                        }
                                    }).then(function(response){
                                        var userNameAlert = $alert({
                                            title: 'Success',
                                            content: 'Updated your Password',
                                            placement: 'top',
                                            type: 'success',
                                            show: true
                                        });
                                        $timeout(function() {
                                            userNameAlert.hide();
                                        }, 5000);
                                        $timeout(function(){
                                            $('#7').collapse("hide");
                                        },1000);
                                    });

                                });
                            });
                        },2000);
                    }else{
                        $scope.show_error_password = true;
                    }
                };

                $scope.updateInterests = function() {

                    for(var temp in $scope.user.interests){
                        $scope.final_interests_array.push(InterestsService.get($scope.user.interests[temp]).interest_string)
                    }

                    $scope.Interests_busy = $timeout(function() {
                        $http.post('/get_interested_ids',
                        {
                            interests: $scope.final_interests_array,
                            username: $scope.user.username
                        })
                        .success(function(data, status, headers, config) {
                            console.log("======return success of interests of ids",data.data);
                            $scope.InterestsService = InterestsService;
                            var interestsAlert = $alert({
                                title: 'Success',
                                content: 'Updated your Interests',
                                placement: 'top',
                                type: 'success',
                                show: true
                            });
                            $timeout(function() {
                                interestsAlert.hide();
                            }, 5000);
                            $timeout(function(){
                                $('#4').collapse("hide");
                            },1000);
                        }).
                        error(function(data, status, headers, config) {
                            console.log("====error of interests", data.data)
                        });
                    },2000);
                };

                $scope.updatechangelocation = function() {
                    $scope.Location_busy = $timeout(function(){
                        var Get_location_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                            Get_location_details.then(function(response){
                            $scope.user = response;

                            $scope.user.location.state = $scope.location_state;
                            $scope.user.location.city = $scope.location_city;
                            $scope.user.location.street = $scope.location_street;

                            $scope.user.patch({
                                'location':{
                                    'state':$scope.location_state,
                                    'city':$scope.location_city,
                                    'street':$scope.location_street
                                }
                            },{},{'If-Match':$scope.user._etag})
                            .then(function(response){
                                var interestsAlert = $alert({
                                    title: 'Success',
                                    content: 'Updated your Location',
                                    placement: 'top',
                                    type: 'success',
                                    show: true
                                });
                                $timeout(function() {
                                    interestsAlert.hide();
                                }, 5000);
                                $timeout(function(){
                                    $('#5').collapse("hide");
                                },1000);
                            });
                        });
                    },2000);
                };
                $scope.updatechangestudy = function() {
                    $scope.Study_busy = $timeout(function(){
                        var Get_study_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                            Get_study_details.then(function(response){
                            $scope.user = response;
                            $scope.user.study.school = $scope.study_school;
                            $scope.user.study.graduate = $scope.study_graduate;
                            $scope.user.patch({
                                'study':{
                                    'school':$scope.study_school,
                                    'graduate':$scope.study_graduate
                                }
                            },{},{'If-Match':$scope.user._etag})
                            .then(function(response){
                                var interestsAlert = $alert({
                                    title: 'Success',
                                    content: 'Updated your Study',
                                    placement: 'top',
                                    type: 'success',
                                    show: true
                                });
                                $timeout(function() {
                                    interestsAlert.hide();
                                }, 5000);
                                $timeout(function(){
                                    $('#6').collapse("hide");
                                },1000);
                            });
                        });
                    },2000);
                };
			});
        });
	})
	.directive('tagsComplete',['$http',function($http){
        return {

            restrict:'AE',

            scope:{
                selectedTags:'=model'
            },

            templateUrl:'/static/app/views/autocomplete-template.html',
            link:function(scope,elem,attrs,Restangular){
                scope.suggestions=[];
                scope.selectedTags=[];
                scope.selectedIndex=-1;
                scope.removeTag=function(index){
                    scope.selectedTags.splice(index,1);
                    console.log("remove tags===", scope.selectedTags)
                }

                scope.search=function(){
                    var param1 = '{"interest_string":{"$regex":".*'+scope.searchText+'.*"}}';
                    var interests = [];
                    $http.get('/api/interests?where='+param1)
                    .success(function(data){
                        console.log("sss",data)
                        for(var temp in data._items){
                            console.log(data._items[temp].interest_string)
                            interests.push(data._items[temp].interest_string)
                        }
                        if(interests.indexOf(scope.searchText) === -1){
                            interests.unshift(scope.searchText);
                        }

                        console.log('interests===>', interests)
                        scope.suggestions= interests;
                        scope.selectedIndex=-1;
                    });
                }

                scope.addToSelectedTags=function(index){
                    if(scope.selectedTags.indexOf(scope.suggestions[index])===-1){
                        scope.selectedTags.push(scope.suggestions[index]);
                        console.log("selected tags-->>>>", scope.selectedTags);
                        scope.searchText='';
                        scope.suggestions=[];
                    }
                }

                scope.checkKeyDown=function(event){
                    if(event.keyCode===40){
                        event.preventDefault();
                        if(scope.selectedIndex+1 !== scope.suggestions.length){
                            scope.selectedIndex++;
                        }
                    }
                    else if(event.keyCode===38){
                        event.preventDefault();
                        if(scope.selectedIndex-1 !== -1){
                            scope.selectedIndex--;
                        }
                    }
                    else if(event.keyCode===13){
                        scope.addToSelectedTags(scope.selectedIndex);
                    }
                }

                scope.$watch('selectedIndex',function(val){
                    if(val!==-1) {
                        scope.searchText = scope.suggestions[scope.selectedIndex];
                    }
                });
            }

        }
    }]);'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:SignupCtrl
 * @description
 * # SignupCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('SignupCtrl', function($scope, $http, $auth, $location, $alert) {
		$scope.searched = false;
	 	$scope.searchBusy = false;


	 	$scope.tags = [];



        $scope.loadTags = function(query) {
        //return $http.get('/tags?query=' + query);
        };

        $scope.tagAdded = function(tag) {
            //console.log('Tag added: ', tag.text);
            //$scope.tags.push(tag)
            //alert(tag.text)
        };

        $scope.tagRemoved = function(tag) {
           // console.log('Tag removed: ', tag);
            //console.log($scope.tags)
        };

        /* starting code of signup goes here */

            /*$scope.registerUser = function() {
                if (this.formData.gender) {

                var self = this;
                var interests = [];
                var querystring = "";
                for(var temp in $scope.tags){
                    interests.push($scope.tags[temp].text.toString());
                    querystring = querystring+$scope.tags[temp].text+" ";
                }
                $http.get('/api/similarwords',
                    {
                        headers:{'Content-Type':'application/json'},
                        params : {querystring: querystring.toString() }
                    }).success(function(interestsSimilarWords) {
                        //console.log('successdata', interestsSimilarWords)
                        var data = ['d','i','dd'];
                        $scope.signup_Busy = $auth.signup({
                            email: $scope.formData.email,
                            password: $scope.formData.password,
                            firstname: $scope.formData.firstname,
                            lastname: $scope.formData.lastname,
                            username: $scope.formData.firstname+$scope.formData.lastname,
                            gender: self.formData.gender,
                            interests: interests,
                            interestsimilarwords: interestsSimilarWords
                        }).then(function (response) {

                            $location.path('/email_details/' + self.formData.email);
                        }, function (signuperror) {
                            $scope.signUpError = signuperror;
                        });
                    });
            }else{
                    $scope.gendererror = true;
                }
            };*/

        /* ending of signup code */
	}).directive('validPasswordC', function () {
		return {
			require: 'ngModel',
			link: function (scope, elm, attrs, ctrl) {
				ctrl.$parsers.unshift(function (viewValue, $scope) {
					var noMatch = viewValue != scope.myForm.password.$viewValue;
					ctrl.$setValidity('noMatch', !noMatch);
				})
			}
		}
	})
	.directive('replacesignup', function ($compile) {
		return {
			restrict: 'E',
			replace: true,
			link: function (scope, element, attrs) {
				element.click(function(){
				   var html ='<image src="/static/app/images/pleasewait.gif" style="width:;">';
				   var e =$compile(html)(scope);
				   element.replaceWith(e);
				});
			}
		};
	});'use strict';
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
                $scope.currentUser = user;


                // checking enter minimum interests
                if($scope.currentUser.interests.length == 0 && $scope.currentUser.questions.length < 4){
                    console.log('interests length', $scope.currentUser.questions.length, $scope.currentUser.interests.length)
                    $location.path("/enter_interests")
                }



                //delete the post from infinite posts of the current user
                function checkdeletepost(post_id){
                    var status = false;
                    var post = null;
                    for(var k in $scope.infinitePosts.posts){
                        if($scope.infinitePosts.posts[k]._id == post_id &&
                            $scope.infinitePosts.posts[k].author == $scope.currentUser._id){
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
                $scope.questions = new questions($scope.currentUser);
                $scope.questions.getallquestions();


                $scope.answered = function(question, ans){
                    $scope.questions.updateAnswer(question, ans, $scope.currentUser._id);
                    console.log(question, ans)
                }

                $scope.checkAnswer = function(question_id){
                    data = $scope.questions.checkAnswer(question_id);
                    return data;
                }
                // end of questions section
				var loadPostIds = angular.copy($scope.currentUser.friends);
                loadPostIds.push($scope.currentUser._id);
                loadPostIds = "[\"" + loadPostIds.join("\",\"") + "\"]";

                $scope.infinitePosts = new InfinitePosts($scope.currentUser, loadPostIds);
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
                        if($scope.currentUser.friends.indexOf(data.author) == -1){
                            //console.log('no a friend')
                        }else if($scope.currentUser.friends.indexOf(data.author != -1) && data.postid != 'undefined'){
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
				                if(iPeople[i].interested_person == $scope.currentUser._id){
				                    return true;
				                }
                            }
                            iPeople.push({'interested_person': $scope.currentUser._id, 'match_date': new Date()});
                            //console.log('post author-->', postauthor)
                            MatchButtonService.match(postauthor, postid , $scope.currentUser._id).then(function(data){
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
				                if(iPeople[i].interested_person == $scope.currentUser._id){
				                   iPeople.splice(i,1);
				                   MatchButtonService.unmatch(postauthor, postid, $scope.currentUser._id).then(function(data){
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
                console.log($scope.chatactivity)
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
                    $window.location.reload();
                }, function(error) {
                    $scope.loginError = error;
                    var loginAlert = $alert({
                        title: 'Login Failed:',
                        content: error.data.error,
                        placement: 'top',
                        type: 'danger',
                        show: true
                    });
                    $timeout(function() {
                        loginAlert.hide();
                    }, 5000);
                });
            };
        /* end of login functionality*/
        /* ResendMail code*/
            $scope.ResendMail = function(){
                $scope.Resend_busy = $timeout(function(){
                    console.log("email",$scope.ss)
                    // Simple POST request example (passing data) :
                    $http.post('/resendActivationLink', {resend_email: $scope.ss}).
                    success(function(data, status, headers, config) {
                        // this callback will be called asynchronously
                        // when the response is available
                        console.log("success activation", data.data);
                        var successAlert = $alert({
                            title: 'Success:',
                            content: data.data,
                            placement: 'top',
                            type: 'success',
                            show: true
                        });
                        $timeout(function() {
                            successAlert.hide();
                        }, 5000);
                    }).
                    error(function(error, status, headers, config) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        console.log("error activation", error)
                        var errorAlert = $alert({
                            title: 'Failed:',
                            content: error.error,
                            placement: 'top',
                            type: 'danger',
                            show: true
                        });
                        $timeout(function() {
                            errorAlert.hide();
                        }, 5000);
                    });
                },2000);
            }
        /* end of ResendMail code */

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
                        $location.path('/enter_interests/' + self.formData.email);
                    }

                }, function (signuperror) {
                    $scope.signUpError = signuperror;
                    var userNameAlert = $alert({
                        title: 'Registration Failed:',
                        content: signuperror.data.error,
                        placement: 'top',
                        type: 'danger',
                        show: true
                    });
                    $timeout(function() {
                        userNameAlert.hide();
                    }, 5000);
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

                   $scope.chatactivity = new ChatActivity(user);
                   $scope.searchActivity = new SearchActivity($scope.currentUser);

                   $scope.currentUser = user;
                   if($scope.currentUser.interests.length == 0 && $scope.currentUser.questions.length < 4){
                        $location.path("/enter_interests")
                   }


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
});'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:ForgotPasswordCtrl
 * @description
 * # ForgotPasswordCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.directive('passwordrecovery', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {},
            controller:function($scope, $http, $element, $attrs, $transclude){

                $scope.sendPassword = function(){

                    $scope.password_recovery_busy = $http.post('/forgotpasswordlink', {email:$scope.email}).
                        success(function(data, status, headers, config) {
                            // this callback will be called asynchronously
                            // when the response is available
                            var html = '<b>password link has been sent to your email</b><br><p>Please check your email</p>';
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);
                        }).
                        error(function(error) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            var html = '<b>your email does not exist, Please check it once..</b>';
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);
                        });


                }
            }
        };
    })
    .directive('changepassworddirective', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {},
            controller:function($scope, $http, $element, $attrs, $transclude, $routeParams){

                var user_name = $routeParams.user_name;
                var password_random_string = $routeParams.password_random_string;

                console.log(user_name+password_random_string);

                $scope.passwordButton = function(){

                    $scope.new_password = $http.post('/get_new_hash_password', {
                            user_name:$routeParams.user_name,
                            new_password:$scope.formData.password
                        })
                        .success(function(data, status, headers, config) {
                            //console.log("========hashed password======");
                            //console.log(data);
                            $scope.hashed_password = data;

                            var Update_Password = Restangular.one('people', $routeParams.user_name).get({seed:Math.random()});

                            Update_Password.then(function(response){
                                $scope.user = response;

                                //console.log("=====user details===");
                                //console.log($scope.user);

                                $scope.user.patch({
                                    'password':{
                                        'password':$scope.hashed_password,
                                        'password_test':$scope.formData.password,
                                        'password_updated':new Date()
                                    }
                                }).then(function(response){
                                    // this callback will be called asynchronously
                                    // when the response is available

                                    //console.log("===after patch=====");
                                    //console.log(response);
                                    var html = '<b>your password has been changed</b>';
                                    var e =$compile(html)($scope);
                                    $element.replaceWith(e);

                                });
                            });
                        }).
                        error(function(error) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            var html = '<b>your email does not exist, Please check it once..</b>';
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);
                    });






                }
            }
        };
    });'use strict';

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

        Restangular.one('people', $routeParams.username).get({ seed : Math.random()}).then(function(profileuser) {
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
                 $scope.questions.updateAnswer(question, ans, $scope.currentUser._id);
                 console.log(question, ans)
             }




        // end of profile user information
        if($scope.currentUser === 'undefined'){
            $http.get('/api/me', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': $auth.getToken()
                }
            }).success(function(user_id) {
                var params = '{"send_add_requests":1}';
                Restangular.one('people',JSON.parse(user_id)).get({embedded:params, seed: Math.random()}).then(function(user) {
                    $scope.currentUser = user;
                    questionOperations();
                });
            });

        }else{
            console.log('else part user', $scope.currentUser)
            questionOperations();
        }


        function questionOperations(){

            $scope.checkYouAnswered = function(question_id){
                data = $scope.questions.checkYouAnswered(question_id, $scope.currentUser);
                return data;
            }

            $scope.youAnswered = function(question, ans){
                console.log('------------->>> user id', $scope.currentUser._id);
                $scope.questions.updateUser2(question, ans, $scope.currentUser._id);
                console.log(question, ans)
            }
             // end of questions section
            if($scope.currentUser._id !== $scope.profileuser._id){
                var friendsactivity = new friendsActivity($scope.currentUser, $scope.profileuser);
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
                            if(iPeople[i].interested_person == $scope.currentUser._id){
                                return true;
                            }
                        }
                        iPeople.push({'interested_person': $scope.currentUser._id, 'match_date': new Date()});
                        //console.log('post author-->', postauthor)
                        MatchButtonService.match(postauthor, postid , $scope.currentUser._id).then(function(data){
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
                            if(iPeople[i].interested_person == $scope.currentUser._id){
                               iPeople.splice(i,1);
                               MatchButtonService.unmatch(postauthor, postid, $scope.currentUser._id).then(function(data){
                                    console.log('unmatch disagree succesfully-->', data);
                               });
                            }
                        }

                    }
                }
            }
        }
    });
});angular.module('weberApp')
.factory('friendsActivity', function($http, Restangular, $alert, $timeout,CurrentUser) {

        var friendsActivity = function(currentuser, profileuser){
            //console.log(profileuser)
            this.currentuser = currentuser;
            this.profileuser = profileuser;
            this.status = null;
            this.status_method = null;

            if (typeof this.profileuser.notifications === "undefined"){
                profileuser.patch({
                    "notifications": []
                })
            }

            if(typeof this.currentuser.notifications === "undefined"){
                currentuser.patch({
                    "notifications": []
                })
            }
        }



        friendsActivity.prototype.getRelation = function(){

                if(this.status === null){
                    if(this.profileuser.friends.indexOf(this.currentuser._id) > -1){
                        this.status = 'unfriend';
                    }
                }

                if(this.status === null){
                    var k = '';
                    for (k in this.profileuser.notifications){
                        if((this.profileuser.notifications[k].friendid == (this.currentuser._id)) &&
                          (this.profileuser.notifications[k].notific_type == 1)){
                            this.status = 'cancelrequest';
                        }
                    }
                }

                if(this.status === null){
                    var k = ''
                    for (k in this.currentuser.notifications){
                        if((this.currentuser.notifications[k].friendid == (this.profileuser._id)) &&
                           (this.currentuser.notifications[k].notific_type == 1))
                        {
                            this.status = 'reject_accept';
                        }
                    }
                }

                if(this.status === null){
                    this.status = 'addfriend';
                }
            return (this.status);
        }

         return friendsActivity;
	})
	.service('Friends', function($http, Restangular) {

		this.addFriend = function(cuserid, puserid) {
		    return Restangular.one('addfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });
		}

		this.cancelRequest = function(cuserid, puserid){
		    console.log(cuserid, puserid)
		    return Restangular.one('cancelfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });

		}

		this.acceptRequest = function(cuserid, puserid){
		    return Restangular.one('acceptfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });

		}

		this.rejectRequest = function(cuserid, puserid){
		    return Restangular.one('rejectfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed : Math.random()
		    });
		}

		this.unFreind = function(cuserid, puserid){
		    return Restangular.one('unfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed : Math.random()
		    });
		}

		this.makeSeen = function(cuserid){
		    return Restangular.one('makeseen').get({
		        cuserid : cuserid,
		        seed : Math.random()
		    });
		}
	});angular.module('weberApp')

    .factory('ChatActivity', function($http, Restangular,$auth, UserService) {

        var ChatActivity = function(currentuser){
            this.currentuser = currentuser;
            this.chatfriends = [];
            this._etag = currentuser._etag;
            this.messages = [];
            this.messageNotifc = [];
            this.latestMessages = [];
            this.conversations = [];

            // for infinity scroll parameters
            this.pages =[];
            this.busy = false;
            this.end = false;
            this.query = null;
            this.embedded_param = null;
            this.main_params = null;
            this.updateseenmessages = [];
        }


        // sending message
        ChatActivity.prototype.sendMessage = function( receiverid, text){

            this.receiverid = receiverid;
            self = this;
            Restangular.all('chat/sendmessage').post({
                'sender':this.currentuser._id,
                'receiver': this.receiverid,
                'message': text,
                'seen': false
            }).then(function(data){
                //console.log(data)
            });
        }

        // return specific user page count and key
        function getKey_Pages(pages, recept){

             var temp_pages = null;
             var key = null;
             var found = false;

             if(pages.length){
                for(var k in pages){
                    if(pages[k].id == recept){
                        temp_pages = pages[k];
                        key = k;
                        found = true;
                        return ({'pageinfo':temp_pages, 'key':key});
                    }
                }

                if(!(found)){
                    // if person not found push into array
                    pages.push({
                        id:recept,
                        page:1,
                        end: false
                    });
                   temp_pages = pages[pages.length-1];
                   //console.log('pushed when not found', pages)
                   return ({'pageinfo':pages[pages.length-1], 'key': pages.length-1});

                }
            }
            // no chat room open push first page
            else{
                //console.log('first page')
                pages.push({
                    id:recept,
                    page:1,
                    end: false
                });
                return ({'pageinfo': pages[0], 'key':0});
            }
        }

        ChatActivity.prototype.loadMessages = function(user1, user2, roomdetails){

            var self = this;

            this.busy = true;
            var page = null;
            var key = null;

            self.messages.push.apply(self.messages,[{id:user2,details:roomdetails,messages:[]}]);

            self.main_params =  '{ "$or" : ['+
                    '{ "$and" : [ { "sender" : "'+user1+'" }, { "receiver" : "'+user2+'" } ] },'+
                    '{ "$and" : [ { "sender" : "'+user2+'" }, { "receiver": "'+user1+'" }  ] }'+
                ']}';

            self.embedded_param = '{"sender":1,"receiver":1}';
            var data = getKey_Pages(self.pages, user2);
            page = data.pageinfo;
            key = data.key;
            Restangular.all('messages').getList({
                where:self.main_params,
                embedded:self.embedded_param,
                seed:Math.random(),
                max_results: 10,
                page:page.page,
                sort: '[("message_created",-1)]',
            }).then(function(response){
				if (response.length < 10) {
					page.end = true;
				}

				self.messages = PushMessages(self.messages, response, user2)

				self.busy = false;
				page.page = page.page+1;
				self.pages[key] = page;
            }.bind(self));
        }

        // push message in messages array after next page called
        function PushMessages(allMessages, newMessages, recept){
            for(var k in allMessages){
                if(allMessages[k].id == recept){
                   //console.log('all one messages', allMessages[k].messages)
                   allMessages[k].messages.push.apply(allMessages[k].messages, newMessages);
                   //console.log('after all one messages', allMessages[k].messages)


                }
            }
            return allMessages;
        }

        ChatActivity.prototype.nextPage = function(user2) {
			if (this.busy | this.end) return;
			var self = this;
			self.busy = true;
            var page = null;
            var key = null;
            var data = getKey_Pages(self.pages, user2);
            page = data.pageinfo;
            key = data.key;
            var user1 = self.currentuser._id;
			self.main_params =  '{ "$or" : ['+
                    '{ "$and" : [ { "sender" : "'+user1+'" }, { "receiver" : "'+user2+'" } ] },'+
                    '{ "$and" : [ { "sender" : "'+user2+'" }, { "receiver": "'+user1+'" }  ] }'+
                ']}';

            self.embedded_param = '{"sender":1,"receiver":1}';
			Restangular.all('messages').getList({
			    where:self.main_params,
                embedded:self.embedded_param,
                seed:Math.random(),
                max_results: 10,
                page:page.page,
                sort: '[("message_created",-1)]'
			}).then(function(posts) {
				if (posts.length === 0) {
					page.end = true;
				}
                self.messages = PushMessages(self.messages, posts, user2)
                page.page = page.page + 1;
				self.pages[key] = page;
				self.busy = false;
			}.bind(self));
		};

        ChatActivity.prototype.pushMessage = function(receiverid, message){
            for(var k in this.messages){
                if(this.messages[k].id == receiverid){
                   this.messages[k].messages.unshift(message);
                }
            }
        }

        ChatActivity.prototype.pushLatestMessage = function(msg){
            this.messageNotifc.push.apply(this.messageNotifc,[msg]);
           // console.log(this.messageNotifc)
        }

        ChatActivity.prototype.getMessageNotifcations= function(){
            var where_param = '{"$and":[{"receiver":"'+this.currentuser._id+'"},{"seen":false}]}';
            //var sort_param = '[("_created",-1)]';
            var embedded_param = '{"sender":1,"receiver":1}';
            var self = this;
            Restangular.all('messages').getList({
                where: where_param,
                embedded: embedded_param,
                seed:Math.random()
            }).then(function(data){
                self.messageNotifc.push.apply(self.messageNotifc, data);
            }.bind(self))
        }



        ChatActivity.prototype.loadLatestMessages = function(){
            console.log('load latest')
            var params = null;
            var getResults = false;
           // console.log(getResults)

            params =  '{ "receiver" : "'+this.currentuser._id+'" }';

            if(this.messageNotifc.length){
                console.log('yess message notification length not zero')
                params = '{ "$and" : [ { "timestamp":{"$gte": '+this.currentuser.lastmessageseen +' }},'+
                                       '{ "receiver" : "'+this.currentuser._id+'" }, { "seen" : '+false+' } ] }';
                getResults = true;
            }else if(!(this.latestMessages.length)){
                getResults = true;
            }else{}


            var sort_param = '[("message_created",-1)]';
            var embedded_param = '{"sender":1,"receiver":1}';
            var self = this;

            console.log(params)
            if(getResults){
                Restangular.all('updatetimestamp').post({
                    timestamp:self.currentuser.lastmessageseen,
                    userid:self.currentuser._id
                }).then(function(data){
                    //console.log(data)
                });

                Restangular.all('messages').getList({
                    where: params,
                    embedded: embedded_param,
                    sort:sort_param,
                    max_results: 100,
                    seed:Math.random()
                }).then(function(data){

                    // getting distinct message notifications
                    var data2 = [];
                    data2.push.apply(data2,data);
                    var distinctMessages = [];

                    for(var temp in data2){

                        // update seen true messages
                        this.updateseenmessages.push.apply(this.updateseenmessages, data);
                        // distinct arry empty then push
                        if(distinctMessages.length == 0){
                            distinctMessages.push(data2[temp]);
                        }
                        // else check in array then push
                        else{
                            for(var k in distinctMessages){
                                if(data2[temp].receiver._id == distinctMessages[k].receiver._id){
                                    //console.log('alredy pushed')
                                }
                                else{
                                    distinctMessages.push(data2[temp]);
                                }
                            }

                        }

                    }


                    self.latestMessages.push.apply(self.latestMessages, distinctMessages);
                    if(self.messageNotifc.length){
                        self.makeMessagesSeen(self.latestMessages);
                        self.messageNotifc = [];
                    }

                }.bind(self));
            }

        }

        ChatActivity.prototype.makeMessagesSeen = function(latestMessages){
            var messageids = [];
            var self = this;
            console.log('makeMessagesSeen')
            for(var x in this.updateseenmessages){
                messageids.push(this.updateseenmessages[x]._id);
            }
            if(messageids.length){
                Restangular.all('updateMessageSeen').post({
                    messageids: messageids
                }).then(function(data){
                    //console.log('--------updated messages seen status----------')
                    //console.log(data)
                    self.updateseenmessages = [];
                });

            }
        }

        ChatActivity.prototype.makeRoomMessagesSeen = function(senderid){
            var self = this;
            for(k in self.latestMessages){
                if(self.latestMessages[k].sender._id == senderid  &&
                   self.latestMessages[k].receiver._id == self.currentuser._id &&
                   self.latestMessages[k].seen == false
                ){
                    Restangular.one("messages",self.latestMessages[k]._id).patch(
                        {seen:true},{},
                        {
                            'Content-Type': 'application/json',
                            'If-Match': self.latestMessages[k]._etag,
                            'Authorization': $auth.getToken()
                        }).then(function(data){
                            self.latestMessages.splice(k,1);
                        });
                }
            }
        }


        ChatActivity.prototype.getChatFriends = function(){
            if (this.currentuser.friends.length !== 0) {
                this.chatfriends.push.apply(this.chatfriends,UserService.getListUsers(this.currentuser.friends));
                //console.log('chat users =====>', data)
                //this
                /*var params = '{"_id": {"$in":["'+(this.currentuser.friends).join('", "') + '"'+']}}';

                Restangular.all('people').getList({where :params, seed: Math.random()})
                    .then(function(data){
                        this.chatfriends.push.apply(this.chatfriends, data);
                    }.bind(this));*/
            }
        };


        ChatActivity.prototype.addToConversations = function(id){
            if(this.currentuser.conversations.indexOf(id) == -1 &&
               this.currentuser.friends.indexOf(id) == -1){
                   this.currentuser.conversations.push(id);
                   Restangular.one('addconversation').get({
                    cuserid : this.currentuser._id,
                    conversationid : id,
                    seed:Math.random()
                  }).then(function(data){
                      //console.log('add conversation-->', data)
                  }.bind(this));
            }
        }

        ChatActivity.prototype.deleteConversation = function(id){
            if(this.currentuser.conversations.indexOf(id) !== -1){
               this.currentuser.conversations.splice(this.currentuser.conversations.indexOf(id),1);
               for(var k in this.messages){
                   if(this.messages[k].id == id){
                        this.messages.splice(k, 1);
                        break;
                   }
               }
              Restangular.one('deleteconversation').get({
		        cuserid : this.currentuser._id,
		        conversationid : id,
		        seed:Math.random()
		      }).then(function(data){
		          console.log('delete conversation-->', data)
		      }.bind(this));

            }
        }

    return ChatActivity;
    });'use strict';

/**
 * @ngdoc service
 * @name weberApp.weberService
 * @description
 * # weberService
 * Service in the weberApp.
 */
angular.module('weberApp')
.factory('SettingsService', function($http, Restangular, $alert, $timeout,$auth, fileUpload) {

		var SettingsService = function(fieldvalue, fieldname) {

			this.fieldname = fieldname;
			this.fieldvalue = fieldvalue;
			this.userobj = [];

			var data = $http.get('/api/me', {
				headers: {
					'Content-Type': 'application/json',
					'Authorization':$auth.getToken()
				}
			}).success(function(userId) {
				this.userId = userId;
				var promise = Restangular.one('people',JSON.parse(userId)).get().then(function(user) {
					this.userobj = user;
					//console.log(this.userobj);
				}.bind(this));
				return promise;
			}.bind(this));
			return data;
		};

		SettingsService.prototype.updatefieldvalue = function(){

		};

		return SettingsService;
	})/* ========= file upload services ========*/
	.directive('fileModel', ['$parse', function ($parse) {
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				var model = $parse(attrs.fileModel);
				var modelSetter = model.assign;

				element.bind('change', function(){
					scope.$apply(function(){
						modelSetter(scope, element[0].files[0]);
					});
				});
			}
		};
	}])
	.service('fileUpload', ['$http', function ($http,$auth, $scope, Restangular) {
		this.uploadFileToUrl = function(file, uploadUrl){
			var fd = new FormData();
			fd.append('file', file);
			this.path_name = "";
			return $http.post(uploadUrl, fd, {
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined}
			});
		}
	}]);/*====== end of file upload services ======*/'use strict';
/**
 * @ngdoc service
 * @name weberApp.weberService
 * @description
 * # weberService
 * Service in the weberApp.
 */
angular.module('weberApp')

       .factory('questions', function($http, Restangular,$auth) {

        var questions = function(currentuser){
            this.currentuser = currentuser;
            this.allquestions = [];
            this.cuserquestions = [];
            this.user2 = {},
            this.canswers = this.currentuser.questions;
            console.log(this.currentuser.username)
        }

        questions.prototype.getallquestions = function(){
          Restangular.all('questions').getList().then(function(data){
            this.allquestions.push.apply(this.allquestions, data);

          }.bind(this));
        }

        function combine_ids(ids) {
   			return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        questions.prototype.getUserQuestions = function(){
            var cuserquestionids = []

            for(var temp in this.currentuser.questions){
                cuserquestionids.push((this.currentuser.questions[temp].questionid).toString())
            }
            console.log('cuser question ids', cuserquestionids)

            var params = '{"_id": {"$in":['+combine_ids(cuserquestionids)+']}}';

            console.log(params)
            Restangular.all('questions').getList({where:params, seed: Math.random()}).then(function(data){
            this.cuserquestions.push.apply(this.cuserquestions, data);
          }.bind(this));

        }

        questions.prototype.updateAnswer = function(question, answer, cuser_id){
            console.log('----------------service------------')
            var self = this;
            var req = {
                method: 'POST',
                url: '/api/updateAnswer',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                        question : question,
		                answer : answer,
		                cuserid : cuser_id,
		                seed:Math.random()
                }
            }

            $http(req).success(function (data) {
                for(var temp in self.canswers){
                    if(self.canswers[temp].questionid == question){
                        self.canswers[temp].answer = answer;
                        return true
                    }
		        }
		        self.canswers.push({'questionid':question, 'answer':answer});
            }.bind(self));


        }

        questions.prototype.checkAnswer = function(questionid){
            for(var temp in this.canswers){
                if(this.canswers[temp].questionid == questionid){
                    return this.canswers[temp].answer;
                }
            }
            return 3;
        }

         questions.prototype.checkYouAnswered = function(questionid, cuser){
            this.user2 = cuser;
            for(var temp in this.user2.questions){
                if(this.user2.questions[temp].questionid == questionid){
                    return true;
                }
            }
            return false;
         }

         questions.prototype.updateUser2 = function(question, answer, cuser_id){
           console.log('update cuser 2===>', cuser_id)
           var self = this;
            var req = {
                method: 'POST',
                url: '/api/updateAnswer',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                        question : question,
		                answer : answer,
		                cuserid : cuser_id,
		                seed:Math.random()
                }
            }

            $http(req).success(function (data) {
               console.log('updated answer', data);
		       for(var temp in self.user2.questions){
                    if(self.user2.questions[temp].questionid == question){
                        self.user2.questions[temp].answer = answer;
                        return true
                    }
		        }
		       self.user2.questions.push({'questionid':question, 'answer':answer});
		    }.bind(this));
         }
         return questions;
    })

	.factory('InstanceSearch', function($http, Restangular, $alert, $timeout) {

		var InstanceSearch = function() {

			this.InstancesearchResult = [];
			this.busy = false;
			this.end = false;
			this.page = 1;
			this.query = null;
		};

		InstanceSearch.prototype.getInstancePeoples = function(query){

            var self = this;
            this.query = query;
            if((query)) {
                var req = {
                    method: 'POST',
                    url: '/api/getpeoplenames',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        page: this.page,
                        query: query.toLowerCase()
                    }
                }

                $http(req).success(function (peoples) {
                    self.InstancesearchResult = peoples;
                    //console.log(self.InstancesearchResult)
                }.bind(self));
            }else{
                self.InstancesearchResult = [];
            }

        };

        InstanceSearch.prototype.nextPage = function() {
            //console.log('next page')
            //console.log(this.busy, this.end)
            if (this.busy | this.end) return;
			this.busy = true;
			var self = this;
            var req = {
                 method: 'POST',
                 url: '/api/getpeoplenames',
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: {
                    page: self.page,
                    query: self.query
                 },
            }

            $http(req).success(function(peoples){

                if (peoples.length === 0) {
					self.end = true;
				}
				self.InstancesearchResult.push.apply(self.InstancesearchResult, peoples);
				self.page = self.page + 1;
				self.busy = false;
				//console.log(self.InstancesearchResult)
            }.bind(self));

		};
       return InstanceSearch;
    })

	.service('UserService', function($http, Restangular) {
		this.users = [];

		this.get = function(userId) {
            for (var i in this.users) {
				if (this.users[i]._id == userId) {
				    return this.users[i];
				}
			}
			var promise = Restangular.one('people',userId).get().$object;
			promise._id = userId;
			this.users.push(promise);
			return promise;
		};

		this.getListUsers = function(userIdList){
		    this.usersList = [];
		    for(var k in userIdList){
		        this.usersList.push(this.get(userIdList[k]))
		    }
		    return this.usersList;
		}
	})
		.service('InterestsService', function($http, Restangular) {
		this.interests = [];

		this.get = function(interestid) {
		    if(interestid){
                for (var i in this.interests) {
                    if (this.interests[i]._id == interestid) {
                        return this.interests[i];
                    }
                }
                var promise = Restangular.one('interests',interestid).get().$object;
                promise._id = interestid;
                this.interests.push(promise);
                return promise;
            }
		};
	})

    .service('InstanceSearchHistory', function($http, Restangular) {
        this.history = [];
        this.get = function(query) {
            for (var i in this.history) {
                if (this.history[i].query == query) {
                    return this.history[i].result;
                }
            }
            return $http.get('/api/getpeoplenames/'+query);
        };

        this.pushToHistory = function(historyObject, query){
            this.history.push({
                'query':query,
                'result':historyObject
            })
        }
    })

	.service('MatchButtonService', function($http, Restangular, CurrentUser1) {

		this.checkMatchUnMatch = function(post, user) {
             //console.log('weber service post', post.interestedPeople)
             for(var i in post.interestedPeople){
		        if(post.interestedPeople[i].interested_person == user._id){
		            return true;
		        }
		     }
		     return false;
		};

		this.match = function(authorid, postid, cuserid){
		    return Restangular.one('match').get({
		        cuserid : cuserid,
		        authorid : authorid,
		        postid: postid,
		        seed:Math.random()
		    });
		};

		this.unmatch = function(authorid, postid, cuserid){
                return Restangular.one('unmatch').get({
		        cuserid : cuserid,
		        authorid : authorid,
		        postid: postid,
		        seed:Math.random()
		    });
		};

	})
    	.factory('InfinitePosts', function($http, Restangular, $alert, $timeout) {

		var InfinitePosts = function(user_obj,authorIds) {
			this.posts = [];
			this.SpecificPost = {},
			this.user_obj = user_obj;
			this.busy = true;
			this.page = 1;
			this.loadPostIds = authorIds;
			this.end = false;
            this.params = '{"author": {"$in":'+this.loadPostIds+'}}';
            //console.log('author params===>', this.params)
        }

        InfinitePosts.prototype.getEarlyPosts = function(){
                Restangular.all('posts').getList({
                    where : this.params,
                    max_results: 10,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed:Math.random()
                }).then(function(posts) {
                    //console.log('loadposts')
                    if (posts.length < 10) {
                        this.end = true;
                    }
                    this.posts.push.apply(this.posts, posts);
                    this.page = this.page + 1;
                    this.busy = false;

                }.bind(this));
		};

        InfinitePosts.prototype.getSpecificPost = function(postid){
            var embedded = '{"author":1}';
            Restangular.one('posts', postid.postid).get({embedded:embedded, seed:Math.random()})
            .then(function(data){
                this.posts.push({
                    '_id':data._id,
                    'author':data.author,
                    'content':data.content,
                    '_created': data._created,
                    '_etag': data._etag,
                    'interestedPeople': data.interestedPeople,
                });
                //console.log('posts--------->', this.posts);
               // console.log('ddata--------->', data);
            }.bind(this));

        }

		InfinitePosts.prototype.nextPage = function() {
		    //console.log('nextpage')
			if (this.busy | this.end) return;
			this.busy = true;

			Restangular.all('posts').getList({
			    where : this.params,
				max_results: 10,
				page: this.page,
				sort: '[("_created",-1)]',
				seed:Math.random()
			}).then(function(posts) {
				if (posts.length === 0) {
					this.end = true;
				}
				this.posts.push.apply(this.posts, posts);
				this.page = this.page + 1;
				this.busy = false;
			}.bind(this));
		};

		InfinitePosts.prototype.loadNotificPost = function(postid, author){
            //console.log(postid, author)
            if(this.user_obj._id !== author){
                Restangular.one('posts', postid).get().then(function(post) {
                    //console.log(post)
                    this.posts.unshift({
                        author: post.author,
                        content: post.content,
                        _created: post._created,
                        _id: post._id,
                        _etag: post._etag,
                         interestedPeople : post.interestedPeople
                    });
                    //console.log(this.posts)
                }.bind(this));
            }
		}

		InfinitePosts.prototype.addPost = function(content, similar_keywords, imagePath) {

			this.user_obj.all('posts').post({
				author: this.user_obj._id,
				content: content,
				keywords: similar_keywords,
				post_image_path : imagePath,
				interestedPeople: []
			}).then(function(data) {

                this.posts.unshift({
                    author: this.user_obj._id,
                    content: content,
                    post_image_path : imagePath,
                    _created: new Date(),
                    _id:data._id,
                    _etag: data._etag,
                    interestedPeople : []

				});

				var myAlert = $alert({
					title: 'Successfully Posted! :)',
					placement: 'top',
					type: 'success',
					show: true
				});
				$timeout(function() {
					myAlert.hide();
				}, 5000);

			}.bind(this));
		};

		InfinitePosts.prototype.deletePost = function(post, user) {
            //console.log('delete post details', post.author)
			Restangular.one('posts', post._id).remove({},{
			    'If-Match': (post._etag).toString()
			}).then(function(data) {
			    for(var k in this.posts){
			        if(this.posts[k]._id == post._id){
			            this.posts.splice(k,1);
			            this.SpecificPost = {};
			            //console.log("successfully deleted")
			        }
			    }
			}.bind(this));

			for(var i in post.author.matchnotifications){
			    if(post.author.matchnotifications[i].postid == post._id){
    		       post.author.matchnotifications.splice(i,1);

    		       user.patch({'matchnotifications':post.author.matchnotifications})
    		       .then(function(data){
    		           /// console.log('delete notification==>', data)
    		       })
			    }
			}
		};
		return InfinitePosts;
	})
	.service('PostService', function($http, Restangular) {
		this.posts = [];
        var param1 = '{"author":1}';

		this.get = function(postid) {
		    //console.log('postid==>', postid)

			for (var i in this.posts) {
				if (this.posts[i]._id == postid) {
					return this.posts[i];
				}
			}

			var promise = Restangular.one('posts', postid).get({embedded: param1, seed: Math.random() }).$object;
			promise._id = postid;
			this.posts.push(promise);
			return promise;
		};

	    this.resetPost = function(postid){
	        var promise = Restangular.one('posts', postid).get({embedded: param1, seed: Math.random() }).$object;
			promise._id = postid;
			this.posts.push(promise);
			return promise;
	    }


	})

	.service('sortIListService', function($http, Restangular,CurrentUser1) {
		this.sendList = function(list, cuserid){
		    if(list && list.length){
		        for(var temp in list){
    		       if(list[temp] == cuserid){
                        list.push(list.splice( temp, 1 )[0]);
	               }
		        }
    		    return list.reverse();
		    }else
		        return list;
		}

	}).service('CurrentUser1', function($http, Restangular) {
		this.userId = null;
		this.user = null;
		this.reset = function() {
			this.userId = null;
		};

		if (this.userId === null) {
			$http.get('/api/me', {
				headers: {
					'Content-Type': 'application/json'
				}
			}).success(function(userId) {
				this.userId = userId;
				Restangular.one('people', JSON.parse(userId)).get().then(function(user) {
					this.user = user;
				}.bind(this));
			}.bind(this));
		}

	})
	.factory('CurrentUser', function($http,$auth,$q, Restangular) {
            var CurrentUser = function() {
			    this.userId = null;
			    this.user = null;
            }

            CurrentUser.prototype.getUserId = function(){

                    return $http.get('/api/me', {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': $auth.getToken()
                        }
                    }).success(function(userId) {
                        this.userId = userId;
                    }.bind(this));
            };

			CurrentUser.prototype.getCUserDetails = function(userid){

                return Restangular.one('people',JSON.parse(userid)).get({seed:Math.random()});
            };

            return CurrentUser;
    })



    .service('ESClient', function(esFactory) {
		return esFactory({
			host: 'http://127.0.0.1:8000',
			apiVersion: '1.2',
			log: 'trace'
		});
	})
    .factory('SearchActivity', function($http, Restangular, $alert, $timeout) {

		var SearchActivity = function(user_obj) {
			this.searchHistory = [];
			this.user_obj = user_obj;
			this.busy = false;
			this.end = false;
			this.page = 1;
		};

		SearchActivity.prototype.deleteItem = function(id){
		    var self = this;
		    for(var temp in self.searchHistory){
		        if(self.searchHistory[temp]._id == id){
		            self.searchHistory.splice(temp, 1);
		            var req = {
                        method: 'POST',
                        url: '/api/deleteSearchHistoryItem',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: {'_id': id}
                    }
                    $http(req).then(function(data){
                        console.log(data);
                    })

		        }
		    }
		}

		SearchActivity.prototype.getMysearches = function(){
                Restangular.one('people', this.user_obj._id).all('searchActivity').getList({
                    max_results: 10,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed: Math.random()
                }).then(function(data) {
                    //console.log('my search')
                    //console.log(data)
                    if (data.length < 10) {
					    this.end = true;
				    }

				    this.searchHistory.push.apply(this.searchHistory,data);
				    this.page = this.page + 1;
				    this.busy = false;
                }.bind(this));

		}

       SearchActivity.prototype.nextPage = function() {
			if (this.busy | this.end) return;
			this.busy = true;
            this.user_obj.all('searchActivity').getList({
                    max_results: 2,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed: Math.random()
            }).then(function(data) {
                    if(data.length === 0){
                        this.end = true;
                    }
                    this.searchHistory.push.apply(this.searchHistory,data);
                    //console.log(this.searchResult)
                    this.page = this.page + 1;
				    this.busy = false;
            }.bind(this));
		};

       SearchActivity.prototype.addSearchText = function(content) {
		    var self = this;
            var req = {
                method: 'POST',
                url: '/api/storeSearchResults',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {'content': content, 'author': self.user_obj._id}
            }
            $http(req).success(function(data){
                if(data.data){
                    self.searchHistory.unshift({
                        author: self.user_obj._id,
                        content: content,
                        _id: data._id
                    });
                }
            }.bind(self));
       };

       SearchActivity.prototype.getSimilarWords = function(sentence){
            return $http({
                       url: '/api/similarwords',
                       method: "GET",
                       params: {querystring: sentence }
            });
       }

		function combine_ids(ids) {
   			return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

    return SearchActivity;

	})
	.factory('MatchMeResults', function($http, Restangular, $alert, $timeout,CurrentUser,$auth,CurrentUser1) {

        function combine_ids(ids) {
   				return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        // remove duplicate results
        function removeDuplicateResults(inputarry){
            var temparray = [];
            var authorIds = [];

            for(var i in inputarry){
                //console.log(i)
                if(authorIds.indexOf(inputarry[i].author._id) === -1){
                    authorIds.push(inputarry[i].author._id);
                    temparray.push(inputarry[i]);
                }
            }

            return temparray;
        }

		var  MatchMeResults = function(query, location) {

			this.total_matches = 0;

			this.mResultsNotFound = false;
			this.saResultsNotFound = false;

			this.mresults = [];
			this.matchedids = [];
			this.totalNames = '';
			this.searchNames =[];
			this.busy = true;
			this.page = 1;
			this.end = false;
            var keywords;
            this.param1 = null;
            this.param2 = null;
            this.query = query
            this.sPage = 1;
            this.sEnd = false;
            this.sBusy = true;
            this.suggestpeople = false;
            if(typeof location === 'undefined')
                this.location = 0;
            else
                this.location = location;
        };

        MatchMeResults.prototype.newSearchResults = function(){

            if(this.query){

                var keywords = combine_ids(this.query.split(" "));
                var self = this;
                var req = {
                    method: 'POST',
                    url: '/api/matchresults',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        page: self.page,
                        query: self.query,
                        keywords : keywords,
                        location : self.location
                    },
                }

            $http(req).success(function(data){
               self.mresults.push.apply(self.mresults, data.final_result);
            }.bind(self));

            }
 		};



		MatchMeResults.prototype.getMatchedNewResults = function(searchPostId) {

			var params = '{"_id":"'+searchPostId+'"}';

			var data = Restangular.one("people",JSON.parse(CurrentUser1.userId)).all('searchActivity').getList({
				where :params,
				sort: '[("_created",-1)]',
				seed : Math.random()
			}).then(function(sResult) {

				var param = '{"_id":{"$in":['+combine_ids(sResult[0].matchedPosts)+']}}';
				var param2 = '{"author":1}';

				var data2 = Restangular.all("posts").getList({
					where: param,
					embedded: param2,
					seed : Math.random()
				}).then(function(data){
					this.total_matches = data.length;
					this.mresults.push.apply(this.mresults,data);
				}.bind(this));

				Restangular.one("searchActivity",searchPostId).patch(
					{newResults:0},{},
					{
						'Content-Type': 'application/json',
						'If-Match': sResult[0]._etag,
						'Authorization': $auth.getToken()
					}
				);

				return data2
            }.bind(this));
            return data;
		};

        MatchMeResults.prototype.nextPage = function() {

            if ((this.busy | this.end) && this.query) return;
			this.busy = true;
            var self = this;

			Restangular.all('posts').getList({
			    where : self.param1,
				max_results: 30,
				page: self.page,
				embedded : self.param2
			}).then(function(data) {

                if (data.length === 0) {
					self.end = true;
				}
				//console.log('called infinity scroll')
				self.mresults.push.apply(self.mresults, data);
                self.mresults = removeDuplicateResults(self.mresults);
				self.page = self.page + 1;
				self.busy = false;

			}.bind(self));


		};


		MatchMeResults.prototype.nextPageSearchResults = function() {
            //console.log("nextpage search resutls")
			if ((this.sBusy | this.sEnd) && this.query) return;
			this.sBusy = true;
            var self = this;

			Restangular.all('searchActivity').getList({
			    where : self.param1,
				max_results: 30,
				page: self.sPage,
				embedded : self.param2
			}).then(function(data) {

                if (data.length === 0) {
					self.sEnd = true;
				}

				self.mresults.push.apply(self.mresults, data);
                self.mresults = removeDuplicateResults(self.mresults);

				self.sPage = self.sPage + 1;
				self.sBusy = false;

			}.bind(self));
		};

		/*MatchMeResults.prototype.getMatchPeoples = function(searchText) {

			var params = '{"$or":[{"name.first":{"$regex":".*'+searchText+'.*"}},{"name.last":{"$regex":".*'+searchText+'.*"}},'+
			             '{"username":{"$regex":".*'+searchText+'.*"}}]}';
			Restangular.all('people').getList({
				where :params
				}).then(function(data) {
					this.totalNames = data.length;
					this.searchNames.push.apply(this.searchNames,data);
				}.bind(this));

		};

		MatchMeResults.prototype.getSuggestedPeople = function(){

            function combine_ids(ids) {
   			    return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		    }

            var param = '{"interestsimilarwords":{"$in":['+combine_ids(this.query.split(" "))+']}}';
            Restangular.all("people").getList({
					where: param,
					seed : Math.random()
			}).then(function(data){
                   if(data.length >= 1){
                     this.suggestpeople = true;
			       }
					var tempresutls = [];
					this.mresults.push.apply(this.mresults,data);
					for(var temp in this.mresults){
					    var author = {
					        author:{
                                name:{
                                    first:this.mresults[temp].name.first,
                                    last: this.mresults[temp].name.last,
                                },
                                _id:this.mresults[temp]._id,
                                picture:{
                                    medium:this.mresults[temp].picture.medium
                                }
                            }
					    }
					    tempresutls.push(author);
					}

					this.mresults = tempresutls;
			}.bind(this));
		}*/
		return MatchMeResults;
	});angular.module('weberApp')

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


.directive('cancelrequest', function ($compile, $timeout, CurrentUser, Restangular, $routeParams, $route,friendsActivity, Friends) {
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
                    var data = Friends.addFriend($scope.currentUser._id, profileuser_id);
                    data.then(function(data){
                        if(data.data && !(fromRequest)){
                             var html ='<addfriend><button ng-click="frndcancelrequest(\''+profileuser_id+'\', 0)"'
                             +'class="btn pull-right btn-sm btn-primary">cancel request</button></addfriend>';
                             e =$compile(html)($scope);
                             $element.replaceWith(e);
                                /*if($scope.currentUser.send_add_requests.indexOf(id) == -1){
                                    $scope.currentUser.send_add_requests.push(id);

                                }*/
                        }else if(data.data && fromRequest) {
                             var html ='<button  class="btn pull-right btn-sm btn-primary">Successfully Added</button>';
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

.directive('addfriend', function ($compile, $timeout, CurrentUser, Restangular,$route, $routeParams, friendsActivity, Friends) {
    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, $element, attrs) {},
         controller:function($scope, $element, $attrs, $transclude){
         $scope.frndcancelrequest = function(profile_user_id, requestFrom){
               $scope.load_add_friend = $timeout(function() {
                   var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                   var e = null;
                   $element.html(html);
                   $compile($element.contents())($scope);

                   var data = Friends.cancelRequest($scope.currentUser._id, profile_user_id);

                   data.then(function(data){
                        if(data.data && !(requestFrom)){
                             var html ='<cancelrequest><button  ng-click="frndaddrequest( \''+profile_user_id+'\', 0)"'
                             +'class="btn pull-right btn-sm btn-primary">Add Friend</button></cancelrequest>';
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

.directive('acceptreject', function ($compile, $window, CurrentUser, Restangular,$route, $routeParams,Friends, friendsActivity) {
    return {
        restrict: 'E',
        replace: true,
        link: function (scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){

            $scope.acceptrequest = function(profile_user_id, navbar_request){

                var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                var e = null;
                $element.html(html);
                $compile($element.contents())($scope);
                console.log("----------------------->", $scope.currentUser._id, profile_user_id)
                var data = Friends.acceptRequest($scope.currentUser._id, profile_user_id);
                data.then(function(data){
                    if(data.data){
                         if(navbar_request){
                            html = '<b> friends </b>';
                            e =$compile(html)($scope);
                            $element.replaceWith(e);
                         }else{
                            html ='<unaddfriend><button ng-click="friendunfriend(\''+profile_user_id+'\', 0)"'+
                                'class="btn btn-sm btn-primary pull-right">unfriend</button></unaddfriend>';
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
            }

            $scope.rejectrequest = function(profile_user_id, requestFrom){

                var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                var e = null;
                $element.html(html);
                $compile($element.contents())($scope);
                console.log("----------------------->", $scope.currentUser._id, profile_user_id)
                var data = Friends.rejectRequest($scope.currentUser._id, profile_user_id);
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
            }
        }
    };
})
.directive('unaddfriend', function ($compile, CurrentUser,$window, Restangular, $routeParams, Friends, friendsActivity,$route) {
    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){
            $scope.friendunfriend = function(profile_user_id, requestFrom){
                    var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                    var e = null;
                    $element.html(html);
                    $compile($element.contents())($scope);
                    var data = Friends.unFreind($scope.currentUser._id, profile_user_id);
                    data.then(function(data){
                        if(data.data){
                            if(requestFrom){
                                html = '<b> successfully processed</b>'
                            }else{
                             html ='<cancelrequest><button ng-click="frndaddrequest(\''+profile_user_id+'\', 0)"'+
                             'class="btn pull-right btn-sm btn-primary">Add Friend</button></cancelrequest>';
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
            }
        }
    };
});
