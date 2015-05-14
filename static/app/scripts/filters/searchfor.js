'use strict';

/**
 * @ngdoc filter
 * @name weberApp.filter:searchFor
 * @function
 * @description
 * # searchFor
 * Filter in the weberApp.
 */
angular.module('weberApp')
  .filter('searchFor', function () {
    return function (arr, searchString) {

      	if(!searchString){
			return;
		}

		var result = [];
		searchString = searchString.toLowerCase();
		angular.forEach(arr, function(item){
			if(item.title.toLowerCase().indexOf(searchString) !== -1){
				result.push(item);
			}
		});
		return result;
    };
  });
