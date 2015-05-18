'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:EmailDetailsCtrl
 * @description
 * # EmailDetailsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('enterInterestsCtrl', function($timeout, questions, InterestsService, $http,
	 Restangular, $scope, $auth, $alert, $location, $routeParams, $rootScope) {

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

                $rootScope.currentUser = user;

                $scope.afterFinishQuestions = function(){
                    $location.path('/home');
                }
                // questions section functions
                $scope.questions = new questions(user);
                $scope.questions.getallquestions();

                $scope.answered = function(question, ans){

                    for(var temp in $rootScope.currentUser.questions){
                        if($rootScope.currentUser.questions[temp].questionid == question){
                            $rootScope.currentUser.questions[temp].answer = ans;
                            $scope.questions.updateAnswer(question, ans, $rootScope.currentUser._id);
                            return;
                        }
                    }

                    $rootScope.currentUser.questions.push({'questionid':question, 'answer': ans});
                    console.log('pushed answereds', $rootScope.currentUser.questions)
                    $scope.questions.updateAnswer(question, ans, $rootScope.currentUser._id);
                    return;
                }

                $scope.checkAnswer = function(question_id){
                    data = $scope.questions.checkAnswer(question_id);
                    return data;
                }
                // end of questions section

                if($rootScope.currentUser.interests.length){
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
                    for(var temp in $rootScope.currentUser.interests){
                        $scope.final_interests_array.push(InterestsService.get($rootScope.currentUser.interests[temp]).interest_string)
                    }
                    $scope.Interests_busy = $timeout(function() {
                        $http.post('/get_interested_ids',
                        {
                            interests: $scope.final_interests_array,
                            username: $rootScope.currentUser.username
                        })
                        .success(function(data, status, headers, config) {
                            console.log("======return success of interests of ids",data);
                            $rootScope.currentUser.interests = data.interests;
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
    });