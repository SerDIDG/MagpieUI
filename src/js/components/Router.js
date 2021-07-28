cm.define('Com.Router', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onChangeStart',
        'onChange',
        'onChangeEnd'
    ],
    'params' : {
        'renderStructure' : false,
        'embedStructureOnRender' : false,
        'controllerEvents' : true,
        'customEvents' : true,
        'route' : null,
        'addLeadPoint' : true
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.Router', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        // Variables
        that.routes = {};
        that.routesBinds = {};
        that.dataStorage = {};
        that.current = null;
        that.previous = null;
        // Bind
        that.windowClickEventHandler = that.windowClickEvent.bind(that);
        that.popstateEventHandler = that.popstateEvent.bind(that);
        that.hashchangeEventHandler = that.hashchangeEvent.bind(that);
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onSetEvents = function(){
        var that = this;
        cm.addEvent(window, 'click', that.windowClickEventHandler);
        cm.addEvent(window, 'popstate', that.popstateEventHandler);
        cm.addEvent(window, 'hashchange', that.hashchangeEventHandler);
    };

    classProto.onUnsetEvents = function(){
        var that = this;
        cm.removeEvent(window, 'click', that.windowClickEventHandler);
        cm.removeEvent(window, 'popstate', that.popstateEventHandler);
        cm.removeEvent(window, 'hashchange', that.hashchangeEventHandler);
    };

    /* *** PROCESS EVENTS *** */

    classProto.windowClickEvent = function(e){
        var that = this,
            target;
        // Process route only on LMB without pressed ctrl or meta keys
        if(e.button || e.metaKey || e.ctrlKey){
            return;
        }
        // Get event target
        target = cm.getEventTarget(e);
        target = that.getTargetLink(target);
        // Process route only on inner link
        if(cm.isTagName(target, 'a')){
            cm.preventDefault(e);
            that.processLink(target);
        }
    };

    classProto.getTargetLink = function(el){
        var that = this;
        if(!cm.isElementNode(el)){
            return false;
        }
        if(
            el.tagName.toLowerCase() === 'a' &&
            el.target !== "_blank" &&
            that.prepareUrl(el.href).indexOf(that.prepareBaseUrl()) !== -1
        ){
            return el;
        }
        el = that.getTargetLink(el.parentNode);
        if(!cm.isElementNode(el)){
            return false;
        }
        return el;
    };

    classProto.popstateEvent = function(e){
        var that = this,
            state = e.state;
        if(state){
            that.processRoute(state);
        }
    };

    classProto.hashchangeEvent = function(e){
        var that = this,
            hash = null;
        if(!cm.isEmpty(window.location.hash)){
            hash = window.location.hash.slice(1);
        }
        // Check hash
        that.current.hash = hash;
        that.current.state.hash = hash;
        that.current.href = !cm.isEmpty(hash) ? [that.current.location, that.current.hash].join('#') : that.current.location;
        that.current.state.href = that.current.href;
        // Restore route state after somebody change hash
        window.history.replaceState(that.current.state, '', that.current.state.href);
    };

    /* *** PROCESS ROUTE *** */

    classProto.processLink = function(el){
        var that = this,
            href = el.getAttribute('href');
        if(!cm.isEmpty(href)){
            href = that.prepareRoute(href);
            that.pushRoute(href[0], href[1]);
        }
    };

    classProto.pushRoute = function(route, hash, params){
        var that = this,
            state;
        // Validate state
        if(cm.isEmpty(route)){
            route = that.current.route;
        }
        state = {
            'route' : route,
            'hash' : hash,
            'location' : that.prepareHref(route),
            'match' : [],
            'params' : cm.merge({
                'pushState' : true,
                'replaceState' : false
            }, params)
        };
        // Check hash
        state.href = !cm.isEmpty(state.hash) ? [state.location, state.hash].join('#') : state.location;
        // Check data storage
        state.data = that.getStorageData(state.route, state, state.params.data);
        // Set scroll
        cm.setBodyScrollTop(0);
        // Set Window URL
        if(state.params.replaceState){
            window.history.replaceState(state, '', state.location);
        }else if(state.params.pushState){
            window.history.pushState(state, '', state.location);
        }
        // Process route
        that.processRoute(state);
        // Process hash
        if(!cm.isEmpty(state.hash)){
            window.location.hash = state.hash;
        }
    };

    classProto.processRoute = function(state){
        var that = this,
            matchedRouteData,
            routeItem;
        // Destruct old route
        that.destructRoute(that.current);
        // Match route
        matchedRouteData = that.getStateMatchedRoute(state);
        // Is not found matched route
        if(cm.isEmpty(matchedRouteData)){
            matchedRouteData = {
                'hasAccess' : true,
                'route' : 'error',
                'item' : that.get('error')
            };
        }
        // Process route
        routeItem = cm.merge(matchedRouteData.item, state);
        routeItem.state = state;
        if(matchedRouteData.match){
            routeItem.captures = that.mapCaptures(routeItem.map, matchedRouteData.match);
        }
        // Handle route redirect or route
        if(!cm.isEmpty(matchedRouteData.redirect)){
            if(cm.isArray(matchedRouteData.redirect)){
                that.redirect.apply(that, matchedRouteData.redirect);
            }else{
                that.redirect(matchedRouteData.redirect, null, {
                    'urlParams' : routeItem.urlParams,
                    'captures' : routeItem.captures,
                    'data' : routeItem.data
                });
            }
        }else{
            that.constructRoute(routeItem);
        }
    };

    classProto.getStateMatchedRoute = function(state){
        var that = this,
            match,
            routeData,
            mathedRouteData;
        // Match routes
        cm.forEach(that.routes, function(routeItem, route){
            match = state.route.match(routeItem.regexp);
            if(match){
                routeItem = cm.clone(routeItem);
                state.match.push(routeItem);
                routeData = {
                    'roure': route,
                    'item' : routeItem,
                    'match' : match,
                    'redirect' : that.getRouteRedirect(routeItem),
                    'access' : that.checkRouteAccess(routeItem)
                };
                if(routeData.redirect || routeData.access){
                    mathedRouteData = routeData
                }
            }
        });
        return mathedRouteData;
    };

    classProto.destructRoute = function(routeItem){
        var that = this;
        // Export
        that.previous = routeItem;
        // Callbacks
        if(routeItem){
            if(routeItem.constructor){
                routeItem.controller && routeItem.controller.destruct && routeItem.controller.destruct();
            }else{
                routeItem.onDestruct(routeItem);
                routeItem.callback(routeItem);
            }
        }
        return that;
    };

    classProto.constructRoute = function(routeItem){
        var that = this,
            constructor,
            constructorParams;
        that.triggerEvent('onChangeStart', routeItem);
        // Export
        that.current = routeItem;
        // Callbacks
        if(!cm.isEmpty(routeItem.constructor)){
            if(cm.isObject(routeItem.constructor)){
                cm.forEach(routeItem.constructor, function(item, key){
                    if(that.checkRoleAccess(key)){
                        constructor = item;
                    }
                });
            }else{
                constructor = routeItem.constructor;
            }
            if(cm.isObject(routeItem.constructorParams)){
                cm.forEach(routeItem.constructorParams, function(item, key){
                    if(that.checkRoleAccess(key)){
                        constructorParams = item;
                    }
                });
            }else{
                constructorParams = routeItem.constructorParams;
            }
        }
        if(constructor){
            cm.getConstructor(constructor, function(classConstructor){
                routeItem.controller = new classConstructor(
                    cm.merge(constructorParams, {
                        'container' : that.params.container,
                        'route' : routeItem
                    })
                );
                routeItem.controller.triggerEvent('onConstructComplete');
            });
        }else{
            routeItem.onConstruct(routeItem);
            routeItem.callback(routeItem);
        }
        that.triggerEvent('onChange', routeItem);
        that.triggerEvent('onChangeEnd', routeItem);
        return that;
    };

    classProto.getRouteRedirect = function(routeItem){
        var that = this,
            routeRedirect;
        if(!cm.isEmpty(routeItem.redirectTo)){
            if(cm.isObject(routeItem.redirectTo)){
                cm.forEach(routeItem.redirectTo, function(item, role){
                    if(that.checkRoleAccess(role)){
                        routeRedirect = item;
                    }
                });
            }else{
                routeRedirect = routeItem.redirectTo;
            }
        }
        if(cm.isFunction(routeRedirect)){
            routeRedirect = routeRedirect(routeItem);
        }
        return routeRedirect;
    };

    /* *** HELPERS *** */

    classProto.prepareUrl = function(url){
        var that = this;
        url = url
            .replace(new RegExp('^(http|https):'), '')
            .replace(new RegExp('^//www\\.'), '//');
        return url;
    };

    classProto.prepareBaseUrl = function(www){
        var that = this,
            hasWWW = new RegExp('^www.').test(window.location.host),
            baseUrl = that.prepareUrl(cm._baseUrl);
        if(www && hasWWW){
            baseUrl = baseUrl.replace(new RegExp('^//'), '//www.');
        }
        return baseUrl;
    };

    classProto.prepareRoute = function(route){
        var that = this,
            baseUrl = that.prepareBaseUrl();
        route = that.prepareUrl(route)
            .replace(new RegExp('^' + baseUrl), '')
            .replace(new RegExp('^\\.'), '');
        // Add lead slash if not exists
        if(!/^(\/|\.\/)/.test(route)){
            route = '/' + route;
        }
        // Split hash
        route = route.split('#');
        return route;
    };

    classProto.prepareHref = function(route){
        var that = this,
            baseUrl = that.prepareBaseUrl(true);
        // Remove lead point
        route = route.replace(new RegExp('^\\.'), '');
        return window.location.protocol + baseUrl + route;
    };

    classProto.prepareExternalHref = function(route, hash, urlParams){
        var that = this;
        // Fill url params
        route = that.fillCaptures(route, urlParams);
        // Add hash
        if(!cm.isEmpty(hash)){
            route = [route, hash].join('#');
        }
        return route;
    };

    classProto.getMap = function(route){
        var machRX = /({(\w+)})/g,
            map = {},
            count = 0,
            match;
        while(match = machRX.exec(route)){
            count++;
            if(match[2]){
                map[count] = match[2];
            }
        }
        return map;
    };

    classProto.mapCaptures = function(map, captures) {
        var result = {};
        cm.forEach(map, function(id, key){
            result[id] = captures[key];
        });
        return result;
    };

    classProto.fillCaptures = function(route, params){
        return cm.fillVariables(route, params);
    };

    classProto.checkRouteAccess = function(route){
        var that = this;
        return route ? that.checkRoleAccess(route.access) : false;
    };

    classProto.checkRoleAccess = function(role){
        var that = this;
        return true;
    };

    classProto.getStorageData = function(route, routeItem, paramsData){
        var that = this,
            data = {};
        // Get default route data
        if(routeItem){
            data = cm.merge(data, routeItem.data);
        }
        // Check data storage
        if(that.dataStorage[route]){
            data = cm.merge(data, that.dataStorage[route]);
            that.dataStorage = {};
        }
        // Override data
        data = cm.merge(data, paramsData);
        return data;
    };

    /* *** PUBLIC *** */

    classProto.embed = function(node){
        var that = this;
        that.params.container = node;
    };

    classProto.add = function(route, params){
        var that = this,
            item = cm.merge({
                'type' : 'internal',        // internal | external
                'route' : route,
                'originRoute' : route,
                'name' : null,
                'access' : 'all',
                'pattern' : '([^\\/]+?)',
                'regexp' : null,
                'map' : [],
                'captures' : {},
                'href' : null,
                'redirectTo' : null,
                'data' : {},
                'urlParams' : {},
                //'pushState' : true,
                //'replaceState' : false,
                'constructor' : false,
                'constructorParams' : {},
                'callback' : function(){},
                'onConstruct' : function(){},
                'onDestruct' : function(){}
            }, params);
        // RegExp
        item.regexp = new RegExp('^' + route.replace(/({\w+})/g, item.pattern) + '$');
        item.map = that.getMap(route);
        // Binds
        if(cm.isString(item.name)){
            that.routesBinds[item.name] = route;
        }else if(cm.isArray(item.name)){
            cm.forEach(item.name, function(name){
                that.routesBinds[name] = route;
            });
        }
        // Export
        that.routes[route] = item;
        return that;
    };

    classProto.get = function(route){
        var that = this;
        if(that.routesBinds[route]){
            route = that.routesBinds[route];
        }
        return that.routes[route];
    };

    classProto.getURL = function(route, hash, urlParams, data){
        var that = this,
            item = that.get(route);
        // Check route type
        if(item){
            if(item.type === 'external'){
                route = item.href;
                return that.prepareExternalHref(route, hash, urlParams);
            }else{
                route = item.route;
            }
        }
        // Fill url params
        route = that.fillCaptures(route, urlParams);
        // Save into data storage
        that.dataStorage[route] = data;
        // Add lead slash if not exists
        if(!/^(\/|\.\/)/.test(route)){
            route = '/' + route;
        }
        // Add lead point if not exists
        if(that.params.addLeadPoint && !/^\./.test(route)){
            route = '.' + route;
        }
        // Add hash
        if(!cm.isEmpty(hash)){
            route = [route, hash].join('#');
        }
        return route;
    };

    classProto.getFullURL = function(route, hash, urlParams, data){
        var that = this;
        return that.prepareHref(that.getURL(route, hash, urlParams, data));
    };

    classProto.getRedirect = function(route){
        var that = this,
            item = that.get(route),
            redirect;
        if(item){
            redirect = that.getRouteRedirect(item);
        }
        return redirect;
    };

    classProto.getCurrent = function(){
        var that = this;
        return that.current;
    };

    classProto.getPrevious = function(){
        var that = this;
        return that.previous;
    };

    classProto.checkAccess = function(route){
        var that = this,
            item = that.get(route);
        return that.checkRouteAccess(item);
    };

    classProto.set = function(route, hash, params){
        var that = this,
            urlParams = !cm.isEmpty(params.urlParams) ? params.urlParams : params.captures,
            href = that.getURL(route, hash, urlParams);
        // Important to override push / replace state params in this case
        params = cm.merge(params, {
            'pushState' : false,
            'replaceState' : true
        });
        that.setURL(href, hash, params);
        return that;
    };

    classProto.setURL = function(route, hash, params){
        var that = this;
        route = that.prepareRoute(route);
        that.pushRoute(route[0], hash || route[1], params);
        return that;
    };

    classProto.summon = function(route, hash, params){
        var that = this,
            state,
            item;
        // Params
        params = cm.merge({
            'data' : {}
        }, params);
        // Get route
        if(that.routesBinds[route]){
            route = that.routesBinds[route];
        }
        // Get item
        if(that.routes[route]){
            item = that.routes[route];
            // Process state
            state = cm.clone(item);
            state.params = cm.merge(state.params, params);
            state.data = that.getStorageData(state.route, state, params.data);
            // Process route
            that.destructRoute(that.current);
            that.constructRoute(state);
        }
        return that;
    };

    classProto.redirect = function(route, hash, params){
        var that = this;
        // Override push / replace state
        params = cm.merge(params, {
            'pushState' : false,
            'replaceState' : true
        });
        that.set(route, hash, params);
        return that;
    };

    classProto.remove = function(route){
        var that = this,
            item;
        if(that.routesBinds[route]){
            route = that.routesBinds[route];
        }
        if(that.routes[route]){
            item = that.routes[route];
            if(cm.isString(item.name)){
                delete that.routesBinds[item.name];
            }else if(cm.isArray(item.name)){
                cm.forEach(item.name, function(name){
                    delete that.routesBinds[name];
                })
            }
            delete that.routes[route];
        }
        return that;
    };

    classProto.start = function(route, hash, params){
        var that = this;
        route = !cm.isUndefined(route) ? route : that.params.route;
        params = cm.merge({
            'pushState' : false,
            'replaceState' : true
        }, params);
        if(!cm.isEmpty(route)){
            that.set(route, hash, params);
        }else{
            that.setURL(window.location.href, hash, params);
        }
        return that;
    };
});
