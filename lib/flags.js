'use strict';

var _Flags$DISPLAY;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Flags = function Flags() {
    _classCallCheck(this, Flags);
};

;

Flags.NORMAL = 1;
Flags.CAPTURE = 2;
Flags.BIG_PAWN = 4; // a pawn moving two spaces
Flags.EP_CAPTURE = 8;
Flags.PROMOTION = 16;
Flags.KSIDE_CASTLE = 32;
Flags.QSIDE_CASTLE = 64;
Flags.DISPLAY = (_Flags$DISPLAY = {}, _defineProperty(_Flags$DISPLAY, Flags.NORMAL, 'n'), _defineProperty(_Flags$DISPLAY, Flags.CAPTURE, 'c'), _defineProperty(_Flags$DISPLAY, Flags.BIG_PAWN, 'b'), _defineProperty(_Flags$DISPLAY, Flags.EP_CAPTURE, 'e'), _defineProperty(_Flags$DISPLAY, Flags.PROMOTION, 'p'), _defineProperty(_Flags$DISPLAY, Flags.KSIDE_CASTLE, 'k'), _defineProperty(_Flags$DISPLAY, Flags.QSIDE_CASTLE, 'q'), _Flags$DISPLAY);

module.exports.Flags = Flags;