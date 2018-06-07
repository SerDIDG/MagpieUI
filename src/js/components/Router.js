cm.define('Com.Router', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onChange'
    ],
    'params' : {
        'renderStructure' : false,
        'embedStructureOnRender' : false
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
        // Call parent method - construct
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init location handlers
        cm.addEvent(window, 'click', that.windowClickEventHandler);
        cm.addEvent(window, 'popstate', that.popstateEventHandler);
    };

    classProto.windowClickEvent = function(e){
        var that = this,
            target;
        // Process route only on LMB without pressed ctrl or meta keys
        if(e.button || e.metaKey || e.ctrlKey){
            return;
        }
        // Get event target
        target = cm.getEventTarget(e);
        // Process route only on inner link
        if(cm.isTagName(target, 'a')){
            cm.preventDefault(e);
            that.processLink(target);
        }
    };

    classProto.popstateEvent = function(e){
        var that = this,
            state = e.state;
        if(state){
            that.processRoute(state);
        }else{
            //that.start();
        }
    };

    classProto.processLink = function(el){
        var that = this,
            href = el.getAttribute('href');
        if(!cm.isEmpty(href)){
            href = that.prepareRoute(href);
            that.pushRoute(href[0], href[1]);
        }
    };

    classProto.pushRoute = function(route, hash){
        var that = this,
            state = {
                'route' : route,
                'hash' : hash,
                'location' : that.prepareHref(route)
            };
        // Check data storage
        if(that.dataStorage[state['route']]){
            state['data'] = that.dataStorage[state['route']];
        }
        that.dataStorage = {};
        // Check hash
        if(!cm.isEmpty(state['hash'])){
            state['href'] = state['location'] + '#' + state['hash'];
        }
        // Set scroll
        cm.setBodyScrollTop(0);
        // Set Window URL
        window.history.pushState(state, '', state['location']);
        // Process route
        that.processRoute(state);
        // Process hash
        if(!cm.isEmpty(state['href'])){
            // TODO fix empty state object after changing hash
            window.location.hash = '#' + state['hash'];
            // window.history.pushState(state, '', state['href']);
        }
    };

    classProto.processRoute = function(state){
        var that = this,
            match,
            matchItem,
            matchCaptures,
            route;
        // Destruct old route
        that.destructRoute(that.current);
        // Match route
        cm.forEach(that.routes, function(rTtem){
            if(match = state['route'].match(rTtem['regexp'])){
                matchCaptures = match;
                matchItem = rTtem;
            }
        });
        if(!matchItem){
            matchItem = that.get('/404');
        }
        route = cm.merge(matchItem, state);
        // Get captures
        if(matchCaptures){
            route['captures'] = that.mapCaptures(route['map'], matchCaptures);
        }
        // Construct route
        that.constructRoute(route);
    };

    classProto.destructRoute = function(route){
        var that = this;
        // Export
        that.previous = route;
        // Callbacks
        if(route){
            if(route['constructor']){
                route['controller'] && route['controller'].destruct && route['controller'].destruct();
            }else{
                route['onDestruct'](route);
                route['callback'](route);
            }
        }
        return that;
    };

    classProto.constructRoute = function(route){
        var that = this;
        // Export
        that.current = route;
        // Callbacks
        if(route['constructor']){
            cm.getConstructor(route['constructor'], function(classConstructor){
                route['controller'] = new classConstructor(
                    cm.merge(route['constructorParams'], {
                        'container' : that.params['container'],
                        'route' : route
                    })
                );
            });
        }else{
            route['onConstruct'](route);
            route['callback'](route);
        }
        that.triggerEvent('onChange', route);
        return that;
    };

    /* *** HELPERS *** */

    classProto.prepareBaseUrl = function(www){
        var that = this,
            hasWWW = new RegExp('^www.').test(window.location.host),
            baseUrl = cm._baseUrl
                .replace(new RegExp('^' + window.location.protocol), '')
                .replace(new RegExp('^//www.'), '//');
        if(www && hasWWW){
            baseUrl = baseUrl.replace(new RegExp('^//'), '//www.');
        }
        return baseUrl;
    };

    classProto.prepareRoute = function(route){
        var that = this,
            baseUrl = that.prepareBaseUrl();
        route = route
            .replace(new RegExp('^' + window.location.protocol), '')
            .replace(new RegExp('^//www.'), '//')
            .replace(new RegExp('^' + baseUrl), '')
            .split('#');
        return route;
    };

    classProto.prepareHref = function(route){
        var that = this,
            baseUrl = that.prepareBaseUrl(true);
        return window.location.protocol + baseUrl + route;
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

    /* *** PUBLIC *** */

    classProto.embed = function(node){
        var that = this;
        that.params['container'] = node;
    };

    classProto.add = function(route, params){
        var that = this,
            item = cm.merge({
                'route' : route,
                'originRoute' : route,
                'name' : null,
                'regexp' : null,
                'map' : [],
                'captures' : {},
                'constructor' : false,
                'constructorParams' : {},
                'callback' : function(){},
                'onConstruct' : function(){},
                'onDestruct' : function(){}
            }, params);
        // RegExp
        item['regexp'] = new RegExp('^' + route.replace(/({\w+})/g, '([\\s\\S]+?)') + '$');
        item['map'] = that.getMap(route);
        // Binds
        if(cm.isString(item['name'])){
            that.routesBinds[item['name']] = route;
        }else if(cm.isArray(item['name'])){
            cm.forEach(item['name'], function(name){
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

    classProto.getURL = function(route, hash, params, data){
        var that = this,
            item;
        if(item = that.get(route)){
            route = item['route'];
        }
        if(cm.isObject(params)){
            route = route.replace(/{(\w+)}/g, function(math, p1){
                return params[p1] || '';
            });
        }
        if(!/^\//.test(route)){
            route = '/' + route;
        }
        // Save into data storage
        that.dataStorage[route] = data;
        // Add hash
        if(!cm.isEmpty(hash)){
            route = route + '#' + hash;
        }
        return route;
    };

    classProto.getFullURL = function(route, hash, params, data){
        var that = this;
        return that.prepareHref(that.getURL(route, hash, params, data));
    };

    classProto.set = function(route, hash){
        var that = this;
        if(that.routesBinds[route]){
            route = that.routesBinds[route];
        }
        that.trigger(route, hash);
        return that;
    };

    classProto.summon = function(route, hash){
        var that = this,
            item;
        if(that.routesBinds[route]){
            route = that.routesBinds[route];
        }
        if(item = that.routes[route]){
            that.destructRoute(that.current);
            that.constructRoute(item);
        }
        return that;
    };

    classProto.remove = function(route){
        var that = this,
            item;
        if(that.routesBinds[route]){
            route = that.routesBinds[route];
        }
        if(item = that.routes[route]){
            if(cm.isString(item['name'])){
                delete that.routesBinds[item['name']];
            }else if(cm.isArray(item['name'])){
                cm.forEach(item['name'], function(name){
                    delete that.routesBinds[name];
                })
            }
            delete that.routes[route];
        }
        return that;
    };

    classProto.trigger = function(route, hash){
        var that = this;
        that.pushRoute(route, hash);
        return that;
    };

    classProto.start = function(){
        var that = this,
            href = that.prepareRoute(window.location.href);
        that.trigger(href[0], href[1]);
        return that;
    };
});