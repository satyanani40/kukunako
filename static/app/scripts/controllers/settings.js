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
        //console.log("interests", $scope.InterestsService)

        $scope.$watchCollection('data.tags',function(val){
            //console.log("----->>>> this controller")
            //console.log(val);


            $scope.final_interests_array = val;
            //console.log("array of interests====>>>>>", $scope.final_interests_array);
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
                        //console.log($scope.myImage)
                    });
                  };
                  reader.readAsDataURL(file);
               };

               angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);

               $scope.$watch('myCroppedImage',function(){
                    //console.log('ddd')
                    //console.log('Res image==->', $scope.myCroppedImage);
               });

               $scope.update_image = function(){
                    //console.log('called')
                    //console.log('---------->',    $scope.myImage)
                    //console.log('=============>', $scope.myCroppedImage)

                    $scope.UploadImage_busy = $timeout(function() {
                       var req = {
                            method: 'POST',
                            url: '/api/image-crop',
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

                    $http.post('/check-user-current-password',
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
                    //console.log("scope----", $scope.if_user_password_is_incorrect)
                    if ($scope.if_user_password_is_incorrect == false) {
                        $scope.Password_busy = $timeout(function(){

                            $http.post('/get-new-hash-password',{
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
                        $http.post('/get-interested-ids',
                        {
                            interests: $scope.final_interests_array,
                            username: $scope.user.username
                        })
                        .success(function(data, status, headers, config) {
                            //console.log("======return success of interests of ids",data.data);
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
                                $route.reload();
                            }, 3000);
                            $timeout(function(){
                                $('#4').collapse("hide");
                            },1000);
                        }).
                        error(function(data, status, headers, config) {
                            //console.log("====error of interests", data.data)
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
                    //console.log("remove tags===", scope.selectedTags)
                }

                scope.search=function(){
                    var param1 = '{"interest_string":{"$regex":".*'+scope.searchText+'.*"}}';
                    var interests = [];
                    $http.get('/api/interests?where='+param1)
                    .success(function(data){
                        //console.log("sss",data)
                        for(var temp in data._items){
                            //console.log(data._items[temp].interest_string)
                            interests.push(data._items[temp].interest_string)
                        }
                        if(interests.indexOf(scope.searchText) === -1){
                            interests.unshift(scope.searchText);
                        }

                        //console.log('interests===>', interests)
                        scope.suggestions= interests;
                        scope.selectedIndex=-1;
                    });
                }

                scope.addToSelectedTags=function(index){
                    if(scope.selectedTags.indexOf(scope.suggestions[index])===-1){
                        scope.selectedTags.push(scope.suggestions[index]);
                        //console.log("selected tags-->>>>", scope.selectedTags);
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
    }]);