'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:GameCtrl
 * @description
 * # GameCtrl
 * Controller of the clientApp
 */
angular.module('clientApp')
  .controller('GameController', function ($scope, $timeout, game) {

    $scope.game  = game;
    $scope.error = {};

    /**
     * Displays a message to the user
     * 
     * @param string message
     * @param string type
     *   Allowed values: success, info, warning, danger
     * @param int timeout
     *   (optional) Time to display message. Use 0 for no autohide.
     */
    function setMessage(message, type, timeout) {

      var style = type;
      switch (type) {
        case 'error' :
          style = 'danger';
          break;
      }
      $scope.error = {
        message: message,
        style: 'alert-' + style
      };
      // Set a timeout to hide the message
      if (timeout === undefined) {
        timeout = 1500;
      }
      if (timeout) {
        $timeout(function() {
          $scope.error = {};
        }, timeout);
      }
    }

    $scope.newGame = function() {
      $scope.game = new SetGame();
    };

    $scope.selectCard = function(e, card) {

      try {
        
        var selectedClass = 'active';
        var board = $scope.game.board;
        var $parentEl = $(e.target).parent();
        if ($parentEl.hasClass(selectedClass)) {
          board.deselectCard(card);
          $parentEl.removeClass(selectedClass);
        }
        else {
          board.selectCard(card);
          $parentEl.addClass(selectedClass);
          // @todo replace this with event listener for max cards selected
          
          if (board.selectedCards.length === SetGameBoard.maxSelectedCards) {
            var isSet = game.checkSet(board.selectedCards[0], board.selectedCards[1], board.selectedCards[2]);
            if (isSet) {
              setMessage('This is a set!', 'success');
              $scope.game.board.removeSelectedCards();
              $scope.game.score++;
              // Play the next 3 cards
              // @todo replace this with event listener for set removed
              // @todo this is currently sharing the same function as laying out an entirely new row because we're stuck
              //   but a better UI would be to replace the cards where they were on the board
              $scope.game.board.addRow();
            }
            else {
              setMessage('Not a set!', 'error');
              $scope.game.board.deselectAllCards();
              $('.' + selectedClass).removeClass(selectedClass); // @todo replace this with event listener for invalid set completed
            }

          }
        }

      }
      catch (err) {
        $scope.error = err.message;
        console.log(err);
      }

    };

    $scope.showMatchingCard = function() {
      var matchingCard = $scope.game.tutorialThirdCard($scope.game.board.selectedCards[0], $scope.game.board.selectedCards[1]);
      setMessage('The third card to complete this Set is: ' + matchingCard.translateCard() + '.', 'info');
    };

    $scope.showPossibleSets = function() {
      var sets = $scope.game.tutorialActiveSets();
      var msg = '';
      if (sets.length === 1) {
        msg = 'There is 1 possible Set.';
      }
      else {
        msg = 'There are ' + sets.length + ' possible Sets.';
      }
      if (sets.length) {
        msg += '<ul>';
      }
      for (var i = 0; i < sets.length; i++) {
        msg += '<li>';
        for (var j = 0; j < sets[i].length; j++) {
          if (j) {
            msg += ', ';
          }
          msg += sets[i][j].translateCard();
        }
        msg += '</li>';
      }
      if (sets.length) {
        msg += '</ul>';
      }
      setMessage(msg, 'info', 0);
    };
  });
