Com['ClassName'] = function(o){
    var that = this,
        config = cm.merge({
            'events' : {},
            'nodes' : {
                'com-classname' : {}
            }
        }, o),
        API = {
            'onRender' : []
        },
        privateConfig = {
            'nodes' : {
                'com-classname' : ['container', 'button']
            }
        },
        nodes = {};

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        convertEvents(config['events']);
        getNodes(null);
        render();
    };

    var render = function(){
        // API onRender event
        executeEvent('onRender', {});
    };

    /* *** MISC FUNCTIONS *** */

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    var getNodes = function(container){
        // Get nodes
        cm.forEach(privateConfig['nodes'], function(item, key){
            nodes[key] = {};
            cm.forEach(item, function(value){
                nodes[key][value] = cm.getByAttr(['data', key].join('-'), value, container)[0] || cm.Node('div')
            });
        });
        // Merge collected nodes with each defined in config
        nodes = cm.merge(nodes, config['nodes']);
    };

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* ******* MAIN ******* */

    that.addEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event].push(handler);
        }
        return that;
    };

    that.removeEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event] = API[event].filter(function(item){
                return item != handler;
            });
        }
        return that;
    };

    init();
};