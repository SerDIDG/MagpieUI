/*

 Running the following code before any other code will create if it's not natively available.
 https://developer.mozilla.org/

*/

window.URL = window.URL || window.webkitURL;

if(!Array.prototype.forEach){
    Array.prototype.forEach = function(fn, scope){
        for(var i = 0, len = this.length; i < len; ++i){
            fn.call(scope || this, this[i], i, this);
        }
    }
}

if(!Array.prototype.filter){
    Array.prototype.filter = function(fun /*, thisp */){
        "use strict";

        if(this == null){
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if(typeof fun != "function"){
            throw new TypeError();
        }
        var res = [];
        var thisp = arguments[1];
        for(var i = 0; i < len; i++){
            if(i in t){
                var val = t[i]; // in case fun mutates this
                if(fun.call(thisp, val, i, t)){
                    res.push(val);
                }
            }
        }
        return res;
    };
}


if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
        var T, A, k;
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        A = new Array(len);
        k = 0;
        while (k < len) {
            var kValue, mappedValue;
            if (k in O) {
                kValue = O[k];
                mappedValue = callback.call(T, kValue, k, O);
                A[k] = mappedValue;
            }
            k++;
        }
        return A;
    };
}

if(!Array.prototype.indexOf){
    Array.prototype.indexOf = function(searchElement /*, fromIndex */){
        "use strict";
        if(this == null){
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if(len === 0){
            return -1;
        }
        var n = 0;
        if(arguments.length > 1){
            n = Number(arguments[1]);
            if(n != n){
                n = 0;
            }else if(n != 0 && n != Infinity && n != -Infinity){
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if(n >= len){
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for(; k < len; k++){
            if(k in t && t[k] === searchElement){
                return k;
            }
        }
        return -1;
    };
}

if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

if ( 'function' !== typeof Array.prototype.reduce ) {
    Array.prototype.reduce = function( callback /*, initialValue*/ ) {
        'use strict';
        if ( null === this || 'undefined' === typeof this ) {
            throw new TypeError('Array.prototype.reduce called on null or undefined' );
        }
        if ( 'function' !== typeof callback ) {
            throw new TypeError( callback + ' is not a function' );
        }
        var t = Object( this ), len = t.length >>> 0, k = 0, value;
        if ( arguments.length >= 2 ) {
            value = arguments[1];
        } else {
            while ( k < len && ! k in t ) k++;
            if ( k >= len )
                throw new TypeError('Reduce of empty array with no initial value');
            value = t[ k++ ];
        }
        for ( ; k < len ; k++ ) {
            if ( k in t ) {
                value = callback( value, t[k], k, t );
            }
        }
        return value;
    };
}

if ( 'function' !== typeof Array.prototype.reduceRight ) {
    Array.prototype.reduceRight = function( callback /*, initialValue*/ ) {
        'use strict';
        if ( null === this || 'undefined' === typeof this ) {
            throw new TypeError(
                'Array.prototype.reduce called on null or undefined' );
        }
        if ( 'function' !== typeof callback ) {
            throw new TypeError( callback + ' is not a function' );
        }
        var t = Object( this ), len = t.length >>> 0, k = len - 1, value;
        if ( arguments.length >= 2 ) {
            value = arguments[1];
        } else {
            while ( k >= 0 && ! k in t ) k--;
            if ( k < 0 )
                throw new TypeError('Reduce of empty array with no initial value');
            value = t[ k-- ];
        }
        for ( ; k >= 0 ; k-- ) {
            if ( k in t ) {
                value = callback( value, t[k], k, t );
            }
        }
        return value;
    };
}

if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== 'function') {
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }
        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP    = function() {},
            fBound  = function() {
                return fToBind.apply(this instanceof fNOP && oThis
                        ? this
                        : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
        return fBound;
    };
}

if(!String.prototype.trim) {
    String.prototype.trim = function(){
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}

if(!Date.now){
    Date.now = function now(){
        return new Date().getTime();
    };
}

(function(){
    if('undefined' == typeof JSON){
        window.JSON = {};
    }
    if(!JSON.parse || !JSON.stringify){
        JSON.parse = function(str){
            return eval('(' + str + ')');
        };
        JSON.stringify = function(){
            throw new Error('JSON.stringify is not supported by this browser.');
        };
    }
})();