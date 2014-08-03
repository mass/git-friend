angular.module('git-friend', [])
  .controller('GitFriendController', function($scope, $http) {

    $scope.user = {};
    $scope.isAuth = false;
    $scope.remaining = null;

    $http.get('/isAuth')
      .success(function(data) {
        $scope.isAuth = data.isAuth;
        $scope.remaining = data.remaining;
      })
      .error(function(data) {
        $scope.isAuth = false;
      });

    $scope.loadData = function(username) {

      $scope.user = {};
      $scope.error = null;

      $http.get('/user/' + username)
        .success(function(data) {
          angular.extend($scope.user, data);
          $scope.user.stars = [];
          $scope.remaining = data.remaining;
        })
        .error(function(data) {
          $scope.error = data.error;
        });

      $http.get('/stars/' + username)
        .success(function(data) {
          $scope.user.stars = data.stars;
          $scope.remaining = data.remaining;
        })
        .error(function(data) {
          $scope.error = data.error;
        });
    }
  });
