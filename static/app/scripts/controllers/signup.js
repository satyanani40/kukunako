'use strict';

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
	});