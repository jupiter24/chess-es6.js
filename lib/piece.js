'use strict';

var _Piece$LOOKUP;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Color = require('./color').Color;
var PieceType = require('./piece_type').PieceType;

var Piece = function () {
    function Piece(options) {
        _classCallCheck(this, Piece);

        this.type = options.type; // PieceType -- the type of piece, e.g. PAWN, KNIGHT, ROOK
        this.color = options.color; // Color     -- WHITE or BLACK

        this.symbol = this.color === Color.WHITE ? this.type.toUpperCase() : this.type;

        Object.freeze(this); // immutability == sanity safeguard
    }

    _createClass(Piece, [{
        key: 'toString',
        value: function toString() {
            return this.symbol;
        }

        // for more succinct console.log() output

    }, {
        key: 'inspect',
        value: function inspect() {
            return this.toString();
        }
    }], [{
        key: 'forSymbol',
        value: function forSymbol(symbol) {
            return Piece.LOOKUP[symbol];
        }
    }]);

    return Piece;
}();

;

// set up our pool of reusable pieces;  http://en.wikipedia.org/wiki/Flyweight_pattern
Piece.WHITE_PAWN = new Piece({ color: Color.WHITE, type: PieceType.PAWN });
Piece.WHITE_KNIGHT = new Piece({ color: Color.WHITE, type: PieceType.KNIGHT });
Piece.WHITE_BISHOP = new Piece({ color: Color.WHITE, type: PieceType.BISHOP });
Piece.WHITE_ROOK = new Piece({ color: Color.WHITE, type: PieceType.ROOK });
Piece.WHITE_QUEEN = new Piece({ color: Color.WHITE, type: PieceType.QUEEN });
Piece.WHITE_KING = new Piece({ color: Color.WHITE, type: PieceType.KING });
Piece.BLACK_PAWN = new Piece({ color: Color.BLACK, type: PieceType.PAWN });
Piece.BLACK_KNIGHT = new Piece({ color: Color.BLACK, type: PieceType.KNIGHT });
Piece.BLACK_BISHOP = new Piece({ color: Color.BLACK, type: PieceType.BISHOP });
Piece.BLACK_ROOK = new Piece({ color: Color.BLACK, type: PieceType.ROOK });
Piece.BLACK_QUEEN = new Piece({ color: Color.BLACK, type: PieceType.QUEEN });
Piece.BLACK_KING = new Piece({ color: Color.BLACK, type: PieceType.KING });
Piece.NONE = new Piece({ color: Color.NONE, type: PieceType.NONE });
Piece.LOOKUP = (_Piece$LOOKUP = {}, _defineProperty(_Piece$LOOKUP, Piece.WHITE_PAWN, Piece.WHITE_PAWN), _defineProperty(_Piece$LOOKUP, Piece.WHITE_KNIGHT, Piece.WHITE_KNIGHT), _defineProperty(_Piece$LOOKUP, Piece.WHITE_BISHOP, Piece.WHITE_BISHOP), _defineProperty(_Piece$LOOKUP, Piece.WHITE_ROOK, Piece.WHITE_ROOK), _defineProperty(_Piece$LOOKUP, Piece.WHITE_QUEEN, Piece.WHITE_QUEEN), _defineProperty(_Piece$LOOKUP, Piece.WHITE_KING, Piece.WHITE_KING), _defineProperty(_Piece$LOOKUP, Piece.BLACK_PAWN, Piece.BLACK_PAWN), _defineProperty(_Piece$LOOKUP, Piece.BLACK_KNIGHT, Piece.BLACK_KNIGHT), _defineProperty(_Piece$LOOKUP, Piece.BLACK_BISHOP, Piece.BLACK_BISHOP), _defineProperty(_Piece$LOOKUP, Piece.BLACK_ROOK, Piece.BLACK_ROOK), _defineProperty(_Piece$LOOKUP, Piece.BLACK_QUEEN, Piece.BLACK_QUEEN), _defineProperty(_Piece$LOOKUP, Piece.BLACK_KING, Piece.BLACK_KING), _defineProperty(_Piece$LOOKUP, Piece.NONE, Piece.NONE), _Piece$LOOKUP);

// TODO(aaron, 2015.11.17) consider relaxing this to include enemy pieces, in order to support that edge-case "promote to an enemy piece for a mate-in-1" puzzle from Sherlock Holmes Chess Mysteries book
Piece.WHITE_PROMOTION_PIECES = [Piece.WHITE_QUEEN, Piece.WHITE_ROOK, Piece.WHITE_BISHOP, Piece.WHITE_KNIGHT];
Piece.BLACK_PROMOTION_PIECES = [Piece.BLACK_QUEEN, Piece.BLACK_ROOK, Piece.BLACK_BISHOP, Piece.BLACK_KNIGHT];

module.exports.Piece = Piece;