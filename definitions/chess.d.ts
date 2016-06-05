import {Move} from './move';
import {MoveContext} from './move_context';
import {MoveMetadata} from './move_metadata';
import {Piece} from './piece';

declare type shouldLog = {shouldLog: boolean};

export declare class Chess {
    constructor(fen?: string);

    toString(): string;
    addGame(game?: Game): void;
    selectGame(i: number): boolean;
    toPgn(options?: {
        maxWidth?: number,
        newlineChar?: string,
        showMoveCursor?: boolean,
        showHeader?: boolean
    }): string;
    loadPgn(pgnText: string, options?: {
        newlineChar?: string
    });
    clear(): void;
    reset(): void;
    createContinuationFromSan(san: string): boolean;
    createVariationFromSan(san: string, isContinuation?: boolean, options?: shouldLog): boolean;
    history(): string[];
    ascendFromCurrentContinuation(): Move|any;
    ascendFromCurrentVariation(): boolean;
    next(): Move|any|boolean;
    previ(): Move|any|boolean;
    rewindToBeginning();
    replayToPlyNum(n: number): Move|any;
    header(): any; //TODO: actually this is always a linked hash map
    descendIntoContinuation(n?: number): Move|boolean|any;
    descendIntoVariation(n?: number): Move|boolean|any;
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
    toFen(options?: {omitExtras: boolean}): string;
    whoseTurn(): string;
    makeMove(move: Move, metadata: MoveMetadata): MoveContext;
    makeMoveFromSan(san: string, metadata: MoveMetadata): MoveContext;
    makeMoveFromAlgebraic(from: string,
                          to : string,
                          promotionPieceType: string,
                          metadata: MoveMetadata): MoveContext;
    selectMove(i: number): Move|any;
}
