declare type pieceType = string;

declare class PieceType {
    static NONE: pieceType;
    static PAWN: pieceType;
    static KNIGHT: pieceType;
    static BISHOP: pieceType;
    static ROOK: pieceType;
    static QUEEN: pieceType;
    static KING: pieceType;
}

export = PieceType;
