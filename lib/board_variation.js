'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Color = require('./../src/color');
var EventLog = require('./../src/event_log');
var Fen = require('./../src/fen');
var Flags = require('./../src/flags');
var Move = require('./../src/move');
var MoveContext = require('./../src/move_context');
var Piece = require('./../src/piece');
var PieceType = require('./../src/piece_type');

var BoardVariation = function () {
    function BoardVariation(eventLog) {
        var _castlingEligibility, _kings;

        _classCallCheck(this, BoardVariation);

        this.id = BoardVariation.id++;

        this.parentVariation = null;
        this.parentLastMoveIndex = null;
        this.turn = Color.WHITE;
        this.enPassantSquare = -1; // the 0x88 index of the current en passant capture square, if any
        this.moveNumber = 1; // logical move number
        this.plyCount = 0; // physical move number
        this.halfMoves = 0; // halfMoves != plyCount, but the number of ply since last capture or pawn advancement

        this.board = Array.apply(null, new Array(128)).map(function () {
            return Piece.NONE;
        }); // an array of Pieces, just { color, type }.  Blank squares are left as Piece.NONE.
        // Conceptually, this array is 128 elements long, per the 0x88 system.

        this.castlingEligibility = (_castlingEligibility = {}, _defineProperty(_castlingEligibility, Color.WHITE, Flags.KSIDE_CASTLE & Flags.QSIDE_CASTLE), _defineProperty(_castlingEligibility, Color.BLACK, Flags.KSIDE_CASTLE & Flags.QSIDE_CASTLE), _castlingEligibility);
        this.kings = (_kings = {}, _defineProperty(_kings, Color.WHITE, -1), _defineProperty(_kings, Color.BLACK, -1), _kings);

        // the 0x88 index of the black King's current location
        this.moveHistory = []; // array of MoveContext objects...
        this.selectedMoveHistoryIndex = -1;

        this.positionCount = new Map(); // a mapping from FEN positional string to frequency count;  used in isThreefoldRepetition()

        this.intraMoveAnnotationSlots = []; // an array of arrays, used for storing PGN comments and PGN Glyphs

        this.eventLog = eventLog; // EventLog for tracking all player interactions at the Game.js level

        this.isContinuation = false;
    }

    // copy constructor


    _createClass(BoardVariation, [{
        key: 'loadFen',
        value: function loadFen(fen /* string */) {
            if (!Fen.validate(fen).isValid) {
                return false;
            }

            this.id = BoardVariation.id++; // loading from fen should (probably) force a new variation ID
            this.board = Array.apply(null, new Array(128)).map(function () {
                return Piece.NONE;
            });

            var tokens = fen.split(/\s+/);
            var position = tokens[0];
            var square = 0;

            for (var i = 0; i < position.length; i++) {
                var symbol = position.charAt(i);

                if (symbol === '/') {
                    square += 8;
                } else if ('0123456789'.indexOf(symbol) !== -1) {
                    square += parseInt(symbol, 10);
                } else {
                    this.put(Piece.forSymbol(symbol), BoardVariation._algebraic(square));
                    square++;
                }
            }

            this.turn = tokens[1];

            if (tokens[2].indexOf('K') > -1) {
                this.castlingEligibility[Color.WHITE] |= Flags.KSIDE_CASTLE;
            }
            if (tokens[2].indexOf('Q') > -1) {
                this.castlingEligibility[Color.WHITE] |= Flags.QSIDE_CASTLE;
            }
            if (tokens[2].indexOf('k') > -1) {
                this.castlingEligibility[Color.BLACK] |= Flags.KSIDE_CASTLE;
            }
            if (tokens[2].indexOf('q') > -1) {
                this.castlingEligibility[Color.BLACK] |= Flags.QSIDE_CASTLE;
            }

            this.enPassantSquare = tokens[3] === '-' ? -1 : Move.SQUARES[tokens[3]];
            this.halfMoves = parseInt(tokens[4], 10);
            this.moveNumber = parseInt(tokens[5], 10);

            this.positionCount.set(this.toFen({ omitExtras: true }), 1);

            return true;
        }
    }, {
        key: 'inspect',
        value: function inspect() {
            // for more succinct console.log() output
            return this.toString();
        }
    }, {
        key: 'toString',
        value: function toString() {
            var s = '   +------------------------+' + (this.turn === Color.BLACK ? '  <-- ' + this.plyCount : '') + '\n';
            for (var i = Move.SQUARES.a8; i <= Move.SQUARES.h1; i++) {
                // display the rank
                if (BoardVariation._file(i) === 0) {
                    s += ' ' + '87654321'[BoardVariation._rank(i)] + ' |';
                }

                s += ' ' + this.board[i] + ' ';

                if (i + 1 & 0x88) {
                    s += '|\n';
                    i += 8;
                }
            }
            s += '   +------------------------+' + (this.turn === Color.WHITE ? '  <-- ' + this.plyCount : '') + '\n';
            s += '     a  b  c  d  e  f  g  h\n';

            return s;
        }
    }, {
        key: 'toFen',
        value: function toFen() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                omitExtras: false
            } : arguments[0];

            var empty = 0;
            var fen = '';

            for (var i = Move.SQUARES.a8; i <= Move.SQUARES.h1; i++) {
                if (this.board[i] === Piece.NONE) {
                    empty++;
                } else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    fen += this.board[i];
                }

                if (i + 1 & 0x88) {
                    if (empty > 0) {
                        fen += empty;
                    }

                    if (i !== Move.SQUARES.h1) {
                        fen += '/';
                    }

                    empty = 0;
                    i += 8;
                }
            }

            if (options.omitExtras) {
                return fen;
            }

            var castlingFlags = '';
            if (this.castlingEligibility[Color.WHITE] & Flags.KSIDE_CASTLE) {
                castlingFlags += 'K';
            }
            if (this.castlingEligibility[Color.WHITE] & Flags.QSIDE_CASTLE) {
                castlingFlags += 'Q';
            }
            if (this.castlingEligibility[Color.BLACK] & Flags.KSIDE_CASTLE) {
                castlingFlags += 'k';
            }
            if (this.castlingEligibility[Color.BLACK] & Flags.QSIDE_CASTLE) {
                castlingFlags += 'q';
            }

            // do we have an empty castling flag?
            castlingFlags = castlingFlags || '-';
            var epFlags = this.enPassantSquare === -1 ? '-' : BoardVariation._algebraic(this.enPassantSquare);

            return [fen, this.turn, castlingFlags, epFlags, this.halfMoves, this.moveNumber].join(' ');
        }
    }, {
        key: 'put',
        value: function put(piece /* Piece, e.g. Piece.WHITE_ROOK */, square /* string, e.g. 'h8' */) {
            // no event logging;  this method is user facing, but is not involved with puzzle interaction

            if (!(piece in Piece.LOOKUP && square in Move.SQUARES)) {
                return false;
            }

            var sq = Move.SQUARES[square];

            // don't let the user place more than one king
            if (piece.type == PieceType.KING && !(this.kings[piece.color] === -1 || this.kings[piece.color] === sq)) {
                return false;
            }

            this.board[sq] = piece;

            if (piece.type === PieceType.KING) {
                this.kings[piece.color] = sq;
            }

            return true;
        }
    }, {
        key: 'get',
        value: function get(square /* string, e.g. 'a1' */) {
            if (!square in Move.SQUARES) {
                return false;
            }

            return this.board[Move.SQUARES[square]];
        }
    }, {
        key: 'remove',
        value: function remove(square /* string, e.g. 'a1' */) {
            // no event logging;  this method is user facing, but is not involved with puzzle interaction

            if (!square in Move.SQUARES) {
                return false;
            }

            var piece = this.get(square);
            this.board[Move.SQUARES[square]] = Piece.NONE;

            if (piece.type === PieceType.KING) {
                this.kings[piece.color] = -1;
            }

            return piece;
        }
    }, {
        key: 'moves',
        value: function moves() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                onlyAlgebraicSquares: false,
                onlyDestinationSquares: false,
                onlyForSquare: undefined
            } : arguments[0];

            // no event logging;  this method is user facing, but is not involved with puzzle interaction

            var moves = void 0;
            if (options.onlyAlgebraicSquares) {
                moves = this._generateMoves({ calculateSan: false }).map(function (move) {
                    return move.algebraic;
                });

                if (options.onlyForSquare) {
                    moves = moves.filter(function (move) {
                        return move.substring(0, 2) === options.onlyForSquare;
                    });
                }

                if (options.onlyDestinationSquares) {
                    moves = moves.map(function (move) {
                        return move.substring(3, 5);
                    });
                }
            } else {
                moves = this._generateMoves({ calculateSan: true }).map(function (move) {
                    return move.san;
                });
            }

            return moves;
        }
    }, {
        key: '_applyMove',
        value: function _applyMove(move /* Move object from move.js */) {
            var us = this.turn;
            var them = us === Color.WHITE ? Color.BLACK : Color.WHITE;

            this.board[move.to] = this.board[move.from];
            this.board[move.from] = Piece.NONE;

            // if ep capture, remove the captured pawn
            if (move.flags & Flags.EP_CAPTURE) {
                if (this.turn === Color.BLACK) {
                    this.board[move.to - 16] = Piece.NONE;
                } else {
                    this.board[move.to + 16] = Piece.NONE;
                }
            }

            // if pawn promotion, replace with new piece
            if (move.flags & Flags.PROMOTION) {
                this.board[move.to] = move.promotionPiece;
            }

            // if we moved the king
            if (move.movedPiece.type === PieceType.KING) {
                this.kings[move.movedPiece.color] = move.to;
                // if we castled, move the rook next to the king
                if (move.flags & Flags.KSIDE_CASTLE) {
                    var castlingTo = move.to - 1;
                    var castlingFrom = move.to + 1;

                    this.board[castlingTo] = this.board[castlingFrom];
                    this.board[castlingFrom] = Piece.NONE;
                } else if (move.flags & Flags.QSIDE_CASTLE) {
                    var _castlingTo = move.to + 1;
                    var _castlingFrom = move.to - 2;

                    this.board[_castlingTo] = this.board[_castlingFrom];
                    this.board[_castlingFrom] = Piece.NONE;
                }
                // turn off castling
                this.castlingEligibility[us] = 0;
            }

            // turn off castling if we move a rook
            if (this.castlingEligibility[us]) {
                if (us === Color.WHITE) {
                    if (move.from === 112 /* a1 */ && this.castlingEligibility[us] & Flags.QSIDE_CASTLE) {
                        this.castlingEligibility[us] ^= Flags.QSIDE_CASTLE;
                    } else if (move.from === 119 /* a8 */ && this.castlingEligibility[us] & Flags.KSIDE_CASTLE) {
                        this.castlingEligibility[us] ^= Flags.KSIDE_CASTLE;
                    }
                } else {
                    if (move.from === 0 /* a8 */ && this.castlingEligibility[us] & Flags.QSIDE_CASTLE) {
                        this.castlingEligibility[us] ^= Flags.QSIDE_CASTLE;
                    } else if (move.from === 7 /* h8 */ && this.castlingEligibility[us] & Flags.KSIDE_CASTLE) {
                        this.castlingEligibility[us] ^= Flags.KSIDE_CASTLE;
                    }
                }
            }

            // turn off castling if we capture a rook
            if (this.castlingEligibility[them]) {
                if (them === Color.WHITE) {
                    if (move.from === 112 /* a1 */ && this.castlingEligibility[them] & Flags.QSIDE_CASTLE) {
                        this.castlingEligibility[them] ^= Flags.QSIDE_CASTLE;
                    } else if (move.from === 119 /* a8 */ && this.castlingEligibility[them] & Flags.KSIDE_CASTLE) {
                        this.castlingEligibility[them] ^= Flags.KSIDE_CASTLE;
                    }
                } else {
                    if (move.from === 0 /* a8 */ && this.castlingEligibility[them] & Flags.QSIDE_CASTLE) {
                        this.castlingEligibility[them] ^= Flags.QSIDE_CASTLE;
                    } else if (move.from === 7 /* h8 */ && this.castlingEligibility[them] & Flags.KSIDE_CASTLE) {
                        this.castlingEligibility[them] ^= Flags.KSIDE_CASTLE;
                    }
                }
            }

            // if big pawn move, update the en passant square
            if (move.flags & Flags.BIG_PAWN) {
                if (this.turn === Color.BLACK) {
                    this.enPassantSquare = move.to - 16;
                } else {
                    this.enPassantSquare = move.to + 16;
                }
            } else {
                this.enPassantSquare = -1;
            }

            // reset the 100 half-move counter if a pawn is moved or a piece is captured
            if (move.movedPiece.type === PieceType.PAWN) {
                this.halfMoves = 0;
            } else if (move.flags & (Flags.CAPTURE | Flags.EP_CAPTURE)) {
                this.halfMoves = 0;
            } else {
                this.halfMoves++;
            }
            if (this.turn === Color.BLACK) {
                this.moveNumber++;
            }

            this.plyCount = this.plyCount + 1;

            this.turn = this.turn === Color.WHITE ? Color.BLACK : Color.WHITE;
        }

        // TODO(6.27.15)   need to reinstrument all pair-wise calls to makeMove() <--> undoCurrentMove(),
        // and possibly _applyMove() <--> _applyUndoMove() should you want to properly avoid fenCount calculations

    }, {
        key: 'undoCurrentMove',
        value: function undoCurrentMove() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                updatePositionCount: true
            } : arguments[0];

            // no event logging;  this method is only used internally

            if (this.selectedMoveHistoryIndex < 0) {
                return false;
            }

            var oldMoveContext = this.moveHistory[this.selectedMoveHistoryIndex];

            this.moveHistory.length = this.selectedMoveHistoryIndex; // we're undoing the currently selected move, so truncate and remove all moves ahead of us
            this.selectedMoveHistoryIndex--;

            var oldMove = this._applyUndoMove(oldMoveContext);

            if (options.updatePositionCount) {
                var key = this.toFen({ omitExtras: true });
                this.positionCount.set(key, this.positionCount.get(key) - 1);

                if (this.positionCount.get(key) === 0) {
                    this.positionCount.delete(key);
                }
            }

            return oldMove;
        }
    }, {
        key: '_applyUndoMove',
        value: function _applyUndoMove(oldMoveContext) {
            var _castlingEligibility2, _kings2;

            var move = oldMoveContext.move;

            this.castlingEligibility = (_castlingEligibility2 = {}, _defineProperty(_castlingEligibility2, Color.WHITE, oldMoveContext.castlingEligibility[Color.WHITE]), _defineProperty(_castlingEligibility2, Color.BLACK, oldMoveContext.castlingEligibility[Color.BLACK]), _castlingEligibility2);
            this.kings = (_kings2 = {}, _defineProperty(_kings2, Color.WHITE, oldMoveContext.kings[Color.WHITE]), _defineProperty(_kings2, Color.BLACK, oldMoveContext.kings[Color.BLACK]), _kings2);

            this.enPassantSquare = oldMoveContext.enPassantSquare;
            this.halfMoves = oldMoveContext.halfMoves;
            this.moveNumber = oldMoveContext.moveNumber;
            this.plyCount = oldMoveContext.plyCount - 1;
            this.timeTakenToMove = oldMoveContext.timeTakenToMove; // TODO need to change this to be metadata struct
            this.turn = oldMoveContext.turn;

            var us = this.turn;

            this.board[move.from] = Piece.forSymbol(move.movedPiece); // to undo any promotions
            this.board[move.to] = Piece.NONE;

            if (move.flags & Flags.CAPTURE) {
                this.board[move.to] = move.capturedPiece;
            } else if (move.flags & Flags.EP_CAPTURE) {
                var index = void 0;
                if (us === Color.BLACK) {
                    index = move.to - 16;
                } else {
                    index = move.to + 16;
                }
                this.board[index] = move.capturedPiece;
            }

            if (move.flags & (Flags.KSIDE_CASTLE | Flags.QSIDE_CASTLE)) {
                var castling_to = void 0,
                    castling_from = void 0;
                if (move.flags & Flags.KSIDE_CASTLE) {
                    castling_to = move.to + 1;
                    castling_from = move.to - 1;
                } else if (move.flags & Flags.QSIDE_CASTLE) {
                    castling_to = move.to - 2;
                    castling_from = move.to + 1;
                }
                this.board[castling_to] = this.board[castling_from];
                this.board[castling_from] = Piece.NONE;
            }

            return move;
        }
    }, {
        key: 'makeMoveFromSan',
        value: function makeMoveFromSan(sanText /* string, e.g. "Rxa7" or "e8=Q#" */
        , game /* Game object from game.js */
        ) /* boolean */
        {
            var metadata = arguments.length <= 2 || arguments[2] === undefined ? { // TODO wrap up this move metadata object into its own class, for DRY purposes.  e.g. move_metadata.js
                comment: null /* string */
                , timeTakenToMove: null /* int */
                , isPuzzleSolution: null } : arguments[2];

            // event logging, always:  this method is user facing, and is involved with puzzle interaction

            var move = Move.createFromSan(sanText, this);
            if (move) {
                this.eventLog.add('makeMoveFromSan(' + sanText + ', ...) --> ' + move.san);

                return this.makeMove(move, game, metadata);
            } else {
                this.eventLog.add('makeMoveFromSan(' + sanText + ', ...) --> invalid move');

                return false;
            }
        }
    }, {
        key: 'makeMoveFromAlgebraic',
        value: function makeMoveFromAlgebraic(from /* e.g. 'a4', 'b3' */
        , to /* e.g. 'a4', 'b3' */
        , game /* Game object from game.js */
        ) /* boolean */
        {
            var promotionPieceType = arguments.length <= 3 || arguments[3] === undefined ? PieceType.QUEEN : arguments[3];
            var metadata = arguments.length <= 4 || arguments[4] === undefined ? { // TODO wrap up this move metadata object into its own class, for DRY purposes.  e.g. move_metadata.js
                comment: null /* string */
                , timeTakenToMove: null /* int */
                , isPuzzleSolution: null } : arguments[4];

            var move = Move.createFromAlgebraic(from, to, this, promotionPieceType);
            if (move) {
                this.eventLog.add('makeMoveFromAlgebraic(' + from + ', ' + to + ', ...) --> ' + move.san);

                return this.makeMove(move, game, metadata);
            } else {
                this.eventLog.add('makeMoveFromAlgebraic(' + from + ', ' + to + ', ...) --> invalid move');

                return false;
            }
        }
    }, {
        key: '_selectMove',
        value: function _selectMove(i) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {
                shouldLog: false
            } : arguments[1];

            if (options.shouldLog) {
                this.eventLog.add('_selectMove(' + i);
            }

            if (this.selectedMoveHistoryIndex === i) {
                return true; // already on requested move;  nothing to do.
            }

            if (i < -1 || i > this.moveHistory.length - 1) {
                return false;
            }

            return this.replayToPlyNum(i + 1);
        }
    }, {
        key: 'next',
        value: function next() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                shouldLog: true
            } : arguments[0];

            if (options.shouldLog) {
                this.eventLog.add('next()');
            }

            return this._selectMove(this.selectedMoveHistoryIndex + 1);
        }
    }, {
        key: 'prev',
        value: function prev() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                shouldLog: true
            } : arguments[0];

            if (options.shouldLog) {
                this.eventLog.add('prev()');
            }

            return this._selectMove(this.selectedMoveHistoryIndex - 1);
        }

        // TODO -- makeMove vs makeMoveFromSan -- these two methods should be combined into one...

        // TODO(6.27.15) consider a top-level API method for making a move, and an internal API method that does the same making of a move, but is only done
        // for internal calculations, exploratory moves, etc -- i.e. not official moves, so official board state (puzzle timing;  position count;  etc) should not be updated.
        // Is this even a good or viable idea??

    }, {
        key: 'makeMove',
        value: function makeMove(move, /* Move object from move.js */
        game) {
            var metadata = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
            var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

            metadata = Object.assign({}, {
                comment: null, /* string */
                timeTakenToMove: null, /* int */
                isPuzzleSolution: null /* boolean */
            }, metadata);

            options = Object.assign({}, {
                updatePositionCount: true,
                isUserMove: true
            }, options);

            // no event logging;  method is only used internally;  TODO verify this, after your attempted merger b/t makeMove and makeMoveFromSan

            // TODO:  consider how to handle if made move is in fact a match of the isPuzzleSolution?
            //
            //// here's the original comment and code
            ////
            //// what's happening here;  i need to pass back whether or not the move just made was a "is_puzzle_solution" move
            //// that exists in the loaded PGN;  however, this here move() method doesn't reference stored moves[], instead it
            //// uses generate_moves()
            //
            //if (next.call(this, false)) {
            //    pretty_move.is_puzzle_solution = this.current_game.current_variation.moves[this.current_game.current_variation.selected_move_index].is_puzzle_solution;
            //    return pretty_move;
            //} else {
            //    return null;
            //}

            // TODO need to hide timeTakenToMove parameter;  should not be exposed to caller;
            // instead perform internal calculation here;

            // TODO add logic for updating the timeTakenToMove of an existing move....
            // if it's an isPuzzleSolution === true move, and no previous timing value exists.... ?

            if (options.isUserMove) {

                // step 1:  check if the next move in our history, if any, matches the requested move
                if (this.selectedMoveHistoryIndex + 1 !== this.moveHistory.length) {
                    var nextMoveContext = this.moveHistory[this.selectedMoveHistoryIndex + 1];

                    // if the requested move is identical to the next move that was already made in
                    // our move history, then we simply advance our move cursor to that next move.
                    if (nextMoveContext.move.san === move.san || move.isWildcard) {
                        this.next({ shouldLog: options.isUserMove });
                        return this.moveHistory[this.selectedMoveHistoryIndex];
                    }

                    // step 1-a:  otherwise, check if the next move has any variations whose first move matches
                    // the requested move.  If found, then we simply advance our move cursor into that variation.
                    //
                    // TODO write an unit test for this
                    //
                    for (var i = 0; i < nextMoveContext.childVariations.length; i++) {
                        if (!nextMoveContext.childVariations[i].isContinuation && ( // variations only
                        nextMoveContext.childVariations[i].moveHistory[0].move.san === move.san || nextMoveContext.childVariations[i].moveHistory[0].move.isWildcard)) {
                            // TODO need to pass back whether or not the move just made was a "isPuzzleSolution" move
                            // that exists in the loaded PGN;  however, this here move() method doesn't reference stored moves[], instead it
                            // uses generate_moves()
                            if (game.descendIntoVariation(i)) {
                                return game.currentVariation.moveHistory[0];
                            } else {
                                return false;
                            }
                        }
                    }
                }

                // step 2:  otherwise, check if the current move in our history has a continuation whose first move matches
                // the requested move.  If found, then we simply advance our move cursor into that continuation.
                if (this.moveHistory[this.selectedMoveHistoryIndex] && this.moveHistory[this.selectedMoveHistoryIndex].childVariations.length > 0) {
                    var childVariations = this.moveHistory[this.selectedMoveHistoryIndex].childVariations;

                    for (var _i = 0; _i < childVariations.length; _i++) {
                        if (childVariations[_i].isContinuation && ( // continuations only
                        childVariations[_i].moveHistory[0].move.san === move.san || childVariations[_i].moveHistory[0].move.isWildcard)) {
                            if (game.descendIntoContinuation(_i)) {
                                return game.currentVariation.moveHistory[0].move;
                            } else {
                                return false;
                            }
                        }
                    }
                }

                // step 3:  otherwise, if the requested move is a new move *and* we're not at the head of our move branch,
                // then let's automatically create a new variation on behalf of the user for the requested move
                if (this.selectedMoveHistoryIndex + 1 !== this.moveHistory.length) {
                    var currentMoveContext = this.moveHistory[this.selectedMoveHistoryIndex + 1];
                    // TODO won't this auto-made variation also need its own variation-ID generation logic passed in?  same as code later on down
                    var newChildVariation = BoardVariation.createFromParentVariation(this, { skipUndoingCurrentMove: true });

                    currentMoveContext.childVariations.push(newChildVariation);
                    newChildVariation.makeMove(move, game, metadata, options); // TODO re-use of options here is suspect

                    game.currentVariation = newChildVariation; // the whole reason we needed to plumb the game object into this method

                    return currentMoveContext;
                }
            }

            // step 4:  otherwise, our move is a new move, and we're at the head of our move branch;
            // *or* this is not a user-requested move, in which case we simply make the requested move
            var moveContext = new MoveContext({
                move: move,

                castlingEligibility: this.castlingEligibility,
                kings: this.kings,

                turn: this.turn,
                enPassantSquare: this.enPassantSquare,

                moveNumber: this.moveNumber,
                halfMoves: this.halfMoves,
                plyCount: this.plyCount + 1,

                metadata: metadata
            });

            // insert our new move into moveHistory[] after the current selectedMoveHistoryIndex;  There's offset-by-one logic here.
            // Do NOT reverse the order of the two lines below, or you will cause all sorts of board state corruption
            this.selectedMoveHistoryIndex++;
            this.moveHistory.splice(this.selectedMoveHistoryIndex, 0, moveContext);

            // generate an ID for this move, one that is unique across the entire game tree.
            // format:  (({parent_variation's id}-)*)-{half_move_number}
            //
            // e.g.:  1. e4 {1} e5 {2} 2. d4 {3} d5 {4} (2... d6 {1-4} 3. c4 {1-5} (3. c3 {1-2-5}))
            //
            // TODO probably want to change this ID scheme from variation_ids to variation_index offset from child_variations;
            // will make tree traversal significantly easier.  although... what about when a variation is deleted?  hmmm....

            // TODO reinstate eventually
            /*
             var moveId = '0-';
             var current = this;
             while (current.parentVariation) {
             moveId += current.id + '-';
             current = current.parentVariation;
             }
             moveId += this.plyCount + this.selectedMoveHistoryIndex;
              this.moveHistory[this.selectedMoveHistoryIndex].moveId = moveId;
             */
            // /TODO

            this._applyMove(move);

            if (options.updatePositionCount) {
                var key = this.toFen({ omitExtras: true });

                if (this.positionCount.has(key)) {
                    this.positionCount.set(key, this.positionCount.get(key) + 1);
                } else {
                    this.positionCount.set(key, 1);
                }
            }

            return moveContext;
        }
    }, {
        key: 'replayToPlyNum',
        value: function replayToPlyNum(n /* logical ply number, starting from 1 */) {
            // no event logging;  this method is only used internally

            n = n - 1; // translate from logical ply number to selectedMoveHistoryIndex number
            if (n > this.selectedMoveHistoryIndex) {
                this.selectedMoveHistoryIndex++;
                for (; this.selectedMoveHistoryIndex <= n; this.selectedMoveHistoryIndex++) {
                    var moveContext = this.moveHistory[this.selectedMoveHistoryIndex].move;

                    this._applyMove(moveContext);
                }
                this.selectedMoveHistoryIndex--;
            } else if (n < this.selectedMoveHistoryIndex) {
                for (; n < this.selectedMoveHistoryIndex; this.selectedMoveHistoryIndex--) {
                    var _moveContext = this.moveHistory[this.selectedMoveHistoryIndex];

                    this._applyUndoMove(_moveContext);
                }
            }

            return this.selectedMoveHistoryIndex > -1 && this.selectedMoveHistoryIndex < this.moveHistory.length ? this.moveHistory[this.selectedMoveHistoryIndex] : null;
        }

        // helper method, used only in generateMoves(...)

    }, {
        key: '_addMove',
        value: function _addMove(from, to, flags, newMoves, calculateSan, them) {

            var capturedPiece = flags === Flags.EP_CAPTURE ? this.board[to + (them === Color.BLACK ? 16 : -16)] : this.board[to];

            var moveConstructorOptions = {
                from: from,
                to: to,
                movedPiece: this.board[from],
                capturedPiece: capturedPiece,
                flags: flags,
                boardVariation: calculateSan ? this : undefined
            };

            // if pawn promotion
            if (this.board[from].type === PieceType.PAWN && (BoardVariation._rank(to) === 0 || BoardVariation._rank(to) === 7)) {
                var promotionPieces = this.turn === Color.WHITE ? Piece.WHITE_PROMOTION_PIECES : Piece.BLACK_PROMOTION_PIECES;
                promotionPieces.forEach(function (promotionPiece) {
                    moveConstructorOptions.promotionPiece = promotionPiece;
                    newMoves.push(new Move(moveConstructorOptions));
                });
            } else {
                newMoves.push(new Move(moveConstructorOptions));
            }
        }
    }, {
        key: '_generateMoves',
        value: function _generateMoves() {
            var _secondRank,
                _this = this;

            var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            options = Object.assign({}, {
                onlyForSquare: null, /* string, e.g. 'a1' */
                calculateSan: false,
                onlyLegalMoves: true
            }, options);

            var us = this.turn;
            var them = this.turn === Color.WHITE ? Color.BLACK : Color.WHITE;

            var secondRank = (_secondRank = {}, _defineProperty(_secondRank, Color.BLACK, 1), _defineProperty(_secondRank, Color.WHITE, 6), _secondRank);

            var newMoves = [];
            var firstSquare = Move.SQUARES.a8;
            var lastSquare = Move.SQUARES.h1;

            // are we generating moves for a single square?
            if (options.onlyForSquare) {
                if (options.onlyForSquare in Move.SQUARES) {
                    firstSquare = lastSquare = Move.SQUARES[options.onlyForSquare];
                } else {
                    return []; // invalid square
                }
            }

            // TODO(aaron) what if instead of inspecting every square, you
            // instead tracked in BoardVariation the location of all active non-blank pieces
            // then you could just iterate over them here.  Do a perf test before and after.

            for (var i = firstSquare; i <= lastSquare; i++) {
                if (i & 0x88) {
                    i += 7;continue;
                } // did we run off the end of the board?

                var piece = this.board[i];
                if (piece === Piece.NONE || piece.color !== us) {
                    continue;
                }

                var square = void 0;

                if (piece.type === PieceType.PAWN) {
                    // single square, non-capturing
                    square = i + Move.PAWN_OFFSETS[us][0];
                    if (this.board[square] === Piece.NONE) {
                        this._addMove(i, square, Flags.NORMAL, newMoves, options.calculateSan);

                        // double square
                        square = i + Move.PAWN_OFFSETS[us][1];
                        if (secondRank[us] === BoardVariation._rank(i) && this.board[square] === Piece.NONE) {
                            this._addMove(i, square, Flags.BIG_PAWN, newMoves, options.calculateSan);
                        }
                    }

                    // pawn captures
                    for (var j = 2; j < 4; j++) {
                        square = i + Move.PAWN_OFFSETS[us][j];
                        if (square & 0x88) continue;

                        if (this.board[square] !== Piece.NONE && this.board[square].color === them) {
                            this._addMove(i, square, Flags.CAPTURE, newMoves, options.calculateSan);
                        } else if (square === this.enPassantSquare) {
                            this._addMove(i, this.enPassantSquare, Flags.EP_CAPTURE, newMoves, options.calculateSan, them);
                        }
                    }
                } else {
                    for (var _j = 0, len = Move.PIECE_OFFSETS[piece.type].length; _j < len; _j++) {
                        var offset = Move.PIECE_OFFSETS[piece.type][_j];
                        square = i;

                        while (true) {
                            square += offset;
                            if (square & 0x88) break;

                            if (this.board[square] === Piece.NONE) {
                                this._addMove(i, square, Flags.NORMAL, newMoves, options.calculateSan);
                            } else {
                                if (this.board[square].color === us) break;
                                this._addMove(i, square, Flags.CAPTURE, newMoves, options.calculateSan);
                                break;
                            }

                            // break, if knight or king
                            if (piece.type === PieceType.KNIGHT || piece.type === PieceType.KING) {
                                break;
                            }
                        }
                    }
                }
            }

            // check for castling if: a) we're generating all moves, or b) we're doing single square move generation on the king's square
            if (!options.onlyForSquare || lastSquare === this.kings[us]) {
                // king-side castling
                if (this.castlingEligibility[us] & Flags.KSIDE_CASTLE) {
                    var castlingFrom = this.kings[us];
                    var castlingTo = castlingFrom + 2;

                    if (this.board[castlingFrom + 1] === Piece.NONE && this.board[castlingTo] === Piece.NONE && !this.isAttacked(them, this.kings[us]) && !this.isAttacked(them, castlingFrom + 1) && !this.isAttacked(them, castlingTo)) {
                        this._addMove(this.kings[us], castlingTo, Flags.KSIDE_CASTLE, newMoves, options.calculateSan);
                    }
                }

                // queen-side castling
                if (this.castlingEligibility[us] & Flags.QSIDE_CASTLE) {
                    var _castlingFrom2 = this.kings[us];
                    var _castlingTo2 = _castlingFrom2 - 2;

                    if (this.board[_castlingFrom2 - 1] === Piece.NONE && this.board[_castlingFrom2 - 2] === Piece.NONE && this.board[_castlingFrom2 - 3] === Piece.NONE && !this.isAttacked(them, this.kings[us]) && !this.isAttacked(them, _castlingFrom2 - 1) && !this.isAttacked(them, _castlingTo2)) {
                        this._addMove(this.kings[us], _castlingTo2, Flags.QSIDE_CASTLE, newMoves, options.calculateSan);
                    }
                }
            }

            // return all pseudo-legal moves (this includes moves that allow the king to be captured)
            if (!options.onlyLegalMoves) {
                return newMoves;
            }

            // filter out illegal moves
            var legalMoves = [];

            if (newMoves.length > 0) {
                // TODO this futureMoves logic is duplicated in Move.toSan(move, boardVariation);
                // might be good candidate for abstraction behind would-be-named MoveHistory object

                // makeMove() below is destructive to all future moves ahead
                // of our current move pointer, so we save a copy here
                var futureMoves = this.moveHistory.slice(this.selectedMoveHistoryIndex + 1);

                newMoves.forEach(function (newMove) {
                    _this.makeMove(newMove, null, null, { updatePositionCount: false, isUserMove: false });
                    if (!_this.isKingAttacked(us)) {
                        legalMoves.push(newMove);
                    }

                    _this.undoCurrentMove({ updatePositionCount: false });
                });

                // restore our previously saved future moves
                this.moveHistory = this.moveHistory.concat(futureMoves);
            }

            return legalMoves;
        }

        // this function is used to uniquely identify ambiguous moves

    }, {
        key: 'getDisambiguator',
        value: function getDisambiguator(move /* Move object from move.js */) {
            var moves = this._generateMoves();

            var from = move.from;
            var to = move.to;
            var piece = move.movedPiece;

            var ambiguities = 0;
            var sameRank = 0;
            var sameFile = 0;

            for (var i = 0, len = moves.length; i < len; i++) {
                var ambigFrom = moves[i].from;
                var ambigTo = moves[i].to;
                var ambigPiece = moves[i].movedPiece;

                // if a move of the same piece type ends on the same to square, we'll
                // need to add a disambiguator to the algebraic notation
                if (piece === ambigPiece && from !== ambigFrom && to === ambigTo) {
                    ambiguities++;

                    if (BoardVariation._rank(from) === BoardVariation._rank(ambigFrom)) {
                        sameRank++;
                    }

                    if (BoardVariation._file(from) === BoardVariation._file(ambigFrom)) {
                        sameFile++;
                    }
                }
            }
            if (ambiguities > 0) {
                // if there exists a similar moving piece on the same rank and file as
                // the move in question, use the square as the disambiguator
                if (sameRank > 0 && sameFile > 0) {
                    return BoardVariation._algebraic(from);
                }
                // if the moving piece rests on the same file,
                // use the rank symbol as the disambiguator
                else if (sameFile > 0) {
                        return BoardVariation._algebraic(from).charAt(1);
                    }
                    // else use the file symbol
                    else {
                            return BoardVariation._algebraic(from).charAt(0);
                        }
            }

            return '';
        }
    }, {
        key: 'isAttacked',
        value: function isAttacked(color, square) {
            for (var i = Move.SQUARES.a8; i <= Move.SQUARES.h1; i++) {
                // did we run off the end f the board
                if (i & 0x88) {
                    i += 7;continue;
                }

                // if empty square or wrong color
                if (this.board[i] === Piece.NONE) continue;
                if (this.board[i].color !== color) continue;

                var difference = i - square;
                var index = difference + 119;

                var piece = this.board[i];

                if (Move.ATTACKS[index] & 1 << Move.SHIFTS[piece.type]) {
                    if (piece.type === PieceType.PAWN) {
                        if (difference > 0) {
                            if (piece.color === Color.WHITE) return true;
                        } else {
                            if (piece.color === Color.BLACK) return true;
                        }
                        continue;
                    }

                    // if the piece is a knight or a king
                    if (piece.type === PieceType.KNIGHT || piece.type === PieceType.KING) return true;

                    var offset = Move.RAYS[index];
                    var j = i + offset;

                    var blocked = false;
                    while (j !== square) {
                        if (this.board[j] !== Piece.NONE) {
                            blocked = true;
                            break;
                        }
                        j += offset;
                    }

                    if (!blocked) return true;
                }
            }

            return false;
        }
    }, {
        key: 'isKingAttacked',
        value: function isKingAttacked(color) {
            return this.isAttacked(color === Color.WHITE ? Color.BLACK : Color.WHITE, this.kings[color]);
        }
    }, {
        key: 'isCheck',
        value: function isCheck() {
            return this.isKingAttacked(this.turn);
        }
    }, {
        key: 'isCheckmate',
        value: function isCheckmate() {
            return this.isCheck() && this._generateMoves().length === 0;
        }
    }, {
        key: 'isStalemate',
        value: function isStalemate() {
            return !this.isCheck() && this._generateMoves().length === 0;
        }
    }, {
        key: 'isDraw',
        value: function isDraw() {
            return this.halfMoves >= 100 || this.isStalemate() || this.isInsufficientMaterial() || this.isThreefoldRepetition();
        }
    }, {
        key: 'isInsufficientMaterial',
        value: function isInsufficientMaterial() {
            var pieceCount = {};
            var totalPieceCount = 0;

            var bishops = [];
            var squareColor = 0;

            for (var i = Move.SQUARES.a8; i <= Move.SQUARES.h1; i++) {
                squareColor = (squareColor + 1) % 2;
                if (i & 0x88) {
                    i += 7;continue;
                }

                var piece = this.board[i];
                if (piece.type !== PieceType.NONE) {
                    pieceCount[piece.type] = piece.type in pieceCount ? pieceCount[piece.type] + 1 : 1;
                    if (piece.type === PieceType.BISHOP) {
                        bishops.push(squareColor);
                    }
                    totalPieceCount++;
                }
            }

            // k vs. k
            if (totalPieceCount === 2) {
                return true;
            }

            // k vs. kn ... or ... k vs. kb
            else if (totalPieceCount === 3 && (pieceCount[PieceType.BISHOP] === 1 || pieceCount[PieceType.KNIGHT] === 1)) {
                    return true;
                }

                // kb vs. kb where any number of bishops are all on the same color
                else if (totalPieceCount === pieceCount[PieceType.BISHOP] + 2) {
                        var len = bishops.length;
                        var sum = 0;
                        for (var _i2 = 0; _i2 < len; _i2++) {
                            sum += bishops[_i2];
                        }
                        if (sum === 0 || sum === len) {
                            return true;
                        }
                    }

            return false;
        }
    }, {
        key: 'isThreefoldRepetition',
        value: function isThreefoldRepetition() {
            return Array.from(this.positionCount.values()).some(function (count) {
                return count >= 3;
            });
        }
    }, {
        key: 'isGameOver',
        value: function isGameOver() {
            return this.halfMoves >= 100 || this.isCheckmate() || this.isStalemate() || this.isInsufficientMaterial() || this.isThreefoldRepetition();
        }
    }], [{
        key: 'copyFrom',
        value: function copyFrom(other /* BoardVariation object */) {
            var _copy$castlingEligibi, _copy$kings;

            var copy = Object.create(BoardVariation.prototype);

            // Yes, copying things in Javascript is not straightforward.  http://stackoverflow.com/questions/14443357/primitive-types-reference-types-in-javascript

            copy.id = BoardVariation.id++;
            copy.parentVariation = other.parentVariation; // yes this should remain a pointer;  shouldn't be a full clone
            copy.parentLastMoveIndex = other.parentLastMoveIndex;
            copy.turn = other.turn;
            copy.enPassantSquare = other.enPassantSquare;

            copy.moveNumber = other.moveNumber;
            copy.plyCount = other.plyCount;
            copy.halfMoves = other.halfMoves;

            copy.board = other.board.slice(0); // http://stackoverflow.com/questions/15722433/javascript-copy-array-to-new-array
            copy.castlingEligibility = (_copy$castlingEligibi = {}, _defineProperty(_copy$castlingEligibi, Color.WHITE, other.castlingEligibility[Color.WHITE]), _defineProperty(_copy$castlingEligibi, Color.BLACK, other.castlingEligibility[Color.BLACK]), _copy$castlingEligibi);
            copy.kings = (_copy$kings = {}, _defineProperty(_copy$kings, Color.WHITE, other.kings[Color.WHITE]), _defineProperty(_copy$kings, Color.BLACK, other.kings[Color.BLACK]), _copy$kings);
            copy.moveHistory = other.moveHistory.slice(0);
            copy.selectedMoveHistoryIndex = other.selectedMoveHistoryIndex;

            copy.positionCount = new Map(other.positionCount);

            copy.intraMoveAnnotationSlots = other.intraMoveAnnotationSlots.slice(0);

            copy.eventLog = other.eventLog;

            return copy;
        }

        // branching constructor:  we're forking our game tree by building a new BoardVariation from the given BoardVariation

    }, {
        key: 'createFromParentVariation',
        value: function createFromParentVariation(parent /* BoardVariation object */) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            options = Object.assign({}, {
                isContinuation: false,
                resetIdCounter: false,
                skipUndoingCurrentMove: false
            }, options);

            var copy = BoardVariation.copyFrom(parent);

            // if this is a PGN variations, then undo the previous move, by definition
            if (!options.skipUndoingCurrentMove && !options.isContinuation) {
                copy.undoCurrentMove();
            }

            if (options.resetIdCounter) {
                BoardVariation.id = 0;
            }

            copy.id = BoardVariation.id++;
            copy.parentLastMoveIndex = parent.selectedMoveHistoryIndex;
            copy.parentVariation = parent;
            copy.isContinuation = options.isContinuation;

            // clear out the existing history
            copy.moveHistory = [];
            copy.selectedMoveHistoryIndex = -1;
            copy.intraMoveAnnotationSlots = [];

            return copy;
        }
    }, {
        key: 'createFromFen',
        value: function createFromFen(fen /* string */) /* EventLog.js object */{
            var eventLog = arguments.length <= 1 || arguments[1] === undefined ? new EventLog() : arguments[1];

            var variation = new BoardVariation(eventLog);
            if (variation.loadFen(fen)) {
                return variation;
            } else {
                return false;
            }
        }
    }, {
        key: '_file',
        value: function _file(i) {
            return i & 15;
        }
    }, {
        key: '_rank',
        value: function _rank(i) {
            return i >> 4;
        }
    }, {
        key: '_algebraic',
        value: function _algebraic(i) {
            var f = BoardVariation._file(i);
            var r = BoardVariation._rank(i);
            return 'abcdefgh'.substring(f, f + 1) + '87654321'.substring(r, r + 1);
        }
    }]);

    return BoardVariation;
}();

;

BoardVariation.id = 0;

module.exports = BoardVariation;