import {EventLog} from './event_log';
import {Piece} from './piece';
import {Game} from './game';
import {Move} from './move';
import {MoveContext} from './move_context';

export declare class BoardVariation {
    constructor(eventLog: EventLog);
    static copyFrom(other: BoardVariation): BoardVariation;
    static createFromParentVariation(parent: BoardVariation, option?: {
        isContinuation?: boolean,
        resetIdCounter?: boolean,
        skipUndoingCurrentMove?: boolean
    });
    static createFromFen(fen: string, eventLog?: EventLog): BoardVariation|boolean;
    loadFen(fen: string): boolean;
    toString(): string;
    inspect(): string;
    toFen(options?: {omitExtras: boolean}): string;
    put(piece: Piece, square: string): boolean;
    get(square: string): Piece|boolean;
    remove(square: string): Piece|boolean;
    moves(options?: {
        onlyAlgebraicSquares: boolean,
        onlyDestinationSquares: boolean,
        onlyForSquare: string
    }): string[];
    makeMoveFromSan(san: string, game: Game, metadata?: {
        comment?: string,
        timeTakenToMove?: number,
        isPuzzleSolution?: boolean
    }): MoveContext|boolean;
    makeMoveFromAlgebraic(from: string,
                          to: string,
                          game: Game,
                          promotionPieceType: string,
                          metadata?: {
                              comment?: string,
                              timeTakenToMove?: number,
                              isPuzzleSolution?: boolean
                          }
                         ): MoveContext|boolean;
    next(options?: {shouldLog: boolean}): Move|any|boolean;
    previous(options?: {shouldLog: boolean}): Move|any|boolean;
    makeMove(move: Move,
             game: Game,
             metadata?: {
                 comment?: string,
                 timeTakenToMove?: number,
                 isPuzzleSolution?: boolean
             },
             options?: {
                 updatePositionCount: boolean,
                 isUserMove: boolean
             }
            ): MoveContext|boolean;
    replayToPlyNum(ply: number): Move|any;
    getDisambiguator(move: Move): string;
    isAttacked(color: string, square: string): boolean;
    isKingAttacked(color: string): string;
    isCheck(): boolean;
    isCheckmate(): boolean;
    isStalemate(): boolean;
    isDraw(): boolean;
    isInsufficientMaterial(): boolean;
    isThreefoldRepetition(): boolean;
    isGameOver(): boolean;

    static id: number;
    id: number;
}
