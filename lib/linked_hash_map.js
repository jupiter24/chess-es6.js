'use strict';

// a lightweight map class that preserves key insertion order;
// needed for parsing and reconstructing PGN headers

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LinkedHashMap = function () {
    function LinkedHashMap() {
        var pairs = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

        _classCallCheck(this, LinkedHashMap);

        this._map = {};
        this._keys = [];

        this.addAll(pairs);
    }

    _createClass(LinkedHashMap, [{
        key: 'addAll',
        value: function addAll(pairs) {
            for (var i = 0; i < pairs.length; i += 2) {
                this.set(pairs[i], pairs[i + 1]);
            }
        }
    }, {
        key: 'clear',
        value: function clear() {
            this._map = {};
            this._keys = [];
        }
    }, {
        key: 'get',
        value: function get(k) {
            return this._map[k];
        }
    }, {
        key: 'getKeyAtPosition',
        value: function getKeyAtPosition(i) {
            return this._keys[i];
        }
    }, {
        key: 'getValueAtPosition',
        value: function getValueAtPosition(i) {
            return this._map[this._keys[i]];
        }
    }, {
        key: 'length',
        value: function length() {
            return this._keys.length;
        }
    }, {
        key: 'remove',
        value: function remove(k) {
            if (k in this._map) {
                var i = this._keys.indexOf(k);
                this._keys.splice(i, 1);
                delete this._map[k];
            }
        }
    }, {
        key: 'set',
        value: function set(k, v) {
            if (!(k in this._map)) {
                this._keys.push(k);
            }
            this._map[k] = v;
        }
    }, {
        key: 'toString',
        value: function toString() {
            var _this = this;

            return '{ ' + this._keys.map(function (key) {
                return key + ': ' + _this._map[key];
            }).join(', ') + ' }';
        }
    }]);

    return LinkedHashMap;
}();

;

module.exports = LinkedHashMap;