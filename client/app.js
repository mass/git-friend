angular.module('git-friend', [])
  .controller('GitFriendController', function($scope, $http) {

    $scope.user = {};

    $scope.loadData = function(username) {
      $scope.user = {};
      $scope.error = null;

      $http.get('/user/' + username)
        .success(function(data) {
          angular.extend($scope.user, data);
        })
        .error(function(data) {
          $scope.error = data.error;
        });

      $http.get('/stars/' + username)
        .success(function(data) {
          $scope.user.stars = data;
        })
        .error(function(data) {
          $scope.error = data.error;
        });
    }
  });
