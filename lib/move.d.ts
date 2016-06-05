import Piece = require('./piece');
import BoardVariation = require('./board_variation');

declare class Move {
    constructor(options: {
        from: number,
        to: number,
        movedPiece: Piece,
        capturedPiece?: Piece,
        promotionPiece?: Piece,
        flags?: number,
        boardVariation?: BoardVariation
    });
    toString(): string;

    from: number;
    to: number;
    movedPiece: Piece;
    capturedPiece: Piece;
    promotionPiece: Piece;
    flags: number;
    isWildcard: boolean;
    algebraic: string;
    san: string|any;

    static copyFrom(move: Move): Move;
    static createFromSan(san: string, boardVariation: BoardVariation): Move|boolean;
    static createFromAlgebraic(from: string, 
                               to: string,
                               boardVariation: BoardVariation,
                               promotionPieceType: string): Move|boolean;
    static createWildcardMove(boardVariation: BoardVariation): Move|any;
    static isValidIndex(i: number): boolean;
    static toSan(move: Move, boardVariation: BoardVariation): string;

    static SQUARES: {[algebraic: string]: number};
    static SQUARES_LOOKUP: {[index: number]: string};
    static WILDCARD_MOVE: string;
}

export = Move;
