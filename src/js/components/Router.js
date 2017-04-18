cm.define('Com.Router', {
    'extend' : 'Com.AbstractController',
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

cm.getConstructor('Com.Router', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Variables
        that.routes = {};
        that.current = null;
        that.previous = null;
        // Bind
        that.windowClickEventHandler = that.windowClickEvent.bind(that);
        that.popstateEventHandler = that.popstateEvent.bind(that);
        // Call parent method - construct
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init location handlers
        cm.addEvent(window, 'click', that.windowClickEventHandler);
        cm.addEvent(window, 'popstate', that.popstateEventHandler);
        return that;
    };

    classProto.windowClickEvent = function(e){
        var that = this,
            target = cm.getEventTarget(e);
        if(cm.isNode(target) && target.tagName.toLowerCase() == 'a'){
            cm.preventDefault(e);
            that.processLink(target);
        }
        return that;
    };

    classProto.popstateEvent = function(e){
        var that = this;
        var state = e.state;
        state && that.processRoute(state['route']);
        return that;
    };

    classProto.processLink = function(el){
        var that = this;
        var route = el.getAttribute('href');
        route && that.pushRoute(route);
        return that;
    };

    classProto.pushRoute = function(route, hash){
        var that = this;
        var state = {
            'route' : route
        };
        var location = !cm.isEmpty(hash) ? [route, hash].join('#') : route;
        // Set Window URL
        window.history.pushState(state, '', location);
        // Process route
        that.processRoute(route);
        return that;
    };

    classProto.processRoute = function(route){
        var that = this;
        // Destruct old route
        that.destructRoute(that.current);
        // Construct new route
        if(that.routes[route]){
            that.constructRoute(route)
        }else if(that.routes['/404']){
            that.constructRoute('/404')
        }
        return that;
    };

    classProto.destructRoute = function(route){
        var that = this;
        var item = that.routes[route];
        // Export
        that.previous = route;
        // Callbacks
        if(item){
            if(item['constructor']){
                item['controller'] && item['controller'].destruct && item['controller'].destruct();
            }else{
                item['onDestruct'](item);
                item['callback'](item);
            }
        }
        return that;
    };

    classProto.constructRoute = function(route){
        var that = this;
        var item = that.routes[route];
        // Export
        that.current = route;
        // Callbacks
        if(item){
            if(item['constructor']){
                cm.getConstructor(item['constructor'], function(classConstructor){
                    item['controller'] = new classConstructor(
                        cm.merge(item['constructorParams'], {
                            'container' : that.params['container']
                        })
                    );
                });
            }else{
                item['onConstruct'](item);
                item['callback'](item);
            }
        }
        return that;
    };

    /* *** PUBLIC *** */

    classProto.add = function(route, params){
        var that = this;
        var item = cm.merge({
            'constructor' : false,
            'constructorParams' : {},
            'callback' : function(){},
            'onConstruct' : function(){},
            'onDestruct' : function(){}
        }, params);
        // Export
        that.routes[route] = item;
        return that;
    };

    classProto.remove = function(route){
        var that = this;
        if(that.routes[route]){
            delete that.routes[route];
        }
        return that;
    };

    classProto.trigger = function(route){
        var that = this;
        that.pushRoute(route);
        return that;
    };

    classProto.start = function(){
        var that = this;
        var route = window.location.pathname;
        var hash = window.location.hash.slice(1);
        that.pushRoute(route, hash);
        return that;
    };
});