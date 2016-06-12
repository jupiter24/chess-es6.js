'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PieceType = function PieceType() {
  _classCallCheck(this, PieceType);
};

;

PieceType.NONE = '.';
PieceType.PAWN = 'p';
PieceType.KNIGHT = 'n';
PieceType.BISHOP = 'b';
PieceType.ROOK = 'r';
PieceType.QUEEN = 'q';
PieceType.KING = 'k';

module.exports.PieceType = PieceType;