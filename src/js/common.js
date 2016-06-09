
// /* ************************************************ */
// /* ******* MAGPIE UI: COMMON ******* */
// /* ************************************************ */

/* ******* INFO ******* */

/* *******

    Objects and Arrays:             56
    Events:                         339
    Nodes:                          703
    Forms:                          1006
    Strings:                        1282
    Date and Time:                  1379
    Styles:                         1506
    Animation:                      2168
    Cookie and Local Storage:       2372
    Ajax:                           2439
    Hash (?):                       2717
    Graphics:                       2737
    Class Fabric                    2747

    -------

    Custom Events:
       scrollSizeChange

 ******* */

var cm = {
        '_version' : '3.18.4',
        '_loadTime' : Date.now(),
        '_debug' : true,
        '_debugAlert' : false,
        '_deviceType' : 'desktop',
        '_deviceOrientation' : 'landscape',
        '_baseUrl': [window.location.protocol, window.location.hostname].join('//'),
        '_scrollSize' : 0,
        '_pageSize' : {},
        '_clientPosition' : {'left' : 0, 'top' : 0},
        '_config' : {
            'animDuration' : 250,
            'animDurationShort' : 150,
            'animDurationLong' : 500,
            'loadDelay' : 350,
            'hideDelay' : 250,
            'hideDelayShort' : 150,
            'hideDelayLong' : 500,
            'requestDelay' : 300,
            'adaptiveFrom' : 768,
            'screenTablet' : 1024,
            'screenTabletPortrait' : 768,
            'screenMobile' : 640,
            'screenMobilePortrait' : 480,
            'dateFormat' : '%Y-%m-%d',
            'dateTimeFormat' : '%Y-%m-%d %H:%i:%s',
            'timeFormat' : '%H:%i:%s',
            'displayDateFormat' : '%F %j, %Y',
            'displayDateTimeFormat' : '%F %j, %Y, %H:%i',
            'tooltipTop' : 'targetHeight + 4'
        },
        'MAX_SAFE_INTEGER' : 9007199254740991
    },
    Mod = {},
    Part = {},
    Com = {
        'Elements' : {}
    };

/* ******* CHECK SUPPORT ******* */

cm.isFileReader = (function(){return 'FileReader' in window;})();
cm.isHistoryAPI = !!(window.history && history.pushState);
cm.isLocalStorage = (function(){try{return 'localStorage' in window && window.localStorage !== null;}catch(e){return false;}})();
cm.isCanvas = !!document.createElement("canvas").getContext;
cm.isTouch = 'ontouchstart' in document.documentElement || !!window.maxTouchPoints || !!navigator.maxTouchPoints;

/* ******* OBJECTS AND ARRAYS ******* */

cm.top = (function(){
    try {
        return window.top.cm;
    }catch(e){
        return window.cm;
    }
})();

cm.isType = function(o, types){
    if(cm.isString(types)){
        return Object.prototype.toString.call(o) === '[object ' + types +']';
    }
    if(cm.isRegExp(types)){
        return types.test(Object.prototype.toString.call(o));
    }
    if(cm.isObject(types)){
        var match = false;
        cm.forEach(types, function(type){
            if(!match){
                match = Object.prototype.toString.call(o) === '[object ' + type +']';
            }
        });
        return match;
    }
    return false;
};

cm.isBoolean = function(o){
    return Object.prototype.toString.call(o) === '[object Boolean]';
};

cm.isString = function(o){
    return Object.prototype.toString.call(o) === '[object String]';
};

cm.isNumber = function(o){
    return Object.prototype.toString.call(o) === '[object Number]';
};

cm.isArray = Array.isArray || function(o){
    return Object.prototype.toString.call(o) === '[object Array]';
};

cm.isObject = function(o){
    return Object.prototype.toString.call(o) === '[object Object]';
};

cm.isArguments = function(o){
    return Object.prototype.toString.call(o) === '[object Arguments]';
};

cm.isFunction = function(o){
    return Object.prototype.toString.call(o) === '[object Function]';
};

cm.isRegExp = function(o){
    return Object.prototype.toString.call(o) === '[object RegExp]';
};

cm.isDate = function(o){
    return Object.prototype.toString.call(o) === '[object Date]';
};

cm.isFile = function(o){
    return Object.prototype.toString.call(o) === '[object File]';
};

cm.isWindow = function(o){
    return Object.prototype.toString.call(o) === '[object Window]' || Object.prototype.toString.call(o) === '[object global]';
};

cm.isNode = function(node){
    try{
        return !!(node && node.nodeType);
    }catch(e){}
    return false;
};

cm.isTextNode = function(node){
    try{
        return !!(node && node.nodeType && node.nodeType == 3);
    }catch(e){}
    return false;
};

cm.isElementNode = function(node){
    try{
        return !!(node && node.nodeType && node.nodeType == 1);
    }catch(e){}
    return false;
};

cm.isPlainObject = function(obj) {
    if (typeof obj == 'object' && obj !== null) {
        if (typeof Object.getPrototypeOf == 'function') {
            var proto = Object.getPrototypeOf(obj);
            return proto === Object.prototype || proto === null;
        }
        return Object.prototype.toString.call(obj) == '[object Object]';
    }
    return false;
};

cm.forEach = function(o, callback){
    if(!o || !(callback && typeof callback == 'function')){
        return o;
    }
    var i, l;
    // Objects
    if(cm.isObject(o)){
        for(var key in o){
            if(o.hasOwnProperty(key)){
                callback(o[key], key, o);
            }
        }
        return o;
    }
    // Arrays
    if(cm.isArray(o)){
        o.forEach(callback);
        return o;
    }
    // Numbers
    if(cm.isNumber(o)){
        for(i = 0; i < o; i++){
            callback(i);
        }
        return o;
    }
    // Default
    try{
        Array.prototype.forEach.call(o, callback);
    }catch(e){
        try{
            for(i = 0, l = o.length; i < l; i++){
                callback(o[i], i, o);
            }
        }catch(e){}
    }
    return o;
};

cm.forEachReverse = function(o, callback){
    if(!o){
        return null;
    }
    if(!callback){
        return o;
    }
    o.reverse();
    cm.forEach(o, callback);
    o.reverse();
    return o;
};

cm.merge = function(o1, o2){
    var o;
    if(!o2){
        if(cm.isArray(o1)){
            o2 = [];
        }else{
            o2 = {};
        }
    }
    if(!o1){
        if(cm.isArray(o2)){
            o1 = [];
        }else{
            o1 = {};
        }
    }
    if(cm.isObject(o1)){
        o = cm.clone(o1);
        cm.forEach(o2, function(item, key){
            if(item !== null){
                try{
                    if(item._isComponent){
                        o[key] = item;
                    }else if(cm.isObject(item) && item.constructor != Object){
                        o[key] = item;
                    }else if(cm.isObject(item)){
                        o[key] = cm.merge(o[key], item);
                    }else if(cm.isArray(item)){
                        o[key] = cm.clone(item);
                    }else{
                        o[key] = item;
                    }
                }catch(e){
                    o[key] = item;
                }
            }
        });
    }else if(cm.isArray(o1)){
        o = cm.clone(o1);
        cm.forEach(o2, function(item){
            if(!cm.inArray(o, item)){
                o.push(item);
            }
        });
    }
    return o;
};

cm.extend = function(o1, o2){
    if(!o1){
        return o2;
    }
    if(!o2){
        return o1;
    }
    var o;
    if(cm.isArray(o1)){
        o = o1.concat(o2);
        return o;
    }
    if(cm.isObject(o1)){
        o = {};
        cm.forEach(o1, function(item, key){
            o[key] = item;
        });
        cm.forEach(o2, function(item, key){
            o[key] = item;
        });
        return o;
    }
    return null;
};

cm.clone = function(o, cloneNode){
    var newO;
    if(!o){
        return o;
    }
    // Arrays
    if(cm.isType(o, /Array|Arguments|StyleSheetList|CSSRuleList|HTMLCollection|NodeList|DOMTokenList|FileList/)){
        newO = [];
        cm.forEach(o, function(item){
            newO.push(cm.clone(item, cloneNode));
        });
        return newO;
    }
    // Objects
    if(cm.isObject(o) && !o._isComponent){
        newO = {};
        cm.forEach(o, function(item, key){
            newO[key] = cm.clone(item, cloneNode);
        });
        return newO;
    }
    // Dates
    if(cm.isDate(o)){
        newO = new Date();
        newO.setTime(o.getTime());
        return newO;
    }
    // Nodes
    if(cm.isNode(o)){
        if(cloneNode){
            newO = o.cloneNode(true);
        }else{
            newO = o;
        }
        return newO;
    }
    // Other (make links)
    return o;
};

cm.getLength = function(o){
    var i = 0;
    cm.forEach(o, function(){
        i++;
    });
    return i;
};

cm.inArray = function(a, item){
    if(typeof a == 'string'){
        return a === item;
    }else{
        return a.indexOf(item) > -1;
    }
};

cm.arrayRemove = function(a, item){
    a.splice(a.indexOf(item), 1);
    return a;
};

cm.arrayIndex = function(a, item){
    return Array.prototype.indexOf.call(a, item);
};

cm.objectToArray = function(o){
    if(typeof(o) != 'object'){
        return [o];
    }
    var a = [];
    cm.forEach(o, function(item){
        a.push(item);
    });
    return a;
};

cm.arrayToObject = function(a){
    var o = {};
    a.forEach(function(item, i){
        if(typeof item == 'object'){
            o[i] = item;
        }else{
            o[item] = item;
        }
    });
    return o;
};

cm.objectReplace = function(o, vars){
    var newO = cm.clone(o);
    cm.forEach(newO, function(value, key){
        if(cm.isObject(value)){
            newO[key] = cm.objectReplace(value, vars);
        }else if(cm.isString(value)){
            newO[key] = cm.strReplace(value, vars);
        }
    });
    return newO;
};

cm.isEmpty = function(el){
    if(!el){
        return true;
    }else if(typeof el == 'string' || cm.isArray(el)){
        return el.length === 0;
    }else if(cm.isObject(el)){
        return cm.getLength(el) === 0;
    }else if(typeof el == 'number'){
        return el === 0;
    }else{
        return false;
    }
};

cm.objectSelector = function(name, obj, apply){
    obj = typeof obj == 'undefined'? window : obj;
    name = name.split('.');
    var findObj = obj,
        length = name.length;
    cm.forEach(name, function(item, key){
        if(!findObj[item]){
            findObj[item] = {};
        }
        if(apply && key == length -1){
            findObj[item] = apply;
        }
        findObj = findObj[item];
    });
    return findObj;
};

cm.sort = function(o){
    var a = [];
    cm.forEach(o, function(item, key){
        a.push({'key' : key, 'value' : item});
    });
    a.sort(function(a, b){
        return (a['key'] < b['key']) ? -1 : ((a['key'] > b['key']) ? 1 : 0);
    });
    o = {};
    a.forEach(function(item){
        o[item['key']] = item['value'];
    });
    return o;
};

cm.replaceDeep = function(o, from, to){
    var newO = cm.clone(o);
    cm.forEach(newO, function(value, key){
        if(typeof value == 'object'){
            newO[key] = cm.replaceDeep(value, from, to);
        }else{
            newO[key] = value.replace(from, to);
        }
    });
    return newO;
};

/* ******* EVENTS ******* */

cm.log = (function(){
    var results = [],
        log;
    if(cm._debug && Function.prototype.bind && window.console){
        log = Function.prototype.bind.call(console.log, console);
        return function(){
            log.apply(console, arguments);
        };
    }else if(cm._debug && cm._debugAlert){
        return function(){
            cm.forEach(arguments, function(arg){
                results.push(arg);
            });
            alert(results.join(', '));
        };
    }else{
        return function(){};
    }
})();

cm.errorLog = function(o){
    var config = cm.merge({
            'type' : 'error',
            'name' : '',
            'message' : '',
            'langs' : {
                'error' : 'Error!',
                'success' : 'Success!',
                'attention' : 'Attention!',
                'common' : 'Common'
            }
        }, o),
        str = [
            config['langs'][config['type']],
            config['name'],
            config['message']
        ];
    cm.log(str.join(' > '));
};

cm.getEvent = function(e){
    return e || window.event;
};

cm.stopPropagation = function(e){
    return e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
};

cm.preventDefault = function(e){
    return e.preventDefault ? e.preventDefault() : e.returnValue = false;
};

cm.getObjFromEvent = cm.getEventObject = cm.getEventTarget = function(e){
    return  e.target || e.srcElement;
};

cm.getObjToEvent = cm.getRelatedTarget = function(e){
    return e.relatedTarget || e.srcElement;
};

cm.getEventClientPosition = function(e){
    var o = {
        'left' : 0,
        'top' : 0
    };
    if(e){
        try{
            o['left'] = e.clientX;
            o['top'] = e.clientY;
            if(e.touches && e.touches.length){
                o['left'] = e.touches[0].clientX;
                o['top'] = e.touches[0].clientY;
            }else if(e.changedTouches && e.changedTouches.length){
                o['left'] = e.changedTouches[0].clientX;
                o['top'] = e.changedTouches[0].clientY;
            }
        }catch(e){}
    }
    return o;
};

cm.crossEvents = function(key){
    var events = {
        'mousedown' : 'touchstart',
        'mouseup' : 'touchend',
        'mousemove' : 'touchmove'
    };
    return events[key];
};

cm.addEvent = function(el, type, handler, useCapture){
    if(el){
        useCapture = typeof useCapture == 'undefined' ? false : useCapture;
        // Process touch events
        if(cm.isTouch && cm.crossEvents(type)){
            el.addEventListener(cm.crossEvents(type), handler, useCapture);
            return el;
        }
        try{
            el.addEventListener(type, handler, useCapture);
        }catch(e){
            el.attachEvent('on' + type, handler);
        }
    }
    return el;
};

cm.removeEvent = function(el, type, handler, useCapture){
    if(el){
        useCapture = typeof useCapture == 'undefined' ? false : useCapture;
        // Process touch events
        if(cm.isTouch && cm.crossEvents(type)){
            el.removeEventListener(cm.crossEvents(type), handler, useCapture);
            return el;
        }
        try{
            el.removeEventListener(type, handler, useCapture);
        }catch(e){
            el.detachEvent('on' + type, handler);
        }
    }
    return el;
};

cm.triggerEvent = function(el, type, params){
    var event;
    if(cm.isTouch && cm.crossEvents(type)){
        type = cm.crossEvents(type);
    }
    if(document.createEvent){
        event = document.createEvent('Event');
        event.initEvent(type, true, true);
    }else if(document.createEventObject){
        event = document.createEventObject();
        event.eventType = type;
    }
    event.eventName = type;
    if(el.dispatchEvent){
        el.dispatchEvent(event);
    }else if(el.fireEvent){
        el.fireEvent('on' + event.eventType, event);
    }
    return el;
};

cm.customEventsStack = [
    /* {'el' : node, 'type' : 'customEventType', 'handler' : function, 'misc' : {'eventType' : [function]}} */
];

cm.addCustomEvent = function(el, type, handler, useCapture, preventDefault){
    useCapture = typeof(useCapture) == 'undefined' ? true : useCapture;
    preventDefault = typeof(preventDefault) == 'undefined' ? false : preventDefault;

    var events = {
        'tap' : function(){
            var x = 0,
                fault = 4,
                y = 0;
            // Generate events
            return {
                'click' : [
                    function(e){
                        if(preventDefault){
                            e.preventDefault();
                        }
                    }
                ],
                'touchstart' : [
                    function(e){
                        x = e.changedTouches[0].screenX;
                        y = e.changedTouches[0].screenY;
                        if(preventDefault){
                            e.preventDefault();
                        }
                    }
                ],
                'touchend' : [
                    function(e){
                        if(
                            Math.abs(e.changedTouches[0].screenX - x) > fault ||
                            Math.abs(e.changedTouches[0].screenY - y) > fault
                        ){
                            return;
                        }
                        if(preventDefault){
                            e.preventDefault();
                        }
                        handler(e);
                    }
                ]
            };
        }
    };
    // Process custom event
    if(events[type]){
        var miscEvents = events[type]();
        // Push generated events to stack
        cm.customEventsStack.push({
            'el' : el,
            'type' : type,
            'handler' : handler,
            'misc' : miscEvents
        });
        // Bind generated events
        cm.forEach(miscEvents, function(miscFunctions, eventType){
            cm.forEach(miscFunctions, function(miscFunction){
                el.addEventListener(eventType, miscFunction, useCapture);
            });
        });
    }
    return el;
};

cm.removeCustomEvent = function(el, type, handler, useCapture){
    cm.customEventsStack = cm.customEventsStack.filter(function(item){
        if(item['el'] === el && item['type'] == type && item['handler'] === handler){
            cm.forEach(item['misc'], function(miscFunctions, eventType){
                cm.forEach(miscFunctions, function(miscFunction){
                    el.removeEventListener(eventType, miscFunction, useCapture);
                });
            });
            return false;
        }
        return true;
    });
    return el;
};

cm.customEvent = (function(){
    var _stack = {};

    return {
        'add' : function(node, type, handler){
            if(!_stack[type]){
                _stack[type] = [];
            }
            _stack[type].push({
                'node' : node,
                'type' : type,
                'handler' : typeof handler == 'function' ? handler : function(){}
            });
            return node;
        },
        'remove' : function(node, type, handler){
            if(!_stack[type]){
                _stack[type] = [];
            }
            _stack[type] = _stack[type].filter(function(item){
                return item['node'] != node && item['handler'] != handler;
            });
            return node;
        },
        'trigger' : function(node, type, params){
            var stopPropagation = false;
            params = cm.merge({
                'target' : node,
                'type' : 'all',            // child | parent | all
                'self' : true,
                'stopPropagation' : function(){
                    stopPropagation = true;
                }
            }, params);
            if(_stack[type]){
                _stack[type].sort(function(a, b){
                    if(params['type'] == 'parent'){
                        return cm.getNodeOffsetIndex(b['node']) > cm.getNodeOffsetIndex(a['node']);
                    }
                    return cm.getNodeOffsetIndex(a['node']) - cm.getNodeOffsetIndex(b['node']);
                });
                cm.forEach(_stack[type], function(item){
                    if(!stopPropagation){
                        if(params['self'] && node === item['node']){
                            item['handler'](params);
                        }
                        switch(params['type']){
                            case 'child':
                                if(cm.isParent(node, item['node'], false)){
                                    item['handler'](params);
                                }
                                break;
                            case 'parent':
                                if(cm.isParent(item['node'], node, false)){
                                    item['handler'](params);
                                }
                                break;
                            default:
                                if(node !== item['node']){
                                    item['handler'](params);
                                }
                                break;
                        }
                    }
                });
            }
            return node;
        }
    };
})();

cm.onLoad = function(handler, isMessage){
    isMessage = typeof isMessage == 'undefined'? true : isMessage;
    var called = false;
    var execute = function(){
        if(called){
            return;
        }
        called = true;
        if(isMessage){
            cm.errorLog({
                'type' : 'common',
                'name' : 'cm.onLoad',
                'message' : ['Load time', (Date.now() - cm._loadTime), 'ms.'].join(' ')
            });
        }
        handler();
    };
    try{
        cm.addEvent(window, 'load', execute);
    }catch(e){}
};

cm.onReady = function(handler, isMessage){
    isMessage = typeof isMessage == 'undefined'? true : isMessage;
    var called = false;
    var execute = function(){
        if(called){
            return;
        }
        called = true;
        if(isMessage){
            cm.errorLog({
                'type' : 'common',
                'name' : 'cm.onReady',
                'message' : ['Ready time', (Date.now() - cm._loadTime), 'ms.'].join(' ')
            });
        }
        handler();
    };
    cm.addEvent(document, 'DOMContentLoaded', execute);
    try{
        cm.addEvent(window, 'load', execute);
    }catch(e){}
};

cm.addScrollEvent = function(node, callback, useCapture){
    useCapture = typeof useCapture == 'undefined' ? false : useCapture;
    if(cm.isWindow(node)){
        cm.addEvent(node, 'scroll', callback, useCapture);
    }else if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            cm.addEvent(cm.getOwnerWindow(node), 'scroll', callback, useCapture);
        }else{
            cm.addEvent(node, 'scroll', callback, useCapture);
        }
    }
    return node;
};

cm.removeScrollEvent = function(node, callback, useCapture){
    useCapture = typeof useCapture == 'undefined' ? false : useCapture;
    if(cm.isWindow(node)){
        cm.removeEvent(node, 'scroll', callback, useCapture);
    }if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            cm.removeEvent(cm.getOwnerWindow(node), 'scroll', callback, useCapture);
        }else{
            cm.removeEvent(node, 'scroll', callback, useCapture);
        }
    }
    return node;
};

cm.isolateScrolling = function(e){
    var that = this;
    if(e.deltaY > 0 && that.clientHeight + that.scrollTop >= that.scrollHeight){
        that.scrollTop = that.scrollHeight - that.clientHeight;
        cm.stopPropagation(e);
        cm.preventDefault(e);
        return false;
    }else if (e.deltaY < 0 && that.scrollTop <= 0){
        that.scrollTop = 0;
        cm.stopPropagation(e);
        cm.preventDefault(e);
        return false;
    }
    return true;
};

cm.addIsolateScrolling = function(node){
    cm.addEvent(node, 'wheel', cm.isolateScrolling);
    return node;
};

cm.removeIsolateScrolling = function(node){
    cm.removeEvent(node, 'wheel', cm.isolateScrolling);
    return node;
};

cm.isCenterButton = function(e){
    return e.button == ((cm.is('IE') && cm.isVersion() < 9) ? 4 : 1);
};

cm.debounce = function(func, wait, immediate){
    var timeout, result;
    return function(){
        var context = this, args = arguments;
        var later = function(){
            timeout = null;
            if(!immediate){
                result = func.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if(callNow){
            result = func.apply(context, args);
        }
        return result;
    };
};

cm.onScrollStart = function(node, handler){
    var worked = false,
        scrollEnd = function(){
            worked = false;
        },
        helper = cm.debounce(scrollEnd, 300),
        scrollEvent = function(){
            !worked && handler();
            worked = true;
            helper();
        };
    cm.addEvent(node, 'scroll', scrollEvent);
    return {
        'remove' : function(){
            cm.removeEvent(node, 'scroll', scrollEvent);
        }
    };
};

cm.onScrollEnd = function(node, handler){
    var helper = cm.debounce(handler, 300);
    cm.addEvent(node, 'scroll', helper);
    return {
        'remove' : function(){
            cm.removeEvent(node, 'scroll', helper);
        }
    };
};

cm.onImageLoad = function(src, handler, delay){
    delay = delay || 0;
    var nodes = [],
        isMany = cm.isArray(src),
        images = isMany ? src : [src],
        imagesLength = images.length,
        isLoad = 0,
        timeStart = Date.now(),
        timePassed = 0;

    images.forEach(function(item, i){
        nodes[i] = cm.Node('img', {'alt' : ''});
        nodes[i].onload = function(){
            isLoad++;
            if(isLoad == imagesLength){
                timePassed = Date.now() - timeStart;
                delay = timePassed < delay ? delay - timePassed : 0;

                if(delay){
                    setTimeout(function(){
                        handler(isMany ? nodes : nodes[0]);
                    }, delay);
                }else{
                    handler(isMany ? nodes : nodes[0]);
                }
            }
        };
        nodes[i].src = item;
    });

    return isMany ? nodes : nodes[0];
};

/* ******* NODES ******* */

cm.getOwnerWindow = function(node){
    return node.ownerDocument.defaultView;
};

cm.getEl = function(str){
    return document.getElementById(str);
};

cm.getByClass = function(str, node){
    node = node || document;
    if(node.getElementsByClassName){
        return node.getElementsByClassName(str);
    }
    var els = node.getElementsByTagName('*'),
        arr = [];
    for(var i = 0, l = els.length; i < l; i++){
        cm.isClass(els[i], str) && arr.push(els[i]);
    }
    return arr;
};

cm.getByAttr = function(attr, value, element){
    var p = element || document;
    if(p.querySelectorAll){
        return p.querySelectorAll("[" + attr + "='" + value + "']");
    }
    var elements = p.getElementsByTagName('*');
    var stack = [];
    for(var i = 0, ln = elements.length; i < ln; i++){
        if(elements[i].getAttribute(attr) == value){
            stack.push(elements[i]);
        }
    }
    return stack;
};

cm.getByName = function(name, node){
    if(node){
        var arr = [],
            els = node.getElementsByTagName('*');
        for(var i = 0, l = els.length; i < l; i++){
            if(els[i].name == name){
                arr.push(els[i]);
            }
        }
        return arr;
    }else{
        return document.getElementsByName(name);
    }
};

cm.getParentByTagName = function(tagName, node){
    if(!tagName || !node || !node.parentNode){
        return null;
    }
    var el = node.parentNode;
    do{
        if(el.tagName && el.tagName.toLowerCase() == tagName.toLowerCase()){
            return el;
        }
    }while(el = el.parentNode);
    return null;
};

cm.getIFrameDOM = function(o){
    return o.contentDocument || o.document;
};

cm.getDocumentHead = function(){
    return document.getElementsByTagName('head')[0];
};

cm.getDocumentHtml = function(){
    return document.documentElement;
};

cm.getNodeOffsetIndex = function(node){
    if(!cm.isNode(node)){
        return 0;
    }
    var o = node,
        i = 0;
    while(o.parentNode){
        o = o.parentNode;
        i++;
    }
    return i;
};

cm.node = cm.Node = function(){
    var args = arguments,
        el = document.createElement(args[0]),
        i = 0;
    if(cm.isObject(args[1])){
        cm.forEach(args[1], function(value, key){
            if(cm.isObject(value)){
                value = JSON.stringify(value);
            }
            if(key == 'style'){
                el.style.cssText = value;
            }else if(key == 'class'){
                el.className = value;
            }else if(key == 'innerHTML'){
                el.innerHTML = value;
            }else{
                el.setAttribute(key, value);
            }
        });
        i = 2;
    }else{
        i = 1;
    }
    for(var ln = args.length; i < ln; i++){
        if(typeof args[i] != 'undefined'){
            if(typeof args[i] == 'string' || typeof args[i] == 'number'){
                el.appendChild(cm.textNode(args[i]));
            }else{
                el.appendChild(args[i]);
            }
        }
    }
    return el;
};

cm.textNode = function(text){
    return document.createTextNode(text);
};

cm.wrap = function(target, node){
    if(!target || !node){
        return null;
    }
    if(node.parentNode){
        cm.insertBefore(target, node);
    }
    target.appendChild(node);
    return target;
};

cm.inDOM = function(o){
    if(o){
        var el = o.parentNode;
        while(el){
            if(el == document){
                return true;
            }
            el = el.parentNode;
        }
    }
    return false;
};

cm.hasParentNode = function(o){
    if(o){
        return !!o.parentNode;
    }
    return false;
};

cm.isParent = function(p, o, flag){
    if(cm.isNode(o) && o.parentNode){
        if(cm.isWindow(p) && cm.inDOM(o)){
            return true;
        }

        var el = o.parentNode;
        do{
            if(el == p){
                return true;
            }
        }while(el = el.parentNode);
    }
    return (flag) ? p === o : false;
};

cm.isParentByClass = function(parentClass, o){
    if(o && o.parentNode){
        var el = o.parentNode;
        do{
            if(cm.isClass(el, parentClass)){
                return true;
            }
        }while(el = el.parentNode);
    }
    return false;
};

cm.getData = function(node, name){
    if(!node){
        return null;
    }
    if(node.dataset){
        return node.dataset[name];
    }else{
        return node.getAttribute(['data', name].join('-'));
    }
};

cm.getTextValue = cm.getTxtVal = function(o){
    return o.nodeType == 1 && o.firstChild ? o.firstChild.nodeValue : '';
};

cm.getTextNodesStr = function(node){
    var str = '',
        childs;
    if(node){
        if(cm.isArray(node)){
            cm.forEach(node, function(child){
                str += cm.getTextNodesStr(child);
            });
        }else if(cm.isNode(node)){
            childs = node.childNodes;
            cm.forEach(childs, function(child){
                if(child.nodeType == 1){
                    str += cm.getTextNodesStr(child);
                }else{
                    str += child.nodeValue;
                }
            });
        }
    }
    return str;
};

cm.remove = function(node){
    if(node && node.parentNode){
        node.parentNode.removeChild(node);
    }
};

cm.clearNode = function(node){
    while(node.childNodes.length){
        node.removeChild(node.firstChild);
    }
    return node;
};

cm.prevEl = function(node){
    node = node.previousSibling;
    if(node && node.nodeType && node.nodeType != 1){
        node = cm.prevEl(node);
    }
    return node;
};

cm.nextEl = function(node){
    node = node.nextSibling;
    if(node && node.nodeType && node.nodeType != 1){
        node = cm.nextEl(node);
    }
    return node;
};

cm.firstEl = function(node){
    if(!node || !node.firstChild){
        return null;
    }
    node = node.firstChild;
    if(node.nodeType != 1){
        node = cm.nextEl(node);
    }
    return node;
};

cm.insertFirst = function(node, target){
    if(cm.isNode(node) && cm.isNode(target)){
        if(target.firstChild){
            cm.insertBefore(node, target.firstChild);
        }else{
            cm.appendChild(node, target);
        }
    }
    return node;
};

cm.insertLast = cm.appendChild = function(node, target){
    if(cm.isNode(node) && cm.isNode(target)){
        target.appendChild(node);
    }
    return node;
};

cm.insertBefore = function(node, target){
    if(cm.isNode(node) && cm.isNode(target) && target.parentNode){
        target.parentNode.insertBefore(node, target);
    }
    return node;
};

cm.insertAfter = function(node, target){
    if(cm.isNode(node) && cm.isNode(target) && target.parentNode){
        var before = target.nextSibling;
        if(before){
            cm.insertBefore(node, before);
        }else{
            target.parentNode.appendChild(node);
        }
    }
    return node;
};

cm.replaceNode = function(node, target){
    cm.insertBefore(node, target);
    cm.remove(target);
    return node;
};

cm.appendNodes = function(nodes, target){
    if(cm.isEmpty(nodes)){
        return target;
    }
    if(cm.isNode(nodes)){
        target.appendChild(nodes);
    }else{
        while(nodes.length){
            if(cm.isNode(nodes[0])){
                target.appendChild(nodes[0]);
            }else{
                cm.remove(nodes[0]);
            }
        }
    }
    return target;
};

cm.hideSpecialTags = function(){
    var els;
    if(document.querySelectorAll){
        els = document.querySelectorAll('iframe,object,embed');
        cm.forEach(els, function(item){
            item.style.visibility = 'hidden';
        });
    }else{
        els = document.getElementsByTagName('*');
        cm.forEach(els, function(item){
            if(item.tagName && /iframe|object|embed/.test(item.tagName)){
                item.style.visibility = 'hidden';
            }
        });
    }
};

cm.showSpecialTags = function(){
    var els;
    if(document.querySelectorAll){
        els = document.querySelectorAll('iframe,object,embed');
        cm.forEach(els, function(item){
            item.style.visibility = 'visible';
        });
    }else{
        els = document.getElementsByTagName('*');
        cm.forEach(els, function(item){
            if(item.tagName && /iframe|object|embed/.test(item.tagName)){
                item.style.visibility = 'visible';
            }
        });
    }
};

cm.strToHTML = function(str){
    if(!str){
        return null;
    }
    var node = cm.Node('div');
    node.insertAdjacentHTML('beforeend', str);
    return node.childNodes.length == 1? node.firstChild : node.childNodes;
};

cm.getNodes = function(container, marker){
    container = container || document.body;
    marker = marker || 'data-node';
    var nodes = {},
        processedNodes = [];

    var separation = function(node, obj, processedObj){
        var attrData = node.getAttribute(marker),
            separators = attrData? attrData.split('|') : [],
            altProcessedObj;

        cm.forEach(separators, function(separator){
            altProcessedObj = [];
            if(separator.indexOf('.') == -1){
                process(node, separator, obj, altProcessedObj);
            }else{
                pathway(node, separator, altProcessedObj);
            }
            cm.forEach(altProcessedObj, function(node){
                processedObj.push(node);
            });
        });
    };

    var pathway = function(node, attr, processedObj){
        var separators = attr? attr.split('.') : [],
            obj = nodes;
        cm.forEach(separators, function(separator, i){
            if(i === 0 && cm.isEmpty(separator)){
                obj = nodes;
            }else if((i + 1) == separators.length){
                process(node, separator, obj, processedObj);
            }else{
                if(!obj[separator]){
                    obj[separator] = {};
                }
                obj = obj[separator];
            }
        });
    };

    var process = function(node, attr, obj, processedObj){
        var separators = attr? attr.split(':') : [],
            arr;
        if(separators.length == 1){
            obj[separators[0]] = node;
        }else if(separators.length == 2 || separators.length == 3){
            if(separators[1] == '[]'){
                if(!obj[separators[0]]){
                    obj[separators[0]] = [];
                }
                arr = {};
                if(separators[2]){
                    arr[separators[2]] = node;
                }
                find(node, arr, processedObj);
                obj[separators[0]].push(arr);
            }else if(separators[1] == '{}'){
                if(!obj[separators[0]]){
                    obj[separators[0]] = {};
                }
                if(separators[2]){
                    obj[separators[0]][separators[2]] = node;
                }
                find(node, obj[separators[0]], processedObj);
            }
        }
        processedObj.push(node);
    };

    var find = function(container, obj, processedObj){
        var sourceNodes = container.querySelectorAll('[' + marker +']');
        cm.forEach(sourceNodes, function(node){
            if(!cm.inArray(processedObj, node)){
                separation(node, obj, processedObj);
            }
        });
    };

    separation(container, nodes, processedNodes);
    find(container, nodes, processedNodes);

    return nodes;
};

cm.processDataAttributes = function(node, name, vars){
    vars = typeof vars != 'undefined' ? vars : {};
    var marker = ['data-attributes', name].join('-'),
        nodes = node.querySelectorAll('[' + marker + ']'),
        value;

    var process = function(node){
        if(value = node.getAttribute(marker)){
            node.setAttribute(name, cm.strReplace(value, vars));
        }
    };

    process(node);
    cm.forEach(nodes, process);
};

/* ******* FORM ******* */

cm.setFDO = function(o, form){
    cm.forEach(o, function(item, name){
        var el = cm.getByAttr('name', name, form);

        for(var i = 0, ln = el.length; i < ln; i++){
            var type = (el[i].type || '').toLowerCase();
            switch(type){
                case 'radio':
                    if(item == el[i].value){
                        el[i].checked = true;
                    }
                    break;

                case 'checkbox':
                    el[i].checked = !!item;
                    break;

                default:
                    if(el[i].tagName.toLowerCase() == 'select'){
                        cm.setSelect(el[i], item);
                    }else{
                        el[i].value = item;
                    }
                    break;
            }
        }
    });
    return form;
};

cm.getFDO = function(o, chbx){
    var data = {};

    if(!cm.isNode(o)){
        return data;
    }

    var elements = [
        o.getElementsByTagName('input'),
        o.getElementsByTagName('textarea'),
        o.getElementsByTagName('select')
    ];

    var setValue = function(name, value){
        if(/\[.*\]$/.test(name)){
            var indexes = [];
            var re = /\[(.*?)\]/g;
            var results = null;
            while(results = re.exec(name)){
                indexes.push(results[1]);
            }
            name = name.replace(/\[.*\]$/, '');
            data[name] = (function(i, obj){
                var index = indexes[i];
                var next = typeof(indexes[i + 1]) != 'undefined';
                if(index === ''){
                    if(obj && obj instanceof Array){
                        obj.push(next ? arguments.callee(i + 1, obj) : value);
                    }else{
                        obj = [next? arguments.callee(i+1, obj) : value];
                    }
                }else{
                    if(!obj || !(obj instanceof Object)){
                        obj = {};
                    }
                    obj[index] = next ? arguments.callee(i + 1, obj[index]) : value;
                }
                return obj;
            })(0, data[name]);
        }else{
            data[name] = value;
        }
        return 1;
    };

    for(var d = 0, lnd = elements.length; d < lnd; d++){
        for(var i = 0, ln = elements[d].length; i < ln; i++){
            if(!elements[d][i].name.length){
                continue;
            }
            switch(elements[d][i].tagName.toLowerCase()){
                case 'input':
                    switch(elements[d][i].type.toLowerCase()){
                        case 'radio':
                            if(elements[d][i].checked){
                                setValue(elements[d][i].name, elements[d][i].value || 1);
                            }
                            break;

                        case 'checkbox':
                            if(elements[d][i].checked){
                                setValue(elements[d][i].name, elements[d][i].value || 1);
                            }else if(typeof(chbx) != 'undefined' && chbx !== false){
                                setValue(elements[d][i].name, chbx);
                            }
                            break;

                        case 'password':
                        case 'hidden':
                        case 'text':
                        default:
                            setValue(elements[d][i].name, elements[d][i].value);
                            break;
                    }
                    break;

                case 'textarea':
                case 'select':
                    if(elements[d][i].multiple){
                        var opts = elements[d][i].getElementsByTagName('option');
                        for(var j in opts){
                            if(opts[j].selected){
                                setValue(elements[d][i].name, opts[j].value);
                            }
                        }
                    }else{
                        setValue(elements[d][i].name, elements[d][i].value);
                    }
                    break;
            }
        }
    }
    return data;
};

cm.clearForm = function(o){
    var formEls = cm.getByClass('formData', o);
    for(var i = 0, ln = formEls.length; i < ln; i++){
        if(formEls[i].tagName.toLowerCase() == 'input'){
            if(formEls[i].type.toLowerCase() == 'checkbox' || formEls[i].type.toLowerCase() == 'radio'){
                formEls[i].checked = false;
            }else{
                formEls[i].value = '';
            }
        }else if(formEls[i].tagName.toLowerCase() == 'textarea'){
            formEls[i].value = '';
        }else if(formEls[i].tagName.toLowerCase() == 'select'){
            var opts = formEls[i].getElementsByTagName('option');
            for(var d = 0, lnd = opts.length; d < lnd; d++){
                opts[d].selected = false;
            }
        }
    }
    return o;
};

cm.setSelect = function(o, value){
    if(!o || !cm.isNode(o)){
        return null;
    }
    var options = o.getElementsByTagName('option');
    cm.forEach(options, function(node){
        node.selected = (typeof value == 'object'? cm.inArray(node.value, value) : node.value == value);
    });
    return o;
};

cm.toggleRadio = function(name, value, node){
    node = node || document.body;
    var els = cm.getByName(name, node);
    for(var i = 0; i < els.length; i++){
        if(els[i].value == value){
            els[i].checked = true;
        }
    }
};

cm.getValue = function(name, node){
    node = node || document.body;
    var nodes = cm.getByName(name, node),
        value;
    for(var i = 0, l = nodes.length; i < l; i++){
        if(nodes[i].checked){
            value = nodes[i].value;
        }
    }
    return value;
};

/* ******* STRINGS ******* */

cm.toFixed = function(n, x){
    return parseFloat(n).toFixed(x);
};

cm.toNumber = function(str){
    return parseInt(str.replace(/\s+/, ''));
};

cm.is = function(str){
    if(typeof Com.UA == 'undefined'){
        cm.log('Error. UA.js is not exists or not loaded. Method "cm.is()" returns false.');
        return false;
    }
    return Com.UA.is(str);
};

cm.isVersion = function(){
    if(typeof Com.UA == 'undefined'){
        cm.log('Error. UA.js is not exists or not loaded. Method "cm.isVersion()" returns null.');
        return null;
    }
    return Com.UA.isVersion();
};

cm.isMobile = function(){
    if(typeof Com.UA == 'undefined'){
        cm.log('Error. UA.js is not exists or not loaded. Method "cm.isMobile()" returns false.');
        return false;
    }
    return Com.UA.isMobile();
};

cm.decode = (function(){
    var node = document.createElement('textarea');
    return function(str){
        if(str){
            node.innerHTML = str;
            return node.value;
        }else{
            return '';
        }

    };
})();

cm.strWrap = function(str, symbol){
    str = str.toString();
    return ['', str, ''].join(symbol);
};

cm.strReplace = function(str, vars){
    if(vars && cm.isObject(vars)){
        str = str.toString();
        cm.forEach(vars, function(item, key){
            if(cm.isObject(item)){
                item = JSON.stringify(item);
            }
            str = str.replace(new RegExp(key, 'g'), item);
        });
    }
    return str;
};

cm.reduceText = function(str, length, points){
    points = typeof points == 'undefined' ? false : points;
    if(str.length > length){
        return str.slice(0, length) + ((points) ? '...' : '');
    }else{
        return str;
    }
};

cm.removeDanger = function(str){
    return str.replace(/(<|>|&lt;|&gt;)/gim, '');
};

cm.cutHTML = function(str){
    return str.replace(/<[^>]*>/g, '');
};

cm.splitNumber = function(str){
    return str.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
};

cm.rand = function(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

cm.isEven = function(num){
    return /^(.*)(0|2|4|6|8)$/.test(num);
};

cm.addLeadZero = function(x){
    x = parseInt(x, 10);
    return x < 10 ? '0' + x : x;
};

cm.getNumberDeclension = function(number, titles){
    var cases = [2, 0, 1, 1, 1, 2];
    return titles[
        (number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]
    ];
};

cm.toRadians = function(degrees) {
    return degrees * Math.PI / 180;
};

cm.toDegrees = function(radians) {
    return radians * 180 / Math.PI;
};

/* ******* DATE AND TIME ******* */

cm.getCurrentDate = function(format){
    format = format || cm._config.dateTimeFormat;
    return cm.dateFormat(new Date(), format);
};

cm.dateFormat = function(date, format, langs){
    date = !date ? new Date() : new Date(+date);
    format = cm.isString(format) ? format : cm._config.dateTimeFormat;
    langs = cm.merge({
        'months' : [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ],
        'days' : [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ]
    }, langs);

    var formats = function(date){
        return {
            '%Y' : function(){
                return date ? date.getFullYear() : '0000';
            },
            '%m' : function(){
                return date ? cm.addLeadZero(date.getMonth() + 1) : '00';
            },
            '%n' : function(){
                return date ? (date.getMonth() + 1) : '00';
            },
            '%F' : function(){
                return date ? langs['months'][date.getMonth()] : '00';
            },
            '%d' : function(){
                return date ? cm.addLeadZero(date.getDate()) : '00';
            },
            '%j' : function(){
                return date ? date.getDate() : '00';
            },
            '%l' : function(){
                return date ? langs['days'][date.getDay()] : '00';
            },
            '%a' : function(){
                return date ? (date.getHours() >= 12? 'pm' : 'am') : '';
            },
            '%A' : function(){
                return date ? (date.getHours() >= 12? 'PM' : 'AM') : '';
            },
            '%g' : function(){
                return date ? (date.getHours() % 12 || 12) : '00';
            },
            '%G' : function(){
                return date ? date.getHours() : '00';
            },
            '%h' : function(){
                return date ? cm.addLeadZero(date.getHours() % 12 || 12) : '00';
            },
            '%H' : function(){
                return date ? cm.addLeadZero(date.getHours()) : '00';
            },
            '%i' : function(){
                return date ? cm.addLeadZero(date.getMinutes()) : '00';
            },
            '%s' : function(){
                return date ? cm.addLeadZero(date.getSeconds()) : '00';
            }
        };
    };

    cm.forEach(formats(date), function(item, key){
        format = format.replace(key, item);
    });
    return format;
};

cm.parseDate = function(str, format){
    if(!str){
        return null;
    }

    var date = new Date(),
        convertFormats = {
            '%Y' : 'YYYY',
            '%m' : 'mm',
            '%d' : 'dd',
            '%H' : 'HH',
            '%i' : 'ii',
            '%s' : 'ss'
        },
        formats = {
            'YYYY' : function(value){
                if(value != '0000'){
                    date.setFullYear(value);
                }
            },
            'mm' : function(value){
                if(value != '00'){
                    date.setMonth(value - 1);
                }
            },
            'dd' : function(value){
                if(value != '00'){
                    date.setDate(value);
                }
            },
            'HH' : function(value){
                date.setHours(value);
            },
            'ii' : function(value){
                date.setMinutes(value);
            },
            'ss' : function(value){
                date.setSeconds(value);
            }
        },
        fromIndex = 0;

    format = format || cm._config['dateTimeFormat'];

    cm.forEach(convertFormats, function(item, key){
        format = format.replace(key, item);
    });

    cm.forEach(formats, function(item, key){
        fromIndex = format.indexOf(key);
        while(fromIndex != -1){
            item(str.substr(fromIndex, key.length));
            fromIndex = format.indexOf(key, fromIndex + 1);
        }
    });

    return date;
};

cm.getWeek = function(date){
    date = !date ? new Date() : new Date(+date);
    var d = new Date(+date);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

cm.getWeeksInYear = function(year){
    year = !year ? new Date().getFullYear() : year;
    var date = new Date(year, 11, 31),
        week = cm.getWeek(date);
    return week == 1 ? cm.getWeek(date.setDate(24)) : week;
};

/* ******* STYLES ******* */

cm.addClass = function(node, str, useHack){
    if(!cm.isNode(node) || cm.isEmpty(str)){
        return null;
    }
    if(useHack){
        useHack = node.clientHeight;
    }
    if(node.classList){
        cm.forEach(str.split(/\s+/), function(item){
            if(!cm.isEmpty(item)){
                node.classList.add(item);
            }
        });
    }else{
        var add = cm.arrayToObject(typeof(str) == 'object' ? str : str.split(/\s+/)),
            current = cm.arrayToObject(node && node.className ? node.className.split(/\s+/) : []);
        current = cm.merge(current, add);
        node.className = cm.objectToArray(current).join(' ');
    }
    return node;
};

cm.removeClass = function(node, str, useHack){
    if(!cm.isNode(node) || cm.isEmpty(str)){
        return null;
    }
    if(useHack){
        useHack = node.clientHeight;
    }
    if(node.classList){
        cm.forEach(str.split(/\s+/), function(item){
            if(!cm.isEmpty(item)){
                node.classList.remove(item);
            }
        });
    }else{
        var remove = cm.arrayToObject(typeof(str) == 'object' ? str : str.split(/\s+/)),
            current = node && node.className ? node.className.split(/\s+/) : [],
            ready = [];
        current.forEach(function(item){
            if(!remove[item]){
                ready.push(item);
            }
        });
        node.className = ready.join(' ');
    }
    return node;
};

cm.replaceClass = function(node, oldClass, newClass, useHack){
    if(!cm.isNode(node)){
        return null;
    }
    return cm.addClass(cm.removeClass(node, oldClass, useHack), newClass, useHack);
};

cm.hasClass = cm.isClass = function(node, cssClass){
    var hasClass, classes;
    if(!cm.isNode(node)){
        return false;
    }
    if(node.classList){
        return node.classList.contains(cssClass);
    }else{
        classes = node.className ? node.className.split(/\s+/) : [];
        hasClass = false;
        cm.forEach(classes, function(item){
            if(item == cssClass){
                hasClass = true;
            }
        });
        return hasClass;
    }
};

cm.getPageSize = function(key){
    var d = document,
        de = d.documentElement,
        b = d.body,
        o = {
            'height' : Math.max(
                Math.max(b.scrollHeight, de.scrollHeight),
                Math.max(b.offsetHeight, de.offsetHeight),
                Math.max(b.clientHeight, de.clientHeight)
            ),
            'width' : Math.max(
                Math.max(b.scrollWidth, de.scrollWidth),
                Math.max(b.offsetWidth, de.offsetWidth),
                Math.max(b.clientWidth, de.clientWidth)
            ),
            'winHeight' : de.clientHeight,
            'winWidth' : de.clientWidth
        };
    return o[key] || o;
};

cm.getScrollBarSize = (function(){
    var node;
    return function(){
        if(!node){
            node = cm.node('div', {'class' : 'cm__scroll-bar-size-checker'});
            cm.insertFirst(node, document.body);
        }
        return Math.max(node.offsetWidth - node.clientWidth, 0);
    };
})();

cm.setOpacity = function(node, value){
    if(node){
        if(cm.is('ie') && cm.isVersion() < 9){
            node.style.filter = "alpha(opacity=" + (Math.floor(value * 100)) + ")";
        }else{
            node.style.opacity = value;
        }
    }
    return node;
};

cm.getX = function(o){
    var x = 0, p = o;
    try{
        while(p){
            x += p.offsetLeft;
            if(p != o){
                x += cm.getStyle(p, 'borderLeftWidth', true) || 0;
            }
            p = p.offsetParent;
        }
    }catch(e){
        return x;
    }
    return x;
};

cm.getY = function(o){
    var y = 0, p = o;
    try{
        while(p){
            y += p.offsetTop;
            if(p != o){
                y += cm.getStyle(p, 'borderTopWidth', true) || 0;
            }
            p = p.offsetParent;
        }
    }catch(e){
        return y;
    }
    return y;
};

cm.getRealX = function(node){
    if(cm.isNode(node)){
        return node.getBoundingClientRect()['left'];
    }
    return 0;
};

cm.getRealY = function(node){
    if(cm.isNode(node)){
        return node.getBoundingClientRect()['top'];
    }
    return 0;
};

cm.getRect = function(node){
    var docEl, o, rect;
    if(cm.isWindow(node)){
        docEl = node.document.documentElement;
        return {
            'top' : 0,
            'right' : docEl.clientWidth,
            'bottom' : docEl.clientHeight,
            'left' : 0,
            'width' : docEl.clientWidth,
            'height' : docEl.clientHeight
        };
    }
    if(cm.isNode(node)){
        o = node.getBoundingClientRect();
        rect = {
            'top' : Math.round(o['top']),
            'right' : Math.round(o['right']),
            'bottom' : Math.round(o['bottom']),
            'left' : Math.round(o['left'])
        };
        rect['width'] = typeof o['width'] != 'undefined' ? Math.round(o['width']) : o['right'] - o['left'];
        rect['height'] = typeof o['height'] != 'undefined' ? Math.round(o['height']) : o['bottom'] - o['top'];
        return rect;
    }
    return {
        'top' : 0,
        'right' : 0,
        'bottom' : 0,
        'left' : 0,
        'width' : 0,
        'height' : 0
    };
};

cm.getFullRect = function(node, styleObject){
    if(!cm.isNode(node)){
        return null;
    }
    var dimensions = {};
    styleObject = typeof styleObject == 'undefined' ? cm.getStyleObject(node) : styleObject;
    // Get size and position
    dimensions['width'] = node.offsetWidth;
    dimensions['height'] = node.offsetHeight;
    dimensions['x1'] = cm.getRealX(node);
    dimensions['y1'] = cm.getRealY(node);
    dimensions['x2'] = dimensions['x1'] + dimensions['width'];
    dimensions['y2'] = dimensions['y1'] + dimensions['height'];
    // Calculate Padding and Inner Dimensions
    dimensions['padding'] = {
        'top' :     cm.getCSSStyle(styleObject, 'paddingTop', true),
        'right' :   cm.getCSSStyle(styleObject, 'paddingRight', true),
        'bottom' :  cm.getCSSStyle(styleObject, 'paddingBottom', true),
        'left' :    cm.getCSSStyle(styleObject, 'paddingLeft', true)
    };
    dimensions['innerWidth'] = dimensions['width'] - dimensions['padding']['left'] - dimensions['padding']['right'];
    dimensions['innerHeight'] = dimensions['height'] - dimensions['padding']['top'] - dimensions['padding']['bottom'];
    dimensions['innerX1'] = dimensions['x1'] + dimensions['padding']['left'];
    dimensions['innerY1'] = dimensions['y1'] + dimensions['padding']['top'];
    dimensions['innerX2'] = dimensions['innerX1'] + dimensions['innerWidth'];
    dimensions['innerY2'] = dimensions['innerY1'] + dimensions['innerHeight'];
    // Calculate Margin and Absolute Dimensions
    dimensions['margin'] = {
        'top' :     cm.getCSSStyle(styleObject, 'marginTop', true),
        'right' :   cm.getCSSStyle(styleObject, 'marginRight', true),
        'bottom' :  cm.getCSSStyle(styleObject, 'marginBottom', true),
        'left' :    cm.getCSSStyle(styleObject, 'marginLeft', true)
    };
    dimensions['absoluteWidth'] = dimensions['width'] + dimensions['margin']['left'] + dimensions['margin']['right'];
    dimensions['absoluteHeight'] = dimensions['height'] + dimensions['margin']['top'] + dimensions['margin']['bottom'];
    dimensions['absoluteX1'] = dimensions['x1'] - dimensions['margin']['left'];
    dimensions['absoluteY1'] = dimensions['y1'] - dimensions['margin']['top'];
    dimensions['absoluteX2'] = dimensions['x2'] + dimensions['margin']['right'];
    dimensions['absoluteY2'] = dimensions['y2'] + dimensions['margin']['bottom'];
    return dimensions;
};

cm.getNodeIndents = function(node, styleObject){
    if(!cm.isNode(node)){
        return null;
    }
    styleObject = typeof styleObject == 'undefined' ? cm.getStyleObject(node) : styleObject;
    // Get size and position
    var o = {};
    o['margin'] = {
        'top' :     cm.getCSSStyle(styleObject, 'marginTop', true),
        'right' :   cm.getCSSStyle(styleObject, 'marginRight', true),
        'bottom' :  cm.getCSSStyle(styleObject, 'marginBottom', true),
        'left' :    cm.getCSSStyle(styleObject, 'marginLeft', true)
    };
    o['padding'] = {
        'top' :     cm.getCSSStyle(styleObject, 'paddingTop', true),
        'right' :   cm.getCSSStyle(styleObject, 'paddingRight', true),
        'bottom' :  cm.getCSSStyle(styleObject, 'paddingBottom', true),
        'left' :    cm.getCSSStyle(styleObject, 'paddingLeft', true)
    };
    return o;
};

cm.getNodeOffset = function(node, styleObject, o, offsets){
    if(!cm.isNode(node)){
        return null;
    }
    styleObject = typeof styleObject == 'undefined' ? cm.getStyleObject(node) : styleObject;
    o = !o || typeof o == 'undefined' ? cm.getNodeIndents(node, styleObject) : o;
    // Get size and position
    o['offset'] = cm.getRect(node);
    if(offsets){
        o['offset']['top'] += offsets['top'];
        o['offset']['right'] += offsets['left'];
        o['offset']['bottom'] += offsets['top'];
        o['offset']['left'] += offsets['left'];
    }
    o['inner'] = {
        'width' : o['offset']['width'] - o['padding']['left'] - o['padding']['right'],
        'height' : o['offset']['height'] - o['padding']['top'] - o['padding']['bottom'],
        'top' : o['offset']['top'] + o['padding']['top'],
        'right' : o['offset']['right'] - o['padding']['right'],
        'bottom' : o['offset']['bottom'] - o['padding']['bottom'],
        'left': o['offset']['left'] + o['padding']['left']
    };
    o['outer'] = {
        'width' : o['offset']['width'] + o['margin']['left'] + o['margin']['right'],
        'height' : o['offset']['height'] + o['margin']['top'] + o['margin']['bottom'],
        'top' : o['offset']['top'] - o['margin']['top'],
        'right' : o['offset']['right'] + o['margin']['right'],
        'bottom' : o['offset']['bottom'] + o['margin']['bottom'],
        'left': o['offset']['left'] - o['margin']['left']
    };
    return o;
};

cm.getRealWidth = function(node, applyWidth){
    var nodeWidth = 0,
        width = 0;
    nodeWidth = node.offsetWidth;
    node.style.width = 'auto';
    width = node.offsetWidth;
    node.style.width = typeof applyWidth == 'undefined' ? [nodeWidth, 'px'].join('') : applyWidth;
    return width;
};

cm.getRealHeight = function(node, type, applyType){
    var types = ['self', 'current', 'offset', 'offsetRelative'],
        height = {},
        styles,
        styleObject;
    // Check parameters
    if(!node || !cm.isNode(node)){
        return 0;
    }
    styleObject = cm.getStyleObject(node);
    type = typeof type == 'undefined' || !cm.inArray(types, type)? 'offset' : type;
    applyType = typeof applyType == 'undefined' || !cm.inArray(types, applyType) ? false : applyType;
    cm.forEach(types, function(type){
        height[type] = 0;
    });
    // Get inline styles
    styles = {
        'display': node.style.display,
        'height': node.style.height,
        'position' : node.style.position
    };
    node.style.display = 'block';
    height['current'] = node.offsetHeight;
    node.style.height = 'auto';

    height['offset'] = node.offsetHeight;
    height['self'] = height['offset']
        - cm.getStyle(styleObject, 'borderTopWidth', true)
        - cm.getStyle(styleObject, 'borderBottomWidth', true)
        - cm.getStyle(styleObject, 'paddingTop', true)
        - cm.getStyle(styleObject, 'paddingBottom', true);

    node.style.position = 'relative';
    height['offsetRelative'] = node.offsetHeight;
    // Set default styles
    node.style.display = styles['display'];
    node.style.height = styles['height'];
    node.style.position = styles['position'];
    if(applyType){
        node.style.height = [height[applyType], 'px'].join('');
    }
    return height[type];
};

cm.getIndentX = function(node){
    if(!node){
        return null;
    }
    return cm.getStyle(node, 'paddingLeft', true)
        + cm.getStyle(node, 'paddingRight', true)
        + cm.getStyle(node, 'borderLeftWidth', true)
        + cm.getStyle(node, 'borderRightWidth', true);
};

cm.getIndentY = function(node){
    if(!node){
        return null;
    }
    return cm.getStyle(node, 'paddingTop', true)
        + cm.getStyle(node, 'paddingBottom', true)
        + cm.getStyle(node, 'borderTopWidth', true)
        + cm.getStyle(node, 'borderBottomWidth', true);
};

cm.addStyles = function(node, str){
    var arr = str.replace(/\s/g, '').split(';'),
        style;

    arr.forEach(function(item){
        if(item.length > 0){
            style = item.split(':');
            // Add style to element
            style[2] = cm.styleStrToKey(style[0]);
            if(style[0] == 'float'){
                node.style[style[2][0]] = style[1];
                node.style[style[2][1]] = style[1];
            }else{
                node.style[style[2]] = style[1];
            }
        }
    });
    return node;
};

cm.getStyleObject = (function(){
    if(window.getComputedStyle){
        return function(node){
            return document.defaultView.getComputedStyle(node, null);
        };
    }else{
        return function(node){
            return node.currentStyle;
        };
    }
})();

cm.getCSSStyle = cm.getStyle = function(node, name, number){
    var obj, raw, data;
    if(cm.isNode(node)){
        obj = cm.getStyleObject(node);
    }else{
        obj = node;
    }
    if(!obj){
        return 0;
    }
    raw = obj[name];
    // Parse
    if(number){
        data = cm.styleToNumber(raw);
    }else{
        data = raw;
    }
    return data;
};

cm.getCurrentStyle = function(obj, name, dimension){
    switch(name){
        case 'width':
        case 'height':
        case 'top':
        case 'left':
            var Name = name.charAt(0).toUpperCase() + name.substr(1, name.length - 1);
            if(dimension == '%' && !obj.style[name].match(/%/)){
                var el = (/body/i.test(obj.parentNode.tagName) || /top|left/i.test(Name)) ? 'client' : 'offset';
                var pv = (/width|left/i.test(Name)) ? obj.parentNode[el + 'Width'] : obj.parentNode[el + 'Height'];
                return 100 * ( obj['offset' + Name] / pv );
            }else if(dimension == '%' && /%/.test(obj.style[name])){
                var display = obj.style.display;
                obj.style.display = 'none';
                var style = cm.getCSSStyle(obj, name, true) || 0;
                obj.style.display = display;
                return style;
            }else if(dimension == 'px' && /px/.test(obj.style[name])){
                return cm.getCSSStyle(obj, name, true) || 0;
            }
            return obj['offset' + Name];
            break;
        case 'opacity':
            if(cm.is('ie') && cm.isVersion() < 9){
                var reg = /alpha\(opacity=(.*)\)/;
                var res = reg.exec(obj.style.filter || cm.getCSSStyle(obj, 'filter'));
                return (res) ? res[1] / 100 : 1;
            }else{
                var val = parseFloat(obj.style.opacity || cm.getCSSStyle(obj, 'opacity'));
                return (!isNaN(val)) ? val : 1;
            }
            break;
        case 'color':
        case 'backgroundColor':
        case 'borderColor':
            var val = cm.getCSSStyle(obj, name);
            if(val.match(/rgb/i)){
                return val = val.match(/\d+/g), [parseInt(val[0]), parseInt(val[1]), parseInt(val[2])];
            }
            return cm.hex2rgb(val.match(/[\w\d]+/)[0]);
            break;
        case 'docScrollTop':
            return cm.getBodyScrollTop();
            break;
        case 'scrollLeft':
        case 'scrollTop':
            return obj[name];
            break;
        case 'x1':
        case 'x2':
        case 'y1':
        case 'y2':
            return parseInt(obj.getAttribute(name));
            break;
        default:
            return cm.getCSSStyle(obj, name, true) || 0;
    }
};

cm.getStyleDimension = function(value){
    var pure = value.toString().match(/\d+(\D*)/);
    return pure ? pure[1] : '';
};

cm.styleToNumber = function(data){
    data = parseFloat(data.toString().replace(/(pt|px|%)/g, ''));
    data = isNaN(data)? 0 : data;
    return data;
};

cm.hex2rgb = function(hex){
    return(function(v){
        return [v >> 16 & 255, v >> 8 & 255, v & 255];
    })(parseInt(hex, 16));
};

cm.rgb2hex = function(r, g, b){
    var rgb = [r, g, b];
    for(var i in rgb){
        rgb[i] = Number(rgb[i]).toString(16);
        if(rgb[i] == '0'){
            rgb[i] = '00';
        }else if(rgb[i].length == 1){
            rgb[i] = '0' + rgb[i];
        }
    }
    return '#' + rgb.join('');
};

cm.styleStrToKey = function(line){
    line = line.replace(/\s/g, '');
    if(line == 'float'){
        line = ['cssFloat', 'styleFloat'];
    }else if(line.match('-')){
        var st = line.split('-');
        line = st[0] + st[1].replace(st[1].charAt(0), st[1].charAt(0).toUpperCase());
    }
    return line;
};

cm.getScrollTop = function(node){
    if(cm.isWindow(node)){
        return cm.getBodyScrollTop();
    }
    if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            return cm.getBodyScrollTop();
        }
        return node.scrollTop;
    }
    return 0;
};

cm.getScrollLeft = function(node){
    if(cm.isWindow(node)){
        return cm.getBodyScrollLeft();
    }
    if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            return cm.getBodyScrollLeft();
        }
        return node.scrollLeft;
    }
    return 0;
};

cm.setScrollTop = function(node, num){
    if(cm.isWindow(node)){
        cm.setBodyScrollTop(num);
    }else if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            cm.setBodyScrollTop(num);
        }else{
            node.scrollTop = num;
        }
    }
    return node;
};

cm.setScrollLeft = function(node, num){
    if(cm.isWindow(node)){
        cm.setBodyScrollLeft(num);
    }else if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            cm.setBodyScrollLeft(num);
        }else{
            node.scrollLeft = num;
        }
    }
    return node;
};

cm.getScrollHeight = function(node){
    if(cm.isWindow(node)){
        return cm.getBodyScrollHeight();
    }
    if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            return cm.getBodyScrollHeight();
        }
        return node.scrollHeight;
    }
    return 0;
};

cm.setBodyScrollTop = function(num){
    document.documentElement.scrollTop = num;
    document.body.scrollTop = num;
};

cm.setBodyScrollLeft = function(num){
    document.documentElement.scrollLeft = num;
    document.body.scrollLeft = num;
};

cm.getBodyScrollTop = function(){
    return Math.max(
        document.documentElement.scrollTop,
        document.body.scrollTop,
        0
    );
};

cm.getBodyScrollLeft = function(){
    return Math.max(
        document.documentElement.scrollLeft,
        document.body.scrollLeft,
        0
    );
};

cm.getBodyScrollHeight = function(){
    return Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        0
    );
};

cm.getSupportedStyle = function(style){
    var upper = cm.styleStrToKey(style).replace(style.charAt(0), style.charAt(0).toUpperCase()),
        styles = [
            cm.styleStrToKey(style),
            ['Webkit', upper].join(''),
            ['Moz', upper].join(''),
            ['O', upper].join(''),
            ['ms', upper].join('')
        ];
    style = false;
    cm.forEach(styles, function(item){
        if(typeof document.createElement('div').style[item] != 'undefined' && !style){
            style = item;
        }
    });
    return style;
};

cm.getTransitionDurationFromRule = function(rule){
    var openDurationRule = cm.getCSSRule(rule)[0],
        openDurationProperty;
    if(
        openDurationRule
        && (openDurationProperty = openDurationRule.style[cm.getSupportedStyle('transitionDuration')])
    ){
        return cm.parseTransitionDuration(openDurationProperty);
    }
    return 0;
};

cm.getTransitionDurationFromLESS = function(name, defaults){
    var variable = cm.getLESSVariable(name, defaults, false);
    return cm.parseTransitionDuration(variable);
};

cm.parseTransitionDuration = function(value){
    if(!cm.isEmpty(value)){
        value = value.toString();
        if(value.match('ms')){
            return parseFloat(value);
        }else if(value.match('s')){
            return (value) / 1000;
        }else{
            return parseFloat(value);
        }
    }
    return 0;
};

cm.getLESSVariable = function(name, defaults, parse){
    name = name.replace(/^@/, '');
    var variable = window.LESS && window.LESS[name] ? window.LESS[name] : defaults;
    return parse ? cm.styleToNumber(variable) : variable;
};

cm.createStyleSheet = function(){
    var style = document.createElement('style');
    // Fix for WebKit
    style.appendChild(document.createTextNode(''));
    document.head.appendChild(style);
    return style.sheet;
};

cm.getCSSRule = function(ruleName){
    var matchedRules = [],
        cssRules;
    if(document.styleSheets){
        cm.forEach(document.styleSheets, function(styleSheet){
            if(styleSheet.cssRules){
                cssRules = styleSheet.cssRules;
            }else{
                cssRules = styleSheet.rules;
            }
            cm.forEach(cssRules, function(cssRule){
                if(cssRule.selectorText == ruleName){
                    matchedRules.push(cssRule);
                }
            });
        });
    }
    return matchedRules;
};

cm.addCSSRule = function(sheet, selector, rules, index){
    if(document.styleSheets){
        sheet = typeof sheet == 'undefined' || !sheet ? document.styleSheets[0] : sheet;
        rules = typeof rules == 'undefined' || !rules ? '' : rules;
        index = typeof index == 'undefined' || !index ? -1 : index;
        if('insertRule' in sheet){
            sheet.insertRule(selector + '{' + rules + '}', index);
        }else if('addRule' in sheet){
            sheet.addRule(selector, rules, index);
        }
    }
};

cm.removeCSSRule = function(ruleName){
    var cssRules;
    if(document.styleSheets){
        cm.forEach(document.styleSheets, function(styleSheet){
            if(styleSheet.cssRules){
                cssRules = styleSheet.cssRules;
            }else{
                cssRules = styleSheet.rules;
            }
            cm.forEachReverse(cssRules, function(cssRule, i){
                if(cssRule.selectorText == ruleName){
                    if(styleSheet.cssRules){
                        styleSheet.deleteRule(i);
                    }else{
                        styleSheet.removeRule(i);
                    }
                }
            });
        });
    }
};

cm.setCSSTranslate = (function(){
    var transform = cm.getSupportedStyle('transform');
    if(transform){
        return function(node, x, y, z, additional){
            x = typeof x != 'undefined' && x != 'auto' ? x : 0;
            y = typeof y != 'undefined' && y != 'auto' ? y : 0;
            z = typeof z != 'undefined' && z != 'auto' ? z : 0;
            additional = typeof additional != 'undefined' ? additional : '';
            node.style[transform] = ['translate3d(', x, ',', y, ',', z,')', additional].join(' ');
            return node;
        };
    }else{
        return function(node, x, y, z, additional){
            x = typeof x != 'undefined' ? x : 0;
            y = typeof y != 'undefined' ? y : 0;
            node.style.left = x;
            node.style.top = y;
            return node;
        };
    }
})();

cm.setCSSTransitionDuration = (function(){
    var rule = cm.getSupportedStyle('transition-duration');

    return function(node, time){
        if(!rule){
            return node;
        }
        if(cm.isNumber(time)){
            time = [time, 'ms'].join('');
        }
        node.style[rule] = time;
        return node;
    };
})();

cm.inRange = function(a1, b1, a2, b2){
    return a1 >= a2 && a1 <= b2 || b1 >= a2 && b1 <= b2 || a2 >= a1 && a2 <= b1
};

cm.CSSValuesToArray = function(value){
    if(cm.isEmpty(value)){
        return [0, 0, 0, 0];
    }
    value = value.replace(/[^0-9\s]/g , '').split(/\s+/);
    cm.forEach(value, function(item, key){
        value[key] = cm.isEmpty(item) ? 0 : parseFloat(item);
    });
    switch(value.length){
        case 0:
            value = [0, 0, 0, 0];
            break;
        case 1:
            value = [value[0], value[0], value[0], value[0]];
            break;
        case 2:
            value = [value[0], value[1], value[0], value[1]];
            break;
        case 3:
            value = [value[0], value[1], value[2], value[1]];
            break;
    }
    return value;
};

cm.arrayToCSSValues = function(a){
    cm.forEach(a, function(item, key){
        a[key] = cm.isEmpty(item) ? 0 : parseFloat(item);
    });
    return a.reduce(function(prev, next, index, a){
        return prev + 'px ' + next + ((index == a.length - 1) ? 'px' : '');
    });
};

/* ******* VALIDATORS ******* */

cm.keyCodeTable = {
    8  : 'delete',
    9  : 'tab',
    13 : 'enter',
    27 : 'escape',
    32 : 'space',
    35 : 'home',
    36 : 'end',
    37 : 'left',
    38 : 'top',
    39 : 'right',
    40 : 'bottom',
    46 : 'backspace'
};

cm.isKeyCode = function(code, rules){
    var isMath = false;
    if(cm.isString(rules)){
        rules = rules.split(/\s+/);
    }
    cm.forEach(rules, function(rule){
        if(cm.keyCodeTable[code] == rule){
            isMath = true;
        }
    });
    return isMath;
};

cm.allowKeyCode = function(code, rules){
    var codes = [];
    cm.forEach(cm.keyCodeTable, function(item, key){
        if(cm.inArray(rules, item)){
            codes.push(key);
        }
    });
    return cm.inArray(codes, code.toString());
};

cm.disallowKeyCode = function(code, rules){
    var codes = [];
    cm.forEach(cm.keyCodeTable, function(item, key){
        if(!cm.inArray(rules, item)){
            codes.push(key);
        }
    });
    cm.log(codes, code);
    return cm.inArray(codes, code.toString());
};

cm.charCodeIsDigit = function(code){
    var codeString = String.fromCharCode(code);
    return /^\d$/.test(codeString);
};

cm.allowOnlyDigitInputEvent = function(input, callback){
    var value;
    cm.addEvent(input, 'input', function(e){
        value = input.value.replace(/[^\d]/, '');
        if(input.type == 'number'){
            input.value = Math.min(parseFloat(value), parseFloat(input.max));
        }else{
            input.value = cm.reduceText(value, parseInt(input.maxlength));
        }
        callback && callback(e, input.value);
    });
    return input;
};

/* ******* ANIMATION ******* */

var animFrame = (function(){
    return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback, element){
                return window.setTimeout(callback, 1000 / 60);
            };
})();

cm.Animation = function(o){
    var that = this,
        obj = o,
        processes = [],
        animationMethod = {
            'random' : function(progress){
                return (function(min, max){
                    return Math.random() * (max - min) + min;
                })(progress, 1);
            },
            'simple' : function(progress){
                return progress;
            },
            'acceleration' : function(progress){
                return Math.pow(progress, 3);
            },
            'inhibition' : function(progress){
                return 1 - animationMethod.acceleration(1 - progress);
            },
            'smooth' : function(progress){
                return (progress < 0.5) ? animationMethod.acceleration(2 * progress) / 2 : 1 - animationMethod.acceleration(2 * (1 - progress)) / 2;
            }
        };

    var setProperties = function(progress, delta, properties, duration){
        if(progress <= 1){
            properties.forEach(function(item){
                var val = item['old'] + (item['new'] - item['old']) * delta(progress);

                if(item['name'] == 'opacity'){
                    cm.setOpacity(obj, val);
                }else if(/color/i.test(item['name'])){
                    var r = parseInt((item['new'][0] - item['old'][0]) * delta(progress) + item['old'][0]);
                    var g = parseInt((item['new'][1] - item['old'][1]) * delta(progress) + item['old'][1]);
                    var b = parseInt((item['new'][2] - item['old'][2]) * delta(progress) + item['old'][2]);
                    obj.style[properties[i]['name']] = cm.rgb2hex(r, g, b);
                }else if(/scrollLeft|scrollTop/.test(item['name'])){
                    obj[item['name']] = val;
                }else if(/x1|x2|y1|y2/.test(item['name'])){
                    obj.setAttribute(item['name'], Math.round(val));
                }else if(item['name'] == 'docScrollTop'){
                    cm.setBodyScrollTop(val);
                }else{
                    obj.style[item['name']] = Math.round(val) + item['dimension'];
                }
            });
            return false;
        }
        properties.forEach(function(item){
            if(item['name'] == 'opacity'){
                cm.setOpacity(obj, item['new']);
            }else if(/color/i.test(item['name'])){
                obj.style[item['name']] = cm.rgb2hex(item['new'][0], item['new'][1], item['new'][2]);
            }else if(/scrollLeft|scrollTop/.test(item['name'])){
                obj[item['name']] = item['new'];
            }else if(/x1|x2|y1|y2/.test(item['name'])){
                obj.setAttribute(item['name'], item['new']);
            }else if(item['name'] == 'docScrollTop'){
                cm.setBodyScrollTop(item['new']);
            }else{
                obj.style[item['name']] = item['new'] + item['dimension'];
            }
        });
        return true;
    };

    var prepareEndPosition = function(name, value){
        if(name.match(/color/i)){
            if(/rgb/i.test(value)){
                var rgb = value.match(/\d+/g);
                return [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])];
            }else{
                return cm.hex2rgb(value.match(/[\w\d]+/)[0]);
            }
        }
        return value.replace(/[^\-0-9\.]/g, '');
    };

    that.getTarget = function(){
        return obj;
    };

    that.go = function(){
        var params = arguments[0],
            args = cm.merge({
                'style' : '',
                'duration' : '',
                'anim' : 'simple',
                'onStop' : function(){}
            }, params),
            pId = 'animation_process_' + Math.random(),
            delta = animationMethod[args.anim] || animationMethod['simple'],
            properties = [],
            start = Date.now();
        for(var name in args.style){
            var value = args.style[name].toString();
            var dimension = cm.getStyleDimension(value);
            properties.push({
                'name' : name,
                'new' : prepareEndPosition(name, value),
                'dimension' : dimension,
                'old' : cm.getCurrentStyle(obj, name, dimension)
            });
        }
        for(var i in processes){
            processes[i] = false;
        }
        processes[pId] = true;
        // Run process
        (function process(){
            var processId = pId;
            if(!processes[processId]){
                delete processes[processId];
                return false;
            }
            var now = Date.now() - start;
            var progress = now / args.duration;
            if(setProperties(progress, delta, properties, args['duration'])){
                delete processes[processId];
                args.onStop && args.onStop();
            }else{
                animFrame(process);
            }
        })();
        return that;
    };

    that.stop = function(){
        for(var i in processes){
            processes[i] = false;
        }
        return that;
    };
};

cm.transition = function(node, params){
    var rule = cm.getSupportedStyle('transition'),
        transitions = [],
        dimension;

    var init = function(){
        // Merge params
        params = cm.merge({
            'properties' : {},
            'duration' : 0,
            'easing' : 'ease-in-out',
            'delayIn' : 0,
            'delayOut' : 0,
            'clear' : false,
            'onStop' : function(){}
        }, params);
        // Prepare styles
        cm.forEach(params['properties'], function(value, key){
            key = cm.styleStrToKey(key);
            transitions.push([key, params['duration'] + 'ms', params['easing']].join(' '));
        });
        transitions = transitions.join(', ');
        start();
    };

    var start = function(){
        // Prepare
        cm.forEach(params['properties'], function(value, key){
            key = cm.styleStrToKey(key);
            dimension = cm.getStyleDimension(value);
            node.style[key] = cm.getCurrentStyle(node, key, dimension) + dimension;
        });
        // Set
        setTimeout(function(){
            node.style[rule] = transitions;
            // Set new styles
            cm.forEach(params['properties'], function(value, key){
                key = cm.styleStrToKey(key);
                node.style[key] = value;
            });
        }, params['delayIn']);
        // End
        setTimeout(function(){
            node.style[rule]  = '';
            if(params['clear']){
                cm.forEach(params['properties'], function(value, key){
                    key = cm.styleStrToKey(key);
                    node.style[key] = '';
                });
            }
            params['onStop'](node);
        }, params['duration'] + params['delayIn'] + params['delayOut']);
    };

    init();
};

/* ******* COOKIE & LOCAL STORAGE ******* */

cm.storageSet = function(key, value, cookie){
    cookie = cookie !== false;
    if(cm.isLocalStorage){
        try{
            window.localStorage.setItem(key, value);
        }catch(e){
        }
    }else if(cookie){
        cm.cookieSet(key, value);
    }
};

cm.storageGet = function(key, cookie){
    cookie = cookie !== false;
    if(cm.isLocalStorage){
        return window.localStorage.getItem(key);
    }else if(cookie){
        return cm.cookieGet(key);
    }
    return null;
};

cm.storageRemove = function(key, cookie){
    cookie = cookie !== false;
    if(cm.isLocalStorage){
        localStorage.removeItem(key);
    }else if(cookie){
        cm.cookieRemove(key);
    }
};

cm.cookieSet = function(name, value, expires){
    document.cookie = encodeURI(name) + "=" + encodeURI(value) + ';' + (expires ? cm.cookieDate(expires) : '');
};

cm.cookieGet = function(name){
    var cookie = " " + document.cookie;
    var search = " " + encodeURI(name) + "=";
    var setStr = null;
    var offset = 0;
    var end = 0;
    if(cookie.length > 0){
        offset = cookie.indexOf(search);
        if(offset != -1){
            offset += search.length;
            end = cookie.indexOf(";", offset);
            if(end == -1){
                end = cookie.length;
            }
            setStr = encodeURI(cookie.substring(offset, end));
        }
    }
    return setStr;
};

cm.cookieRemove = function(name){
    var date = new Date();
    date.setDate(date.getDate() - 1);
    document.cookie = encodeURI(name) + '=;expires=' + date;
};

cm.cookieDate = function(num){
    return 'expires=' + (new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * num)).toUTCString() + ';';
};

/* ******* AJAX ******* */

cm.ajax = function(o){
    var config = cm.merge({
            'debug' : true,
            'type' : 'json',                                         // text | xml | json | jsonp
            'method' : 'post',                                       // post | get
            'params' : '',
            'url' : '',
            'formData'  : false,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'X-Requested-With' : 'XMLHttpRequest'
            },
            'withCredentials' : false,
            'onStart' : function(){},
            'onEnd' : function(){},
            'onSuccess' : function(){},
            'onError' : function(){},
            'onAbort' : function(){},
            'handler' : false
        }, o),
        responseType,
        response,
        callbackName,
        callbackSuccessName,
        callbackErrorName,
        scriptNode,
        returnObject;

    var init = function(){
        validate();
        if(config['type'] == 'jsonp'){
            returnObject = {
                'abort' : abortJSONP
            };
            sendJSONP();
        }else{
            returnObject = config['httpRequestObject'];
            send();
        }
    };

    var validate = function(){
        config['httpRequestObject'] = cm.createXmlHttpRequestObject();
        config['type'] = config['type'].toLowerCase();
        responseType =  /text|json/.test(config['type']) ? 'responseText' : 'responseXML';
        config['method'] = config['method'].toLowerCase();
        // Convert params object to URI string
        if(config['params'] instanceof FormData) {
            delete config['headers']['Content-Type'];
        }else if(config['formData']){
            config['params'] = cm.obj2FormData(config['params']);
            delete config['headers']['Content-Type'];
        }else if(cm.isObject(config['params'])){
            config['params'] = cm.objectReplace(config['params'], {
                '%baseurl%' : cm._baseUrl
            });
            config['params'] = cm.obj2URI(config['params']);
        }
        // Build request link
        config['url'] = cm.strReplace(config['url'], {
            '%baseurl%' : cm._baseUrl
        });
        if(config['method'] != 'post'){
            if(!cm.isEmpty(config['params'])){
                config['url'] = [config['url'], config['params']].join('?');
            }
        }
    };

    var send = function(){
        config['httpRequestObject'].open(config['method'], config['url'], true);
        // Set Headers
        if('withCredentials' in config['httpRequestObject']){
            config['httpRequestObject'].withCredentials = config['withCredentials'];
        }
        cm.forEach(config['headers'], function(value, name){
            config['httpRequestObject'].setRequestHeader(name, value);
        });
        // Add response events
        cm.addEvent(config['httpRequestObject'], 'load', loadHandler);
        cm.addEvent(config['httpRequestObject'], 'error', errorHandler);
        cm.addEvent(config['httpRequestObject'], 'abort', abortHandler);
        // Send
        config['onStart']();
        if(config['method'] == 'post'){
            config['httpRequestObject'].send(config['params']);
        }else{
            config['httpRequestObject'].send(null);
        }
    };

    var loadHandler = function(e){
        if(config['httpRequestObject'].readyState == 4){
            response = config['httpRequestObject'][responseType];
            if(config['type'] == 'json'){
                response = cm.parseJSON(response);
            }
            if(config['httpRequestObject'].status == 200){
                config['onSuccess'](response, e);
            }else{
                config['onError'](e);
            }
            deprecatedHandler(response);
            config['onEnd'](e);
        }
    };

    var successHandler = function(){
        config['onSuccess'].apply(config['onSuccess'], arguments);
        deprecatedHandler.apply(deprecatedHandler, arguments);
        config['onEnd'].apply(config['onEnd'], arguments);
    };

    var errorHandler = function(){
        config['onError'].apply(config['onError'], arguments);
        deprecatedHandler.apply(deprecatedHandler, arguments);
        config['onEnd'].apply(config['onEnd'], arguments);
    };

    var abortHandler = function(){
        config['onAbort'].apply(config['onAbort'], arguments);
        deprecatedHandler.apply(deprecatedHandler, arguments);
        config['onEnd'].apply(config['onEnd'], arguments);
    };

    var deprecatedHandler = function(){
        if(typeof config['handler'] == 'function'){
            cm.errorLog({'type' : 'attention', 'name' : 'cm.ajax', 'message' : 'Parameter "handler" is deprecated. Use "onSuccess", "onError" or "onAbort" callbacks instead.'});
            config['handler'].apply(config['handler'], arguments);
        }
    };

    var sendJSONP = function(){
        // Generate unique callback name
        callbackName = ['cmAjaxJSONP', Date.now()].join('__');
        callbackSuccessName = [callbackName, 'Success'].join('__');
        callbackErrorName = [callbackName, 'Error'].join('__');
        // Generate events
        window[callbackSuccessName] = function(){
            successHandler.apply(successHandler, arguments);
            removeJSONP();
        };
        window[callbackErrorName] = function(){
            errorHandler.apply(errorHandler, arguments);
            removeJSONP();
        };
        // Prepare url and attach events
        scriptNode = cm.Node('script', {'type' : 'application/javascript'});
        if(/%callback%|%25callback%25/.test(config['url'])){
            config['url'] = cm.strReplace(config['url'], {
                '%callback%' : callbackSuccessName,
                '%25callback%25' : callbackSuccessName
            });
        }else{
            cm.addEvent(scriptNode, 'load', window[callbackSuccessName]);
        }
        cm.addEvent(scriptNode, 'error', window[callbackErrorName]);
        // Embed
        config['onStart']();
        scriptNode.setAttribute('src', config['url']);
        document.getElementsByTagName('head')[0].appendChild(scriptNode);
    };

    var removeJSONP = function(){
        cm.removeEvent(scriptNode, 'load', window[callbackSuccessName]);
        cm.removeEvent(scriptNode, 'error', window[callbackErrorName]);
        cm.remove(scriptNode);
        delete window[callbackSuccessName];
        delete window[callbackErrorName];
    };

    var abortJSONP = function(){
        window[callbackSuccessName] = function(){
            abortHandler();
            removeJSONP();
        };
    };

    init();
    return returnObject;
};

cm.parseJSON = function(str){
    var o;
    if(str){
        try{
            o = JSON.parse(str);
        }catch(e){
            cm.errorLog({
                'type' : 'common',
                'name' : 'cm.parseJSON',
                'message' : ['Error while parsing JSON. Input string:', str].join(' ')
            });
        }
    }
    return o;
};

cm.obj2URI = function(obj, prefix){
    var str = [];
    cm.forEach(obj, function(item, key){
        var k = prefix ? prefix + "[" + key + "]" : key,
            v = item;
        str.push(typeof v == "object" ? cm.obj2URI(v, k) : k + "=" + encodeURIComponent(v));
    });
    return str.join("&");
};

cm.obj2FormData = function(o){
    var fd = new FormData();
    cm.forEach(o, function(value, key){
        fd.append(key, value);
    });
    return fd;
};

cm.formData2Obj = function(fd){
    var o = {},
        data;
    if(fd.entries && (data = fd.entries())){
        cm.forEach(data, function(item){
            o[item[0]] = item[1];
        });
    }
    return o;
};

cm.formData2URI = function(fd){
    return cm.obj2URI(cm.formData2Obj(fd));
};

cm.xml2arr = function(o){
    o = o.nodeType == 9 ? cm.firstEl(o) : o;
    if(o.nodeType == 3 || o.nodeType == 4){
        //Need to be change
        var n = cm.nextEl(o);
        if(!n){
            return o.nodeValue;
        }
        o = n;
    }
    if(o.nodeType == 1){
        var res = {};
        res[o.tagName] = {};
        var els = o.childNodes;
        for(var i = 0, ln = els.length; i < ln; i++){
            var childs = arguments.callee(els[i]);
            if(typeof(childs) == 'object'){
                for(var key in childs){
                    if(!res[o.tagName][key]){
                        res[o.tagName][key] = childs[key];
                    }else if(res[o.tagName][key]){
                        if(!res[o.tagName][key].push){
                            res[o.tagName][key] = [res[o.tagName][key], childs[key]];
                        }else{
                            res[o.tagName][key].push(childs[key]);
                        }
                    }
                }
            }else{
                res[o.tagName] = childs;
            }
        }
        res[o.tagName] = ln ? res[o.tagName] : '';
        return res;
    }
    return null;
};

cm.responseInArray = function(xmldoc){
    var response = xmldoc.getElementsByTagName('response')[0];
    var data = [];
    var els = response.childNodes;
    for(var i = 0; els.length > i; i++){
        if(els[i].nodeType != 1){
            continue;
        }
        var kids = els[i].childNodes;
        var tmp = [];
        for(var k = 0; kids.length > k; k++){
            if(kids[k].nodeType == 1){
                tmp[kids[k].tagName] = kids[k].firstChild ? kids[k].firstChild.nodeValue : '';
            }
        }
        data.push(tmp);
    }
    return data;
};

cm.createXmlHttpRequestObject = function(){
    var xmlHttp;
    try{
        xmlHttp = new XMLHttpRequest();
    }catch(e){
        var XmlHttpVersions = [
            "MSXML2.XMLHTTP.6.0",
            "MSXML2.XMLHTTP.5.0",
            "MSXML2.XMLHTTP.4.0",
            "MSXML2.XMLHTTP.3.0",
            "MSXML2.XMLHTTP",
            "Microsoft.XMLHTTP"
        ];
        cm.forEach(XmlHttpVersions, function(item){
            try{
                xmlHttp = new ActiveXObject(item);
            }catch(e){}
        });
    }
    if(!xmlHttp){
        return null;
    }
    return xmlHttp;
};

/* ******* HASH ******* */

cm.loadHashData = function(){
    var hash = document.location.hash.replace('#', '').split('&');
    window.userRequest = {};
    hash.forEach(function(item){
        window.userRequest[item.split('=')[0]] = item.split('=')[1];
    });
    return true;
};

cm.reloadHashData = function(){
    var hash = '#';
    cm.forEach(window.userRequest, function(item, key){
        hash += key + '=' + item;
    });
    document.location.hash = hash;
    return true;
};

/* ******* GRAPHICS ******* */

cm.createSvg = function(){
    var node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    node.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    node.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    node.setAttribute('version', '1.1');
    return node;
};

/* ******* CLASS FABRIC ******* */

cm.defineStack = {};

cm.defineHelper = function(name, data, handler){
    var that = this;
    // Process config
    data = cm.merge({
        'modules' : [],
        'require' : [],
        'params' : {},
        'events' : [],
        'extend' : false
    }, data);
    // Create class extend object
    that.build = {
        'constructor' : handler,
        '_raw' : cm.clone(data),
        '_update' : {},
        '_name' : {
            'full' : name,
            'short' : name.replace('.', ''),
            'split' : name.split('.')
        },
        '_modules' : {},
        'params' : data['params']
    };
    // Inheritance
    if(data['extend']){
        cm.getConstructor(data['extend'], function(classConstructor){
            handler.prototype = Object.create(classConstructor.prototype);
            that.build._inherit = classConstructor;
            that.build._raw['modules'] = cm.merge(that.build._inherit.prototype._raw['modules'], that.build._raw['modules']);
        });
    }
    // Extend class by predefine modules
    cm.forEach(Mod, function(module, name){
        if(module._config && module._config['predefine']){
            Mod['Extend']._extend.call(that, name, module);
        }
    });
    // Extend class by class specific modules
    cm.forEach(that.build._raw['modules'], function(module){
        if(Mod[module]){
            Mod['Extend']._extend.call(that, module, Mod[module]);
        }
    });
    // Prototype class methods
    cm.forEach(that.build, function(value, key){
        handler.prototype[key] = value;
    });
    // Extend Window object
    cm.objectSelector(that.build._name['full'], window, handler);
    // Add to stack
    cm.defineStack[name] = handler;
};

cm.define = (function(){
    var definer = Function.prototype.call.bind(cm.defineHelper, arguments);
    return function(){
        definer.apply(cm.defineHelper, arguments);
    };
})();

cm.getConstructor = function(className, callback){
    var classConstructor;
    callback = typeof callback != 'undefined' ? callback : function(){};
    if(!className || className == '*'){
        cm.forEach(cm.defineStack, function(classConstructor){
            callback(classConstructor, className, classConstructor.prototype);
        });
        return cm.defineStack;
    }else{
        classConstructor = cm.defineStack[className];
        if(!classConstructor){
            if(cm._debug){
                cm.errorLog({
                    'type' : 'attention',
                    'name' : 'cm.getConstructor',
                    'message' : ['Class', cm.strWrap(className, '"'), 'does not exists or define.'].join(' ')
                });
            }
            return false;
        }else{
            callback(classConstructor, className, classConstructor.prototype);
            return classConstructor;
        }
    }
};

cm.find = function(className, name, parentNode, callback){
    if(!className || className == '*'){
        var classes = [];
        cm.forEach(cm.defineStack, function(classConstructor){
            if(classConstructor.prototype.findInStack){
                classes = cm.extend(classes, classConstructor.prototype.findInStack(name, parentNode, callback));
            }
        });
        return classes;
    }else{
        var classConstructor = cm.defineStack[className];
        if(!classConstructor){
            cm.errorLog({
                'type' : 'error',
                'name' : 'cm.find',
                'message' : ['Class', cm.strWrap(className, '"'), 'does not exist.'].join(' ')
            });
        }else if(!classConstructor.prototype.findInStack){
            cm.errorLog({
                'type' : 'error',
                'name' : 'cm.find',
                'message' : ['Class', cm.strWrap(className, '"'), 'does not support Module Stack.'].join(' ')
            });
        }else{
            return classConstructor.prototype.findInStack(name, parentNode, callback);
        }
    }
    return null;
};

cm.Finder = function(className, name, parentNode, callback, params){
    var that = this,
        isEventBind = false;

    var init = function(){
        var finder;
        // Merge params
        parentNode = parentNode || document.body;
        callback = typeof callback == 'function' ? callback : function(){};
        params = cm.merge({
            'event' : 'onRender',
            'multiple' : false
        }, params);
        // Search in constructed classes
        finder = cm.find(className, name, parentNode, callback);
        // Bind event when no one constructed class found
        if(!finder || !finder.length || params['multiple']){
            isEventBind = true;
            cm.getConstructor(className, function(classConstructor){
                classConstructor.prototype.addEvent(params['event'], watcher);
            });
        }
    };

    var watcher = function(classObject){
        classObject.removeEvent(params['event'], watcher);
        var isSame = classObject.isAppropriateToStack(name, parentNode, callback);
        if(isSame && !params['multiple'] && isEventBind){
            that.remove();
        }
    };

    that.remove = function(){
        cm.getConstructor(className, function(classConstructor){
            classConstructor.prototype.removeEvent(params['event'], watcher);
        });
        return that;
    };

    init();
};