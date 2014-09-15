/* ******* INFO ******* */

/*

    Objects and Arrays:             123
    Events:                         303
    Nodes:                          580
    Forms:                          845
    Strings:                        1018
    Date and Time:                  1110
    Styles:                         1166
    Animation:                      1437
    Cookie and Local Storage:       1785
    Ajax:                           1852
    Hash (?):                       1986
    Graphics:                       2006

*/

var cm = {
        '_version' : '2.1.0',
        '_loadTime' : Date.now(),
        '_debug' : true,
        '_debugAlert' : false,
        '_deviceType' : 'desktop',
        '_deviceOrientation' : 'landscape',
        '_config' : {
            'screenTablet' : 1024,
            'screenTabletPortrait' : 768,
            'screenMobile' : 640,
            'screenMobilePortrait' : 480,
            'dateFormat' : '%Y-%m-%d',
            'dateTimeFormat' : '%Y-%m-%d %H:%i:%s',
            'timeFormat' : '%H:%i',
            'displayDateFormat' : '%F %j, %Y',
            'displayDateTimeFormat' : '%F %j, %Y, %H:%i'
        }
    },
    Mod = {},
    Part = {},
    Com = {
        'Elements' : {}
    };

/* ******* CHECK SUPPORT ******* */

cm.isFileReader = (function(){return 'FileReader' in window;})();
cm.isHistoryAPI = !!(window.history && history.pushState);
cm.isLocalStorage = (function(){try{return 'localStorage' in window && window['localStorage'] !== null;}catch(e){return false;}})();
cm.isCanvas = !!document.createElement("canvas").getContext;
cm.isTouch = 'ontouchstart' in document.documentElement || !!window.navigator.msMaxTouchPoints;

/* ******* OBJECTS AND ARRAYS ******* */

cm.isArray = Array.isArray || function(a){
    return (a) ? a.constructor == Array : false;
};
cm.isObject = function(o){
    return (o) ? o.constructor == Object : false;
};

cm.forEach = function(o, callback){
    if(!o){
        return null;
    }
    if(!callback){
        return o;
    }
    var i, l;
    switch(o.constructor){
        case Object:
            for(var key in o){
                if(o.hasOwnProperty(key)){
                    callback(o[key], key, o);
                }
            }
            break;
        case Array:
            o.forEach(callback);
            break;
        case Number:
            for(i = 0; i < o; i++){
                callback(i);
            }
            break;
        default:
            try{
                Array.prototype.forEach.call(o, callback);
            }catch(e){
                try{
                    for(i = 0, l = o.length; i < l; i++){
                        callback(o[i], i, o);
                    }
                }catch(e){}
            }
            break;
    }
    return o;
};

cm.merge = function(o1, o2){
    if(!o2){
        o2 = {};
    }
    if(!o1){
        o1 = {}
    }else if(cm.isObject(o1) || cm.isArray(o1)){
        o1 = cm.clone(o1);
    }else{
        return cm.clone(o2);
    }
    cm.forEach(o2, function(item, key){
        if(item != null){
            try{
                if(Object.prototype.toString.call(item) == '[object Object]' && item.constructor != Object){
                    o1[key] = item;
                }else if(cm.isObject(item)){
                    o1[key] = cm.merge(o1[key], item);
                }else{
                    o1[key] = item;
                }
            }catch(e){
                o1[key] = item;
            }
        }
    });
    return o1;
};

cm.extend = function(o1, o2){
    if(!o1){
        return o2;
    }
    if(!o2){
        return o1;
    }
    var o;
    switch(o1.constructor){
        case Array:
            o = o1.concat(o2);
            break;
        case Object:
            o = {};
            cm.forEach(o1, function(item, key){
                o[key] = item;
            });
            cm.forEach(o2, function(item, key){
                o[key] = item;
            });
            break;
    }
    return o;
};

cm.clone = function(o, cloneNode){
    var newO;
    if(!o){
        return o;
    }
    switch(o.constructor){
        case Function:
        case String:
        case Number:
        case RegExp:
        case Boolean:
        case XMLHttpRequest:
            newO = o;
            break;
        case Array:
            newO = [];
            cm.forEach(o, function(item){
                newO.push(cm.clone(item, cloneNode));
            });
            break;
        case Object:
            newO = {};
            cm.forEach(o, function(item, key){
                newO[key] = cm.clone(item, cloneNode);
            });
            break;
        default:
            // Exceptions
            if(cm.isNode(o)){
                if(cloneNode){
                    newO = o.cloneNode(true);
                }else{
                    newO = o;
                }
            }else if(Object.prototype.toString.call(o) == '[object Object]' && o.constructor != Object){
                newO = o;
            }else if(o == window){
                newO = o;
            }else{
                newO = [];
                cm.forEach(o, function(item){
                    newO.push(cm.clone(item, cloneNode));
                });
            }
            break;
    }
    return newO;
};

cm.getLength = function(o){
    var i = 0;
    cm.forEach(o, function(){
        i++;
    });
    return i;
};

cm.inArray = function(a, str){
    if(typeof a == 'string'){
        return a === str;
    }else{
        var inArray = false;
        a.forEach(function(item){
            if(item === str){
                inArray = true;
            }
        });
        return inArray;
    }
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

cm.isEmpty = function(el){
    if(!el){
        return true;
    }else if(typeof el == 'string' || el.constructor == Array){
        return el.length == 0;
    }else if(el.constructor == Object){
        return cm.getLength(el) === 0;
    }else if(typeof el == 'number'){
        return el == 0;
    }else{
        return false;
    }
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
        return function(){}
    }
})();

cm.errorLog = function(o){
    var config = cm.merge({
            'type' : 'error',
            'name' : '',
            'message' : '',
            'langs' : {
                'error' : 'Error!',
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

cm.crossEvents = function(key){
    var events = {
        'mousedown' : 'touchstart',
        'mouseup' : 'touchend',
        'mousemove' : 'touchmove',
        'click' : 'tap'
    };
    return events[key];
};

cm.addEvent = function(el, type, handler, useCapture, preventDefault){
    useCapture = typeof(useCapture) == 'undefined' ? true : useCapture;
    preventDefault = typeof(preventDefault) == 'undefined' ? false : preventDefault;
    // Process touch events
    if(cm.isTouch && cm.crossEvents(type)){
        if(/tap/.test(cm.crossEvents(type))){
            cm.addCustomEvent(el, cm.crossEvents(type), handler, useCapture, preventDefault);
        }else{
            el.addEventListener(cm.crossEvents(type), handler, useCapture);
        }
        return el;
    }
    try{
        el.addEventListener(type, handler, useCapture);
    }catch(e){
        el.attachEvent("on" + type, handler);
    }
    return el;
};

cm.removeEvent = function(el, type, handler, useCapture){
    useCapture = typeof(useCapture) == 'undefined' ? true : useCapture;
    // Process touch events
    if(cm.isTouch && cm.crossEvents(type)){
        if(/tap/.test(cm.crossEvents(type))){
            cm.removeCustomEvent(el, cm.crossEvents(type), handler, useCapture);
        }else{
            el.removeEventListener(cm.crossEvents(type), handler, useCapture);
        }
        return el;
    }
    try{
        el.removeEventListener(type, handler, useCapture);
    }catch(e){
        el.detachEvent("on" + type, handler);
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
        helper = _.debounce(scrollEnd, 300),
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
    var helper = _.debounce(handler, 300);
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

cm.isNode = function(node){
    return node && node.nodeType;
};

cm.isTextNode = function(node){
    return node && node.nodeType && node.nodeType == 3;
};

cm.isElementNode = function(node){
    return node && node.nodeType && node.nodeType == 1;
};

cm.getEl = function(str){
    return document.getElementById(str);
};

cm.getByClass = function(str, node){
    node = node || document;
    if(node.getElementsByClassName){
        return node.getElementsByClassName(str);
    }
    var els = node.getElementsByTagName('*'), arr = [];
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

cm.node = cm.Node = function(){
    var args = arguments,
        el = document.createElement(args[0]);
    if(typeof args[1] == "object" && !args[1].nodeType){
        for(var i in args[1]){
            if(i == 'style'){
                el.style.cssText = args[1][i];
            }else if(i == 'class'){
                el.className = args[1][i];
            }else if(i == 'innerHTML'){
                el.innerHTML = args[1][i];
            }else{
                el.setAttribute(i, args[1][i]);
            }
        }
        i = 2;
    }else{
        i = 1;
    }
    for(var ln = args.length; i < ln; i++){
        if(typeof arguments[i] != 'undefined'){
            if(typeof arguments[i] == 'string' || typeof args[i] == 'number'){
                el.appendChild(document.createTextNode(args[i]));
            }else{
                el.appendChild(args[i]);
            }
        }
    }
    return el;
};

cm.wrap = function(node, target){
    if(!target || !node){
        return null;
    }
    if(target.parentNode){
        cm.insertBefore(node, target);
    }
    node.appendChild(target);
    return node;
};

cm.inDOM = function(o){
    if(o){
        var el = o.parentNode;
        while(el){
            if(el == document){
                return true;
            }
            el = el.parentNode
        }
    }
    return false;
};

cm.isParent = function(p, o, flag){
    if(o && o.parentNode){
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
    while(node.childNodes.length != 0){
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
    if(target.firstChild){
        cm.insertBefore(node, target.firstChild);
    }else{
        target.appendChild(node);
    }
    return node;
};

cm.insertLast = cm.appendChild = function(node, target){
    target.appendChild(node);
    return node;
};

cm.insertBefore = function(el, target){
    target.parentNode.insertBefore(el, target);
    return el;
};

cm.insertAfter = function(node, target){
    var before = target.nextSibling;
    if(before != null){
        cm.insertBefore(node, before);
    }else{
        target.parentNode.appendChild(node);
    }
    return node;
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
            if(i == 0 && cm.isEmpty(separator)){
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

/* ******* FORM ******* */

cm.setFDO = function(o, form){
    cm.forEach(o, function(item, name){
        var el = cm.getByAttr('name', name, form);

        for(var i = 0, ln = el.length; i < ln; i++){
            var type = (el[i].type || '').toLowerCase();
            switch(type){
                case 'radio':
                    if(o[name] == el[i].value){
                        el[i].checked = true;
                    }
                    break;

                case 'checkbox':
                    el[i].checked = !!+o[name];
                    break;

                default:
                    if(el[i].tagName.toLowerCase() == 'select'){
                        cm.setSelect(el[i], o[name]);
                    }else{
                        el[i].value = o[name];
                    }
                    break;
            }
        }
    });
    return form;
};

cm.getFDO = function(o, chbx){
    var data = {},
        elements = [
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
                if(index == ''){
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

cm.isRegExp = function(obj){
    return obj.constructor == RegExp;
};
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
    return ['', str, ''].join(symbol);
};

cm.reduceText = function(str, length, points){
    if(str.length > length){
        return str.slice(0, length) + ((points) ? '...' : '');
    }else{
        return str;
    }
};

cm.removeDanger = function(str){
    return str.replace(/(\<|\>|&lt;|&gt;)/gim, '');
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

cm.onTextChange = function(node, handler){
    var u = Com.UA.get(), f = function(e){
        setTimeout(function(){
            handler(e);
        }, 5);
    }, e = (/IE|Chrome|Safari/.test(u.browser)) ? 'keydown' : 'keypress';
    cm.addEvent(node, e, f);
    return node;
};

/* ******* DATE AND TIME ******* */

cm.getCurrentDate = function(format){
    format = format || cm._config['dateTimeFormat'];
    return cm.dateFormat(new Date(), format);
};

cm.dateFormat = function(date, format, langs){
    var str = format,
        formats = function(date){
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
            }
        };

    langs = cm.merge({
        'months' : [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ],
        'days' : [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ]
    }, langs);

    cm.forEach(formats(date), function(item, key){
        str = str.replace(key, item);
    });
    return str;
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
                date.setFullYear(value);
            },
            'mm' : function(value){
                date.setMonth(value - 1);
            },
            'dd' : function(value){
                date.setDate(value);
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

/* ******* STYLES ******* */

cm.addClass = function(node, str, useHack){
    if(!node || cm.isEmpty(str)){
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
    if(!node || cm.isEmpty(str)){
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
    if(!node){
        return null;
    }
    return cm.addClass(cm.removeClass(node, oldClass, useHack), newClass, useHack);
};

cm.hasClass = cm.isClass = function(node, cssClass){
    var hasClass, classes;
    if(!node){
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
        o = {
            'height' : Math.max(
                Math.max(d.body.scrollHeight, de.scrollHeight),
                Math.max(d.body.offsetHeight, de.offsetHeight),
                Math.max(d.body.clientHeight, de.clientHeight)
            ),
            'width' : Math.max(
                Math.max(d.body.scrollWidth, de.scrollWidth),
                Math.max(d.body.offsetWidth, de.offsetWidth),
                Math.max(d.body.clientWidth, de.clientWidth)
            ),
            'winHeight' : de.clientHeight,
            'winWidth' : de.clientWidth
        };
    return o[key] || o;
};

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

cm.getRealX = function(o){
    var x = cm.getX(o),
        bodyScroll = false;
    while(o){
        if(o.tagName){
            bodyScroll = cm.getCSSStyle(o, 'position') == 'fixed' || bodyScroll;
            if(!/body|html/gi.test(o.tagName)){
                x -= (o.scrollLeft || 0);
            }
        }
        o = o.parentNode;
    }
    return x - (!bodyScroll ? cm.getBodyScrollLeft() : 0);
};

cm.getRealY = function(o){
    var y = cm.getY(o),
        bodyScroll = false;
    while(o){
        if(o.tagName){
            bodyScroll = cm.getCSSStyle(o, 'position') == 'fixed' || bodyScroll;
            if(!/body|html/gi.test(o.tagName)){
                y -= (o.scrollTop || 0);
            }
        }
        o = o.parentNode;
    }
    return y - (!bodyScroll ? cm.getBodyScrollTop() : 0);
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

cm.getRealHeight = function(node, applyHeight){
    var nodeHeight = 0,
        height = 0;
    nodeHeight = node.offsetHeight;
    node.style.height = 'auto';
    height = node.offsetHeight;
    node.style.height = typeof applyHeight == 'undefined' ? [nodeHeight, 'px'].join('') : applyHeight;
    return height;
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
            style[2] = cm.styleHash(style[0]);
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

cm.getCSSStyle = cm.getStyle = function(o, name, number){
    var obj = typeof o.currentStyle != 'undefined' ? o.currentStyle : document.defaultView.getComputedStyle(o, null),
        data;
    if(!obj){
        return 0;
    }
    if(number){
        data = parseFloat(obj[name].toString().replace(/(pt|px|%)/g, ''));
        data = isNaN(data)? 0 : data;
    }else{
        data = obj[name];
    }
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

cm.styleHash = function(line){
    line = line.replace(/\s/g, '');
    if(line == 'float'){
        line = ['cssFloat', 'styleFloat'];
    }else if(line.match('-')){
        var st = line.split('-');
        line = st[0] + st[1].replace(st[1].charAt(0), st[1].charAt(0).toUpperCase());
    }
    return line;
};

cm.setBodyScrollTop = function(num){
    document.documentElement.scrollTop = num;
    document.body.scrollTop = num;
};

cm.getBodyScrollLeft = function(){
    return Math.max(
        document.documentElement.scrollLeft,
        document.body.scrollLeft,
        0
    );
};

cm.getBodyScrollTop = function(){
    return Math.max(
        document.documentElement.scrollTop,
        document.body.scrollTop,
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
    var upper = cm.styleHash(style).replace(style.charAt(0), style.charAt(0).toUpperCase()),
        styles = [
            cm.styleHash(style),
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

    that.getTarget = function(){
        return obj;
    };

    that.go = function(){
        var args = cm.merge({
                'style' : '',
                'duration' : '',
                'anim' : 'simple',
                'animParams' : {},
                'onStop' : function(){
                }
            }, arguments[0]),
            pId = 'animation_process_' + Math.random(),
            delta = animationMethod[args.anim] || animationMethod['simple'],
            properties = [];

        for(var name in args.style){
            var value = args.style[name].toString();
            var dimension = getDimension(value);
            properties.push({
                'name' : name,
                'new' : prepareEndPosition(name, value),
                'dimension' : dimension,
                'old' : getStyle(name, dimension)
            });
        }

        var start = Date.now();
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
    };

    that.stop = function(){
        for(var i in processes){
            processes[i] = false;
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

    var getDimension = function(value){
        var pure = value.match(/\d+(\D*)/);
        return pure ? pure[1] : '';
    };

    var getStyle = function(name, dimension){
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
                }else if((dimension == '%' && /%/.test(obj.style[name])) || (dimension == 'px' && /px/.test(obj.style[name]))){
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
};

cm.transition = function(o){
    var config = cm.merge({
            'node' : null,
            'style' : [],			// array ['style','0','px','type']
            'duration' : 100,
            'type' : 'easy-in-out',
            'delayIn' : 0,
            'delayOut' : 30,
            'clear' : true,
            'onStop' : function(){
            }
        }, o),
        styles = [];
    // Prepare styles
    config['style'].forEach(function(item){
        item[3] = item[3] || o['type'];
        // Convert style to js format
        item[4] = cm.styleHash(item[0]);
        // Build transition format string
        styles.push([item[0], (config['duration'] / 1000 + 's'), item[3]].join(' '));
    });
    styles = styles.join(', ');
    // Start
    setTimeout(function(){
        if(cm.is('opera')){
            // Presto
            config['node'].style.OTransition = styles;
        }else if(cm.is('ff') && cm.isVersion() < 16){
            // Gecko
            config['node'].style.MozTransition = styles;
        }else if(cm.is('chrome') || cm.is('safari')){
            // Webkit
            config['node'].style.webkitTransition = styles;
        }
        // Default
        config['node'].style.transition = styles;
        // Set styles
        config['style'].forEach(function(item){
            config['node'].style[item[4]] = item[1] + item[2];
        });
    }, config['delayIn']);
    // End
    setTimeout(function(){
        if(config['clear']){
            if(cm.is('opera')){
                // Presto
                config['node'].style.OTransition = 'none 0s';
            }else if(cm.is('ff') && cm.isVersion() < 16){
                // Gecko
                config['node'].style.MozTransition = 'none 0s';
            }else if(cm.is('chrome') || cm.is('safari')){
                // Webkit
                config['node'].style.webkitTransition = 'none 0s';
            }
            // Default
            config['node'].style.transition = 'none 0s';
        }
        config['onStop']();
    }, (config['delayIn'] + config['duration'] + config['delayOut']));
};

/* ******* COOKIE & LOCAL STORAGE ******* */

cm.storageSet = function(key, value, cookie){
    cookie = cookie !== false;
    if(cm.isLocalStorage){
        try{
            localStorage.setItem(key, value);
        }catch(e){
        }
    }else if(cookie){
        cm.cookieSet(key, value);
    }
};

cm.storageGet = function(key, cookie){
    cookie = cookie !== false;
    if(cm.isLocalStorage){
        return localStorage.getItem(key);
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
            'type' : 'xml',                                         // text | xml | json
            'method' : 'post',                                      // post | get
            'params' : '',
            'url' : '',
            'httpRequestObject' : cm.createXmlHttpRequestObject(),
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'X-Requested-With' : 'XMLHttpRequest'
            },
            'withCredentials' : false,
            'beforeSend' : function(){},
            'handler' : function(){}
        }, o),
        responceType,
        responce;

    var init = function(){
        validate();
        send();
    };

    var validate = function(){
        config['type'] = config['type'].toLocaleLowerCase();
        responceType =  /text|json/.test(config['type']) ? 'responseText' : 'responseXML';
        config['method'] = config['method'].toLocaleLowerCase();
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
        config['httpRequestObject'].onreadystatechange = function(){
            if(config['httpRequestObject'].readyState == 4){
                responce = config['httpRequestObject'][responceType];
                if(config['type'] == 'json'){
                    responce = cm.parseJSON(responce);
                }
                config['handler'](responce, config['httpRequestObject'].status, config['httpRequestObject']);
            }
        };
        // Before send events
        config['beforeSend'](config['httpRequestObject']);
        // Send
        if(config['method'] == 'post'){
            config['httpRequestObject'].send(config['params']);
        }else{
            config['httpRequestObject'].send(null);
        }
    };

    init();
    return config['httpRequestObject'];
};

cm.parseJSON = function(str){
    var o;
    if(str){
        try{
            o = JSON.parse(str);
        }catch(e){
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

cm.defineHelper = function(name, data, handler){
    var that = this;

    that.data = cm.merge({
        'modules' : [],
        'params' : {},
        'events' : []
    }, data);

    that.className = name;
    that.classNameShort = that.className.replace('.', '');
    that.name = that.className.split('.');

    // Define default methods

    that.extendObject = {
        'modules' : that.data['modules'],
        'params' : that.data['params'],
        'className' : that.className,
        'classNameShort' : that.classNameShort
    };

    // Extend class

    cm.forEach(that.data['modules'], function(module){
        if(Mod[module]){
            cm.forEach(Mod[module], function(item, key){
                if(key === '_define'){
                    item.call(that);
                }else{
                    that.extendObject[key] = item;
                }
            });
        }
    });

    handler.prototype = that.extendObject;

    // Build class

    if(that.name.length == 1){
        window[that.name[0]] = handler;
    }else{
        if(!window[that.name[0]]){
            window[that.name[0]] = {};
        }
        window[that.name[0]][that.name[1]] = handler;
    }
};

cm.define = (function(){
    var definer = Function.prototype.call.bind(cm.defineHelper, arguments);
    return function(){
        definer.apply(cm.defineHelper, arguments);
    };
})();
