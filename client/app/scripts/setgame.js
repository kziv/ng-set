/**
 * Set Game
 *
 * Abstract implementation of the Set card game. This is designed to be
 * used with AngularJS, but technically can be used by any JS.
 *
 * @author Karen Ziv <me@karenziv.com>
 */
'use strict';

/* ======================== CARD CLASS ======================== */

function SetGameCard(data) {
  
  // Raw bits for set math
  this.color = data.color;
  this.count = data.count;
  this.fill  = data.fill;
  this.shape = data.shape;

  this.colorText = this.translate('color');
  this.countText = this.translate('count');
  this.fillText  = this.translate('fill');
  this.shapeText = this.translate('shape');
  this.description = this.translateCard();

  this.isSelected = false;
}

// All the available card attributes. There is one card for every combination of each attribute value
// (i.e. total cards = shape.length * color.length * count.length * fill.length)
SetGameCard.attributes = {shape : ['squiggle', 'diamond', 'pill'],
                          color : ['red', 'purple', 'green'],
                          count : [1, 2, 3],
                          fill  : ['solid', 'semi', 'empty']
                         };

/**
 * Translates a card attribute into human-friendly text
 *
 * @param string attribute
 *   Name of attribute to translate (shape, color, count, fill)
 *
 * @return string
 *   Text description of attribute (e.g. squiggle)
 */
SetGameCard.prototype.translate = function(attribute) {
  return SetGameCard.attributes[attribute][ this[attribute] ];
};

/**
 * Translates the card bits into human-friendly dsecription
 *
 * @return string
 */
SetGameCard.prototype.translateCard = function() {
  
  var color = this.translate('color');
  var count = this.translate('count');
  var fill  = this.translate('fill');
  var shape = this.translate('shape');

  var description = count + ' ' + color + ' ' + fill + ' ' + shape;
  if (count > 1) {
    description += 's';
  }

  return description;
};

/**
 * Sets the current card as selected on the game board
 */
SetGameCard.prototype.select = function() {
  this.isSelected = true;
};

/* ======================== DECK CLASS ======================== */

function SetGameDeck() {
  
  this.cards = []; // All game cards. Instances of setGameCard.

  // ---------- Init ---------- //
  this.populateCards();
}

/**
 * Initializes the card deck with all cards.
 */
SetGameDeck.prototype.populateCards = function() {
  
  // For each fill...
  for (var fillVal = 0; fillVal < SetGameCard.attributes.fill.length; fillVal++) {
    // For each shape...
    for (var shapeVal = 0; shapeVal < SetGameCard.attributes.shape.length; shapeVal++) {
      // For each color...
      for (var colorVal = 0; colorVal < SetGameCard.attributes.color.length; colorVal++) {
        // For each count...
        for (var countVal = 0; countVal < SetGameCard.attributes.count.length; countVal++) {
          // Create a card with these attributes
          this.cards.push(new SetGameCard({fill: fillVal, shape: shapeVal, color: colorVal, count: countVal}));
        }
      }
    }
  }
  
};

/**
 * Draws a card from the deck of unplayed cards
 *
 * @return object
 *   Instance of SetCard representing the drawn card
 */
SetGameDeck.prototype.getNextCard = function() {
  var random = Math.floor(Math.random() * this.cards.length); // Get a random number from deck size
  var card = this.cards[random]; // Retrieve card
  this.cards.splice(random, 1);  // Remove the card from the deck
  return card;                   // Return the card
};

/* ======================== BOARD CLASS ======================== */

function SetGameBoard(deck) {
  
  this.cards         = []; // Cards currently on the board
  this.deck          = deck; // The deck of unplayed cards for this game
  this.errors        = []; // Error stack for non-Set trios
  this.selectedCards = []; // Cards currently selected for Set testing

  // ---------- Init ---------- //

  this.initBoard();

}

SetGameBoard.cardsPerRow = 3; // Number of cards in each row (for laying out a new row when no sets exist)
SetGameBoard.size        = 12; // Number of total cards on the board (normal play, until we have to add more for no sets)
SetGameBoard.maxSelectedCards = 3; // Max number of cards that can be selected at once

/**
 * Initializes the game board
 */
SetGameBoard.prototype.initBoard = function() {

  // @todo do we need this logic if this is only run in the beginning of the game?
  // Don't bother trying to add a card if we've exceeded the total number of cards
  if (this.cards.length >= (this.deck.cards.length - 1)) {
    return false;
  }

  for (var i = 0; i < SetGameBoard.size; i++) {
    this.addCard();
  }

};

/**
 * Adds a card from the deck to the game board
 * 
 * @todo Add card to specific position on the board
 */
SetGameBoard.prototype.addCard = function() {

  // If there are no more unused cards left, get out of here
  if (!this.deck.cards.length) {
    return;
  }
    
  var card = this.deck.getNextCard();
  this.cards.push(card);
  
};

/**
 * Adds another row to the game board.
 * This is just shorthand for adding N cards.
 */
SetGameBoard.prototype.addRow = function() {

  for (var i = 0; i < SetGameBoard.cardsPerRow; i++) {
    this.addCard();
  }
};

/**
 * Removed a card from the board (i.e. to the discard pile)
 */
SetGameBoard.prototype.removeCard = function(card) {

  // We can assume the card is selected if we're going to discard it
  // as the rules don't allow for discarding an unselected card.
  // If you want to expand this board logic for other card games,
  // this may have to be rewritten.

  // Deselect the card
  this.deselectCard(card);

  // Remove the card from the board
  for (var i in this.cards) {
    if (this.cards[i] === card) {
      this.cards.splice(i, 1);
    }
  }
  
};

/**
 * Selects a specific card on the board
 *
 * @param object card
 *   Selected card. Instance of SetGameCard
 */
SetGameBoard.prototype.selectCard = function(card) {

  // Make sure we don't already have the max number of cards selected
  if (this.selectedCards.length >= SetGameBoard.maxSelectedCards) {
    throw new SetGameException('The maximum number of cards (' + SetGameBoard.maxSelectedCards + ') has already been selected.');
  }

  // Make sure this card isn't already in the stack
  // UI should prevent this, but this class is UI-agnostic
  for (var i in this.selectedCards) {
    if (this.selectedCards[i] === card) {
      throw new SetGameException('This card is already selected.', card);
    }
  }

  // Add the card to the selected cards stack
  this.selectedCards.push(card);
  
};

/**
 * Dselects a specific card on the board that is already selected
 *
 * @param object card
 *   Selected card. Instance of SetGameCard.
 */
SetGameBoard.prototype.deselectCard = function(card) {

  for (var i in this.selectedCards) {
    if (this.selectedCards[i] === card) {
      this.selectedCards.splice(i, 1);
    }
  }

};

/**
 * Deselects all active cards
 */
SetGameBoard.prototype.deselectAllCards = function() {
  this.selectedCards = [];
};

/**
 * Discards all selected cards. Use this when a valid Set is completed.
 */
SetGameBoard.prototype.removeSelectedCards = function() {

  // We have to do this in reverse because the array keys reset when items are removed
  for (var i = this.selectedCards.length - 1; i >= 0; i--) {
    this.removeCard(this.selectedCards[i]);
  }

};

/**
 * Checks whether the selected cards are a valid Set
 *
 * @return bool
 *   true if a Set, false if not
 */
SetGameBoard.prototype.checkSet = function() {

  // Make sure we have the requisite number of cards to make a Set
  if (this.selectedCards.length !== SetGameBoard.maxSelectedCards) {
    throw new SetGameException('Incorrect number of cards to make a Set.');
  }

  function isSame(val1, val2, val3) {
    return (val1 === val2 && val2 === val3);
  }
  function isDifferent(val1, val2, val3) {
    return !(val1 === val2 || val1 === val3 || val2 === val3);
  }

  var card1 = this.selectedCards[0];
  var card2 = this.selectedCards[1];
  var card3 = this.selectedCards[2];
  
  // Clear the error stack for new trio verification
  this.errors = []; // @todo make this happen on checkSet event instead of forced?

  // For each property, the 3 values must be all the same or all different        
  for (var attribute in SetGameCard.attributes) {
    if (!isSame(card1[attribute], card2[attribute], card3[attribute]) && !isDifferent(card1[attribute], card2[attribute], card3[attribute])) {
      this.errors.push(attribute);
    }
  }

  return !!!(this.errors.length);

};

/* ======================== GAME CONTROLLER ======================== */

function SetGame() {
  
  this.score  = 0; // Current score (number of Sets found)
  
  this.deck   = new SetGameDeck();           // The current deck in use. Instance of setGameDeck.
  this.board  = new SetGameBoard(this.deck); // The current game board in use. Instance of setGameBoard.

  // Let the world know this is done
  //var event = new CustomEvent('gameInitialized', { detail: {}});
  //this.dispatchEvent(event); // @todo fire this!

}

/**
 * Custom exception for the Set game
 *
 * @param string msg
 *   A user-friendly message
 * @param object details
 *   Other info relevant to the exception
 */
function SetGameException(msg, details) {
  this.message = msg;
  this.details = details;

  this.toString = function() {
    return this.msg;
  };

}

/* ======================== EVENT MANAGEMENT ======================== */
// @see http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/

//Copyright (c) 2010 Nicholas C. Zakas. All rights reserved.
//MIT License

function EventTarget(){
  this._listeners = {};
}

EventTarget.prototype = {
  
  constructor: EventTarget,
  
  addListener: function(type, listener){
    if (typeof this._listeners[type] === 'undefined'){
      this._listeners[type] = [];
    }
    
    this._listeners[type].push(listener);
  },
  
  fire: function(event){
    if (typeof event === 'string'){
      event = { type: event };
    }
    if (!event.target){
      event.target = this;
    }
    
    if (!event.type){  //falsy
      throw new Error('Event object missing \'type\' property.');
    }
    
    if (this._listeners[event.type] instanceof Array){
      var listeners = this._listeners[event.type];
      for (var i=0, len=listeners.length; i < len; i++){
        listeners[i].call(this, event);
      }
    }
  },
  
  removeListener: function(type, listener){
    if (this._listeners[type] instanceof Array){
      var listeners = this._listeners[type];
      for (var i=0, len=listeners.length; i < len; i++){
        if (listeners[i] === listener){
          listeners.splice(i, 1);
          break;
        }
      }
    }
  }
};
