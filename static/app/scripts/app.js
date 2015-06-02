'use strict';

/**
 * @ngdoc overview
 * @name weberApp
 * @description
 * # weberApp
 *
 * Main module of the application.
 */
angular
	.module('weberApp', [
		'ngAnimate',
		'ngCookies',
		'ngResource',
		'ngRoute',
		'ngSanitize',
		'ngTouch',
		'mgcrea.ngStrap',
		'satellizer',
		'restangular',
		'angularMoment',
		'ngImgCrop',
		'infinite-scroll',
		'ngSocket',
		'cgBusy',
		'autocomplete',
		'luegg.directives',

	])
	.run(["$rootScope", "$location",
		function($rootScope, $location) {
			$rootScope.$on("$routeChangeError", function(event, current, previous, eventObj) {
				if (eventObj.authenticated === false) {
					$location.path("/login");
				}
			});
		}
	])
	.config(["$socketProvider", function ($socketProvider) {
      //$socketProvider.setUrl("www.weber.ooo");
      $socketProvider.setUrl(document.location.host);
      //$socketProvider.setUrl("http://127.0.0.1:8000/");
    }])
    .config(['RestangularProvider',
		function(RestangularProvider) {
			// point RestangularProvider.setBaseUrl to your API's URL_PREFIX
			RestangularProvider.setBaseUrl('/api');
			RestangularProvider.setRestangularFields({
				selfLink: '_links._self.href'
			});
			// add a response intereceptor
			RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
				var extractedData;
				// .. to look for getList operations
				if (operation === "getList") {
					// .. and handle the data and meta data
					extractedData = data._items;
					extractedData.meta = data._meta;
					extractedData.links = data._links;
				} else {
					extractedData = data;
				}
				return extractedData;
			});

			RestangularProvider.setRestangularFields({
				id: "_id"
			});
		}
	])
	.config(function($routeProvider, $locationProvider, $authProvider) {
		$authProvider.logoutRedirect = '/search';
		$authProvider.loginOnSignup = true;
		$routeProvider
			.when('/home', {
				templateUrl: '/static/app/views/main.html',
				controller: 'MainCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/login');
						}
					}
				}
			})
			.when('/profile/:username', {
				templateUrl: '/static/app/views/userprofile.html',
				controller: 'UserprofileCtrl',
			})

			.when('/post/:postid', {
				templateUrl: '/static/app/views/post.html',
				controller: 'PostLoadController'
			})
			.when('/search/:query?', {
				templateUrl: '/static/app/views/start_search.html',
				controller: 'WeberSearchCtrl',
				reloadOnSearch: false
			})
			.when('/login', {
				templateUrl: '/static/app/views/login.html',
				controller: 'indexCtrl'
			})
			.when('/settings', {
				templateUrl: '/static/app/views/settings.html',
				controller: 'SettingsCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/login');
						}
					}
				}
			})
			.when('/friends', {
				templateUrl: '/static/app/views/friends.html',
				controller: 'FriendsCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/login');
						}
					}
				}
			})
			.when('/messages', {
				templateUrl: '/static/app/views/messages.html',
				controller: 'MessagesCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/login');
						}
					}
				}
			})
			.when('/enter-interests/:email?', {
				templateUrl: '/static/app/views/enter_interests.html',
				controller:'enterInterestsCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/search');
						}
					}
				}
			})
			.when('/forgot-password', {
				templateUrl: '/static/app/views/f_password.html'


			})

			.when('/users/:user_name/change-password-link/:password_random_string', {
				templateUrl:'/static/app/views/change_password.html'
			})
			.when('/confirm-account/users/:objectId/confirm/:rand_string', {
				templateUrl:'/static/app/views/confirm_email.html',
				controller:'EmailCtrl'
			})
			.when('/signup', {
				templateUrl: '/static/app/views/signup.html',
				controller: 'indexCtrl'
			})
			.when('/about', {
				templateUrl: '/static/app/views/about.html'
			})
			.when('/term-policy', {
				templateUrl: '/static/app/views/terms-policy.html'
			})
			.when('/privacy-policy', {
				templateUrl: '/static/app/views/privacy-policy.html'
			})
           .when('/feedback', {
               controller: 'feedBackController',
               templateUrl: '/static/app/views/feedback.html',
           })
           .when('/careers', {
               controller: 'CareersCtrl',
               templateUrl: '/static/app/views/careers.html',
           })
           .otherwise({
				redirectTo: '/search',
				reloadOnSearch: false
		   });
	});