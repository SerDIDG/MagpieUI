cm.define('Com.Router', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'renderStructure' : false,
        'renderOnConstruct' : false
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
        // Bind
        that.windowClickEventHandler = that.windowClickEvent.bind(that);
        // Call parent method - construct
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init location handlers
        cm.addEvent(window, 'click', that.windowClickEventHandler);
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

    classProto.processLink = function(el){
        var that = this;
        var route = el.getAttribute('href');
        that.processRoute(route);
        return that;
    };

    classProto.processRoute = function(route){
        var that = this;
        cm.log(route);
        // Set Window URL
        window.history.pushState({}, '', route);
        // Find route
        var item = that.routes[route];
        return that;
    };

    classProto.renderRoute = function(item){
        var that = this;
        if(item){
            // Callbacks
            if(item['constructor']){
                cm.getConstructor(item['constructor'], function(classConstructor){
                    item['controller'] = new classConstructor(
                        cm.merge(item['constructorParams'], {
                            'container' : that.params['container']
                        })
                    );
                });
            }else{
                item['callback'](item);
            }
        }else{

        }
        return that;
    };

    /* *** PUBLIC *** */

    classProto.add = function(route, params){
        var that = this;
        var item = cm.merge({
            'constructor' : false,
            'constructorParams' : {},
            'callback' : function(){}
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

    classProto.trigger = function(route, params){
        var that = this;
        var item = that.routes[route];
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
                item['callback'](item);
            }
        }
        return that;
    };
});