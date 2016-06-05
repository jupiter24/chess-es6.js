import Color = require('./color');
import PieceType = require('./piece_type');

declare class Piece {
    constructor(options: {
        pieceType: string,
        color: string
    });
    toString(): string;
    inspect(): string;

    static WHITE_PAWN: Piece;
    static WHITE_KNIGHT: Piece;
    static WHITE_BISHOP: Piece;
    static WHITE_ROOK: Piece;
    static WHITE_QUEEN: Piece;
    static WHITE_KING: Piece;
    static BLACK_PAWN: Piece;
    static BLACK_KNIGHT: Piece;
    static BLACK_BISHOP: Piece;
    static BLACK_ROOK: Piece;
    static BLACK_QUEEN: Piece;
    static BLACK_KING: Piece;
    static NONE: Piece;

    static WHITE_PROMOTION_PIECES: Piece[];
    static BLACK_PROMOTION_PIECES: Piece[];
}

export = Piece;
