cm.define('Com.Router', {
    'extend': 'Com.AbstractController',
    'events': [
        'onChangeStart',
        'onChange',
        'onChangeEnd'
    ],
    'params': {
        'renderStructure': false,
        'embedStructureOnRender': false,
        'controllerEvents': true,
        'customEvents': true,
        'route': null,
        'addLeadPoint': true,
        'catchRouteErrors': false,
        'summonRouteOnError': false,
    },
    'strings': {
        'errors': {
            'constructor_error': 'An error has occurred in the route "{route}" constructor "{constructor}".',
            'constructor_not_found': 'Route "{route}" constructor "{constructor}" is not defined.',
        },
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
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
            hash = !cm.isEmpty(window.location.hash) ? window.location.hash.slice(1) : null;
        // Check hash
        that.current.hash = hash;
        that.current.href = !cm.isEmpty(hash) ? [that.current.location, that.current.hash].join('#') : that.current.location;
        that.current.state = cm.clone(that.current.state);
        that.current.state.hash = hash;
        that.current.state.href = that.current.href;
        // Restore route state after somebody change hash
        window.history.replaceState(that.current.state, '', that.current.state.href);
    };

    /* *** PROCESS ROUTE *** */

    classProto.processLink = function(el){
        var that = this,
            href = el.getAttribute('href'),
            preventDefault = el.dataset.preventDefault;
        if(!cm.isEmpty(href) && preventDefault !== 'true'){
            var route = that.prepareRoute(href);
            that.pushRoute(route);
        }
    };

    classProto.pushRoute = function(route, params){
        var that = this,
            state;
        // Validate state
        if(cm.isEmpty(route)){
            route = that.current.route;
        }
        state = {
            'route' : route.route,
            'hash' : route.hash,
            'parameters' : route.parameters,
            'location' : that.prepareLocation(route.route, route.parameters),
            'match' : [],
            'params' : cm.merge({
                'pushState' : true,
                'replaceState' : false,
                'processRoute' : true
            }, params)
        };
        // Check hash
        state.href = !cm.isEmpty(state.hash) ? [state.location, state.hash].join('#') : state.location;
        // Parse parameters
        try {
            state.parameters = Object.fromEntries(
                new URLSearchParams(state.parameters)
            );
        } catch (e) {}
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
        if(state.params.processRoute){
            that.processRoute(state);
        }
        // Process hash
        if(!cm.isEmpty(state.hash)){
            window.location.hash = state.hash;
        }
    };

    classProto.processRoute = function(state){
        var that = this,
            routeItem = cm.clone(state),
            matchedRouteData;

        // Destruct old route
        that.destructRoute(that.current);

        // Match route
        matchedRouteData = that.getStateMatchedRoute(routeItem);
        // Is not found matched route
        if(cm.isEmpty(matchedRouteData)){
            matchedRouteData = {
                'hasAccess': true,
                'route': 'error',
                'item': that.get('error'),
            };
        }

        // Process route
        routeItem = cm.merge(matchedRouteData.item, routeItem);
        routeItem.state = state;
        if(matchedRouteData.match){
            routeItem.captures = that.mapCaptures(routeItem.map, matchedRouteData.match);
        }

        // Handle route redirect or route
        if(!cm.isEmpty(matchedRouteData.redirect)){
            if(cm.isArray(matchedRouteData.redirect)){
                that.redirect.apply(that, matchedRouteData.redirect);
            }else{
                that.redirect(matchedRouteData.redirect, {
                    'urlData' : routeItem.urlData,
                    'captures' : routeItem.captures,
                    'data' : routeItem.data
                });
            }
        }else{
            that.constructRoute(routeItem);
        }
    };

    classProto.getStateMatchedRoute = function(routeState){
        var that = this,
            matchedRouteData;
        // Match routes
        cm.forEach(that.routes, function(routeItem, route){
            var match = routeState.route.match(routeItem.regexp);
            if(match){
                routeItem = cm.clone(routeItem);
                routeState.match.push(routeItem);
                var routeData = {
                    'roure': route,
                    'item' : routeItem,
                    'match' : match,
                    'redirect' : that.getRouteRedirect(routeItem),
                    'access' : that.checkRouteAccess(routeItem)
                };
                if(routeData.redirect || routeData.access){
                    matchedRouteData = routeData
                }
            }
        });
        return matchedRouteData;
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
            constructor;
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
        }
        if(constructor){
            that.constructRouteController(routeItem, constructor);
        }else{
            routeItem.onConstruct(routeItem);
            routeItem.callback(routeItem);
        }
        that.triggerEvent('onChange', routeItem);
        that.triggerEvent('onChangeEnd', routeItem);
        return that;
    };

    classProto.constructRouteController = function(routeItem, constructor) {
        var that = this;

        // Bypass errors
        if (!that.params.catchRouteErrors) {
            cm.getConstructor(constructor, function(classConstructor) {
                routeItem.controller = new classConstructor(
                    cm.merge(routeItem.constructorParams, {
                        'container': that.params.container,
                        'route': routeItem
                    })
                );
                routeItem.controller.triggerEvent('onConstructComplete');
            });
            return;
        }

        // Catch errors
        var errorDetails;
        var errorMessage;
        var errorMessageData = {
            '{route}': routeItem.route,
            '{constructor}': constructor,
        };
        var classConstructor = cm.getConstructor(constructor, function(classConstructor) {
            try {
                routeItem.controller = new classConstructor(
                    cm.merge(routeItem.constructorParams, {
                        'container': that.params.container,
                        'route': routeItem
                    })
                );
                routeItem.controller.triggerEvent('onConstructComplete');
            } catch (err) {
                errorDetails = err;
                errorMessage = that.msg('errors.constructor_error', errorMessageData);
            }
        });
        if (cm.isEmpty(classConstructor)) {
            errorMessage = that.msg('errors.constructor_not_found', errorMessageData);
        }
        if (!cm.isEmpty(errorMessage)) {
            cm.errorLog({
                'type': 'error',
                'name': 'Com.Router',
                'message': errorMessage,
            });
            console.error(errorDetails);
            if (that.params.summonRouteOnError) {
                that.summon('error', null, {
                    'data': {
                        'code': 1404,
                        'message': errorMessage,
                        'error': errorDetails,
                    },
                });
            }
        }
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
        var parts = route.split('#');
        var url = parts[0].split('?');
        return {
            route: url[0],
            parameters: url[1],
            hash: parts[1],
        };
    };

    classProto.prepareLocation = function(route, parameters){
        var that = this,
            baseUrl = that.prepareBaseUrl(true);
        // Remove lead point
        route = route.replace(new RegExp('^\\.'), '');
        // Prepare url
        var url =  window.location.protocol + baseUrl + route;
        if (!cm.isEmpty(parameters)) {
            url = [url, parameters].join('?')
        }
        return url;
    };

    classProto.prepareExternalHref = function(route, params){
        var that = this;
        // Fill url params
        route = that.fillCaptures(route, params.urlParams);
        // Add hash
        if(!cm.isEmpty(params.hash)){
            route = [route, params.hash].join('#');
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

    classProto.getURL = function(route, params, urlParams){
        var that = this;
        if(cm.isEmpty(route)){
            return;
        }

        // Validate
        params = cm.merge({
            urlData: null,
            parameters: null,
            parametersConfig: null,
            hash: null,
            data: null,
        }, params);

        // ToDo: Remove legacy
        if(!cm.isEmpty(urlParams)){
            params.urlData = urlParams;
        }

        // Check route type
        var item = that.get(route);
        if(item){
            if(item.type === 'external'){
                return that.prepareExternalHref(item.href, params);
            }else{
                route = item.route;
            }
        }

        // Fill url params
        var url = that.fillCaptures(route, params.urlData);

        // Save into data storage
        that.dataStorage[url] = params.data;

        // Add lead slash if not exists
        if(!/^(\/|\.\/)/.test(url)){
            url = '/' + url;
        }

        // Add lead point if not exists
        if(that.params.addLeadPoint && !/^\./.test(url)){
            url = '.' + url;
        }

        // Add parameters
        if (!cm.isEmpty(params.parameters)) {
            if (cm.isObject(params.parameters)) {
                params.parameters = cm.obj2URI(params.parameters, params.parametersConfig);
            }
            url = [url, params.parameters].join('?')
        }

        // Add hash
        if(!cm.isEmpty(params.hash)){
            url = [url, params.hash].join('#');
        }
        return url;
    };

    classProto.getFullURL = function(route, params, urlParams){
        var that = this;
        return that.prepareLocation(that.getURL(route, params, urlParams));
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

    classProto.set = function(route, params){
        var that = this;

        // Validate params
        params = cm.merge({
            urlData: null,
            parameters: null,
            parametersConfig: null,
            hash: null,
            captures: null,
            assignLocation: false
        }, params);
        if (cm.isEmpty(params.urlData)) {
            params.urlData = params.captures;
        }

        // Get route item
        var routeItem = that.get(route);
        if(routeItem && routeItem.type === 'external'){
            params.assignLocation = true;
        }

        // Get route url
        var url = that.getURL(route, params);

        // Assign new location or push/replace history state
        if(params.assignLocation){
            window.location.assign(url);
        }else{
            that.setURL(url, params);
        }
        return that;
    };

    classProto.setURL = function(url, params){
        var that = this;
        var route = that.prepareRoute(url);
        that.pushRoute(route, params);
        return that;
    };

    classProto.summon = function(route, params){
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

    classProto.redirect = function(route, params){
        var that = this;
        // Override push / replace state
        params = cm.merge(params, {
            'pushState' : false,
            'replaceState' : true
        });
        that.set(route, params);
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
                });
            }
            delete that.routes[route];
        }
        return that;
    };

    classProto.start = function(route, params) {
        var that = this;
        route = !cm.isUndefined(route) ? route : that.params.route;
        params = cm.merge({
            'pushState': false,
            'replaceState': true
        }, params);
        if (!cm.isEmpty(route)) {
            that.set(route, params);
        } else {
            that.setURL(window.location.href, params);
        }
        return that;
    };
});
