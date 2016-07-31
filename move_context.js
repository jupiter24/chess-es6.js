'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Color = require('./color').Color;

var MoveContext = function () {

    // default constructor

    function MoveContext(options) {
        var _castlingEligibility, _kings;

        _classCallCheck(this, MoveContext);

        this.move = options.move; // Move object from move.js

        this.castlingEligibility = (_castlingEligibility = {}, _defineProperty(_castlingEligibility, Color.WHITE, options.castlingEligibility[Color.WHITE]), _defineProperty(_castlingEligibility, Color.BLACK, options.castlingEligibility[Color.BLACK]), _castlingEligibility);
        this.kings = (_kings = {}, _defineProperty(_kings, Color.WHITE, options.kings[Color.WHITE]), _defineProperty(_kings, Color.BLACK, options.kings[Color.BLACK]), _kings);

        this.turn = options.turn;
        this.enPassantSquare = options.enPassantSquare;

        this.moveNumber = options.moveNumber;
        this.halfMoves = options.halfMoves;
        this.plyCount = options.plyCount;

        this.metadata = options.metadata;

        // TODO these original members are now, or should be!, in this.metadata
        // this.timeTakenToMove = options.timeTakenToMove;
        // this.comment = options.comment;
        // this.isPuzzleSolution = options.isPuzzleSolution;

        this.childVariations = [];
    }

    _createClass(MoveContext, [{
        key: 'toString',
        value: function toString() {
            return this.move.algebraic;
        }

        // for more succinct console.log() output

    }, {
        key: 'inspect',
        value: function inspect() {
            return this.toString();
        }
    }]);

    return MoveContext;
}();

;

module.exports.MoveContext = MoveContext;