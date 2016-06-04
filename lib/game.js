'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BoardVariation = require('../src/board_variation');
var Color = require('./../src/color');
var EventLog = require('./../src/event_log');
var Fen = require('../src/fen');
var Flags = require('./../src/flags');
var LinkedHashMap = require('../src/linked_hash_map');
var Move = require('./../src/move');
var PieceType = require('./../src/piece_type');

var Game = function () {
    function Game() {
        var fen = arguments.length <= 0 || arguments[0] === undefined ? Fen.DEFAULT_POSITION_FULL : arguments[0];
        var pgnHeaderPairs = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

        _classCallCheck(this, Game);

        // EventLog for tracking all player interactions
        this.eventLog = new EventLog();

        // a chess's PGN header applies to all of its variations
        this.header = new LinkedHashMap(pgnHeaderPairs);

        // our board state information will always reside within the context of a given line of play, i.e. variation
        if (fen) {
            this.currentVariation = BoardVariation.createFromFen(fen, this.eventLog);

            if (fen !== Fen.DEFAULT_POSITION_FULL) {
                this.header.set('SetUp', '1');
                this.header.set('FEN', fen);
            }
        } else {
            this.currentVariation = new BoardVariation(this.eventLog);
        }

        // to store any continuations/variations
        this.boardVariations = [this.currentVariation];
    }

    _createClass(Game, [{
        key: 'toString',
        value: function toString() {
            var pgn = this.toPgn({
                maxWidth: 0,
                newlineChar: '\n',
                showMoveCursor: true,
                showHeaders: false
            });

            var lineSize = Math.max(80, Math.floor(pgn.length / 4));

            var pgnLines = [];
            for (var i = 0; i < pgn.length;) {
                var start = i;
                i += lineSize;
                while (pgn.charAt(i) != ' ' && i < pgn.length) {
                    i++;
                }
                pgnLines.push(pgn.substring(start, i));
            }

            var result = '';

            var asciiLines = this.currentVariation.toString().split("\n");
            var tallies = ' : (variations: ' + this.boardVariations.length + ', move history length: ' + this.currentVariation.moveHistory.length + ', selected index: ' + this.currentVariation.selectedMoveHistoryIndex + ')';
            for (var _i = 0; _i < asciiLines.length; _i++) {
                result += asciiLines[_i];

                if (this.currentVariation.turn === Color.WHITE) {
                    if (_i == 9) result += tallies;
                } else {
                    if (_i == 0) result += tallies;
                }

                if (_i >= 2 && pgnLines.length > _i - 2) result += '  ' + pgnLines[_i - 2];
                if (_i == 7) result += '  ' + this.currentVariation.toFen();
                result += '\n';
            }
            return result;
        }
    }, {
        key: 'loadFen',
        value: function loadFen(fen) {
            var variation = BoardVariation.createFromFen(fen);
            if (variation) {
                this.currentVariation = variation;
                this._updateSetup();
                this.boardVariations = [variation];
                return true;
            } else {
                return false;
            }
        }
    }, {
        key: 'makeMove',
        value: function makeMove(move) {
            var metadata = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            metadata = Object.assign({}, {
                comment: null, /* string */
                timeTakenToMove: null, /* int */
                isPuzzleSolution: null /* boolean */
            }, metadata);

            return this.currentVariation.makeMove(move, this, metadata);
        }
    }, {
        key: 'makeMoveFromSan',
        value: function makeMoveFromSan(san) {
            var metadata = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            metadata = Object.assign({}, {
                comment: null, /* string */
                timeTakenToMove: null, /* int */
                isPuzzleSolution: null /* boolean */
            }, metadata);

            return this.currentVariation.makeMoveFromSan(san, this, metadata);
        }
    }, {
        key: 'makeMoveFromAlgebraic',
        value: function makeMoveFromAlgebraic(from /* e.g. 'a4', 'b3' */
        , to /* e.g. 'a4', 'b3' */
        ) {
            var promotionPieceType = arguments.length <= 2 || arguments[2] === undefined ? PieceType.QUEEN : arguments[2];
            var metadata = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

            metadata = Object.assign({}, {
                comment: null, /* string */
                timeTakenToMove: null, /* int */
                isPuzzleSolution: null /* boolean */
            }, metadata);

            return this.currentVariation.makeMoveFromAlgebraic(from, to, this, promotionPieceType, metadata);
        }
    }, {
        key: 'toPgn',
        value: function toPgn() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            options = Object.assign({}, {
                maxWidth: 0,
                newlineChar: '\n',
                showMoveCursor: false,
                showHeaders: true
            }, options);

            var result = [];

            // add the PGN header information
            if (options.showHeaders) {
                for (var i = 0; i < this.header.length(); i++) {
                    result.push('[' + this.header.getKeyAtPosition(i) + ' "' + this.header.getValueAtPosition(i) + '"]' + options.newlineChar);
                }
                if (this.header.length() > 0) {
                    result.push(options.newlineChar);
                }
            }

            var outermostVariation = this.boardVariations[0];
            var moves = processVariation(outermostVariation, 1, this.currentVariation);

            function processVariation(variation, pgnMoveNum, currentVariation) {
                var moves = [];
                var variationMoveString = '';
                var justStartedVariation = false;
                var justFinishedVariation = false;

                // initial leading annotation slot
                if (variation.intraMoveAnnotationSlots[0]) {
                    moves = moves.concat(variation.intraMoveAnnotationSlots[0]);
                }

                for (var _i2 = 0; _i2 < variation.moveHistory.length; _i2++) {

                    //
                    // #1: process move
                    //

                    var moveContext = variation.moveHistory[_i2];

                    justStartedVariation = _i2 == 0;

                    // if the position started with black to move, start PGN with 1. ...
                    if (justStartedVariation && moveContext.move.movedPiece.color === Color.BLACK) {
                        moves.push(pgnMoveNum + '...');
                        pgnMoveNum++;
                    } else if ((justStartedVariation || justFinishedVariation) && moveContext.move.movedPiece.color === Color.BLACK && !variation.isContinuation) {
                        moves.push(pgnMoveNum - 1 + '...');
                    } else if (moveContext.move.movedPiece.color === Color.WHITE) {
                        moves.push(pgnMoveNum + '.');
                        pgnMoveNum++;
                    }

                    moves.push(moveContext.move.isWildcard ? Move.WILDCARD_MOVE : moveContext.move.san);

                    if (options.showMoveCursor) {
                        var isCurrentlySelectedMove = variation === currentVariation && _i2 === currentVariation.selectedMoveHistoryIndex;
                        if (isCurrentlySelectedMove) {
                            moves.push(' ^');
                        }
                    }

                    //
                    // #2: process annotations
                    //

                    if (variation.intraMoveAnnotationSlots[_i2 + 1]) {
                        moves = moves.concat(variation.intraMoveAnnotationSlots[_i2 + 1]);
                    }

                    //
                    // #3: process variations
                    //

                    justFinishedVariation = false;
                    if (variation.moveHistory[_i2].childVariations.length > 0) {

                        if (variation.intraMoveAnnotationSlots[_i2 + 1]) {
                            moves.concat(variation.intraMoveAnnotationSlots[_i2 + 1]);
                        }

                        for (var j = 0; j < variation.moveHistory[_i2].childVariations.length; j++) {
                            var childVariation = variation.moveHistory[_i2].childVariations[j];

                            var variationMoves = processVariation(childVariation, pgnMoveNum - (childVariation.isContinuation ? 0 : 1), currentVariation);

                            if (variationMoves.length == 0) {
                                // an empty variation
                                moves.push("()");
                            } else {
                                for (var k = 0; k < variationMoves.length; k++) {
                                    variationMoveString = variationMoves[k];

                                    if (k == 0) {
                                        variationMoveString = '(' + (childVariation.isContinuation ? '* ' : '') + variationMoveString;
                                    }
                                    if (k == variationMoves.length - 1) {
                                        variationMoveString = variationMoveString + ')';
                                    }

                                    moves.push(variationMoveString);
                                }
                            }

                            justFinishedVariation = true;
                        }
                    }
                }

                return moves;
            }

            // is there a result?
            var resultHeader = this.header.get('Result');
            if (resultHeader) {
                moves.push(resultHeader);
            }

            // history should be back to what is was before we started generating PGN, so join together moves
            if (options.maxWidth === 0) {
                return result.join('') + moves.join(' ');
            }

            // wrap the PGN output at maxWidth -- TODO, revisit whether you want to linewrap inside a move, e.g. for "1. e4" --> "1.\ne4"
            var currentWidth = 0;
            for (var _i3 = 0; _i3 < moves.length; _i3++) {
                // if the current move will push past maxWidth
                if (currentWidth + moves[_i3].length > options.maxWidth && _i3 !== 0) {

                    // don't end the line with whitespace
                    if (result[result.length - 1] === ' ') {
                        result.pop();
                    }

                    result.push(options.newlineChar);
                    currentWidth = 0;
                } else if (_i3 !== 0) {
                    result.push(' ');
                    currentWidth++;
                }
                result.push(moves[_i3]);
                currentWidth += moves[_i3].length;
            }

            return result.join('');
        }
    }, {
        key: 'createContinuationFromSan',
        value: function createContinuationFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */) {
            this.eventLog.add('createContinuationFromSan(' + san + ')');

            return this.createVariationFromSan(san, true, { shouldLog: false });
        }
    }, {
        key: 'createVariationFromSan',
        value: function createVariationFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */, isContinuation) {
            var options = arguments.length <= 2 || arguments[2] === undefined ? {
                shouldLog: true
            } : arguments[2];

            if (options.shouldLog) {
                this.eventLog.add('createVariationFromSan(' + san + ', ' + isContinuation + ')');
            }

            if (san === null) {
                return false;
            }

            if (isContinuation) {
                if (this.currentVariation.selectedMoveHistoryIndex + 1 < this.currentVariation.moveHistory.length) {
                    var _move = this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex + 1].move;
                    if (_move.san === san) {
                        return false; // Continuation not created.  New move already exists as the next move in the current move sequence.
                    } else if (san === Move.WILDCARD_MOVE) {
                            return false; // Continuation not created.  New wildcard move already exists as the next move in the current move sequence.
                        }
                }
            } else {
                    var _move2 = this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex].move;
                    if (_move2.san === san) {
                        return false; // Variation not created.  New move already exists as the next move in the current move sequence.
                    } else if (san === Move.WILDCARD_MOVE) {
                            return false; // Continuation not created.  New wildcard move already exists as the next move in the current move sequence.
                        }
                }

            var innerVariation = BoardVariation.createFromParentVariation(this.currentVariation, { isContinuation: isContinuation });
            this.boardVariations.push(innerVariation);

            // take the variation we just started, and append it to the list of variations that start from its "parent" move.
            this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex].childVariations.push(innerVariation);

            // down we go, into our new variation
            this.currentVariation = innerVariation;

            var move = Move.createFromSan(san, this.currentVariation);

            if (!move) {
                // requested move isn't possible, so undo our attempt at creating a variation
                this.currentVariation = this.currentVariation.parentVariation;
                this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex].childVariations.pop();
                this.boardVariations.pop();

                return false;
            }

            this.currentVariation.makeMove(move, this);

            return true;
        }
    }, {
        key: 'history',
        value: function history() {
            var moveHistory = [];
            var tempVariation = this.currentVariation;

            for (var i = tempVariation.selectedMoveHistoryIndex; i >= 0; i--) {
                moveHistory.push(tempVariation.moveHistory[i].move.isWildcard ? Move.WILDCARD_MOVE : tempVariation.moveHistory[i].move.san);
            }

            var parentLastMoveIndex = tempVariation.parentLastMoveIndex;
            var isContinuation = tempVariation.isContinuation;
            tempVariation = tempVariation.parentVariation;

            while (tempVariation != null) {
                var _i4 = parentLastMoveIndex;
                if (!isContinuation) {
                    _i4--;
                }

                for (; _i4 >= 0; _i4--) {
                    moveHistory.push(tempVariation.moveHistory[_i4].isWildcard ? Move.WILDCARD_MOVE : tempVariation.moveHistory[_i4].move.san);
                }

                parentLastMoveIndex = tempVariation.parentLastMoveIndex;
                isContinuation = tempVariation.isContinuation;
                tempVariation = tempVariation.parentVariation;
            }

            return moveHistory.reverse();
        }

        // ---------------
        // navigation APIs
        // ---------------

    }, {
        key: 'ascendFromCurrentContinuation',
        value: function ascendFromCurrentContinuation() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                shouldLog: true
            } : arguments[0];

            if (options.shouldLog) {
                this.eventLog.add('ascendFromCurrentContinuation()');
            }

            if (this.currentVariation.parentVariation === null) {
                // already at the topmost level;  nothing to do.
                return false;
            }

            // this method differs from ascendFromCurrentVariation only here in this "- 1" offset
            var selectedMoveIndex = this.currentVariation.parentLastMoveIndex - 1;
            this.currentVariation = this.currentVariation.parentVariation;
            this.currentVariation.selectedMoveIndex = selectedMoveIndex;

            return this._selectMove(selectedMoveIndex);
        }
    }, {
        key: 'ascendFromCurrentVariation',
        value: function ascendFromCurrentVariation() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                shouldLog: true
            } : arguments[0];

            if (options.shouldLog) {
                this.eventLog.add('ascendFromCurrentVariation()');
            }

            if (this.currentVariation.parentVariation === null) {
                // already at the topmost level;  nothing to do.
                return false;
            }

            var selectedMoveIndex = this.currentVariation.parentLastMoveIndex;
            this.currentVariation = this.currentVariation.parentVariation;
            this.currentVariation.selectedMoveIndex = selectedMoveIndex;

            return true;
        }
    }, {
        key: 'next',
        value: function next() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                shouldLog: true
            } : arguments[0];

            return this.currentVariation.next(options);
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

            if (this.currentVariation.selectedMoveHistoryIndex === 0 && this.currentVariation.parentVariation) {
                if (this.ascendFromCurrentVariation({ shouldLog: false })) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return this._selectMove(this.currentVariation.selectedMoveHistoryIndex - 1);
            }
        }
    }, {
        key: 'rewindToBeginning',
        value: function rewindToBeginning() {
            this.eventLog.add('rewindToBeginning()');
            while (this.prev({ shouldLog: false })) {}
        }
    }, {
        key: 'replayToPlyNum',
        value: function replayToPlyNum(n /* logical ply number, starting from 1 */) {
            return this.currentVariation.replayToPlyNum(n); // TODO broken method logic;  game-level replay should unwind through multiple childVariations;
            // think:  path from leaf to n ancestors up the tree
        }
    }, {
        key: '_updateSetup',
        value: function _updateSetup() {
            if (this.currentVariation.moveHistory.length > 0) return;

            var fen = this.currentVariation.toFen();

            if (fen !== Fen.DEFAULT_POSITION) {
                this.header.set('SetUp', '1');
                this.header.set('FEN', fen);
            } else {
                this.header.remove('SetUp');
                this.header.remove('FEN');
            }
        }
    }, {
        key: 'header',
        value: function header() {
            return this.header;
        }
    }, {
        key: 'descendIntoContinuation',
        value: function descendIntoContinuation() /* defaults to the first variation */{
            var i = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

            this.eventLog.add('descendIntoContinuation()');

            if (this.currentVariation.moveHistory.length <= 0) {
                return false;
            }

            var currentMoveContext = this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex];
            if (currentMoveContext.childVariations.length <= 0) {
                return false;
            }
            if (i < 0 || i > currentMoveContext.childVariations.length - 1) {
                return false;
            }
            if (!currentMoveContext.childVariations[i].isContinuation) {
                return false;
            }

            this.currentVariation = currentMoveContext.childVariations[i];
            this.currentVariation.selectedMoveHistoryIndex = 0;

            return this._selectMove(0);
        }
    }, {
        key: 'descendIntoVariation',
        value: function descendIntoVariation() /* defaults to the first variation */{
            var i = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

            this.eventLog.add('descendIntoVariation()');

            if (this.currentVariation.moveHistory.length <= 0) {
                return false;
            }

            var currentMoveContext = this.currentVariation.moveHistory[this.currentVariation.selectedMoveHistoryIndex];
            if (currentMoveContext.childVariations.length <= 0) {
                return false;
            }
            if (i < 0 || i > currentMoveContext.childVariations.length - 1) {
                return false;
            }
            if (currentMoveContext.childVariations[i].isContinuation) {
                return false;
            }

            this.currentVariation = currentMoveContext.childVariations[i];
            this.currentVariation.selectedMoveHistoryIndex = 0;

            return this._selectMove(0);
        }
    }, {
        key: 'goToPosition',
        value: function goToPosition(path) {
            this.eventLog.add('goToPosition()');
            this.rewindToBeginning();
            for (var i = 0; i < path.length; i++) {
                this.currentVariation.replayToPlyNum(path[i]['ply']);
                if ('variation' in path[i]) {
                    this.descendIntoVariation(path[i]['variation']);
                }
            }
        }

        // --------------------------------------
        // pass-through API methods, alphabetized
        // --------------------------------------

    }, {
        key: '_selectMove',
        value: function _selectMove(i) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {
                shouldLog: false
            } : arguments[1];

            return this.currentVariation._selectMove(i, options);
        }
    }, {
        key: 'get',
        value: function get(square /* string, e.g. 'a1' */) {
            return this.currentVariation.get(square);
        }
    }, {
        key: 'isCheck',
        value: function isCheck() {
            return this.currentVariation.isCheck();
        }
    }, {
        key: 'isCheckmate',
        value: function isCheckmate() {
            return this.currentVariation.isCheckmate();
        }
    }, {
        key: 'isDraw',
        value: function isDraw() {
            return this.currentVariation.isDraw();
        }
    }, {
        key: 'isGameOver',
        value: function isGameOver() {
            return this.currentVariation.isGameOver();
        }
    }, {
        key: 'isInsufficientMaterial',
        value: function isInsufficientMaterial() {
            return this.currentVariation.isInsufficientMaterial();
        }
    }, {
        key: 'isStalemate',
        value: function isStalemate() {
            return this.currentVariation.isStalemate();
        }
    }, {
        key: 'isThreefoldRepetition',
        value: function isThreefoldRepetition() {
            return this.currentVariation.isThreefoldRepetition();
        }
    }, {
        key: 'moves',
        value: function moves() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                onlyAlgebraicSquares: false,
                onlyDestinationSquares: false,
                onlyForSquare: undefined
            } : arguments[0];

            return this.currentVariation.moves(options);
        }
    }, {
        key: 'put',
        value: function put(piece /* Piece, e.g. Piece.WHITE_ROOK */, square /* string, e.g. 'h8' */) {
            return this.currentVariation.put(piece, square);
        }
    }, {
        key: 'remove',
        value: function remove(square /* string, e.g. 'a1' */) {
            var piece = this.currentVariation.remove(square);
            this._updateSetup();

            return piece;
        }
    }, {
        key: 'toFen',
        value: function toFen() {
            return this.currentVariation.toFen();
        }
    }]);

    return Game;
}();

;

module.exports = Game;