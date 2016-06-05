import {Move} from './move';

export declare class MoveContext {
    constructor(options: {
        move: Move,
        turn: string,
        enPassantSquare: number,
        moveNumber: number,
        halfMoves: number,
        plyCount: number,
        kings: {[color: string]: number},
        castlingEligibility: {[color: string]: number},
        metadata: {
            comment: string|any,
            isPuzzleSolution: string|any,
            timeTakenToMove: number|any
        }
    });
    toString(): string;
    inspect(): string;
}
