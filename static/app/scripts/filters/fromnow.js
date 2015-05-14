'use strict';

/**
 * @ngdoc filter
 * @name weberApp.filter:fromNow
 * @function
 * @description
 * # fromNow
 * Filter in the weberApp.
 */
angular.module('weberApp')
  .filter('fromnow', function () {
    return function(date) {
      return moment(date).fromNow();
    }
  });


