cm.define('Com.Router', {
    extend: 'Com.AbstractController',
    events: [
        'onChangeStart',
        'onChange',
        'onChangeEnd'
    ],
    params: {
        renderStructure: false,
        embedStructureOnRender: false,
        controllerEvents: true,
        customEvents: true,
        route: null,
        addLeadPoint: true,
        catchRouteErrors: false,
        summonRouteOnError: false,
    },
    strings: {
        errors: {
            constructor_error: 'An error has occurred in the route "{route}" constructor "{constructor}".',
            constructor_not_found: 'Route "{route}" constructor "{constructor}" is not defined.',
        },
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.Router', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function() {
        const that = this;

        // Variables
        that.routes = {};
        that.routesBinds = {};
        that.dataStorage = {};
        that.current = null;
        that.previous = null;

        // Context binds
        that.windowClickEventHandler = that.windowClickEvent.bind(that);
        that.popstateEventHandler = that.popstateEvent.bind(that);
        that.hashchangeEventHandler = that.hashchangeEvent.bind(that);

        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onSetEvents = function() {
        const that = this;
        cm.addEvent(window, 'click', that.windowClickEventHandler);
        cm.addEvent(window, 'popstate', that.popstateEventHandler);
        cm.addEvent(window, 'hashchange', that.hashchangeEventHandler);
    };

    classProto.onUnsetEvents = function() {
        const that = this;
        cm.removeEvent(window, 'click', that.windowClickEventHandler);
        cm.removeEvent(window, 'popstate', that.popstateEventHandler);
        cm.removeEvent(window, 'hashchange', that.hashchangeEventHandler);
    };

    /* *** PROCESS EVENTS *** */

    classProto.windowClickEvent = function(e) {
        const that = this;

        // Process route only on LMB without pressed ctrl or meta keys
        if (e.button || e.metaKey || e.ctrlKey) return;

        // Process route only on inner link
        const target = that.getTargetLink(cm.getEventTarget(e));
        if (!target) return;

        const noRouteProcess = target.dataset.noRouteProcess;
        if (noRouteProcess !== 'true') {
            cm.preventDefault(e);
            that.processLink(target);
        }
    };

    classProto.getTargetLink = function(el) {
        const that = this;
        if (!cm.isElementNode(el)) {
            return false;
        }

        if (
            cm.isTagName(el, 'a') &&
            el.target !== "_blank" &&
            that.prepareUrl(el.href).indexOf(that.prepareBaseUrl()) !== -1
        ) {
            return el;
        }

        return that.getTargetLink(el.parentNode);
    };

    classProto.popstateEvent = function(e) {
        const that = this;
        const state = e.state;
        if (state) {
            that.processRoute(state);
        }
    };

    classProto.hashchangeEvent = function(e) {
        const that = this;
        const hash = !cm.isEmpty(window.location.hash) ? window.location.hash.slice(1) : null;

        // Check hash
        that.current.hash = hash;
        that.current.pathHash = that.prepareHash(that.current.path, that.current.hash);
        that.current.href = that.prepareHash(that.current.location, that.current.hash);

        that.current.state = cm.clone(that.current.state);
        that.current.state.hash = hash;
        that.current.state.pathHash = that.current.pathHash;
        that.current.state.href = that.current.href;

        // Restore route state after somebody change hash
        window.history.replaceState(that.current.state, '', that.current.state.href);
    };

    /* *** PROCESS ROUTE *** */

    classProto.processLink = function(el) {
        const that = this;

        const preventDefault = el.dataset.preventDefault;
        if (preventDefault === 'true') {
            cm.errorLog({
                type: 'attention',
                name: 'Com.Router:processLink',
                message: 'Link data attribute "preventDefault" is deprecated. Use "noRoute" instead.',
            });
        }

        const href = el.getAttribute('href');
        const noRoute = el.dataset.noRoute;
        if (!cm.isEmpty(href) && preventDefault !== 'true' && noRoute !== 'true') {
            const route = that.prepareRoute(href);
            that.pushRoute(route);
        }
    };

    classProto.pushRoute = function(route, params) {
        const that = this;

        // Validate state
        if (cm.isEmpty(route)) {
            route = that.current.route;
        }

        const state = {
            route: route.route,
            hash: route.hash,
            parameters: route.parameters,
            match: [],
            params: cm.merge({
                processRoute: true,
                pushState: true,
                replaceState: false,
            }, params)
        };

        // Path
        state.path = that.preparePath(state.route, state.parameters);
        state.location = that.prepareHref(state.route, state.parameters);

        // Check hash
        state.pathHash = that.prepareHash(state.path, state.hash);
        state.href = that.prepareHash(state.location, state.hash);

        // Parse parameters
        state.originParameters = state.parameters;
        try {
            state.parameters = Object.fromEntries(
                new URLSearchParams(state.originParameters)
            );
        } catch {}

        // Check data storage
        state.data = that.getStorageData(state.route, state, state.params.data);

        // Reset document scroll top
        cm.setBodyScrollTop(0);

        // Set Window URL
        if (state.params.replaceState) {
            window.history.replaceState(state, '', state.location);
        } else if (state.params.pushState) {
            window.history.pushState(state, '', state.location);
        }

        // Process route
        if (state.params.processRoute) {
            that.processRoute(state);
        }

        // Process hash
        if (!cm.isEmpty(state.hash)) {
            window.location.hash = state.hash;
        }
    };

    classProto.processRoute = function(state) {
        const that = this;
        let routeItem = cm.clone(state);

        // Destruct old route
        that.destructRoute(that.current);

        // Match route
        let matchedRouteData = that.getStateMatchedRoute(routeItem);

        // Is not found matched route
        if (cm.isEmpty(matchedRouteData)) {
            matchedRouteData = {
                hasAccess: true,
                route: 'error',
                item: that.get('error'),
            };
        }

        // Process route
        routeItem = cm.merge(matchedRouteData.item, routeItem);
        routeItem.state = state;
        if (matchedRouteData.match) {
            routeItem.captures = that.mapCaptures(routeItem.map, matchedRouteData.match);
        }

        // Handle route redirect or route
        if (!cm.isEmpty(matchedRouteData.redirect)) {
            if (cm.isArray(matchedRouteData.redirect)) {
                that.redirect.apply(that, matchedRouteData.redirect);
            } else {
                that.redirect(matchedRouteData.redirect, null, {
                    urlParams: routeItem.urlParams,
                    captures: routeItem.captures,
                    parameters: routeItem.parameters,
                    data: routeItem.data
                });
            }
        } else {
            that.constructRoute(routeItem);
        }
    };

    classProto.getStateMatchedRoute = function(routeState) {
        const that = this;

        // Match routes
        let matchedRouteData;
        cm.forEach(that.routes, (routeItem, route) => {
            const match = routeState.route.match(routeItem.regexp);
            if (!match) return;

            routeItem = cm.clone(routeItem);
            routeState.match.push(routeItem);
            const routeData = {
                roure: route,
                item: routeItem,
                match: match,
                redirect: that.getRouteRedirect(routeItem),
                access: that.checkRouteAccess(routeItem)
            };
            if (routeData.redirect || routeData.access) {
                matchedRouteData = routeData
            }
        });

        return matchedRouteData;
    };

    classProto.destructRoute = function(routeItem) {
        const that = this;

        // Set previous route variable
        that.previous = routeItem;

        // Callbacks
        if (routeItem) {
            if (routeItem.constructor) {
                routeItem.controller?.destruct?.();
            } else {
                routeItem.onDestruct(routeItem);
                routeItem.callback(routeItem);
            }
        }

        return that;
    };

    classProto.constructRoute = function(routeItem) {
        const that = this;
        that.triggerEvent('onChangeStart', routeItem);

        // Set current route variable
        that.current = routeItem;

        // Callbacks
        let constructor;
        if (!cm.isEmpty(routeItem.constructor)) {
            if (cm.isObject(routeItem.constructor)) {
                cm.forEach(routeItem.constructor, (item, key) => {
                    if (that.checkRoleAccess(key)) {
                        constructor = item;
                    }
                });
            } else {
                constructor = routeItem.constructor;
            }
        }

        if (constructor) {
            that.constructRouteController(routeItem, constructor);
        } else {
            routeItem.onConstruct(routeItem);
            routeItem.callback(routeItem);
        }

        that.triggerEvent('onChange', routeItem);
        that.triggerEvent('onChangeEnd', routeItem);
        return that;
    };

    classProto.constructRouteController = function(routeItem, constructor) {
        const that = this;

        // Bypass errors
        if (!that.params.catchRouteErrors) {
            cm.getConstructor(constructor, classConstructor => {
                routeItem.controller = new classConstructor(
                    cm.merge(routeItem.constructorParams, {
                        container: that.params.container,
                        route: routeItem
                    })
                );
                routeItem.controller.triggerEvent('onConstructComplete');
            });
            return;
        }

        // Catch errors
        let errorDetails;
        let errorMessage;
        let errorMessageData = {
            '{route}': routeItem.route,
            '{constructor}': constructor,
        };

        const classConstructor = cm.getConstructor(constructor, classConstructor => {
            try {
                routeItem.controller = new classConstructor(
                    cm.merge(routeItem.constructorParams, {
                        container: that.params.container,
                        route: routeItem
                    })
                );
                routeItem.controller.triggerEvent('onConstructComplete');
            } catch (e) {
                errorDetails = e;
                errorMessage = that.msg('errors.constructor_error', errorMessageData);
            }
        });

        if (cm.isEmpty(classConstructor)) {
            errorMessage = that.msg('errors.constructor_not_found', errorMessageData);
        }

        if (!cm.isEmpty(errorMessage)) {
            cm.errorLog({
                type: 'error',
                name: 'Com.Router',
                message: errorMessage,
            });
            console.error(errorDetails);

            if (that.params.summonRouteOnError) {
                that.summon('error', null, {
                    data: {
                        code: 1404,
                        message: errorMessage,
                        error: errorDetails,
                    },
                });
            }
        }
    };

    classProto.getRouteRedirect = function(routeItem) {
        const that = this;

        let routeRedirect;
        if (!cm.isEmpty(routeItem.redirectTo)) {
            if (cm.isObject(routeItem.redirectTo)) {
                cm.forEach(routeItem.redirectTo, (item, role) => {
                    if (that.checkRoleAccess(role)) {
                        routeRedirect = item;
                    }
                });
            } else {
                routeRedirect = routeItem.redirectTo;
            }
        }

        if (cm.isFunction(routeRedirect)) {
            routeRedirect = routeRedirect(routeItem);
        }

        return routeRedirect;
    };

    /* *** HELPERS *** */

    classProto.prepareUrl = function(url) {
        const that = this;
        return url
            .replace(new RegExp('^(http|https):'), '')
            .replace(new RegExp('^//www\\.'), '//');
    };

    classProto.prepareBaseUrl = function(www) {
        const that = this;
        const hasWWW = new RegExp('^www.').test(window.location.host);
        const baseUrl = that.prepareUrl(cm._baseUrl);
        if (www && hasWWW) {
            return baseUrl.replace(new RegExp('^//'), '//www.');
        }
        return baseUrl;
    };

    classProto.prepareRoute = function(route) {
        const that = this;
        const baseUrl = that.prepareBaseUrl();

        // Prepare route url
        route = that.prepareUrl(route)
            .replace(new RegExp('^' + baseUrl), '')
            .replace(new RegExp('^\\.'), '');

        // Add lead slash if not exists
        if (!/^(\/|\.\/)/.test(route)) {
            route = '/' + route;
        }

        // Split hash and search parameters
        const parts = route.split('#');
        const url = parts[0].split('?');
        return {
            route: url[0],
            parameters: url[1],
            hash: parts[1],
        };
    };

    classProto.prepareHref = function(route, parameters) {
        const that = this;

        // Remove lead point
        route = route.replace(new RegExp('^\\.'), '');

        // Prepare url
        const baseUrl = that.prepareBaseUrl(true);
        const url = window.location.protocol + baseUrl + route;
        return that.preparePath(url, parameters);
    };

    classProto.preparePath = function(url, parameters) {
        const that = this;
        if (!cm.isEmpty(parameters)) {
            url = [url, parameters].join('?');
        }
        return url;
    };

    classProto.prepareHash = function(url, hash) {
        const that = this;
        if (!cm.isEmpty(hash)) {
            url = [url, hash].join('#');
        }
        return url;
    };

    classProto.prepareExternalHref = function(route, hash, urlParams, params) {
        const that = this;

        // Validate params
        params = cm.merge({
            parameters: null,
        }, params);

        if (cm.isObject(params.parameters)) {
            params.parameters = cm.obj2URI(params.parameters);
        }

        // Fill url params
        route = that.fillCaptures(route, urlParams);

        // Add parameters
        route = that.preparePath(route, params.parameters);

        // Add hash
        return that.prepareHash(route, hash);
    };

    classProto.getMap = function(route) {
        const regExp = /({(\w+)})/g;
        const map = {};

        let count = 0;
        let match;
        while (match = regExp.exec(route)) {
            count++;
            if (match[2]) {
                map[count] = match[2];
            }
        }

        return map;
    };

    classProto.mapCaptures = function(map, captures) {
        const result = {};
        cm.forEach(map, (id, key) => {
            result[id] = captures[key];
        });
        return result;
    };

    classProto.fillCaptures = function(route, params) {
        return cm.fillVariables(route, params);
    };

    classProto.checkRouteAccess = function(route) {
        const that = this;
        return route ? that.checkRoleAccess(route.access) : false;
    };

    classProto.checkRoleAccess = function(role) {
        const that = this;
        return true;
    };

    classProto.getStorageData = function(route, routeItem, paramsData) {
        const that = this;
        let data = {};

        // Get default route data
        if (routeItem) {
            data = cm.merge(data, routeItem.data);
        }

        // Check data storage
        if (that.dataStorage[route]) {
            data = cm.merge(data, that.dataStorage[route]);
            that.dataStorage = {};
        }

        // Override data
        data = cm.merge(data, paramsData);
        return data;
    };

    /* *** PUBLIC *** */

    classProto.embed = function(node) {
        const that = this;
        that.params.container = node;
    };

    classProto.add = function(route, params) {
        const that = this;
        const item = cm.merge({
            type: 'internal',        // internal | external
            route: route,
            originRoute: route,
            name: null,
            access: 'all',
            pattern: '([^\\/]+?)',
            regexp: null,
            map: [],
            captures: {},
            href: null,
            redirectTo: null,
            data: {},
            urlParams: {},
            //'pushState' : true,
            //'replaceState' : false,
            constructor: false,
            constructorParams: {},
            callback: function() {},
            onConstruct: function() {},
            onDestruct: function() {}
        }, params);

        // RegExp
        item.regexp = new RegExp('^' + route.replace(/({\w+})/g, item.pattern) + '$');
        item.map = that.getMap(route);

        // Binds
        if (cm.isString(item.name)) {
            that.routesBinds[item.name] = route;
        } else if (cm.isArray(item.name)) {
            cm.forEach(item.name, name => {
                that.routesBinds[name] = route;
            });
        }

        // Export
        that.routes[route] = item;
        return that;
    };

    classProto.get = function(route) {
        const that = this;
        if (that.routesBinds[route]) {
            route = that.routesBinds[route];
        }
        return that.routes[route];
    };

    classProto.getURL = function(route, hash, urlParams, params) {
        const that = this;
        if (cm.isEmpty(route)) return;

        // Validate params
        params = cm.merge({
            data: null,
            parameters: null,
        }, params);

        if (cm.isObject(params.parameters)) {
            params.parameters = cm.obj2URI(params.parameters);
        }

        // Check a route type
        const item = that.get(route);
        if (item) {
            if (item.type === 'external') {
                return that.prepareExternalHref(item.href, hash, urlParams, params);
            } else {
                route = item.route;
            }
        }

        // Fill url params
        route = that.fillCaptures(route, urlParams);

        // Add lead slash if not exists
        if (!/^(\/|\.\/)/.test(route)) {
            route = '/' + route;
        }

        // Save into data storage
        that.dataStorage[route] = params.data;

        // Add lead point if not exists
        if (that.params.addLeadPoint && !/^\./.test(route)) {
            route = '.' + route;
        }

        // Add parameters
        route = that.preparePath(route, params.parameters);

        // Add hash
        return that.prepareHash(route, hash);
    };

    classProto.getFullURL = function(route, hash, urlParams, params) {
        const that = this;
        return that.prepareHref(that.getURL(route, hash, urlParams, params));
    };

    classProto.getRedirect = function(route) {
        const that = this;
        const item = that.get(route);
        if (!item) return;
        return that.getRouteRedirect(item);
    };

    classProto.getCurrent = function() {
        const that = this;
        return that.current;
    };

    classProto.getPrevious = function() {
        const that = this;
        return that.previous;
    };

    classProto.checkAccess = function(route) {
        const that = this;
        const item = that.get(route);
        return that.checkRouteAccess(item);
    };

    classProto.set = function(route, hash, params) {
        const that = this;

        // Validate params
        params = cm.merge({
            urlParams: null,
            parameters: null,
            captures: null,
            data: null,
            assignLocation: false,
            replaceLocation: false,
        }, params);

        // Get route item
        const routeItem = that.get(route);
        if (routeItem && routeItem.type === 'external') {
            params.assignLocation = true;
        }

        // Get route url
        const urlParams = !cm.isEmpty(params.urlParams) ? params.urlParams : params.captures;
        const urlRouteParams = {
            data: params.data,
            parameters: params.parameters,
        };
        const url = that.getURL(route, hash, urlParams, urlRouteParams);
        that.setURL(url, hash, params);

        return that;
    };

    classProto.setURL = function(url, hash, params) {
        const that = this;

        // Validate params
        params = cm.merge({
            assignLocation: false,
            replaceLocation: false,
        }, params);

        // Assign new location or push/replace history state
        if (params.replaceLocation) {
            window.history.replaceState(that.current.state, '', url);
        } else if (params.assignLocation) {
            window.location.assign(url);
        } else {
            const route = that.prepareRoute(url);
            that.pushRoute(route, params);
        }

        return that;
    };

    classProto.summon = function(route, hash, params) {
        const that = this;

        // Validate params
        params = cm.merge({
            data: {}
        }, params);

        // Get route
        if (that.routesBinds[route]) {
            route = that.routesBinds[route];
        }

        // Get item
        if (that.routes[route]) {
            const item = that.routes[route];

            // Process state
            const state = cm.clone(item);
            state.params = cm.merge(state.params, params);
            state.data = that.getStorageData(state.route, state, params.data);
            if (that.current) {
                state.route = that.current.route;
            }

            // Process route
            that.destructRoute(that.current);
            that.constructRoute(state);
        }

        return that;
    };

    classProto.redirect = function(route, hash, params) {
        const that = this;
        // Override push / replace state
        params = cm.merge(params, {
            pushState: false,
            replaceState: true
        });
        that.set(route, hash, params);
        return that;
    };

    classProto.remove = function(route) {
        const that = this;

        if (that.routesBinds[route]) {
            route = that.routesBinds[route];
        }

        if (that.routes[route]) {
            const item = that.routes[route];
            if (cm.isString(item.name)) {
                delete that.routesBinds[item.name];
            } else if (cm.isArray(item.name)) {
                cm.forEach(item.name, function(name) {
                    delete that.routesBinds[name];
                });
            }
            delete that.routes[route];
        }

        return that;
    };

    classProto.start = function(route, hash, params) {
        const that = this;
        route = !cm.isUndefined(route) ? route : that.params.route;
        params = cm.merge({
            pushState: false,
            replaceState: true
        }, params);

        if (!cm.isEmpty(route)) {
            that.set(route, hash, params);
        } else {
            that.setURL(window.location.href, hash, params);
        }

        return that;
    };
});
