
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

    Custom Events / Hooks:
        ajax.beforePrepare
        ajax.afterPrepare
        ajax.error
        scrollSizeChange
        pageSizeChange

 ******* */

var cm = {
        '_version': '@@VERSION',
        '_lang': 'en',
        '_locale': 'en-IN',
        '_loadTime': Date.now(),
        '_isDocumentReady': false,
        '_isDocumentLoad': false,
        '_debug': true,
        '_debugAlert': false,
        '_deviceType': 'desktop',
        '_deviceOrientation': 'landscape',
        '_adaptive': false,
        '_baseUrl': [window.location.protocol, window.location.hostname].join('//'),
        '_port': window.location.port,
        '_pathUrl': '',
        '_assetsUrl': [window.location.protocol, window.location.hostname].join('//'),
        '_scrollSize': 0,
        '_pageSize': {},
        '_clientPosition': {'left': 0, 'top': 0},
        '_config': {
            'redrawOnLoad': true,
            'motionAsymmetric': 'cubic-bezier(.5,0,.15,1)',
            'motionSmooth': 'ease-in-out',
            'animDuration': 250,
            'animDurationShort': 150,
            'animDurationLong': 500,
            'loadDelay': 500,
            'lazyDelay': 1000,
            'hideDelay': 250,
            'hideDelayShort': 150,
            'hideDelayLong': 500,
            'autoHideDelay': 2000,
            'requestDelay': 300,
            'adaptiveFrom': 768,
            'screenTablet': 1024,
            'screenTabletPortrait': 768,
            'screenMobile': 640,
            'screenMobilePortrait': 480,
            'screenXSmall': 375,
            'dateFormat': '%Y-%m-%d',
            'dateTimeFormat': '%Y-%m-%d %H:%i:%s',
            'dateFormatCase': 'nominative',
            'timeFormat': '%H:%i:%s',
            'displayDateFormat': '%F %j, %Y',
            'displayDateTimeFormat': '%F %j, %Y, %H:%i',
            'displayDateFormatCase': 'nominative',
            'tooltipIndent': 4,
            'tooltipTop': 'targetHeight + 4',
            'tooltipDown': 'targetHeight + 4',
            'tooltipUp': '- (selfHeight + 4)',
            'tooltipLeft': 'targetWidth + 4',
            'tooltipRight': '- (selfWidth + 4)',
            'fileExtensions': {
                'image': 'jpg|jpeg|png|gif|bmp|tga|svg|tiff|webp',
                'video': 'avi|ogg|mpeg|mp4|m4a|m4b|mov|wmv|webm',
            },
            'fileTypes': {
                'image': /image\/.*/,
                'video': /video\/(mp4|webm|ogg|avi|mp4|mov|mpg|x-ms-wmv|quicktime)/,
                'embed': /application\/pdf/,
            }
        },
        '_variables': {
            '%baseUrl%': 'cm._baseUrl',
            '%port%': 'cm._port',
            '%assetsUrl%': 'cm._assetsUrl',
            '%pathUrl%': 'cm._pathUrl',
            '%version%': 'cm._version',
            '%lang%': 'cm._lang',
            '%locale%': 'cm._locale',
        },
        '_strings': {
            'common': {
                'server_error': 'An unexpected error has occurred. Please try again later.'
            },
            'months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            'days': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            'daysShort': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            'daysAbbr': ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        }
    },
    Mod = {},
    Part = {},
    Com = {
        'Elements': {}
    };

/* ******* CHECK SUPPORT ******* */

cm.isFileReader = (function(){return 'FileReader' in window;})();
cm.isHistoryAPI = !!(window.history && history.pushState);
cm.isClipboardItem = (function(){return 'ClipboardItem' in window;})();
cm.isLocalStorage = (function(){try{return 'localStorage' in window && window.localStorage !== null;}catch(e){return false;}})();
cm.isSessionStorage = (function(){try{return 'sessionStorage' in window && window.sessionStorage !== null;}catch(e){return false;}})();
cm.isCanvas = !!document.createElement("canvas").getContext;
cm.hasBeacon = !!(navigator.sendBeacon);
cm.hasPointerEvent = !!(window.PointerEvent);

cm.isMotionReduced = () => (window.matchMedia('(prefers-reduced-motion: reduce)') === true || window.matchMedia('(prefers-reduced-motion: reduce)').matches === true);

/* ******* COMMON ******* */

cm._getVariables = function(){
    var data = {};
    cm.forEach(cm._variables, function(value, name){
        data[name] = cm.reducePath(value, window);
    });
    return data;
};

/* ******* BREAKPOINTS ******* */

cm.getBreakpoints = function() {
    return {
        desktop: cm._config.screenTablet,
        desktopUp: cm._config.screenTablet,
        desktopDown: (cm._config.screenTablet - 1),
        tablet: cm._config.screenTabletPortrait,
        tabletUp: (cm._config.screenTabletPortrait + 1),
        tabletDown: cm._config.screenTabletPortrait,
        mobile: cm._config.screenMobile,
        mobileUp: (cm._config.screenMobile + 1),
        mobileDown: cm._config.screenMobile,
        small: cm._config.screenMobilePortrait,
        smallUp: (cm._config.screenMobilePortrait + 1),
        smallDown: cm._config.screenMobilePortrait,
        xSmall: cm._config.screenXSmall,
        xSmallUp: (cm._config.screenXSmall + 1),
        xSmallDown: cm._config.screenXSmall,
    };
};

cm.getBreakpoint = function() {
    var pageSize = cm._pageSize || cm.getPageSize();
    var breakpoints = [];
    cm.forEach(cm._breakpoints, function(breakpoint, name) {
        if (name.indexOf('Up') > -1 && pageSize.winWidth >= breakpoint) {
            breakpoints.push(name);
        }
        if (name.indexOf('Down') > -1 && pageSize.winWidth <= breakpoint) {
            breakpoints.push(name);
        }
    });
    return breakpoints;
};

cm.isBreakpoint = function(value) {
    return cm.isArray(value)
        ? value.some(breakpoint => cm.inArray(cm._breakpoint, breakpoint))
        : cm.inArray(cm._breakpoint, value);
};

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
    return Object.prototype.toString.call(o) === '[object Number]' && !isNaN(o);
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
    return Object.prototype.toString.call(o) === '[object Function]' || Object.prototype.toString.call(o) === '[object AsyncFunction]';
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
        return !!(node && node.nodeType && node.nodeType !== 9);
    }catch(e){}
    return false;
};

cm.isTextNode = function(node){
    try{
        return !!(node && node.nodeType && node.nodeType === 3);
    }catch(e){}
    return false;
};

cm.isElementNode = function(node){
    try{
        return !!(node && node.nodeType && node.nodeType === 1);
    }catch(e){}
    return false;
};

cm.isTagName = function(node, tag){
    return cm.isElementNode(node) && node.tagName.toLowerCase() === tag.toLowerCase();
};

cm.isPlainObject = function(obj) {
    if (typeof obj === 'object' && obj !== null) {
        if (typeof Object.getPrototypeOf === 'function') {
            var proto = Object.getPrototypeOf(obj);
            return proto === Object.prototype || proto === null;
        }
        return Object.prototype.toString.call(obj) === '[object Object]';
    }
    return false;
};

cm.forEach = function(o, callback){
    if(!o || !(callback && typeof callback === 'function')){
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
            try{
                if(item === undefined){
                    o[key] = item;
                }else if(item._isComponent){
                    o[key] = item;
                }else if(cm.isObject(item)){
                    if(cm.isObject(o[key])){
                        o[key] = cm.merge(o[key], item);
                    }else{
                        o[key] = cm.clone(item);
                    }
                }else if(cm.isArray(item)){
                    o[key] = cm.clone(item);
                }else{
                    o[key] = item;
                }
            }catch(e){
                o[key] = item;
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

cm.extend = function(o1, o2, deep, clone){
    if(!o1){
        return o2;
    }
    if(!o2){
        return o1;
    }
    deep = cm.isUndefined(deep) ? false : deep;
    clone = cm.isUndefined(clone) ? true : clone;
    if(cm.isArray(o1)){
        return o1.concat(o2);
    }
    if(cm.isObject(o1)){
        var o = clone ? cm.clone(o1) : o1;
        cm.forEach(o2, function(item, key){
            if(deep){
                o[key] = cm.extend(o[key], item, deep, clone);
            }else{
                o[key] = item;
            }
        });
        return o;
    }
    return o2;
};

cm.join = function(arr, separator) {
    return arr
        .filter(function(item) {
            return !cm.isEmpty(item);
        })
        .join(separator);
};

cm.joinIntl = function(data, type = 'conjunction') {
    if (!cm.isArray(data)) {
        return data;
    }
    const formatter = new Intl.ListFormat(cm._locale, {
        style: 'long',
        type: type,
    });
    return formatter.format(data);
};

cm.extract = function(o1, o2){
    if(!o1){
        return o2;
    }
    if(!o2){
        return o1;
    }
    var o;
    if(cm.isArray(o1)){
        o = o1.filter(function(value){
            return !cm.inArray(o2, value);
        });
    }
    return o;
};

cm.clone = function(o, cloneNode, deep){
    var newO;
    if(!o){
        return o;
    }
    cloneNode = cm.isUndefined(cloneNode) ? false : cloneNode;
    deep = cm.isUndefined(deep) ? true : deep;
    // Arrays
    if(cm.isType(o, 'Arguments')){
        return [].slice.call(o);
    }
    if(cm.isType(o, /Array|StyleSheetList|CSSRuleList|HTMLCollection|NodeList|DOMTokenList|FileList/)){
        if(deep){
            newO = [];
            cm.forEach(o, function(item){
                newO.push(cm.clone(item, cloneNode));
            });
            return newO;
        }else{
            return [].slice.call(o);
        }
    }
    // Objects
    if(cm.isObject(o) && !o._isComponent){
        newO = {};
        cm.forEach(o, function(item, key){
            if(deep){
                newO[key] = cm.clone(item, cloneNode);
            }else{
                newO[key] = item;
            }
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
    // Array
    if(cm.isArray(o)){
        return o.length;
    }
    // Object
    var keys = Object.keys(o);
    return keys.length;
};

cm.getCount = function(o){
    var i = 0;
    cm.forEach(o, function(item){
        if(!cm.isUndefined(item)){
            i++;
        }
    });
    return i;
};

cm.arrayIndex = function(a, item){
    return Array.prototype.indexOf.call(a, item);
};

cm.inArray = function(a, item){
    if(cm.isString(a)){
        return a === item;
    }
    if(cm.isArray(a)){
        return a.includes(item);
    }
    return false;
};

cm.arrayRemove = function(a, item){
    var index = cm.arrayIndex(a, item);
    if(index > -1){
        a.splice(index, 1);
    }
    return a;
};

cm.arrayClear = function(a){
    while(a.length > 0){
        a.pop();
    }
    return a;
};

cm.arrayAdd = function(a, item, move){
    if(move){
        a = cm.arrayRemove(a, item);
    }
    if(!cm.inArray(a, item)){
        a.push(item);
    }
    return a;
}

cm.arrayPrepend = function(a, item, move){
    if(move){
        a = cm.arrayRemove(a, item);
    }
    if(!cm.inArray(a, item)){
        a.unshift(item);
    }
    return a;
};

cm.arrayFilter = function(a, items){
    return a.filter(function(item){
        return !items.includes(item);
    });
};

/**
 * Sort an array by key with optional locale comparison
 * @param {Array} a - Array to sort
 * @param {string} [key] - Object key to sort by
 * @param {string} [dir='asc'] - Direction: 'asc', 'desc', 'asc-locale', 'desc-locale'
 * @param {boolean} [clone=true] - Whether to clone array or sort in place
 * @param {Object} [options] - Locale compare options
 * @returns {Array} Sorted array
 */
cm.arraySort = function(a, key, dir, clone, options){
    if (!cm.isArray(a)) return a;

    dir = cm.isUndefined(dir) ? 'asc' : dir.toLowerCase();
    dir = cm.inArray(['asc', 'asc-locale', 'desc', 'desc-locale'], dir) ? dir : 'asc';
    clone = cm.isUndefined(clone) ? true : clone;

    const method = clone ? 'toSorted' : 'sort';
    switch(dir){
        case 'asc':
            return a[method]((a, b) => cm.arraySortAsc(a, b, key));

        case 'asc-locale':
            return a[method]((a, b) => cm.arraySortAscLocale(a, b, key, options));

        case 'desc' :
            return a[method]((a, b) => cm.arraySortDesc(a, b, key));

        case 'desc-locale':
            return a[method]((a, b) => cm.arraySortDescLocale(a, b, key, options));
    }
};

cm.arraySortAsc = function(a, b, key) {
    a = key ? a[key] : a;
    b = key ? b[key] : b;
    return (a < b) ? -1 : ((a > b) ? 1 : 0);
};

cm.arraySortAscLocale = function(a, b, key, options) {
    a = key ? a[key] : a;
    b = key ? b[key] : b;
    options = {
        sensitivity: 'base',
        numeric: true,
        ...options,
    };
    return a.localeCompare(b, cm._lang, options);
};

cm.arraySortDesc = function(a, b, key) {
    a = key ? a[key] : a;
    b = key ? b[key] : b;
    return (a < b) ? 1 : ((a > b) ? -1 : 0);
};

cm.arraySortDescLocale = function(a, b, key, options) {
    a = key ? a[key] : a;
    b = key ? b[key] : b;
    options = {
        sensitivity: 'base',
        numeric: true,
        ...options,
    };
    return b.localeCompare(a, cm._lang, options);
};

cm.arrayParseFloat = function(a){
    return a.map(Number.parseFloat);
};

cm.objectToArray = function(o){
    if(!cm.isObject(o)){
        return [o];
    }
    var a = [];
    cm.forEach(o, function(item){
        if(!cm.isEmpty(item)){
            a.push(item);
        }
    });
    return a;
};

cm.arrayToObject = function(a){
    var o = {};
    a.forEach(function(item, i){
        if(typeof item === 'object'){
            o[i] = item;
        }else{
            o[item] = item;
        }
    });
    return o;
};

cm.objectReplace = function(o, map, replaceKeys){
    var newO = cm.isArray(o) ? [] : {},
        newKey;
    replaceKeys = !cm.isUndefined(replaceKeys) ? replaceKeys : true;
    cm.forEach(o, function(value, key){
        if(cm.isString(key)){
            newKey = replaceKeys ? cm.strReplace(key, map) : key;
        }else{
            newKey = key;
        }
        if(cm.isObject(value)){
            newO[newKey] = cm.objectReplace(value, map, replaceKeys);
        }else if(cm.isString(value)){
            newO[newKey] = cm.strReplace(value, map);
        }else{
            newO[newKey] = value;
        }
    });
    return newO;
};

cm.getDiffCompare = function(item1, item2){
    var newO = {};
    cm.diffCompare(newO, item1, item2, 'key');
    return newO['key'];
};

cm.isEmpty = function(value){
    if(cm.isUndefined(value)){
        return true;
    }
    if(cm.isString(value) || cm.isArray(value)){
        return value.length === 0;
    }
    if(cm.isObject(value)){
        return cm.getLength(value) === 0;
    }
    return false;
};

cm.isUndefined = function(value){
    return typeof value === 'undefined' || value === undefined || value === null;
};

cm.objectFormPath = function(name, value, defaultValue){
    var newO = {},
        tempO = newO,
        nameO = name.toString().split('.'),
        nameL = nameO.length;
    defaultValue = !cm.isUndefined(defaultValue) ? defaultValue : {};
    value = !cm.isEmpty(value) ? value : defaultValue;
    nameO.map(function(item, i){
        if(nameL === i + 1){
            tempO[item] = value;
        }else{
            tempO = tempO[item] = {};
        }
    });
    return newO;
};

cm.objectSelector = function(name, obj, apply){
    if(cm.isUndefined(obj) || cm.isUndefined(name)){
        return obj;
    }
    name = name.toString().split('.');
    var findObj = obj,
        length = name.length;
    cm.forEach(name, function(item, key){
        if(!findObj[item]){
            findObj[item] = {};
        }
        if(apply && key === length -1){
            findObj[item] = apply;
        }
        findObj = findObj[item];
    });
    return findObj;
};

cm.reducePath = cm.objectPath = function(name, obj){
    if(cm.isUndefined(obj) || cm.isUndefined(name)){
        return obj;
    }
    name = name.toString().split('.');
    return name.reduce(function(object, property){
        return cm.isUndefined(object) ? undefined : object[property];
    }, obj);
};

cm.fillDataMap = function(map, data){
    var items = {},
        value;
    cm.forEach(map, function(id, key){
        value = cm.reducePath(id, data);
        if(cm.isEmpty(value) && /[{%]\w+[%}]/.test(id)){
            value = cm.fillVariables(id, data);
        }
        if(!cm.isEmpty(value)){
            items[key] = value;
        }
    });
    return items;
};

cm.objectFillVariables = function(o, map, skipEmpty, replaceKeys){
    var newO = cm.isArray(o) ? [] : {},
        newKey;
    replaceKeys = !cm.isUndefined(replaceKeys) ? replaceKeys : true;
    skipEmpty = !cm.isUndefined(skipEmpty) ? skipEmpty : false;
    cm.forEach(o, function(value, key){
        if(cm.isString(key)){
            newKey = replaceKeys ? cm.fillVariables(key, map, skipEmpty) : key;
        }else{
            newKey = key;
        }
        if(cm.isObject(value)){
            newO[newKey] = cm.objectFillVariables(value, map, skipEmpty, replaceKeys);
        }else if(cm.isString(value)){
            newO[newKey] = cm.fillVariables(value, map, skipEmpty);
        }else{
            newO[newKey] = value;
        }
    });
    return newO;
};

cm.sort = function(o, dir){
    var keys = cm.arraySort(Object.keys(o), null, dir),
        sorted = {};
    cm.forEach(keys, function(key){
        sorted[key] = o[key];
    });
    return sorted;
};

cm.replaceDeep = function(o, from, to){
    var newO = cm.clone(o);
    cm.forEach(newO, function(value, key){
        if(typeof value === 'object'){
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
        data = [
            config['langs'][config['type']],
            config['name'],
            config['message']
        ],
        str = data.join(' > ');
    switch(config['type']){
        case 'error':
            console.error(str);
            break;
        case 'attention':
            console.warn(str);
            break;
        case 'common':
        case 'success':
        default:
            console.info(str);
            break;
    }
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

cm.getElementAbove = function(e){
    var x = e.clientX || cm._clientPosition['left'],
        y = e.clientY || cm._clientPosition['top'];
    return document.elementFromPoint(x, y);
};

cm.onSchedule = function(callback){
    animFrame(function(){
        animFrame(function(){
            callback();
        });
    });
};

cm.addEvent = function(el, type, handler, useCapture){
    if(el){
        useCapture = cm.isUndefined(useCapture)? false : useCapture;
        el.addEventListener(type, handler, useCapture);
    }
    return el;
};

cm.removeEvent = function(el, type, handler, useCapture){
    if(el){
        useCapture = cm.isUndefined(useCapture) ? false : useCapture;
        el.removeEventListener(type, handler, useCapture);
    }
    return el;
};

cm.triggerEvent = function(el, type, options){
    if(el){
        options = cm.merge({
            bubbles: true,
            cancelable: true
        }, options);
        var event = new Event(type, options);
        el.dispatchEvent(event);
    }
    return el;
};

cm.click =  (function() {
    var stack = new Map();

    return {
        add: function(el, callback, useCapture) {
            if (!el || !cm.isFunction(callback)) {
                return el;
            }

            function helper(event) {
                if (event && cm.isNotToggleKey(event) || /button|input/i.test(el.tagName)) {
                    return;
                }
                callback(event);
            }

            var item = stack.get(el);
            if (!item) {
                item = new Map();
                stack.set(el, item);
            }
            item.set(callback, helper);

            cm.addEvent(el, 'click', callback, useCapture);
            cm.addEvent(el, 'keypress', helper, useCapture);
            return el;
        },
        remove: function(el, callback, useCapture) {
            if (!el || !cm.isFunction(callback)) {
                return el;
            }

            var item = stack.get(el);
            if (!item) {
                return el;
            }

            var helper = item.get(callback);
            if (!helper) {
                return el;
            }
            item.delete(callback);

            cm.removeEvent(el, 'click', callback, useCapture);
            cm.removeEvent(el, 'keypress', helper, useCapture);
            return el;
        },
        list: function() {
            return stack;
        },
    };
})();

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
                'handler' : cm.isFunction(handler) ? handler : function(){}
            });
            return node;
        },
        'remove' : function(node, type, handler){
            if(!_stack[type]){
                _stack[type] = [];
            }
            _stack[type] = _stack[type].filter(function(item){
                return item['node'] !== node && item['handler'] !== handler;
            });
            return node;
        },
        'trigger' : function(node, type, params){
            if(!node){
                return null;
            }
            var stopPropagation = false;
            params = cm.merge({
                'target' : node,
                'type' : type,
                'direction' : 'all',            // child | parent | all
                'self' : true,
                'stopPropagation' : function(){
                    stopPropagation = true;
                }
            }, params);
            if(_stack[type]){
                _stack[type].sort(function(a, b){
                    if(params['direction'] === 'parent'){
                        return cm.getNodeOffsetIndex(b['node']) > cm.getNodeOffsetIndex(a['node']);
                    }
                    return cm.getNodeOffsetIndex(a['node']) - cm.getNodeOffsetIndex(b['node']);
                });
                cm.forEach(_stack[type], function(item){
                    var itemParams = cm.merge(params, {
                        'currentTarget' : item['node'],
                        'item' : item
                    });
                    if(!stopPropagation){
                        if(itemParams['self'] && node === item['node']){
                            item['handler'](itemParams);
                        }
                        switch(itemParams['direction']){
                            case 'child':
                                if(cm.isParent(node, item['node'], false)){
                                    item['handler'](itemParams);
                                }
                                break;
                            case 'parent':
                                if(cm.isParent(item['node'], node, false)){
                                    item['handler'](itemParams);
                                }
                                break;
                            default:
                                if(node !== item['node']){
                                    item['handler'](itemParams);
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

cm.hook = (function(){
    var _stack = {};

    return {
        'get' : function(type){
            if(!type){
                return _stack;
            }
            if(!_stack[type]){
                _stack[type] = [];
            }
            return _stack[type];
        },
        'add' : function(type, handler){
            if(!_stack[type]){
                _stack[type] = [];
            }
            if(cm.isFunction(handler)){
                _stack[type].push(handler);
            }else{
                cm.errorLog({
                    'name' : 'cm.hook',
                    'message' : ['Handler of event', cm.strWrap(type, '"'), 'must be a function.'].join(' ')
                });
            }
        },
        'remove' : function(type, handler){
            if(!_stack[type]){
                _stack[type] = [];
            }
            if(cm.isFunction(handler)){
                _stack[type] = _stack[type].filter(function(item){
                    return item !== handler;
                });
            }else{
                cm.errorLog({
                    'name' : 'cm.hook',
                    'message' : ['Handler of event', cm.strWrap(type, '"'), 'must be a function.'].join(' ')
                });
            }
        },
        'trigger' : function(type, params){
            var that = this,
                data = cm.clone(arguments);
            // Remove event name parameter from data
            data.shift();
            if(_stack[type]){
                cm.forEach(_stack[type], function(handler){
                    handler.apply(that, data);
                });
            }
        }
    }
})();

cm.onLoad = function(handler, logMessage){
    logMessage = cm.isUndefined(logMessage) ? true : logMessage;
    var called = false;
    var execute = function(){
        if(called){
            return;
        }
        called = true;
        if(logMessage){
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

cm.onReady = function(handler, logMessage){
    logMessage = cm.isUndefined(logMessage) ? true : logMessage;
    var called = false;
    var execute = function(){
        if(called){
            return;
        }
        called = true;
        if(logMessage){
            cm.errorLog({
                type: 'common',
                name: 'cm.onReady',
                message: ['Ready time', (Date.now() - cm._loadTime), 'ms.'].join(' ')
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
    useCapture = cm.isUndefined(useCapture) ? false : useCapture;
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
    useCapture = cm.isUndefined(useCapture) ? false : useCapture;
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
    return e.button === 1;
};

cm.ticking = function() {
    let isTicking = false;
    return (callback) => {
        if (isTicking) return;
        isTicking = true;
        animFrame(() => {
            isTicking = false;
            if (cm.isFunction(callback)) {
                callback();
            }
        });
    };
};

cm.throttleFrame = function(callback) {
    let isTicking = false;
    return (...args) => {
        if (isTicking) return;
        isTicking = true;
        animFrame(() => {
            isTicking = false;
            if (cm.isFunction(callback)) {
                callback.apply(this, args);
            }
        });
    };
};

cm.throttle = function (func, wait) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= wait) {
            lastCall = now;
            func.apply(this, args);
        }
    };
};

cm.debounce = function(func, wait, immediate){
    var timeout, result;
    return function(){
        var context = this,
            args = arguments;
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
        helper = cm.debounce(scrollEnd, 100),
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
    var helper = cm.debounce(handler, 100);
    cm.addEvent(node, 'scroll', helper);
    return {
        'remove' : function(){
            cm.removeEvent(node, 'scroll', helper);
        }
    };
};

cm.onImageLoad = function(src, success, error){
    var nodes = [],
        isMany = cm.isArray(src),
        images = isMany ? src : [src],
        imagesLength = images.length,
        isLoad = 0;

    images.forEach(function(item, i){
        nodes[i] = cm.node('img', {'alt' : ''});
        nodes[i].onload = function(){
            isLoad++;
            if(isLoad === imagesLength){
                cm.isFunction(success) && success(isMany ? nodes : nodes[0]);
            }
        };
        nodes[i].onerror = function(event){
            cm.isFunction(error) && error(isMany ? nodes : nodes[0], event);
        };
        nodes[i].src = item;
    });

    return isMany ? nodes : nodes[0];
};

cm.fileFromDataTransfer = function(e, callback){
    var types = ['url', 'text/plain', 'text/uri-list'],
        image = new Image(),
        canvas = document.createElement('canvas'),
        dt = e.dataTransfer,
        tempData,
        data,
        dataURL,
        blob,
        file;
    // Get URL from HTML
    tempData = dt.getData('text/html');
    if(!cm.isEmpty(tempData)){
        tempData = cm.strToHTML(tempData);
        if(!cm.isEmpty(tempData)){
            tempData = tempData.querySelector('img');
            if(!cm.isEmpty(tempData)){
                data = tempData.src;
            }
        }
    }
    // Get URL
    if(cm.isEmpty(data)){
        cm.forEach(types, function(type){
            tempData = dt.getData(type);
            if(!cm.isEmpty(tempData)){
                data = tempData
            }
        });
    }
    // Get Data URL
    image.crossOrigin = 'anonymous';
    cm.addEvent(image, 'load', function(){
        var that = this;
        canvas.width = that.naturalWidth;
        canvas.height = that.naturalHeight;
        canvas.getContext('2d').drawImage(that, 0, 0);
        dataURL = canvas.toDataURL('image/png');
        blob = cm.dataURItoBlob(dataURL);
        file = new File([blob], data);
        cm.isFunction(callback) && callback(file);
    });
    image.src = data;
    return data;
};

cm.dataURItoBlob = function(dataURI){
    var byteString = atob(dataURI.split(',')[1]),
        mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0],
        ab = new ArrayBuffer(byteString.length),
        ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {'type': mimeString});
};

cm.dataURItoFile = function(dataURI, data) {
    data = cm.merge({
        name: cm.quid('$$$$$$$'),
        type: 'image/jpeg',
    }, data);
    var blob = cm.dataURItoBlob(dataURI);
    return new File([blob], data.name, data);
};

cm.bufferToHEX = function(arrayBuffer){
    var byteArray = new Uint8Array(arrayBuffer),
        hexParts = [];
    for(var i = 0; i < byteArray.byteLength; i++){
        var hex = byteArray[i].toString(16),
            paddedHex = ('00' + hex).slice(-2);
        hexParts.push(paddedHex);
    }
    return hexParts.join('');
};

cm.bufferToBase64 = function(arrayBuffer){
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
};

/* ******* NODES ******* */

cm.getOwnerWindow = function(node){
    return node.ownerDocument.defaultView;
};

cm._addScriptStack = {};

cm.addScript = function(src, async, callback, container){
    var item,
        vars = cm._getVariables();
    // Config
    src = cm.isArray(src) ? cm.objectReplace(src, vars) : cm.strReplace(src, vars);
    async = !cm.isUndefined(async) ? async : false;
    callback = !cm.isUndefined(callback) ? callback : function(){};
    container = !cm.isUndefined(container) ? container : cm.getDocumentHead()
    // Configure Stack Item
    if(cm._addScriptStack[src]){
        item = cm._addScriptStack[src];
        if(!item['loaded']){
            item['callbacks'].push(callback);
        }else{
            callback();
        }
    }else{
        item = {
            'src' : src,
            'async' : async,
            'loaded' : false,
            'callback' : function(e){
                item['loaded'] = true;
                while(item['callbacks'].length){
                    item['callbacks'][0](e);
                    cm.arrayRemove(item['callbacks'], item['callbacks'][0]);
                }
            },
            'callbacks' : [callback]
        };
        cm._addScriptStack[src] = item;
        // Render Script
        item['script'] = document.createElement('script');
        item['script'].async = item['async'];
        item['script'].src = item['src'];
        cm.addEvent(item['script'], 'load', item['callback']);
        cm.addEvent(item['script'], 'error', item['callback']);
        cm.appendChild(item['script'], container);
    }
    return item['script'];
};

cm.loadScript = function(config) {
    config = cm.merge({
        path: '',
        src: '',
        async: true,
        callback: function() {},
    }, config);

    var path = cm.objectPath(config.path, window);
    if (!cm.isEmpty(path)) {
        return new Promise(function(resolve, reject) {
            config.callback(path);
            resolve(path);
        });
    } else {
        return new Promise(function(resolve, reject) {
            cm.addScript(config.src, config.async, function(event) {
                path = cm.objectPath(config.path, window);
                if (!cm.isEmpty(path)) {
                    config.callback(path);
                    resolve(path);
                } else {
                    cm.errorLog({
                        type: 'error',
                        name: 'cm.loadScript',
                        message: [config.path, 'was not loaded.'].join(' '),
                    });
                    config.callback(null);
                    reject(event);
                }
            });
        });
    }
};

cm.addLink = function(href, callback){
    var node  = document.createElement('link');
    node.rel  = 'stylesheet';
    node.type = 'text/css';
    node.media = 'all';
    node.href = href;
    cm.appendChild(node, cm.getDocumentHead());
    return node;
}

cm.getEl = function(str){
    return document.getElementById(str);
};

cm.getByClass = function(str, node){
    node = node || document;
    return node.getElementsByClassName(str);
};

cm.getByAttr = function(attr, value, element){
    var p = element || document;
    return p.querySelectorAll('[' + attr + '="' + value + '"]');
};

cm.getByName = function(name, node){
    if(cm.isNode(node)){
        return node.querySelectorAll('[name="' + name + '"]');
    }else{
        return document.getElementsByName(name);
    }
};

cm.getParentByTagName = function(tagName, node){
    if(cm.isEmpty(tagName) || !cm.hasParentNode(node)){
        return null;
    }
    var el = node.parentNode;
    do{
        if(el.tagName && el.tagName.toLowerCase() === tagName.toLowerCase()){
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
            if (cm.isUndefined(value)) return;
            if (cm.isObject(value) && !['class', 'classes', 'style', 'styles'].includes(key)) {
                value = JSON.stringify(value);
            }
            switch(key){
                case 'style':
                case 'styles':
                    cm.addStyles(el, value);
                    break;
                case 'class':
                case 'classes':
                    cm.addClass(el, value);
                    break;
                case 'innerHTML':
                    el.innerHTML = value;
                    break;
                case 'innerText':
                    el.innerText = value;
                    break;
                default:
                    el.setAttribute(key, value);
                    break;
            }
        });
        i = 2;
    }else{
        i = 1;
    }
    for(var ln = args.length; i < ln; i++){
        if(typeof args[i] !== 'undefined'){
            if (typeof args[i] === 'string' || typeof args[i] === 'number') {
                cm.appendChild(cm.textNode(args[i]), el);
            } else {
                cm.appendNodes(args[i], el);
            }
        }
    }
    return el;
};

cm.textNode = function(text){
    return document.createTextNode(text);
};

cm.svgNode = function(){
    const ns = 'http://www.w3.org/2000/svg';
    const xlink = 'http://www.w3.org/1999/xlink';

    const args = arguments;
    const el = document.createElementNS(ns, args[0]);
    let i = 0;
    if(cm.isObject(args[1])){
        cm.forEach(args[1], function(value, key){
            if(cm.isUndefined(value)) return;
            if (/^xlink/.test(key)) {
                const name = key.split(':').pop();
                el.setAttributeNS(xlink, name, value);
            } else {
                el.setAttribute(key, value);
            }
        });
        i = 2;
    }else{
        i = 1;
    }
    for(let ln = args.length; i < ln; i++){
        if(typeof args[i] !== 'undefined'){
            if (typeof args[i] === 'string' || typeof args[i] === 'number') {
                cm.appendChild(cm.textNode(args[i]), el);
            } else {
                cm.appendNodes(args[i], el);
            }
        }
    }
    return el;
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

cm.inDOM = function(node){
    return node === document.body || document.body.contains(node);
};

cm.hasParentNode = function(o){
    if(!cm.isNode(o)){
        return false;
    }
    return !!o.parentNode;
};

cm.isParent = function(p, node, flag){
    if(flag && p === node){
        return true;
    }
    if(cm.isNode(node)){
        if(cm.isWindow(p) && cm.inDOM(node)){
            return true;
        }
        if(p.contains(node) && p !== node){
            return true
        }
    }
    return false;
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
    return o.nodeType === 1 && o.firstChild ? o.firstChild.nodeValue : '';
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
                if(child.nodeType === 1){
                    str += cm.getTextNodesStr(child);
                }else{
                    str += child.nodeValue;
                }
            });
        }
    }
    return str;
};

cm.remove = cm.removeNode = function(node){
    if(node && node.parentNode){
        node.parentNode.removeChild(node);
    }
};

cm.removeNodes = function(nodes){
    if(cm.isEmpty(nodes)){
        return;
    }
    if(cm.isNode(nodes)){
        cm.remove(nodes)
    }else{
        while(nodes.length){
            cm.remove(nodes[0]);
        }
    }
};

cm.clearNode = function(node){
    if(cm.isNode(node)){
        while(node.childNodes.length){
            node.removeChild(node.firstChild);
        }
    }
    return node;
};

cm.prevEl = function(node){
    node = node.previousSibling;
    if(node && node.nodeType && node.nodeType !== 1){
        node = cm.prevEl(node);
    }
    return node;
};

cm.nextEl = function(node){
    node = node.nextSibling;
    if(node && node.nodeType && node.nodeType !== 1){
        node = cm.nextEl(node);
    }
    return node;
};

cm.firstEl = function(node){
    if(!node || !node.firstChild){
        return null;
    }
    node = node.firstChild;
    if(node.nodeType !== 1){
        node = cm.nextEl(node);
    }
    return node;
};

cm.insertFirst = function(node, target, reAppend){
    reAppend = cm.isUndefined(reAppend) ? true : reAppend;
    if(!cm.isNode(node) || !cm.isNode(target)){
        return node;
    }
    const isAppended = cm.isParent(target, node);
    const isAlreadyFirst = isAppended && target.firstChild === node;
    if (reAppend || !isAppended || !isAlreadyFirst) {
        target.insertBefore(node, target.firstChild);
    }

    return node;
};

cm.insertLast = cm.appendChild = function(node, target, reAppend){
    reAppend = cm.isUndefined(reAppend) ? true : reAppend;
    if(!cm.isNode(node) || !cm.isNode(target)){
        return node;
    }
    const isAppended = cm.isParent(target, node);
    const isAlreadyLast = isAppended && target.lastChild === node;
    if (reAppend || !isAppended || !isAlreadyLast) {
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

cm.appendNodes = function(nodes, target) {
    if (cm.isEmpty(nodes)) {
        return target;
    }
    if (cm.isNode(nodes)) {
        cm.appendChild(nodes, target);
    } else if(cm.isArray(nodes)) {
        cm.forEach(nodes, function(node) {
            cm.appendChild(node, target);
        });
    } else {
        while (nodes.length) {
            if (cm.isNode(nodes[0])) {
                cm.appendChild(nodes[0], target);
            } else {
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
    if(!str || cm.isNode(str)){
        return str;
    }
    var node = cm.node('div');
    node.insertAdjacentHTML('beforeend', str);
    return node.childNodes.length === 1? node.firstChild : node.childNodes;
};

cm.getNodes = function(container, marker){
    container = container || document.body;
    marker = marker || 'data-node';
    var accumulator = {},
        processedNodes = [];

    var separation = function(node, accumulatorObj, processedObj){
        var path = node.getAttribute(marker),
            pathItems = path? path.split('|') : [],
            tempProcessedObj;

        cm.forEach(pathItems, function(item){
            tempProcessedObj = [];
            if(item.indexOf('.') === -1){
                process(node, item, accumulatorObj, tempProcessedObj);
            }else{
                pathway(node, item, tempProcessedObj);
            }
            cm.forEach(tempProcessedObj, function(node){
                processedObj.push(node);
            });
        });
    };

    var pathway = function(node, path, processedObj){
        var pathItems = path? path.split('.') : [],
            accumulatorObj = accumulator;
        cm.forEach(pathItems, function(item, i){
            if(i === 0 && cm.isEmpty(item)){
                accumulatorObj = accumulator;
            }else if((i + 1) === pathItems.length){
                process(node, item, accumulatorObj, processedObj);
            }else{
                if(!accumulatorObj[item]){
                    accumulatorObj[item] = {};
                }
                accumulatorObj = accumulatorObj[item];
            }
        });
    };

    var process = function(node, path, accumulatorObj, processedObj){
        var pathItems = path? path.split(':') : [],
            childNodes;
        if(pathItems.length === 1){
            accumulatorObj[pathItems[0]] = node;
        }else if(pathItems.length === 2 || pathItems.length === 3){
            if(pathItems[1] === '[]'){
                if(!accumulatorObj[pathItems[0]]){
                    accumulatorObj[pathItems[0]] = [];
                }
                childNodes = {};
                if(pathItems[2]){
                    childNodes[pathItems[2]] = node;
                }
                find(node, childNodes, processedObj);
                accumulatorObj[pathItems[0]].push(childNodes);
            }else if(pathItems[1] === '[&]'){
                if(!accumulatorObj[pathItems[0]]){
                    accumulatorObj[pathItems[0]] = [];
                }
                accumulatorObj[pathItems[0]].push(node);
            }else if(pathItems[1] === '{}'){
                if(!accumulatorObj[pathItems[0]]){
                    accumulatorObj[pathItems[0]] = {};
                }
                if(pathItems[2]){
                    accumulatorObj[pathItems[0]][pathItems[2]] = node;
                }
                find(node, accumulatorObj[pathItems[0]], processedObj);
            }
        }
        processedObj.push(node);
    };

    var find = function(container, accumulatorObj, processedObj){
        var childNodes = container.querySelectorAll('[' + marker +']');
        cm.forEach(childNodes, function(node){
            if(!cm.inArray(processedObj, node)){
                separation(node, accumulatorObj, processedObj);
            }
        });
    };

    separation(container, accumulator, processedNodes);
    find(container, accumulator, processedNodes);

    return accumulator;
};

cm.processDataAttributes = function(node, name, vars){
    vars = !cm.isUndefined(vars) ? vars : {};
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
                    if(cm.isTagName(el[i], 'select')){
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
                var next = !cm.isUndefined(indexes[i + 1]);
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
                            }else if(!cm.isUndefined(chbx) && chbx !== false){
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

                case 'textarea':
                    setValue(elements[d][i].name, elements[d][i].value);
                    break;
            }
        }
    }
    return data;
};

cm.clearForm = function(o){
    var formEls = cm.getByClass('formData', o);
    for(var i = 0, ln = formEls.length; i < ln; i++){
        if(cm.isTagName(formEls[i], 'input')){
            if(formEls[i].type.toLowerCase() === 'checkbox' || formEls[i].type.toLowerCase() === 'radio'){
                formEls[i].checked = false;
            }else{
                formEls[i].value = '';
            }
        }else if(cm.isTagName(formEls[i], 'textarea')){
            formEls[i].value = '';
        }else if(cm.isTagName(formEls[i], 'select')){
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
        if(cm.isArray(value)){
            node.selected = cm.inArray(value, node.value);
        }else{
            if(cm.isBoolean(value)){
                value = value.toString();
            }
            node.selected = node.value == value;
        }
    });
    return o;
};

cm.toggleRadio = function(name, value, node){
    node = node || document.body;
    var els = cm.getByName(name, node);
    for(var i = 0; i < els.length; i++){
        if(els[i].value == value){
            els[i].checked = els[i].value == value;
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

cm.getSelectedOptions = function(node, index){
    if(!cm.isNode(node)){
        return null;
    }
    var options = node.selectedOptions ? node.selectedOptions : node.querySelectorAll('option:checked');
    return !cm.isUndefined(index) ? options[index] : options;
};

cm.getSelectValue = function(node){
    if(!cm.isNode(node)){
        return null;
    }
    if(!node.multiple){
        return node.value;
    }
    var options,
        selected = [];
    try{
        options = cm.getSelectedOptions(node);
        selected = Array.from(options).map(function(option){
            return option.value;
        });
    }catch(e){}
    return selected;
};

cm.setInputMaxLength = function(input, maxLength, max, limit){
    limit = cm.isUndefined(limit) ? true : limit;
    if(cm.isNode(input)){
        var value = 0;
        if(input.type === 'number'){
            value = max || '9'.repeat(maxLength);
            if(value){
                input.max = value;
            }
        }else{
            value = maxLength || max;
            if(limit && value){
                input.maxLength = value;
            }
        }
    }
    return input;
};

cm.setInputMinLength = function(input, minLength, min){
    if(cm.isNode(input)){
        var value = 0;
        if(input.type === 'number'){
            value = min || (minLength ? Math.pow(10, minLength - 1) : 0);
            if(value){
                input.min = value;
            }
        }else{
            value = minLength || min;
            if(value){
                input.minLength = value;
            }
        }
    }
    return input;
};

cm.getMinMax = function(value, min, max, minLength, maxLength) {
    value = parseFloat(value);
    min = min || (minLength ? Math.pow(10, minLength - 1) : 0);
    max = max || (maxLength ? '9'.repeat(maxLength) : Infinity);
    return Math.min(Math.max(value, min), max);
};

cm.constraintsPattern = function(pattern, match, message){
    var test,
        testPattern;
    return function(data){
        testPattern = cm.isFunction(pattern) ? pattern(data) : pattern;
        if(cm.isRegExp(testPattern)){
            test = testPattern.test(data['value']);
        }else{
            test = testPattern === data['value'];
        }
        data['pattern'] = testPattern;
        data['message'] = message;
        data['valid'] = match? test : !test;
        return data;
    }
};

cm.constraintsCallback = function(callback, message){
    return function(data){
        data['message'] = message;
        data['valid'] = cm.isFunction(callback) ? callback(data) : function(){};
        return data;
    }
};

cm.constraintsCallbackAsync = function(callback, message){
    return async function(data){
        data['async'] = true;
        data['message'] = message;
        data['valid'] = cm.isFunction(callback) ? await callback(data) : function(){};
        return data;
    }
};

/* ******* STRINGS ******* */

cm.toFixed = function(n, x, toNumber){
    if(!x || x === 0){
        return Math.round(n);
    }
    var value = Number.parseFloat(n).toFixed(x);
    return toNumber ? Number(value) : value;
};

cm.toNumber = function(str){
    return parseInt(str.replace(/\s+/, ''));
};

cm.is = function(str){
    if(cm.isUndefined(Com.UA)){
        cm.log('Error. UA.js is not exists or not loaded. Method "cm.is()" returns false.');
        return false;
    }
    return Com.UA.is(str);
};

cm.isVersion = function(){
    if(cm.isUndefined(Com.UA)){
        cm.log('Error. UA.js is not exists or not loaded. Method "cm.isVersion()" returns null.');
        return null;
    }
    return Com.UA.isVersion();
};

cm.isMobile = function(){
    if(cm.isUndefined(Com.UA)){
        cm.log('Error. UA.js is not exists or not loaded. Method "cm.isMobile()" returns false.');
        return false;
    }
    return Com.UA.isMobile();
};

cm.decode = (function(){
    var node;
    return function(text){
        if(!node){
            node = cm.node('textarea', {'class' : 'cm__textarea-clipboard'});
        }
        if(!cm.isEmpty(text)){
            node.innerHTML = text;
            return node.value;
        }else{
            return '';
        }

    };
})();

cm.copyToClipboard = function(text, params){
    if (cm.isEmpty(text)) return;

    if (cm.isFunction(params)) {
        params = {
            callback: params,
        };
    }
    params = cm.merge({
        type: 'text/plain',
        callback: () => {},
    }, params);

    const success = () => {
        cm.isFunction(params.callback) && params.callback(true);
    };

    const error = () => {
        cm.errorLog({type: 'error', name: 'cm.copyToClipboard', message: 'Unable to copy text to clipboard!'});
        cm.isFunction(params.callback) && params.callback(false);
    };

    if (
        (params.type === 'text/plain' && navigator.clipboard?.writeText) ||
        (params.type !== 'text/plain' && navigator.clipboard?.write && cm.isClipboardItem)
    ) {
        if (params.type === 'text/plain') {
            navigator.clipboard.writeText(text).then(success).catch(error);
        } else {
            const clipboardItem = new ClipboardItem({
                'text/plain': new Blob([text], {type: 'text/plain'}),
                [params.type]: new Blob([text], {type: params.type}),
            });
            navigator.clipboard.write([clipboardItem]).then(success).catch(error);
        }
    } else {
        const node = cm.node('textarea');
        node.value = text;
        cm.appendChild(node, document.body);

        node.select();
        const successful = document.execCommand('copy');
        cm.remove(node);

        successful ? success() : error();
    }
};

cm.share = async function(data) {
    try {
        await navigator.share(data)
    } catch (err) {
        cm.errorLog({'type': 'error', 'name': 'cm.share', 'message': `Unable to share text: ${err}`});
    }
};

cm.RegExpEscape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

cm.strWrap = function(str, symbol){
    str = str.toString();
    return ['', str, ''].join(symbol);
};

cm.strReplace = function(str, map){
    if(map && cm.isObject(map)){
        str = str.toString();
        cm.forEach(map, function(item, key){
            if(cm.isObject(item)){
                item = JSON.stringify(item);
            }
            str = str.replace(new RegExp(key, 'g'), item);
        });
    }
    return str;
};

cm.fillVariables = function(value, data, skipEmpty){
    var tests;
    skipEmpty = !cm.isUndefined(skipEmpty) ? skipEmpty : false;
    return value.replace(/[{%](\w.+?)[%}]/g, function(math, p1){
        tests = [
            cm.reducePath(p1, data),
            cm.reducePath('%' + p1 + '%', data),
            cm.reducePath('{' + p1 + '}', data),
            skipEmpty ? math : ''
        ];
        return tests.find(function(item){
            return !cm.isUndefined(item);
        });
    });
};

cm.reduceText = function(str, length, points){
    str = str.toString();
    points = cm.isUndefined(points) ? false : points;
    if(str.length > length){
        return str.slice(0, length) + ((points) ? '…' : '');
    }else{
        return str;
    }
};

cm.reduceTextSmart = function(str, length, points){
    if(str.length <= length){
        return str;
    }
    var split = str.split(/[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+/),
        newStr = '',
        testStr = '',
        i = 0;
    while(split[i] && testStr.length <= length){
        newStr = testStr;
        testStr += ' ' + split[i];
        i++;
    }
    if(!cm.isUndefined(points)){
        newStr += '…';
    }
    return newStr;
};

cm.removeDanger = function(str){
    return str.replace(/(<|>|&lt;|&gt;)/gim, '');
};

cm.removeSpaces = function(str){
    return str.replace(/[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+/g, '');
};

// https://doc.wikimedia.org/mediawiki-core/master/js/source/mediawiki.base.html#mw-html-method-escape
cm.escapeHTML = function(str){
    if (!cm.isString(str)) {
        return;
    }
    function escapeCallback(str){
        switch(str){
            case '\'':
                return '&#039;';
            case '"':
                return '&quot;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
        }
    }

    return str.replace( /['"<>&]/g, escapeCallback );
};

cm.cutHTML = function(str){
    if (!cm.isString(str)) {
        return;
    }
    return str.replace(/<[^>]*>/g, '');
};

cm.splitNumber = function(str){
    return str.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
};

cm.formatNumber = function(number, locale, params){
    number = cm.isString(number) ? cm.parseLocalNumber(number) : number;
    locale = !cm.isEmpty(locale) ? locale : cm._locale;
    return new Intl.NumberFormat(locale, params).format(number);
};

cm.parseLocalNumber = function(str){
    // Check if comma is a decimal separator
    const hasCommaDecimal = /,\d{1,2}$/.test(str);
    if (hasCommaDecimal) {
        // European format: "2.415,00"
        return parseFloat(str.replace(/\./g, '').replace(',', '.'));
    } else {
        // US format: "2,415.00"
        return parseFloat(str.replace(/,/g, ''));
    }
};

cm.getPercentage = function(){
    cm.errorLog({type: 'error', name: 'cm.getPercentage', message: 'Deprecated!'});
};

cm.parseDuration = function(value) {
    if (cm.isEmpty(value) || cm.isNumber(value)) return value;
    const str = value.toString().trim().toLowerCase();
    if (str.includes('ms')) return parseFloat(str);
    if (str.includes('s')) return parseFloat(str) * 1000;
    return parseFloat(str);
};

cm.rand = function(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

cm.quid = function(pattern){
    pattern = !cm.isUndefined(pattern) ? pattern : '$';
    function generator(){
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return pattern.replaceAll('$', generator);
};

cm.isEven = function(number){
    return !(number % 2);
};

cm.addLeadZero = function(x, count){
    count = !cm.isUndefined(count) ? count : 1;
    return x.toString().padStart(++count, '0');
};

/**
 * Gets a plural string from a value using Intl.PluralRules.
 * @param {Number} count
 * @param {Object|Array|string} strings - Object with plural categories or legacy array
 * @param {string} locale - Locale code (e.g., 'en-US', 'uk-UA')
 * @return string
 */
cm.plural = cm.getNumberDeclension = function(count, strings, locale){
    if(!strings || cm.isString(strings)){
        return strings;
    }

    const pr = cm.getPluralRules(locale);
    const rule = pr.select(count);

    // Support legacy array format with fallback
    if (cm.isArray(strings)) {
        // Map array indices to common categories: [one, few, many] or [singular, plural]
        const mapping = {
            'one': 0,
            'few': 1,
            'many': 2,
            'other': strings.length > 2 ? 2 : 1
        };

        const i = !cm.isUndefined(mapping[rule]) ? mapping[rule] : 0;
        return strings[i] || strings[strings.length - 1] || strings[0];
    }

    // Modern object format: {one: '...', few: '...', many: '...', other: '...'}
    return strings[rule] || strings.other || strings.one || '';
};

/**
 * Gets a cached Intl.PluralRules instance for the specified locale.
 * Creates and caches a new instance if one doesn't exist for the locale.
 * @param {string} [locale] - Locale code (e.g., 'en-US', 'uk-UA')
 * @return {Intl.PluralRules} Cached PluralRules instance for the locale
 */
cm.getPluralRules = (function(){
    const cache = {};

    return function(locale){
        locale = !cm.isUndefined(locale) ? locale : cm._locale;
        if(!cache[locale]){
            cache[locale] = new Intl.PluralRules(locale);
        }
        return cache[locale];
    };
})();

cm.toRadians = function(degrees) {
    return degrees * Math.PI / 180;
};

cm.toDegrees = function(radians) {
    return radians * 180 / Math.PI;
};

/* ******* DATE AND TIME ******* */

cm.isDateValid = function(date){
    return (cm.isDate(date) && !isNaN(date.valueOf()));
};

cm.getCurrentDate = function(format){
    format = format || cm._config.dateTimeFormat;
    return cm.dateFormat(new Date(), format);
};

cm.dateFormat = function(date, format, langs, formatCase){
    if(cm.isDate(date)){
        date = new Date(+date);
    }else if(cm.isString(date) || cm.isNumber(date)){
        date = new Date(date);
    }
    if(isNaN(date)){
        date = null;
    }
    // Validate format
    format = cm.isString(format) ? format : cm._config.dateTimeFormat;
    formatCase = cm.isString(formatCase) ? formatCase : cm._config.dateFormatCase;
    // Validate language strings
    langs = cm.merge({
        'months' : cm._strings.months,
        'days' : cm._strings.days
    }, langs);
    // Validate language case
    if(cm.isObject(langs['months']) && langs['months'][formatCase]){
        langs['months'] = langs['months'][formatCase]
    }
    // Define format variables
    var convertFormats = {
        '%Y%' : '%Y',
        '%m%' : '%m',
        '%n%' : '%n',
        '%F%' : '%F',
        '%d%' : '%d',
        '%j%' : '%j',
        '%l%' : '%l',
        '%a%' : '%a',
        '%A%' : '%A',
        '%g%' : '%g',
        '%G%' : '%G',
        '%h%' : '%h',
        '%H%' : '%H',
        '%i%' : '%i',
        '%s%' : '%s'
    };
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
            },
            '%v' : function(){
                return date ? cm.addLeadZero(date.getMilliseconds(), 2) : '000';
            },
        };
    };
    format = cm.strReplace(format, convertFormats);
    format = cm.strReplace(format, formats(date));
    return format;
};

cm.parseDate = function(str, format){
    if(!str){
        return null;
    }
    var date = new Date(),
        convert = {
            '%Y%' : 'YYYY',
            '%m%' : 'mm',
            '%d%' : 'dd',
            '%H%' : 'HH',
            '%i%' : 'ii',
            '%s%' : 'ss',
            '%Y' : 'YYYY',
            '%m' : 'mm',
            '%d' : 'dd',
            '%h' : 'hh',
            '%H' : 'HH',
            '%i' : 'ii',
            '%s' : 'ss',
            '%v' : 'vvv',
            '$e' : 'e'
        },
        helpers = {
            'YYYY' : function(value){
                return (value !== '0000') ? value : date.getFullYear();
            },
            'mm' : function(value){
                return (value !== '00') ? value - 1 : date.getMonth();
            },
            'dd' : function(value){
                return (value !== '00') ? value : date.getDate();
            },
            'hh' : function(value){
                return value;
            },
            'HH' : function(value){
                return value;
            },
            'ii' : function(value){
                return value;
            },
            'ss' : function(value){
                return value;
            },
            'vv' : function(value){
                return value;
            },
            'e' : function(value){
                return value;
            }
        },
        parsed = {
            'YYYY' : '0000',
            'mm' : '00',
            'dd' : '00',
            'hh' : '00',
            'HH' : '00',
            'ii' : '00',
            'ss' : '00',
            'vvv' : '000',
            'e' : 'Z'
        },
        fromIndex = 0;
    format = cm.isString(format) ? format : cm._config.dateTimeFormat;
    format = cm.strReplace(format, convert);
    cm.forEach(helpers, function(item, key){
        fromIndex = format.indexOf(key);
        while(fromIndex !== -1){
            parsed[key] = item(str.substr(fromIndex, key.length));
            fromIndex = format.indexOf(key, fromIndex + 1);
        }
    });
    return new Date(parsed['YYYY'], parsed['mm'], parsed['dd'], parsed['HH'], parsed['ii'], parsed['ss'], parsed['vvv']);
};

cm.parseFormatDate = function(str, format, displayFormat, langs, formatCase){
    format = format || cm._config.dateFormat;
    displayFormat = displayFormat || cm._config.displayDateFormat;
    formatCase = formatCase|| cm._config.displayDateFormatCase;
    var date = cm.parseDate(str, format);
    return cm.dateFormat(date, displayFormat, langs, formatCase);
};

cm.parseFormatDateTime = function(str, format, displayFormat, langs, formatCase){
    format = format || cm._config.dateTimeFormat;
    displayFormat = displayFormat || cm._config.displayDateTimeFormat;
    formatCase = formatCase|| cm._config.displayDateFormatCase;
    var date = cm.parseDate(str, format);
    return cm.dateFormat(date, displayFormat, langs, formatCase);
};

cm.getWeek = function(date){
    var d = new Date();
    if(cm.isDate(date)){
        d = new Date(+date);
    }else if(cm.isString(date)){
        d = new Date(date);
    }
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

cm.getWeeksInYear = function(year){
    year = !year ? new Date().getFullYear() : year;
    var date = new Date(year, 11, 31),
        week = cm.getWeek(date);
    return week === 1 ? cm.getWeek(date.setDate(24)) : week;
};

/* ******* STYLES ******* */

cm.addClass = function(node, classes, useHack){
    if(!cm.isNode(node) || cm.isEmpty(classes)){
        return;
    }
    if(useHack){
        useHack = node.clientHeight;
    }
    if(cm.isString(classes) || cm.isNumber(classes)){
        classes = classes.toString().split(/\s+/);
    }
    cm.forEach(classes, function(item){
        if(!cm.isEmpty(item)){
            node.classList.add(item);
        }
    });
    return node;
};

cm.removeClass = function(node, classes, useHack){
    if(!cm.isNode(node) || cm.isEmpty(classes)){
        return;
    }
    if(useHack){
        useHack = node.clientHeight;
    }
    if(cm.isString(classes) || cm.isNumber(classes)){
        classes = classes.toString().split(/\s+/);
    }
    cm.forEach(classes, function(item){
        if(!cm.isEmpty(item)){
            node.classList.remove(item);
        }
    });
    return node;
};

cm.toggleClass = function(node, classes, value) {
    if(!cm.isNode(node)){
        return null;
    }
    if(value){
        return cm.addClass(node, classes);
    }
    return cm.removeClass(node, classes);
};

cm.replaceClass = function(node, oldClass, newClass, useHack){
    if(!cm.isNode(node)){
        return null;
    }
    return cm.addClass(cm.removeClass(node, oldClass, useHack), newClass, useHack);
};

cm.clearClass = function(node){
    if(!cm.isNode(node)){
        return null;
    }
    var classes = node.classList;
    while (classes.length > 0) {
        classes.remove(classes.item(0));
    }
    return node;
};

cm.hasClass = cm.isClass = function(node, cssClass){
    var classes;
    if(!cm.isNode(node)){
        return false;
    }
    return node.classList.contains(cssClass);
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
    o['scrollTop'] = cm.getBodyScrollTop();
    o['scrollLeft'] = cm.getBodyScrollLeft();
    o['scrollHeight'] = o['height'] - o['winHeight'];
    o['scrollWidth'] = o['width'] - o['winWidth'];
    return o[key] || o;
};

cm.getScrollBarSize = (function(){
    var node;
    return function(){
        if(!node){
            node = cm.node('div', {'class' : 'cm__scrollbar-size-checker', 'aria-hidden' : true});
            cm.insertFirst(node, document.body);
        }
        return Math.max(node.offsetWidth - node.clientWidth, 0);
    };
})();

cm.setOpacity = function(node, value){
    if(cm.isNode(node)){
        node.style.opacity = value;
    }
    return node;
};

cm.getX = function(o){
    var x = 0,
        p = o;
    try{
        while(p){
            x += p.offsetLeft;
            if(p !== o){
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
    var y = 0,
        p = o;
    try{
        while(p){
            y += p.offsetTop;
            if(p !== o){
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
        rect['width'] = !cm.isUndefined(o['width']) ? Math.round(o['width']) : o['right'] - o['left'];
        rect['height'] = !cm.isUndefined(o['height']) ? Math.round(o['height']) : o['bottom'] - o['top'];
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

cm.getOffsetRect = function(node){
    var rect = cm.getRect(node),
        topOffset = cm.getBodyScrollTop(),
        leftOffset = cm.getBodyScrollLeft();
    rect.offset = {
        'top' : rect.top + topOffset,
        'right' : rect.right +  leftOffset,
        'bottom' : rect.bottom +  topOffset,
        'left' : rect.left + leftOffset
    }
    return rect;
};

cm.getFullRect = function(node, styleObject){
    if(!cm.isNode(node)){
        return null;
    }
    var dimensions = {};
    styleObject = cm.isUndefined(styleObject) ? cm.getStyleObject(node) : styleObject;
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
    styleObject = cm.isUndefined(styleObject) ? cm.getStyleObject(node) : styleObject;
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
    styleObject = cm.isUndefined(styleObject) ? cm.getStyleObject(node) : styleObject;
    o = cm.isUndefined(o) ? cm.getNodeIndents(node, styleObject) : o;
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
    node.style.width = cm.isUndefined(applyWidth) ? [nodeWidth, 'px'].join('') : applyWidth;
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
    type = cm.isUndefined(type) || !cm.inArray(types, type)? 'offset' : type;
    applyType = cm.isUndefined(applyType) || !cm.inArray(types, applyType) ? false : applyType;
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

cm.addStyles = function(node, data){
    if(!cm.isNode(node)){
        return;
    }
    if(cm.isObject(data)){
        cm.forEach(data, function(value, key){
            node.style[key] = value;
        });
    }else{
        node.style.cssText = data;
    }
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
            if(dimension === '%' && !obj.style[name].match(/%/)){
                var el = (/body/i.test(obj.parentNode.tagName) || /top|left/i.test(Name)) ? 'client' : 'offset';
                var pv = (/width|left/i.test(Name)) ? obj.parentNode[el + 'Width'] : obj.parentNode[el + 'Height'];
                return 100 * ( obj['offset' + Name] / pv );
            }else if(dimension === '%' && /%/.test(obj.style[name])){
                var display = obj.style.display;
                obj.style.display = 'none';
                var style = cm.getCSSStyle(obj, name, true) || 0;
                obj.style.display = display;
                return style;
            }else if(dimension === 'px' && /px/.test(obj.style[name])){
                return cm.getCSSStyle(obj, name, true) || 0;
            }
            return obj['offset' + Name];

        case 'translateX':
            var val = cm.getCSSTranslate(obj).x;
            return cm.styleToNumber(val);

        case 'opacity':
            var val = parseFloat(obj.style.opacity || cm.getCSSStyle(obj, 'opacity'));
            return (!isNaN(val)) ? val : 1;

        case 'color':
        case 'backgroundColor':
        case 'borderColor':
        case 'metaColor':
            var val;
            if (name === 'metaColor') {
                val = obj.getAttribute('content');
            } else {
                val = cm.getCSSStyle(obj, name);
            }
            if (cm.isEmpty(val)) return;
            if(val.match(/rgb/i)){
                val = val.match(/\d+/g);
                return [parseInt(val[0]), parseInt(val[1]), parseInt(val[2])];
            }
            if(val.match(/hsl/i)){
                return cm.hsl2rgb.apply(this, cm.strToHsl(val));
            }
            return cm.hex2rgb(val.match(/[\w\d]+/)[0]);

        case 'docScrollTop':
            return cm.getBodyScrollTop();

        case 'scrollLeft':
        case 'scrollTop':
            return obj[name];

        case 'x1':
        case 'x2':
        case 'y1':
        case 'y2':
            return parseInt(obj.getAttribute(name));

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
        rgb[i] = Math.round(Number(rgb[i])).toString(16);
        if(rgb[i] == '0'){
            rgb[i] = '00';
        }else if(rgb[i].length === 1){
            rgb[i] = '0' + rgb[i];
        }
    }
    return '#' + rgb.join('');
};

cm.strToHsl = function(value) {
    return value.match(/[\d.]+/g).map((v, i) => {
        v = Number(v);
        if (!v) return 0;
        if (i === 0) return v / 360;
        return v / 100;
    });
};

cm.hsl2rgb = function(h,s,l){
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = cm.hueToRgb(p, q, h + 1/3);
        g = cm.hueToRgb(p, q, h);
        b = cm.hueToRgb(p, q, h - 1/3);
    }
    const round = val => Math.min(Math.floor(val * 256), 255);
    return [round(r), round(g), round(b)];
};

cm.hueToRgb = function(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
};

cm.styleStrToKey = function(line){
    line = line.replace(/\s/g, '');
    if(line === 'float'){
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

cm.getScrollOffsetHeight = function(node){
    if(cm.isWindow(node)){
        return cm._pageSize['winHeight'];
    }
    if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            return cm._pageSize['winHeight'];
        }
        return node.offsetHeight;
    }
    return 0;
};

cm.getScrollTopMax = function(node){
    if(cm.isWindow(node)){
        return cm.getBodyScrollMaxTop();
    }
    if(cm.isNode(node)){
        if(/body|html/gi.test(node.tagName)){
            return cm.getBodyScrollMaxTop();
        }
        return node.scrollHeight - node.offsetHeight;
    }
    return 0;
};

cm.setBodyScrollTop = function(top){
    window.scrollTo({top});
};

cm.setBodyScrollLeft = function(left){
    window.scrollTo({left});
};

cm.getBodyScrollTop = function(){
    return Math.max(
        document.documentElement.scrollTop,
        document.body.scrollTop,
        window.scrollY,
        0
    );
};

cm.getBodyScrollLeft = function(){
    return Math.max(
        document.documentElement.scrollLeft,
        document.body.scrollLeft,
        window.scrollX,
        0
    );
};

cm.getBodyScrollWidth = function(){
    return Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
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

cm.getBodyScrollMaxTop = function(){
    return cm.getBodyScrollHeight() - cm._pageSize['winHeight'];
};

cm.showBodyScroll = function(){
    cm.removeClass(cm.getDocumentHtml(), 'cm__scroll--none');
};

cm.hideBodyScroll = function(){
    var scrollTop = cm.getBodyScrollTop();
    cm.addClass(cm.getDocumentHtml(), 'cm__scroll--none');
    cm.setBodyScrollTop(scrollTop);
};

cm.bodyScroll = (function(){
    var stack = [];

    return {
        add: function(node) {
            if (!cm.isNode(node)) {
                return;
            }
            cm.arrayAdd(stack, node);
            cm.bodyScroll.hide();
        },
        remove: function(node) {
            if (!cm.isNode(node)) {
                return;
            }
            cm.arrayRemove(stack, node);
            cm.bodyScroll.show();
        },
        show: function() {
            if (!cm.isEmpty(stack)) {
                return;
            }
            cm.showBodyScroll();
        },
        hide: function() {
            if (cm.isEmpty(stack)) {
                return;
            }
            cm.hideBodyScroll();
        },
    };
})();

cm.scrollTo = function(node, parent, params, callback){
    if (!cm.isNode(node)) return;

    // If parent didn't specify - scroll the window
    parent = !cm.isUndefined(parent) ? parent : window;

    // Variables
    var parentNode = cm.isWindow(parent) ? cm.getDocumentHtml() : parent,
        scrollHeight = cm.getScrollHeight(parentNode),
        scrollOffsetHeight = cm.getScrollOffsetHeight(parentNode),
        scrollTop = cm.getScrollTop(parentNode),
        scrollMax = cm.getScrollTopMax(parentNode);

    // Do not process when parent scroll's height match parent's offset height
    if (scrollHeight === scrollOffsetHeight) return node;

    // Validate
    params = cm.merge({
        'type' : 'auto',
        'behavior' : 'smooth',
        'block' : 'start',
        'top' : 'auto',
        'scrollPadding' : 'auto',
        'direction' : 'both',   // up | down | both
        'duration' : cm._config.animDuration,
        'callback' : cm.isFunction(callback) ? callback : function(){},
    }, params);

    // Check type
    if(params['type'] === 'auto'){
        params['type'] = (cm.isWindow(parent) || parent === document.body) ? 'docScrollTop' : 'scrollTop';
    }

    // Calculate top value
    if(params['top'] === 'auto'){
        var scrollPadding = 0;
        if (params['scrollPadding'] === 'auto') {
            scrollPadding = cm.getStyle(parentNode, 'scroll-padding-top', true) || 0;
        } else if (cm.isNumber(params['scrollPadding'])) {
            scrollPadding = params['scrollPadding'];
        }
        var nodeOffsetTop = (params['type'] === 'docScrollTop' ? cm.getY(node) : node.offsetTop) - scrollPadding;
        switch(params['block']){
            case 'end':
                params['top'] = Math.max(Math.min(nodeOffsetTop + node.offsetHeight, scrollMax), 0);
                break;

            case 'center':
                params['top'] = Math.max(Math.min(nodeOffsetTop - ((scrollOffsetHeight - node.offsetHeight) / 2), scrollMax), 0);
                break;

            case 'start':
            default:
                params['top'] = Math.max(Math.min(nodeOffsetTop, scrollMax), 0);
                break;
        }
    }

    // Check a direction
    if (
        params.direction === 'up' && scrollTop < params.top ||
        params.direction === 'down' && scrollTop > params.top
    ) {
        return node;
    }

    // Animate
    if(params['behavior'] === 'instant'){
        cm.setScrollTop(parent, params['top']);
        params['callback']();
    }else{
        var scrollAnimation = new cm.Animation(parent);
        scrollAnimation.go({
            'easing' : params['behavior'],
            'duration' : params['duration'],
            'onStop' : params['callback'],
            'style' : {
                [params['type']]: params['top']
            },
        });
    }
    return node;
};

cm.getSupportedStyle = (function(){
    var node = document.createElement('div');

    return function(style){
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
            if(!cm.isUndefined(node.style[item]) && !style){
                style = item;
            }
        });
        return style;
    }
})();

cm.getTransitionDurationFromRule = function(rule){
    var openDurationRule = cm.getCSSRule(null, rule)[0],
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

cm.createCSStyleSheet = function(options, container){
    var sheet = new CSSStyleSheet(options);
    if (cm.isNode(container)) {
        var shadow = container.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [sheet];
    } else {
        document.adoptedStyleSheets = cm.extend(document.adoptedStyleSheets, [sheet]);
    }
    return sheet;
};

cm.removeCSStyleSheet = function(sheet, container){
    if(!sheet){
        return;
    }
    cm.replaceCSSRule(sheet);
    document.adoptedStyleSheets = cm.arrayRemove(document.adoptedStyleSheets, sheet);
};

cm.getCSSRule = function(sheet, selector){
    var matchedRules = [];
    if (cm.isUndefined(sheet)) {
        cm.forEach(document.styleSheets, function(sheet) {
            cm.forEach(sheet.cssRules, function(rule) {
                if(rule.selectorText === selector){
                    matchedRules.push(rule);
                }
            });
        });
    } else {
        cm.forEach(sheet.cssRules, function(rule) {
            if(rule.selectorText === selector){
                matchedRules.push(rule);
            }
        });
    }
    return matchedRules;
};

cm.reduceCSSRule = function(selector, rules) {
    rules = !cm.isUndefined(rules) ? rules : [];
    if(cm.isObject(rules)){
        rules = Object.keys(rules).map(function(key){
            return [key, rules[key]].join(':');
        });
    }
    if(cm.isArray(rules)){
        rules = rules.join(';');
    }
    return selector + '{' + rules + '}';
};

cm.addCSSRule = function(sheet, selector, rules, index){
    sheet = !cm.isUndefined(sheet) ? sheet : document.styleSheets[0];
    sheet.insertRule(cm.reduceCSSRule(selector, rules), index);
};

cm.replaceCSSRule = function(sheet, selector, rules, async){
    if(!sheet){
        return;
    }
    async = !cm.isUndefined(async) ? async : false;
    var text = !cm.isEmpty(selector) ? cm.reduceCSSRule(selector, rules) : '';
    if (async) {
        return sheet.replace(text);
    } else {
        sheet.replaceSync(text);
    }
};

cm.removeCSSRule = function(sheet, selector, index){
    if (!cm.isUndefined(sheet)) {
        if (!cm.isEmpty(index)) {
            sheet.deleteRule(index);
        } else {
            cm.forEach(sheet.cssRules, function(rule, i) {
                if (rule.selectorText === selector) {
                    sheet.deleteRule(i);
                }
            });
        }
    } else {
        cm.forEach(document.styleSheets, function(sheet) {
            cm.forEach(sheet.cssRules, function(rule, i) {
                if (rule.selectorText === selector) {
                    sheet.deleteRule(i);
                }
            });
        });
    }
};

cm.setCSSTranslate = (function(){
    const transform = cm.getSupportedStyle('transform');
    if(transform){
        return function(node, x, y, z, additional){
            x = !cm.isUndefined(x) && x !== 'auto' ? x : 0;
            y = !cm.isUndefined(y) && y !== 'auto' ? y : 0;
            z = !cm.isUndefined(z) && z !== 'auto' ? z : 0;
            additional = !cm.isUndefined(additional) ? additional : '';
            node.style[transform] = ['translate3d(', x, ',', y, ',', z,')', additional].join(' ');
            return node;
        };
    }else{
        return function(node, x, y, z, additional){
            x = !cm.isUndefined(x) ? x : 0;
            y = !cm.isUndefined(y) ? y : 0;
            node.style.left = x;
            node.style.top = y;
            return node;
        };
    }
})();

cm.getCSSTranslate = function(node) {
    const style = window.getComputedStyle(node)
    const matrix = new DOMMatrixReadOnly(style.transform)
    return {
        x: matrix.m41,
        y: matrix.m42,
        z: matrix.m43,
    };
};

cm.clearCSSTranslate = (function(){
    const transform = cm.getSupportedStyle('transform');
    if(transform){
        return function(node){
            node.style[transform] = '';
        }
    }else{
        return function(node){
            node.style.left = '';
            node.style.top = '';
        }
    }
})();

cm.setCSSTransitionDuration = (function(){
    const rule = cm.getSupportedStyle('transition-duration');
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
    return a1 >= a2 && a1 <= b2 || b1 >= a2 && b1 <= b2 || a2 >= a1 && a2 <= b1;
};

cm.CSSValuesToArray = function(value){
    if(cm.isEmpty(value)){
        return [0, 0, 0, 0];
    }
    value = value.toString().replace(/[^\d\s-]/g , '').split(/\s+/);
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

cm.arrayToCSSValues = function(a, units){
    var value;
    units = !cm.isUndefined(units) ? units : 'px';
    cm.forEach(a, function(item, key){
        value = cm.isEmpty(item) ? 0 : parseFloat(item);
        value = isNaN(value) ? 0 : value;
        a[key] = value;
    });
    return a.reduce(function(prev, next, index, a){
        return [prev + units, next + ((index === a.length - 1) ? units : '')].join(' ');
    });
};

cm.URLToCSSURL = function(url){
    return !cm.isEmpty(url) ? 'url("' + url + '")' : 'none';
};

cm.setCSSVariable = function(key, value, node){
    node = !cm.isUndefined(node) ? node : document.documentElement;
    if(cm.isNode(node)){
        node.style.setProperty(key, value);
    }
    return node;
};

cm.getCSSVariable = function(key, node){
    node = !cm.isUndefined(node) ? node : document.documentElement;
    if(cm.isNode(node)){
        var styleObject = cm.getStyleObject(node);
        return styleObject.getPropertyValue(key);
    }
};

cm.removeCSSVariable = function(key, node){
    node = !cm.isUndefined(node) ? node : document.documentElement;
    if(cm.isNode(node)){
        node.style.removeProperty(key);
    }
};

/* ******* VALIDATORS ******* */

cm.isKey = function(){
    cm.errorLog({type: 'error', name: 'cm.isKey', message: 'Deprecated!'});
};

cm.isKeyCode = function(){
    cm.errorLog({type: 'error', name: 'cm.isKeyCode', message: 'Deprecated!'});
};

cm.allowKeyCode = function(){
    cm.errorLog({type: 'error', name: 'cm.allowKeyCode', message: 'Deprecated!'});
};

cm.disallowKeyCode = function(){
    cm.errorLog({type: 'error', name: 'cm.disallowKeyCode', message: 'Deprecated!'});
};

cm.isNotToggleKey = function(event) {
    return event.type === 'keypress' && !['Enter', 'Space'].includes(event.code);
};

cm.isLinkClick = function(e){
    return !(e.button || e.metaKey || e.ctrlKey);
};

cm.isInputFocused = function(){
    const element = document.activeElement;
    return (element.tagName === 'INPUT' && !cm.inArray(['button', 'submit', 'reset', 'file', 'checkbox', 'radio', 'image', 'hidden'], element.type)) ||
        element.tagName === 'TEXTAREA' ||
        element.contentEditable === 'true';
};

cm.isFormInputFocused = function(){
    const element = document.activeElement;
    return (element.tagName === 'INPUT' && !cm.inArray(['button', 'submit', 'reset', 'file', 'checkbox', 'radio', 'image', 'hidden'], element.type)) ||
        element.contentEditable === 'true';
};

cm.handleKey = function(event, codes, callback){
    if (!cm.isArray(codes)) {
        codes = [codes];
    }
    if(!cm.isInputFocused() && cm.inArray(codes, event.code)){
        callback && callback(event);
    }
};

cm.charCodeIsDigit = function(code){
    var codeString = String.fromCharCode(code);
    return /^\d$/.test(codeString);
};

cm.allowOnlyDigitInputEvent = function(input, callback){
    return cm.allowOnlyNumbersInputEvent(input, callback, {'allowNegative' : false, 'allowFloat' : false});
};

cm.allowOnlyNumbersInputEvent = function(input, callback, params){
    var regexp, value, isMaxlength, isMax;
    // Validate
    params = cm.merge({
        'allowNegative' : false,
        'allowFloat' : false
    }, params);
    if(params['allowNegative'] && params['allowFloat']){
        regexp = /[^\d-.]/g;
    }else if(params['allowNegative']){
        regexp = /[^\d-]/g;
    }else if(params['allowFloat']){
        regexp = /[^\d.]/g;
    }else{
        regexp = /[^\d]/g;
    }
    // Add events
    cm.addEvent(input, 'input', function(e){
        value = input.value.replace(regexp, '');
        isMaxlength = !cm.isEmpty(input.maxlength) && input.maxlength > 0;
        isMax = !cm.isEmpty(input.max) && input.max > 0;
        if(isMaxlength || isMax){
            if(input.type === 'number'){
                input.value = Math.min(parseFloat(value), parseFloat(input.max));
            }else{
                input.value = cm.reduceText(value, parseFloat(input.maxlength));
            }
        }else{
            input.value = value;
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

cm.Animation = function(o) {
    const that = this;
    const animationMethod = {
        random: progress => ((min, max) => (Math.random() * (max - min) + min))(progress, 1),
        simple: progress => progress,
        linear: progress => progress,
        acceleration: progress => Math.pow(progress, 3),
        inhibition: progress => (1 - animationMethod.acceleration(1 - progress)),
        smooth: progress => (
            (progress < 0.5)
                ? animationMethod.acceleration(2 * progress) / 2
                : 1 - animationMethod.acceleration(2 * (1 - progress)) / 2
        ),
        easeInOutSine: progress => -(Math.cos(Math.PI * progress) - 1) / 2,
    };
    const obj = o;
    const processes = [];

    const setProperties = (progress, delta, properties, duration) => {
        if (progress <= 1) {
            properties.forEach(item => {
                const val = item['old'] + (item['new'] - item['old']) * delta(progress);

                if (item['name'] === 'opacity') {
                    cm.setOpacity(obj, val);
                } else if (/color/i.test(item['name'])) {
                    const r = parseInt((item['new'][0] - item['old'][0]) * delta(progress) + item['old'][0]);
                    const g = parseInt((item['new'][1] - item['old'][1]) * delta(progress) + item['old'][1]);
                    const b = parseInt((item['new'][2] - item['old'][2]) * delta(progress) + item['old'][2]);
                    const color = cm.rgb2hex(r, g, b);
                    if (item['name'] === 'metaColor') {
                        obj.setAttribute('content', color);
                    } else {
                        obj.style[item['name']] = color;
                    }
                } else if (/scrollLeft|scrollTop/.test(item['name'])) {
                    obj[item['name']] = val;
                } else if (/x1|x2|y1|y2/.test(item['name'])) {
                    obj.setAttribute(item['name'], Math.round(val));
                } else if (item['name'] === 'docScrollTop') {
                    cm.setBodyScrollTop(val);
                } else if (item['name'] === 'translateX'){
                    cm.setCSSTranslate(obj, Math.round(val) + item['dimension']);
                } else {
                    obj.style[item['name']] = Math.round(val) + item['dimension'];
                }
            });
            return false;
        }
        properties.forEach(item => {
            if (item['name'] === 'opacity') {
                cm.setOpacity(obj, item['new']);
            } else if (/color/i.test(item['name'])) {
                const color = cm.rgb2hex(item['new'][0], item['new'][1], item['new'][2]);
                if (item['name'] === 'metaColor') {
                    obj.setAttribute('content', color);
                } else {
                    obj.style[item['name']] = color;
                }
            } else if (/scrollLeft|scrollTop/.test(item['name'])) {
                obj[item['name']] = item['new'];
            } else if (/x1|x2|y1|y2/.test(item['name'])) {
                obj.setAttribute(item['name'], item['new']);
            } else if (item['name'] === 'docScrollTop') {
                cm.setBodyScrollTop(item['new']);
            } else {
                obj.style[item['name']] = item['new'] + item['dimension'];
            }
        });
        return true;
    };

    const prepareEndPosition = (name, value) => {
        if (cm.isEmpty(value)) return;
        if (name.match(/color/i)) {
            if (/rgb/i.test(value)) {
                var rgb = value.match(/\d+/g);
                return [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])];
            }
            if (/hsl/i.test(value)) {
                return cm.hsl2rgb.apply(this, cm.strToHsl(value));
            }
            return cm.hex2rgb(value.match(/[\w\d]+/)[0]);
        }
        return value.replace(/[^\-0-9.]/g, '');
    };

    that.go = function(params) {
        // Config
        params= cm.merge({
            style: {},
            duration: 0,
            easing: 'smooth',
            onStop: function() {}
        }, params);

        // Validate
        params.duration = cm.parseDuration(params.duration);
        params.easing = params.anim || params.easing || 'smooth';

        const pId = `animation_process_${Math.random()}`;
        const delta = cm.isFunction(params.easing) ? params.easing : (animationMethod[params.easing] || animationMethod.smooth);
        const properties = [];
        const start = Date.now();

        for (const name in params.style) {
            const value = params.style[name].toString();
            const dimension = cm.getStyleDimension(value);
            const newValue = prepareEndPosition(name, value);
            if (cm.isEmpty(newValue)) return;
            properties.push({
                name: name,
                dimension: dimension,
                new: newValue,
                old: cm.getCurrentStyle(obj, name, dimension),
            });
        }

        // Stop a previous process
        that.stop();

        // Run a new process
        processes[pId] = true;

        const process = () => {
            const processId = pId;
            if (!processes[processId]) {
                delete processes[processId];
                return false;
            }
            const now = Date.now() - start;
            const progress = now / params.duration;
            if (setProperties(progress, delta, properties, params.duration)) {
                delete processes[processId];
                params.onStop && params.onStop();
            } else {
                animFrame(process);
            }
        };
        process();

        return that;
    };

    that.stop = function() {
        for (const i in processes) {
            processes[i] = false;
        }
        return that;
    };

    that.getTarget = function() {
        return obj;
    };
};

cm.transition = function(node, params) {
    const rule = cm.getSupportedStyle('transition');
    let transitions = [];

    const init = () => {
        // Config
        params = cm.merge({
            properties: {},
            duration: 0,
            easing: 'ease-in-out',
            delayIn: 0,
            delayOut: 0,
            immediately: false,
            clear: false,
            onStop: function() {}
        }, params);

        // Validate
        params.duration = cm.parseDuration(params.duration);

        // Prepare styles
        cm.forEach(params.properties, function(value, key) {
            key = cm.styleStrToKey(key);
            transitions.push([key, `${params.duration}ms`, params.easing].join(' '));
        });
        transitions = transitions.join(', ');

        start();
    };

    const start = () => {
        // Prepare
        cm.forEach(params.properties, (value, key) => {
            key = cm.styleStrToKey(key);
            const dimension = cm.getStyleDimension(value);
            node.style[key] = cm.getCurrentStyle(node, key, dimension) + dimension;
        });
        if (params.immediately) {
            set();
            end();
        } else {
            setTimeout(set, params.delayIn);
            setTimeout(end, params.duration + params.delayIn + params.delayOut);
        }
    };

    const set = () => {
        node.style[rule] = transitions;
        // Set new styles
        cm.forEach(params.properties, (value, key) => {
            key = cm.styleStrToKey(key);
            node.style[key] = value;
        });
    };

    const end = () => {
        node.style[rule] = '';
        if (params.clear) {
            cm.forEach(params.properties, (value, key) => {
                key = cm.styleStrToKey(key);
                node.style[key] = '';
            });
        }
        params.onStop(node);
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
        window.localStorage.removeItem(key);
    }else if(cookie){
        cm.cookieRemove(key);
    }
};

cm.sessionStorageSet = function(key, value){
    if(cm.isSessionStorage){
        try{
            window.sessionStorage.setItem(key, value);
        }catch(e){
            cm.storageSet.apply(this, arguments);
        }
    }
};

cm.sessionStorageGet = function(key){
    if(cm.isSessionStorage){
        return window.sessionStorage.getItem(key);
    }else{
        return cm.storageGet.apply(this, arguments);
    }
};

cm.sessionStorageRemove = function(key){
    if(cm.isSessionStorage){
        window.sessionStorage.removeItem(key);
    }else{
        cm.storageRemove.apply(this, arguments);
    }
};

cm.cookieSet = function(name, value, maxAge, path){
    path = 'path=' + (!cm.isEmpty(path) ? encodeURI(path) : '/');
    maxAge = !cm.isEmpty(maxAge) ? cm.cookieAge(maxAge) : '';
    document.cookie = encodeURI(name) + "=" + encodeURI(value) + ';' + path + ';' + maxAge;
};

cm.cookieGet = function(name){
    var cookie = " " + document.cookie;
    var search = " " + encodeURI(name) + "=";
    var setStr = null;
    var offset = 0;
    var end = 0;
    if(cookie.length > 0){
        offset = cookie.indexOf(search);
        if(offset !== -1){
            offset += search.length;
            end = cookie.indexOf(";", offset);
            if(end === -1){
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

cm.cookieDate = function(days){
    return 'expires=' + (new Date(Date.now() + 1000 * 60 * 60 * 24 * days)).toUTCString() + ';';
};

cm.cookieAge = function(days){
    return 'max-age=' + (60 * 60 * 24 * days) + ';';
};

/* ******* AJAX ******* */

cm.ajax = function(o){
    var config = cm.merge({
            'debug' : true,
            'type' : 'json',                                         // text | document | json | jsonp | blob | arraybuffer
            'method' : 'POST',                                       // POST | GET | PUT | PATCH | DELETE
            'paramsType' : 'uri',                                    // uri | json | form-data | none
            'uriConfig' : {},                                        // parameters for cm.obj2URI
            'uriParams' : {},
            'data' : {},
            'params' : '',                                           // TODO: Deprecated, use uriParams and data
            'url' : '',
            'variables' : {},
            'variablesMap' : {},
            'formData'  : false,                                     // TODO: Deprecated, use paramsType: 'form-data'
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'X-Requested-With' : 'XMLHttpRequest'
            },
            'withCredentials' : false,
            'async' : true,
            'beacon' : false,
            'onStart' : function(){},
            'onEnd' : function(){},
            'onProgress': function(){},
            'onSuccess' : function(){},
            'onError' : function(){},
            'onAbort' : function(){},
            'onResolve' : function(){},
            'onReject': function(){},
            'handler' : false
        }, o),
        successStatuses = [200, 201, 202, 204],
        variables = cm._getVariables(),
        response,
        callbackName,
        callbackSuccessName,
        callbackSuccessEmitted,
        callbackErrorName,
        callbackErrorEmitted,
        scriptNode,
        returnObject;

    var init = function(){
        if(config['type'] === 'jsonp'){
            validateJSONP();
            validate();
            returnObject = {'abort' : abortJSONP};
            sendJSONP();
        }else{
            validate();
            returnObject = config.httpRequestObject;
            send();
        }
    };

    var validateJSONP = function(){
        // Generate unique callback name
        callbackName = ['cmAjaxJSONP', Date.now()].join('__');
        callbackSuccessName = [callbackName, 'Success'].join('__');
        callbackErrorName = [callbackName, 'Error'].join('__');
        // Add variables
        variables['%callback%'] = callbackSuccessName;
        variables['%25callback%25'] = callbackSuccessName;
    };

    var validate = function(){
        cm.hook.trigger('ajax.beforePrepare', config);
        config.httpRequestObject = cm.createXmlHttpRequestObject();
        config['type'] = config['type'].toLowerCase();
        config['method'] = config['method'].toUpperCase();
        if(config['formData'] === true){
            config['paramsType'] = 'form-data';
        }
        // Process variables
        if(!cm.isEmpty(config['variablesMap'])){
            config['_originVariables'] = cm.clone(config['variables']);
            config['variables'] = cm.fillDataMap(config['variablesMap'], config['variables']);
        }
        // Process params object
        if(config['data'] instanceof FormData || config['params'] instanceof FormData) {
            delete config['headers']['Content-Type'];
        }else{
            if(!cm.isEmpty(config['data'])){
                config['data'] = processParams(config['data']);
            }else{
                config['params'] = processParams(config['params']);
            }
        }
        if(cm.isObject(config['uriParams'])){
            config['uriParams'] = cm.obj2URI(config['uriParams'], config['uriConfig']);
        }
        // Process request route
        config['url'] = cm.strReplace(config['url'], variables);
        config['url'] = cm.fillVariables(config['url'], config['variables'], true);
        if(config['paramsType'] !== 'none') {
            if (!cm.isEmpty(config['uriParams'])) {
                config['url'] = [config['url'], config['uriParams']].join('?');
            } else if (!cm.isEmpty(config['params']) && !cm.inArray(['POST', 'PUT', 'PATCH'], config['method'])) {
                config['url'] = [config['url'], config['params']].join('?');
            }
        }
        cm.hook.trigger('ajax.afterPrepare', config);
    };

    var processParams = function(data){
        if(cm.isObject(data) || cm.isArray(data)){
            data = cm.objectReplace(data, variables);
            data = cm.objectFillVariables(data, config['variables'], true);
            if(config['paramsType'] === 'json'){
                config['headers']['Content-Type'] = 'application/json';
                data = cm.stringifyJSON(data);
            }else if(config['paramsType'] === 'form-data'){
                data = cm.obj2FormData(data);
                delete config['headers']['Content-Type'];
            }else{
                data = cm.obj2URI(data, config['uriConfig']);
            }
        }
        return data;
    };

    var send = function(){
        config.httpRequestObject.open(config['method'], config['url'], config['async']);
        config.httpRequestObject.responseType = config['type'];

        // Set Headers
        if('withCredentials' in config.httpRequestObject){
            config.httpRequestObject.withCredentials = config.withCredentials;
        }
        cm.forEach(config['headers'], function(value, name){
            config.httpRequestObject.setRequestHeader(name, value);
        });

        // Add response events
        cm.addEvent(config.httpRequestObject, 'load', loadHandler);
        cm.addEvent(config.httpRequestObject, 'error', errorHandler);
        cm.addEvent(config.httpRequestObject, 'abort', abortHandler);

        // Upload progress events
        if (config.httpRequestObject.upload) {
            cm.addEvent(config.httpRequestObject.upload, 'progress', progressHandler);
        }

        // Send
        config['onStart']();
        if(config['beacon'] && cm.hasBeacon){
            navigator.sendBeacon(
                config['url'],
                !cm.isEmpty(config['data']) ? config['data'] : (!cm.isEmpty(config['params']) ? config['params'] : null)
            );
        }else{
            if(!cm.isEmpty(config['data'])){
                config.httpRequestObject.send(config['data']);
            }else if(!cm.isEmpty(config['params']) && cm.inArray(['POST', 'PUT', 'PATCH'], config['method'])){
                config.httpRequestObject.send(config['params']);
            }else{
                config.httpRequestObject.send(null);
            }
        }
    };

    var progressHandler = function(e){
        config['onProgress'].apply(config['onProgress'], arguments);
    };

    var loadHandler = function(e){
        if(config.httpRequestObject.readyState === 4){
            response = config.httpRequestObject.response;
            if(cm.inArray(successStatuses, config.httpRequestObject.status)){
                config['onSuccess'](response, e);
                config['onResolve'](response, e);
            }else{
                config['onError'](response, e);
                config['onReject'](response, e);
                cm.hook.trigger('ajax.error', e);
            }
            deprecatedHandler(response);
            config['onEnd'](response, e);
        }
    };

    var successHandler = function(e){
        config['onSuccess'].apply(config['onSuccess'], arguments);
        config['onResolve'].apply(config['onResolve'], arguments);
        deprecatedHandler.apply(deprecatedHandler, arguments);
        config['onEnd'].apply(config['onEnd'], arguments);
    };

    var errorHandler = function(e){
        config['onError'].apply(config['onError'], arguments);
        config['onReject'].apply(config['onReject'], arguments);
        deprecatedHandler.apply(deprecatedHandler, arguments);
        config['onEnd'].apply(config['onEnd'], arguments);
        cm.hook.trigger('ajax.error', e);
    };

    var abortHandler = function(e){
        config['onAbort'].apply(config['onAbort'], arguments);
        deprecatedHandler.apply(deprecatedHandler, arguments);
        config['onEnd'].apply(config['onEnd'], arguments);
    };

    var deprecatedHandler = function(){
        if(cm.isFunction(config['handler'])){
            cm.errorLog({
                'type' : 'attention',
                'name' : 'cm.ajax',
                'message' : 'Parameter "handler" is deprecated. Use "onSuccess", "onError" or "onAbort" callbacks instead.'
            });
            config['handler'].apply(config['handler'], arguments);
        }
    };

    var sendJSONP = function(){
        // Generate events
        window[callbackSuccessName] = function(){
            if(!callbackSuccessEmitted){
                callbackSuccessEmitted = true;
                successHandler.apply(successHandler, arguments);
                removeJSONP();
            }
        };
        window[callbackErrorName] = function(){
            if(!callbackErrorEmitted){
                callbackErrorEmitted = true;
                errorHandler.apply(errorHandler, arguments);
                removeJSONP();
            }
        };

        // Prepare url and attach events
        scriptNode = cm.Node('script', {'type' : 'application/javascript'});
        cm.addEvent(scriptNode, 'load', window[callbackSuccessName]);
        cm.addEvent(scriptNode, 'error', window[callbackErrorName]);

        // Append
        config['onStart']();
        scriptNode.setAttribute('src', config['url']);
        cm.getDocumentHead().appendChild(scriptNode);
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

cm.ajaxPromise = function(o){
    return new Promise(function(resolve, reject){
        cm.ajax(
            cm.merge(o, {
                'onResolve' : resolve,
                'onReject' : reject
            })
        );
    });
};

cm.parseJSON = function(str){
    if(cm.isObject(str) || cm.isArray(str)){
        return str;
    }
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

cm.stringifyJSON = function(o){
    if(cm.isObject(o) || cm.isArray(o)){
        return JSON.stringify.apply(null, arguments);
    }else {
        return o;
    }
};

cm.obj2Filter = function(obj, prefix, separator, skipEmpty){
    var data = {},
        keyPrefix;
    separator = !cm.isUndefined(separator) ? separator : '=';
    skipEmpty = !cm.isUndefined(skipEmpty) ? skipEmpty : false;
    cm.forEach(obj, function(item, key){
        if(!skipEmpty || !cm.isEmpty(item)){
            keyPrefix = !cm.isEmpty(prefix) ? prefix + separator + key : key;
            if(cm.isObject(item)){
                data = cm.merge(data, cm.obj2Filter(item, keyPrefix, separator, skipEmpty))
            }else if(cm.isArray(item)){
                data[keyPrefix] = item.join(',');
            }else{
                data[keyPrefix] = item;
            }
        }
    });
    return data;
};

cm.obj2URI = function(data, params){
    var str = [],
        keyPrefix,
        keyValue,
        keyParams;
    // TODO: Legacy: arguments[1] = prefix
    if(cm.isString(arguments[1])){
        params = {
            'multipleValues' : 'brackets',
            'prefix' : arguments[1]
        };
    }
    // Validate
    params = cm.merge({
        'multipleValues' : 'brackets',          // brackets | keys | join
        'multipleValuesConjunction' : ',',
        'prefix' : null,
        'itemConjunction' : '&',
        'valueConjunction' : '=',
        'skipEmpty' : false
    }, params);

    if(cm.isArray(data) && params.multipleValues === 'join'){
        cm.forEach(data, function(item){
            if(!cm.isUndefined(item) && (!params.skipEmpty || !cm.isEmpty(item))){
                str.push(encodeURIComponent(item));
            }
        });
        if(!cm.isEmpty(str)){
            str = str.join(params.multipleValuesConjunction);
            if(!cm.isEmpty(params.prefix)){
                str = [params.prefix, str].join(params.valueConjunction);
            }
        }
        return !cm.isEmpty(str) ? str : null;
    }

    cm.forEach(data, function(item, key){
        if(!cm.isUndefined(item) && (!params.skipEmpty || !cm.isEmpty(item))){
            keyValue = item;
            // Handle prefix
            if(!cm.isEmpty(params.prefix)){
                switch(params.multipleValues){
                    case 'brackets':
                        keyPrefix = params.prefix + '[' + key + ']';
                        break;
                    case 'keys':
                    case 'join':
                        keyPrefix = [params.prefix, key].join(params.valueConjunction);
                        break;
                    case 'same':
                        keyPrefix = params.prefix;
                        break;
                }
            }else{
                keyPrefix = key;
            }
            // Handle items
            if(cm.isArray(item) && params.multipleValues === 'keys'){
                keyValue = cm.obj2URI(keyValue, cm.merge(params, {'multipleValues' : 'same', 'prefix' : keyPrefix}));
            }else if(typeof item === 'object'){
                keyValue = cm.obj2URI(keyValue, cm.merge(params, {'prefix' : keyPrefix}));
            }else{
                keyValue = [keyPrefix, encodeURIComponent(keyValue)].join(params.valueConjunction);
            }
            str.push(keyValue);
        }
    });

    return !cm.isEmpty(str) ? str.join(params.itemConjunction) : null;
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
    o = o.nodeType === 9 ? cm.firstEl(o) : o;
    if(o.nodeType === 3 || o.nodeType === 4){
        //Need to be change
        var n = cm.nextEl(o);
        if(!n){
            return o.nodeValue;
        }
        o = n;
    }
    if(o.nodeType === 1){
        var res = {};
        res[o.tagName] = {};
        var els = o.childNodes;
        for(var i = 0, ln = els.length; i < ln; i++){
            var childs = arguments.callee(els[i]);
            if(typeof(childs) === 'object'){
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
        if(els[i].nodeType !== 1){
            continue;
        }
        var kids = els[i].childNodes;
        var tmp = [];
        for(var k = 0; kids.length > k; k++){
            if(kids[k].nodeType === 1){
                tmp[kids[k].tagName] = kids[k].firstChild ? kids[k].firstChild.nodeValue : '';
            }
        }
        data.push(tmp);
    }
    return data;
};

cm.createXmlHttpRequestObject = function(){
    return new XMLHttpRequest();
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

cm._defineStack = {};
cm._defineExtendStack = {};

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
    // Create a class extend object
    that.build = {
        'constructor' : handler,
        '_raw' : cm.clone(data),
        '_update' : {},
        '_name' : {
            'full' : name,
            'short' : name.replace('.', ''),
            'split' : name.split('.')
        },
        '_className' : name,
        '_constructor' : handler,
        '_modules' : {},
        'params' : data['params'],
        'strings' : data['strings']
    };
    // Inheritance
    if(data['extend']){
        cm.getConstructor(data['extend'], function(classConstructor, className){
            handler.prototype = Object.create(classConstructor.prototype);
            that.build._inheritName = className;
            that.build._inherit = classConstructor;
            // Merge raw params
            that.build._raw['modules'] = cm.merge(that.build._inherit.prototype._raw['modules'], that.build._raw['modules']);
            that.build._raw['events'] = cm.merge(that.build._inherit.prototype._raw['events'], that.build._raw['events']);
            // Add to extend stack
            if(cm._defineExtendStack[className]){
                cm._defineExtendStack[className].push(name);
            }
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
    // Add to stack
    if(!cm._defineExtendStack[name]){
        cm._defineExtendStack[name] = [];
    }
    cm._defineStack[name] = handler;
    // Extend Window object
    cm.objectSelector(name, window, handler);
};

cm.define = (function(){
    var definer = Function.prototype.call.bind(cm.defineHelper, arguments);
    return function(){
        definer.apply(cm.defineHelper, arguments);
    };
})();

cm.getConstructor = function(className, callback){
    var classConstructor;
    callback = cm.isFunction(callback) ? callback : function(){};
    if(cm.isUndefined(className)){
        if(cm._debug){
            cm.errorLog({
                'type' : 'error',
                'name' : 'cm.getConstructor',
                'message' : ['Parameter "className" does not specified.'].join(' ')
            });
        }
        return false;
    }else if(className === '*'){
        cm.forEach(cm._defineStack, function(classConstructor){
            callback(classConstructor, className, classConstructor.prototype, classConstructor.prototype._inherit);
        });
        return cm._defineStack;
    }else{
        classConstructor = cm._defineStack[className];
        if(!classConstructor){
            if(cm._debug){
                cm.errorLog({
                    'type' : 'attention',
                    'name' : 'cm.getConstructor',
                    'message' : ['Class', cm.strWrap(className, '"'), 'is not defined.'].join(' ')
                });
            }
            return false;
        }else{
            callback(classConstructor, className, classConstructor.prototype, classConstructor.prototype._inherit);
            return classConstructor;
        }
    }
};

cm.isInstance = function(childClass, parentClass){
    var isInstance = false;
    if(cm.isString(parentClass)){
        parentClass = cm.getConstructor(parentClass);
    }
    if(!cm.isEmpty(childClass) && !cm.isEmpty(parentClass)){
        isInstance = childClass instanceof parentClass;
    }
    return isInstance;
};

cm.find = function(className, name, parentNode, callback, params){
    var items = [],
        processed = {};
    // Config
    callback = cm.isFunction(callback) ? callback : function(){};
    params = cm.merge({
        'childs' : false
    }, params);
    // Process
    if(!className || className === '*'){
        cm.forEach(cm._defineStack, function(classConstructor){
            if(classConstructor.prototype.findInStack){
                items = cm.extend(items, classConstructor.prototype.findInStack(name, parentNode, callback));
            }
        });
    }else{
        var classConstructor = cm._defineStack[className];
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
            // Find instances of current constructor
            items = cm.extend(items, classConstructor.prototype.findInStack(name, parentNode, callback));
            // Find child instances, and stack processed parent classes to avoid infinity loops
            if(params['childs'] && cm._defineExtendStack[className] && !processed[className]){
                processed[className] = true;
                cm.forEach(cm._defineExtendStack[className], function(childName){
                    items = cm.extend(items, cm.find(childName, name, parentNode, callback, params));
                });
            }
        }
    }
    return items;
};

cm.Finder = function(className, name, parentNode, callback, params){
    var that = this,
        isEventBind = false;

    var init = function(){
        var finder;
        // Merge params
        //parentNode = parentNode || document.body;
        callback = cm.isFunction(callback) ? callback : function(){};
        params = cm.merge({
            'event' : 'onRender',
            'multiple' : false,
            'childs' : false
        }, params);
        // Search in constructed classes
        finder = cm.find(className, name, parentNode, callback, {
            'childs' : params['childs']
        });
        // Bind event when no one constructed class found
        if(!finder || !finder.length || params['multiple']){
            isEventBind = true;
            cm.getConstructor(className, function(classConstructor){
                classConstructor.prototype.addEvent(params['event'], watcher);
            });
        }
    };

    var watcher = function(classInstance){
        classInstance.removeEvent(params['event'], watcher);
        var isSame = classInstance.isAppropriateToStack(name, parentNode, callback);
        if(isSame && !params['multiple'] && isEventBind){
            that.remove(classInstance._constructor);
        }
    };

    that.remove = function(classConstructor){
        if(classConstructor){
            classConstructor.prototype.removeEvent(params['event'], watcher);
        }else{
            cm.getConstructor(className, function(classConstructor){
                classConstructor.prototype.removeEvent(params['event'], watcher);
            });
        }
    };

    init();
};

cm.setParams = function(className, params){
    cm.getConstructor(className, function(classConstructor, className, classProto){
        classProto.setParams(params);
    });
};

cm.setMessages = cm.setStrings = function(className, strings){
    cm.getConstructor(className, function(classConstructor, className, classProto){
        classProto.setMessages(strings);
    });
};

cm.parseMessage = function(text, variables){
    if (!cm._messageParser) {
        cm.getConstructor('Com.MessageParser', classConstructor => {
            cm._messageParser = new classConstructor();
        });
    }
    return cm._messageParser.parse(text, variables);
};

cm.getMessage = cm.getString = function(className, str){
    var data;
    cm.getConstructor(className, function(classConstructor, className, classProto){
        data = classProto.message(str);
    });
    return data;
};

cm.getMessages = cm.getStrings = function(className, o){
    var data;
    if(cm.isUndefined(o) || cm.isEmpty(o)){
        o = '*';
    }
    cm.getConstructor(className, function(classConstructor, className, classProto){
        data = classProto.messageObject(o);
    });
    return data;
};
