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
        'version' : '2.0.7'
    },
    Com = {
        'Elements' : {}
    };

/* ******* CHECK SUPPORT ******* */

cm.isFileReader = (function(){return 'FileReader' in window;})();
cm.isHistoryAPI = !!(window.history && history.pushState);
cm.isLocalStorage = (function(){try{return 'localStorage' in window && window['localStorage'] !== null;}catch(e){return false;}})();
cm.isCanvas = !!document.createElement("canvas").getContext;
cm.isTouch = 'ontouchstart' in document.documentElement || !!window.navigator.msMaxTouchPoints;

/* ******* COMPATIBILITY ******* */

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
            if(n != n){ // shortcut for verifying if it's NaN
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

/* ******* OBJECTS AND ARRAYS ******* */

cm.isArray = Array.isArray || function(a){
    return (a) ? a.constructor == Array : false;
};
cm.isObject = function(o){
    return (o) ? o.constructor == Object : false;
};

cm.forEach = function(o, handler){
    if(!o || !handler){
        return null;
    }
    switch(o.constructor){
        case Object:
            for(var key in o){
                if(o.hasOwnProperty(key)){
                    handler(o[key], key);
                }
            }
            break;
        case Array:
            o.forEach(handler);
            break;
        case Number:
            for(var i = 0; i < o; i++){
                handler(i);
            }
            break;
        default:
            try{
                Array.prototype.forEach.call(o, handler);
            }catch(e){
                try{
                    for(var i = 0, l = o.length; i < l; i++){
                        handler(o[i], i);
                    }
                }catch(e){}
            }
            break;
    }
    return o;
};

cm.merge = function(o1, o2){
    if(!o1 || typeof o1 == 'string' || typeof o1 == 'number'){
        o1 = {}
    }else{
        o1 = cm.clone(o1);
    }
    cm.forEach(o2, function(item, key){
        if(item != null){
            try{
                if(item.constructor == Object){
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

cm.clone = function(o){
    var newO;
    if(!o){
        return o;
    }
    // GO
    switch(o.constructor){
        case Function:
        case String:
        case Number:
        case RegExp:
            newO = o;
            break;
        case Array:
            newO = o.slice();
            break;
        case Object:
            newO = {};
            cm.forEach(o, function(item, key){
                newO[key] = cm.clone(item);
            });
            break;
        default:
            // Exceptions
            if(o.nodeType){
                newO = o;
            }else if(Object.prototype.toString.call(o) == '[object Object]' && o.constructor != Object){
                newO = o;
            }else{
                newO = [];
                cm.forEach(o, function(item){
                    newO.push(item);
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

cm.log = function(){
    var args = arguments, results = [];

    var log = function(){
        for(var i = 0, l = args.length; i < l; i++){
            results.push(args[i]);
        }
        alert(results.join(', '));
    };

    try{
        if("console" in window){
            console.log.apply(console.log, args);
        }else{
            log();
        }
    }catch(e){
        log();
    }
};

cm.dump = function(o){
    var node = cm.Node('div');
    for(var i in o){
        node.appendChild(
            cm.Node('div', [i, o[i]].join(': '))
        )
    }
    return node;
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

cm.onload = function(handler){
    try{
        cm.addEvent(window, 'load', handler);
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
    var nodes = [],
        isMany = cm.isArray(src),
        images = isMany ? src : [src],
        imagesLength = images.length,
        isLoad = 0,
        delay = delay || 0,
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
    return node && 'nodeType' in node;
};

cm.getEl = function(str){
    return document.getElementById(str);
};

cm.getByClass = function(str, node){
    var node = node || document;
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
        if(arguments[i]){
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

cm.getChilds = function(parent, handler){
    if(parent && handler){
        var els = parent.childNodes;
        for(var i = 0, l = els.length; i < l; i++){
            if(els[i] && els[i].nodeType == 1){
                handler(els[i]);
                cm.getChilds(els[i], handler);
            }
        }
    }
};

cm.getTextNodes = function(parent, handler){
    if(parent && handler){
        var els = parent.childNodes;
        for(var i = 0, l = els.length; i < l; i++){
            if(els[i].nodeType == 1){
                cm.getTextNodes(els[i], handler);
            }else if(els[i].nodeType == 3){
                handler(els[i]);
            }
        }
    }
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

cm.insertFirst = function(node, target){
    if(target.firstChild){
        cm.insertBefore(node, target.firstChild);
    }else{
        target.appendChild(node);
    }
    return node;
};

cm.appendChild = function(node, target){
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
    var data = [],
        elements = [
            o.getElementsByTagName('input'),
            o.getElementsByTagName('textarea'),
            o.getElementsByTagName('select')
        ];

    var getMultiplySelect = function(o){
        var opts = o.getElementsByTagName('option');
        var val = [];
        for(var i in opts){
            if(opts[i].selected){
                val.push(opts[i].value);
            }
        }
        return val;
    };

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
                        obj = next ? [arguments.callee(i + 1, obj)] : value;//obj = [next? arguments.callee(i+1, obj) : value]
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
                    setValue(elements[d][i].name, (elements[d][i].multiple) ? getMultiplySelect(elements[d][i]) : elements[d][i].value);
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
    var options = o.getElementsByTagName('option');
    for(var k = 0, ln = options.length; k < ln; k++){
        options[k].selected = (typeof(value) == 'object' ? cm.inArray(options[k++].value, value) : options[k++].value == value);
    }
    return true;
};

cm.toggleRadio = function(name, value, node){
    var node = node || document.body;
    var els = cm.getByName(name, node);
    for(var i = 0; i < els.length; i++){
        if(els[i].value == value){
            els[i].checked = true;
        }
    }
};

cm.getValue = function(name, node){
    var node = node || document.body, nodes = cm.getByName(name, node), value;
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
        throw new Error('Error. useragent.js is not exists or not loaded.');
    }
    return Com.UA.is(str);
};

cm.isVersion = function(){
    if(typeof Com.UA == 'undefined'){
        throw new Error('Error. useragent.js is not exists or not loaded.');
    }
    return Com.UA.isVersion();
};

cm.isMobile = function(){
    if(typeof Com.UA == 'undefined'){
        throw new Error('Error. useragent.js is not exists or not loaded.');
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
    return Math.floor(Math.random() * (min - max)) + min;
};
cm.rand2 = function(min, max){
    return Math.floor(Math.random() * (max - min) + min);
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

cm.getCurrentDate = function(){
    var date = new Date();
    return date.getFullYear() + '-' +
        ((date.getMonth() < 9) ? '0' : '') + (date.getMonth() + 1) + '-' +
        ((date.getDate() < 9) ? '0' : '') + (date.getDate()) + ' ' +
        ((date.getHours() < 10) ? '0' : '') + date.getHours() + ':' +
        ((date.getMinutes() < 10) ? '0' : '') + date.getMinutes() + ':' +
        ((date.getSeconds() < 10) ? '0' : '') + date.getSeconds();
};
cm.dateFormat = function(date, format, langs){
    var str = format,
        langs = cm.merge({
            'months' : [
                'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
                'October', 'November', 'December'
            ]
        }, langs),
        formats = function(date){
            return {
                '%d' : function(){
                    return date ? cm.addLeadZero(date.getDate()) : '00';
                },
                '%j' : function(){
                    return date ? date.getDate() : '00';
                },
                '%F' : function(){
                    return date ? langs['months'][date.getMonth()] : '00';
                },
                '%m' : function(){
                    return date ? cm.addLeadZero(date.getMonth() + 1) : '00';
                },
                '%n' : function(){
                    return date ? (date.getMonth() + 1) : '00';
                },
                '%Y' : function(){
                    return date ? date.getFullYear() : '0000';
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
    cm.forEach(formats(date), function(item, key){
        str = str.replace(key, item);
    });
    return str;
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

cm.replaceClass = function(node, oldClass, newClass){
    if(!node){
        return null;
    }
    return cm.addClass(cm.removeClass(node, oldClass), newClass);
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
    var x = cm.getX(o), bodyScroll = false;
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
    var y = cm.getY(o), bodyScroll = false;
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

cm.addStyles = function(node, str){
    var arr = str.replace(/\s/g, '').split(';'), style;

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

cm.animation = cm.Animation = function(o){
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
            delta = cm.easing(args.anim, args['duration']) || animationMethod[args.anim] || animationMethod['simple'],
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

// Bezier by Copyright (c) 2013 Arian Stolwijk https://github.com/arian/cubic-bezier

cm.bezier = function(x1, y1, x2, y2, epsilon){
    var curveX = function(t){
        var v = 1 - t;
        return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
    };

    var curveY = function(t){
        var v = 1 - t;
        return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
    };

    var derivativeCurveX = function(t){
        var v = 1 - t;
        return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (-t * t * t + 2 * v * t) * x2;
    };

    return function(t){
        var x = t, t0, t1, t2, x2, d2, i;
        // First try a few iterations of Newton's method -- normally very fast.
        for(t2 = x, i = 0; i < 8; i++){
            x2 = curveX(t2) - x;
            if(Math.abs(x2) < epsilon){
                return curveY(t2);
            }
            d2 = derivativeCurveX(t2);
            if(Math.abs(d2) < 1e-6){
                break;
            }
            t2 = t2 - x2 / d2;
        }

        t0 = 0;
        t1 = 1;
        t2 = x;

        if(t2 < t0){
            return curveY(t0);
        }
        if(t2 > t1){
            return curveY(t1);
        }

        // Fallback to the bisection method for reliability.
        while(t0 < t1){
            x2 = curveX(t2);
            if(Math.abs(x2 - x) < epsilon){
                return curveY(t2);
            }
            if(x > x2){
                t0 = t2;
            }else{
                t1 = t2;
            }
            t2 = (t1 - t0) * .5 + t0;
        }

        // Failure
        return curveY(t2);
    };
};

cm.easing = function(type, duration){
    var epsilon = (1000 / 60 / duration) / 4,
        types = {
            'easeIn' : function(progress){
                return Math.pow(progress, 3);
            },
            'easeOut' : function(progress){
                return 1 - types['easeIn'](1 - progress);
            },
            'easeInQuint' : cm.bezier(0.755, 0.05, 0.855, 0.06, epsilon),
            'easeInOutCubic' : cm.bezier(.64, .05, .35, 1, epsilon),
            'easeInOutQuart' : cm.bezier(0.77, 0, 0.175, 1, epsilon)
        };
    return types[type] || false;
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

cm.ajax = cm.altReq = function(){
    var o = cm.merge({
                'type' : 'xml',
                'method' : 'post',
                'params' : '',
                'url' : '',
                'httpRequestObject' : false
            },
            arguments[0]),
        type = (o.type && o.type.toLowerCase() == 'text') ? 'responseText' : 'responseXML',
        method = o.method || 'post',
        params = o.params || '',
        url = (method.toLowerCase() == 'post') ? o.url : o.url + params,
        httpRequestObject = o.httpRequestObject ? o.httpRequestObject : cm.createXmlHttpRequestObject();

    httpRequestObject.open(method, url, true);
    httpRequestObject.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
    httpRequestObject.onreadystatechange = (o.handler) ? function(){
        if(httpRequestObject.readyState == 4){
            o.handler(httpRequestObject[type], httpRequestObject.status)
        }
    } : null;
    (method.toLowerCase() == 'post') ? httpRequestObject.send(params) : httpRequestObject.send(null);
    return httpRequestObject;
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
        var k = prefix ? prefix + "[" + key + "]" : key, v = item;
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

cm.getTxtVal = function(o){
    return o.nodeType == 1 && o.firstChild ? o.firstChild.nodeValue : '';
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
        for(var i = 0; i < XmlHttpVersions.length && !xmlHttp; i++){
            try{
                xmlHttp = new ActiveXObject(XmlHttpVersions[i]);
            }catch(e){}
        }
    }
    if(!xmlHttp){
        alert("Error creating the XMLHttpRequest object.");
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

/* ******* OTHER ******* */
