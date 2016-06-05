declare class Flags {
    static NORMAL: number;
    static CAPTURE:number;
    static BIG_PAWN:number;  // a pawn moving two spaces
    static EP_CAPTURE:number;
    static PROMOTION:number;
    static KSIDE_CASTLE:number;
    static QSIDE_CASTLE:number;
    static DISPLAY: {
        [x: number]: string
    };
}

export = Flags;
