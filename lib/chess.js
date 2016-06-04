'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BoardVariation = require('board_variation');
var Color = require('./color');
var Fen = require('fen');
var Flags = require('./flags');
var Game = require('game');
var Move = require('./move');
var PieceType = require('./piece_type');

var Chess = function () {
    function Chess() /* string */ // TODO(aaron) think about also having a constructor that takes in PGN ?
    {
        var fen = arguments.length <= 0 || arguments[0] === undefined ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : arguments[0];

        _classCallCheck(this, Chess);

        var game = new Game(fen);
        this.games = [game];

        this.currentGame = game;
        this.currentGameNum = 0;

        this.lastTimerSnapshot = -1;
        this.replayLog = [];
    }

    _createClass(Chess, [{
        key: 'toString',
        value: function toString() {
            return this.games.length + ' game' + (this.games.length > 1 ? 's' : '') + ' loaded.  Game #' + (this.currentGameNum + 1) + ' selected:\n\n' + this.currentGame.toString();
        }
    }, {
        key: 'addGame',
        value: function addGame() {
            var game = arguments.length <= 0 || arguments[0] === undefined ? new Game() : arguments[0];

            this.games.push(game);
        }
    }, {
        key: 'selectGame',
        value: function selectGame(i) {
            if (i < 0 || i >= this.games.length) {
                return false;
            }

            this.currentGame = this.games[i];
            this.currentGameNum = i;

            return true;
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

            return this.currentGame.toPgn(options);
        }
    }, {
        key: 'loadPgn',
        value: function loadPgn(pgnText) {
            var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            options = Object.assign({}, {
                newlineChar: '\r?\n'
            }, options);

            // reduce all newlines into \n for simplified parsing
            pgnText = pgnText.replace(new RegExp(options.newlineChar.replace(/\\/g, '\\'), 'g'), '\n');

            var pairs = this._parsePgnGames(pgnText);

            for (var i = 0; i < pairs.length; i++) {
                var game = this._parsePgnGame(pairs[i].headerText, pairs[i].gameText);
                if (!game) {
                    return false;
                }
                this.addGame(game);
            }

            this.selectGame(this.games.length - 1); // select the game we just loaded...

            return true;
        }

        // sanitizes our raw input PGN text, dividing it up by each unique game entry it contains

    }, {
        key: '_parsePgnGames',
        value: function _parsePgnGames(pgnText) {
            var results = [];

            var headMatch = void 0,
                prevHead = void 0,
                newHead = void 0,
                startNew = void 0,
                afterNew = void 0,
                lastOpen = void 0,
                checkedGame = "",
                numberOfGames = 0,
                validHead = void 0;
            var headerBlockRegex = /\s*(\[\s*\w+\s*"[^"]*"\s*\]\s*)+/;

            // fix common mistakes in PGN text
            pgnText = pgnText.replace(/[\u00A0\u180E\u2000-\u200A\u202F\u205F\u3000]/g, " "); // some spaces to plain space
            pgnText = pgnText.replace(/\u00BD/g, "1/2"); // "half fraction" to "1/2"
            pgnText = pgnText.replace(/[\u2010-\u2015]/g, "-"); // "hyphens" to "-"
            pgnText = pgnText.replace(/\u2024/g, "."); // "one dot leader" to "."
            pgnText = pgnText.replace(/[\u2025-\u2026]/g, "..."); // "two dot leader" and "ellipsis" to "..."
            pgnText = pgnText.replace(/\\"/g, "'"); // fix [Opening "Queen\"s Gambit"]

            // escape html entities
            pgnText = pgnText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

            // PGN standard: ignore lines starting with %
            pgnText = pgnText.replace(/(^|\n)%.*(\n|$)/g, "\n");

            if (headerBlockRegex.exec(pgnText)) {
                while (headMatch = headerBlockRegex.exec(pgnText)) {
                    newHead = headMatch[0];
                    startNew = pgnText.indexOf(newHead);
                    afterNew = startNew + newHead.length;
                    if (prevHead) {
                        checkedGame += pgnText.slice(0, startNew);
                        validHead = (lastOpen = checkedGame.lastIndexOf("{")) < 0 || checkedGame.lastIndexOf("}") > lastOpen;
                        if (validHead) {
                            results.push({
                                headerText: prevHead,
                                gameText: checkedGame
                            });
                            checkedGame = "";
                        } else {
                            checkedGame += newHead;
                        }
                    } else {
                        validHead = true;
                    }
                    if (validHead) {
                        prevHead = newHead;
                    }
                    pgnText = pgnText.slice(afterNew);
                }
            } else {
                results.push({
                    headerText: "",
                    gameText: pgnText
                });
            }

            if (prevHead) {
                checkedGame += pgnText;
                results.push({
                    headerText: prevHead,
                    gameText: checkedGame
                });
            }

            return results;
        }

        //
        // behold, an actual PGN parser and lexer, with full support for variations.
        //

    }, {
        key: '_parsePgnGame',
        value: function _parsePgnGame(pgnHeaderText, pgnGameText) {
            var POSSIBLE_RESULTS = ['1-0', '0-1', '1/2-1/2', '*']; // TODO:  this is a constant, put it somewhere better...?

            function _openNewVariation(game, isContinuation) {
                var parentLastMoveIndex = game.currentVariation.moveHistory.length - 1;

                var innerVariation = BoardVariation.createFromParentVariation(game.currentVariation, { isContinuation: isContinuation });

                game.boardVariations.push(innerVariation);

                // take the variation we just started, and append it to the list of child variations that start from its "parent" move.
                game.currentVariation.moveHistory[parentLastMoveIndex].childVariations.push(innerVariation);

                game.currentVariation = innerVariation;
            }

            function _closeCurrentVariation(game) {
                game.currentVariation = game.currentVariation.parentVariation;
            }

            // parse pgn's header text
            var key = void 0,
                value = void 0,
                headers = pgnHeaderText.split('\n');

            var fen = Fen.DEFAULT_POSITION_FULL;
            var pairs = [];
            for (var i = 0; i < headers.length; i++) {
                var header = headers[i].trim();

                key = header.replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, '$1');
                value = header.replace(/^\[[A-Za-z]+\s"(.*)"\]$/, '$1');

                if (key.length > 0) {
                    pairs.push(key);
                    pairs.push(value);

                    if (key.toUpperCase() === 'FEN') {
                        fen = value;
                    }
                }
            }

            var game = new Game(fen, pairs);

            // parse pgn's chess text
            var prevMove = void 0,
                start = void 0,
                end = void 0,
                comment = void 0,
                ss = pgnGameText;

            for (start = 0; start < ss.length; start++) {
                switch (ss.charAt(start)) {
                    case ' ':
                    case '\b':
                    case '\f':
                    case '\n':
                    case '\r':
                    case '\t':
                        break;

                    case ';':
                        // TODO:  add support for "rest of line" comment.  http://www6.chessclub.com/help/PGN-spec
                        break;

                    case '{':
                        end = start;
                        while (ss.charAt(end) != '}') {
                            end++;
                        }

                        comment = ss.substring(start, end + 1); // TODO need to properly sanitize this input.

                        if (game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1]) {
                            game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1].push(comment);
                        } else {
                            game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1] = [comment];
                        }

                        if (prevMove) {
                            prevMove.metadata.comment = comment; // assign all comment blocks to their preceding move
                            // TODO this logic is broken;  there could be multiple comments;  need to push onto a .comments array;
                            // TODO figure out the interplay between metadata.comment and intraMoveAnnotationSlots;
                            // you should probably just have metadata link to the given slots?  instead of duplicating?
                        }

                        start = end;
                        break;

                    case '(':
                        var isContinuation = false;
                        if (ss.charAt(start + 1) === '*') {
                            isContinuation = true;
                            start++;
                        }
                        _openNewVariation(game, isContinuation);
                        break;

                    case ')':
                        _closeCurrentVariation(game);
                        break;

                    case '$':
                        // http://en.wikipedia.org/wiki/Numeric_Annotation_Glyphs
                        end = start + 1;
                        while (ss.charAt(end) != ' ') {
                            end++;
                        }

                        var glyph = ss.substring(start, end); // TODO need to properly sanitize this input.

                        if (game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1]) {
                            game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1].push(glyph);
                        } else {
                            game.currentVariation.intraMoveAnnotationSlots[game.currentVariation.selectedMoveHistoryIndex + 1] = [glyph];
                        }

                        start = end;
                        break;

                    default:
                        var sanText = void 0;

                        for (var _i = 0; _i < POSSIBLE_RESULTS.length; _i++) {
                            if (ss.indexOf(POSSIBLE_RESULTS[_i], start) == start) {
                                if (game.currentVariation === game.currentVariation[0]) {
                                    end = ss.length;
                                } else {
                                    end = start + POSSIBLE_RESULTS[_i].length;
                                }
                                start = end;
                                break;
                            }
                        }
                        if (start == ss.length) {
                            break;
                        }

                        var needle = game.currentVariation.moveNumber.toString();

                        if (ss.indexOf(needle, start) == start) {
                            start += needle.length;
                            while (' .\n\r'.indexOf(ss.charAt(start)) != -1) {
                                start++;
                            }
                        }

                        if (ss.substr(start, 2) === Move.WILDCARD_MOVE) {
                            var someMove = Move.createWildcardMove(game.currentVariation);
                            prevMove = game.makeMove(someMove);
                            end = start + 2;
                        } else if (ss.substr(start, 8) === "&lt;&gt;") {
                            var _someMove = Move.createWildcardMove(game.currentVariation);
                            prevMove = game.makeMove(_someMove);
                            end = start + 8;
                        } else {
                            if ((end = start + ss.substr(start).search(/[\s${;!?()]/)) < start) {
                                end = ss.length;
                            }

                            sanText = ss.substring(start, end);
                            prevMove = game.makeMoveFromSan(sanText);
                        }

                        if (!prevMove) {
                            throw new Error('error when trying to apply the parsed PGN move "' + sanText + '"');
                        }

                        comment = null;

                        if (ss.charAt(end) === ' ') {
                            start = end;
                        } else {
                            start = end - 1;
                        }

                        break;
                }
            }

            if (game.currentVariation !== game.boardVariations[0]) {
                // error: parse_pgn ended with one or more dangling variations that weren't closed off
                while (game.currentVariation !== game.boardVariations[0]) {
                    _closeCurrentVariation(game);
                }
            }

            return game;
        }
    }, {
        key: 'clear',
        value: function clear() {
            var game = new Game();
            this.currentGameNum = 0;
            this.currentGame = game;

            this.games[this.currentGameNum] = game;
        }
    }, {
        key: 'reset',
        value: function reset() {
            var game = new Game(Fen.DEFAULT_POSITION_FULL);
            this.currentGameNum = 0;
            this.currentGame = game;

            this.games[this.currentGameNum] = game;
        }
    }, {
        key: 'whoseTurn',
        value: function whoseTurn() {
            return this.currentGame.currentVariation.turn;
        }

        // --------------------------------------
        // pass-through API methods, alphabetized
        // --------------------------------------

    }, {
        key: 'ascendFromCurrentContinuation',
        value: function ascendFromCurrentContinuation() {
            return this.currentGame.ascendFromCurrentContinuation();
        }
    }, {
        key: 'ascendFromCurrentVariation',
        value: function ascendFromCurrentVariation() {
            return this.currentGame.ascendFromCurrentVariation();
        }
    }, {
        key: 'createContinuationFromSan',
        value: function createContinuationFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */) {
            return this.currentGame.createContinuationFromSan(san);
        }
    }, {
        key: 'createVariationFromSan',
        value: function createVariationFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */) {
            return this.currentGame.createVariationFromSan(san);
        }
    }, {
        key: 'descendIntoContinuation',
        value: function descendIntoContinuation(i) {
            return this.currentGame.descendIntoContinuation(i);
        }
    }, {
        key: 'descendIntoVariation',
        value: function descendIntoVariation(i) {
            return this.currentGame.descendIntoVariation(i);
        }
    }, {
        key: 'get',
        value: function get(square /* string, e.g. 'a1' */) {
            return this.currentGame.get(square);
        }
    }, {
        key: 'header',
        value: function header() {
            return this.currentGame.header;
        }
    }, {
        key: 'history',
        value: function history() {
            return this.currentGame.history();
        }
    }, {
        key: 'isCheck',
        value: function isCheck() {
            return this.currentGame.isCheck();
        }
    }, {
        key: 'isCheckmate',
        value: function isCheckmate() {
            return this.currentGame.isCheckmate();
        }
    }, {
        key: 'isDraw',
        value: function isDraw() {
            return this.currentGame.isDraw();
        }
    }, {
        key: 'isGameOver',
        value: function isGameOver() {
            return this.currentGame.isGameOver();
        }
    }, {
        key: 'isInsufficientMaterial',
        value: function isInsufficientMaterial() {
            return this.currentGame.isInsufficientMaterial();
        }
    }, {
        key: 'isStalemate',
        value: function isStalemate() {
            return this.currentGame.isStalemate();
        }
    }, {
        key: 'isThreefoldRepetition',
        value: function isThreefoldRepetition() {
            return this.currentGame.isThreefoldRepetition();
        }
    }, {
        key: 'loadFen',
        value: function loadFen(fen) {
            return this.currentGame.loadFen(fen);
        }
    }, {
        key: 'makeMove',
        value: function makeMove(move /* Move.js object */) {
            return this.currentGame.makeMove(move);
        }
    }, {
        key: 'makeMoveFromSan',
        value: function makeMoveFromSan(san /* string, e.g. "Rxa7" or "e8=Q#" */) {
            return this.currentGame.makeMoveFromSan(san);
        }
    }, {
        key: 'makeMoveFromAlgebraic',
        value: function makeMoveFromAlgebraic(from /* e.g. 'a4', 'b3' */
        , to /* e.g. 'a4', 'b3' */
        ) {
            var promotionPieceType = arguments.length <= 2 || arguments[2] === undefined ? PieceType.QUEEN : arguments[2];

            return this.currentGame.makeMoveFromAlgebraic(from, to, promotionPieceType);
        }
    }, {
        key: 'moves',
        value: function moves() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                onlyAlgebraicSquares: false,
                onlyDestinationSquares: false,
                onlyForSquare: undefined
            } : arguments[0];

            return this.currentGame.moves(options);
        }
    }, {
        key: 'next',
        value: function next() {
            return this.currentGame.next();
        }
    }, {
        key: 'prev',
        value: function prev() {
            return this.currentGame.prev();
        }
    }, {
        key: 'put',
        value: function put(piece /* Piece, e.g. Piece.WHITE_ROOK */, square /* string, e.g. 'h8' */) {
            var success = this.currentGame.put(piece, square);
            if (success) {
                this.currentGame._updateSetup();
            }
            return success;
        }
    }, {
        key: 'remove',
        value: function remove(square /* string, e.g. 'a1' */) {
            return this.currentGame.remove(square);
        }
    }, {
        key: 'rewindToBeginning',
        value: function rewindToBeginning() {
            return this.currentGame.rewindToBeginning();
        }
    }, {
        key: 'selectMove',
        value: function selectMove(i) {
            return this.currentGame._selectMove(i, { shouldLog: true });
        }
    }, {
        key: 'toFen',
        value: function toFen() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {
                omitExtras: false
            } : arguments[0];

            return this.currentGame.currentVariation.toFen(options);
        }
    }, {
        key: 'validateFen',
        value: function validateFen(fen) {
            return Fen.validate(fen);
        }
    }]);

    return Chess;
}();

;

module.exports = Chess;