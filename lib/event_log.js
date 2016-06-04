'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventLog = function () {
    function EventLog() {
        _classCallCheck(this, EventLog);

        this._events = [];
        this._lastTimerSnapshot = Date.now();

        this._events.push({
            timer: this._lastTimerSnapshot,
            delta: null,
            event: 'Event Log initialized.'
        });
    }

    _createClass(EventLog, [{
        key: 'add',
        value: function add(event) {
            var delta = this._updateEventTimer();

            this._events.push({
                timer: this._lastTimerSnapshot,
                delta: delta,
                event: event
            });
        }
    }, {
        key: '_updateEventTimer',
        value: function _updateEventTimer() {
            var prev = this._lastTimerSnapshot;
            this._lastTimerSnapshot = Date.now();
            return this._lastTimerSnapshot - prev;
        }
    }]);

    return EventLog;
}();

;

module.exports = EventLog;