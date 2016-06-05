declare class Fen {
    static validate(fen: string): {
        isValid: boolean,
        errorCode: number,
        error: string
    };

    static ERRORS: {[x: number]: string};
    static DEFAULT_POSITION: string;
    static DEFAULT_POSITION_FULL: string;
}

export = Fen;
