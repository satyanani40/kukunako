'use strict';

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
	}]);/*====== end of file upload services ======*/