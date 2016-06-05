import {Move} from './move';
import {MoveContext} from './move_context';
import {MoveMetadata} from './move_metadata';
import {Piece} from './piece';

declare type shouldLog = {shouldLog: boolean};

export declare class Game {
    constructor(fen?: string, headerPairs?: string[]);

    toString(): string;
    loadFen(fen: string): boolean;
    makeMove(move: Move, metadata: MoveMetadata): MoveContext;
    makeMoveFromSan(san: string, metadata: MoveMetadata): MoveContext;
    makeMoveFromAlgebraic(from: string,
                          to : string,
                          promotionPieceType: string,
                          metadata: MoveMetadata): MoveContext;
    toPgn(options?: {
        maxWidth?: number,
        newlineChar?: string,
        showMoveCursor?: boolean,
        showHeaders?: boolean
    }): string;
    createContinuationFromSan(san: string): boolean;
    createVariationFromSan(san: string, isContinuation?: boolean, options?: shouldLog): boolean;
    history(): string[];
    ascendFromCurrentContinuation(options?: shouldLog): Move|any;
    ascendFromCurrentVariation(options?: shouldLog): boolean;
    next(options?: shouldLog): Move|any|boolean;
    prev(options?: shouldLog): Move|any|boolean;
    rewindToBeginning();
    replayToPlyNum(n: number): Move|any;
    header(): any; //TODO: actually this is always a linked hash map
    descendIntoContinuation(n?: number): Move|boolean|any;
    descendIntoVariation(n?: number): Move|boolean|any;
    goToPosition(path: any[]);
    isCheck(): boolean;
    isCheckmate(): boolean;
    isStalemate(): boolean;
    isDraw(): boolean;
    isInsufficientMaterial(): boolean;
    isThreefoldRepetition(): boolean;
    isGameOver(): boolean;
    moves(options?: {
        onlyAlgebraicSquares: boolean,
        onlyDestinationSquares: boolean,
        onlyForSquare: string
    }): string[];
    put(piece: Piece, square: string): boolean;
    get(square: string): Piece|boolean;
    remove(square: string): Piece|boolean;
    toFen(): string;
}
