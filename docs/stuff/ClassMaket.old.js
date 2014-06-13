Com['ClassName'] = function(o){
    var that = this,
        config = cm.merge({
            'node' : cm.Node('div'),
            'nodesMarker' : 'ClassName',
            'configMarker' : 'data-config',
            'nodes' : {},
            'events' : {},
            'langs' : {}
        }, o),
        API = {
            'onRender' : []
        },
        nodes = {
            'container' : cm.Node('div'),
            'button' : cm.Node('div')
        };

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        convertEvents(config['events']);
        getNodes(config['node'], config['nodesMarker']);
        getConfig(config['node'], config['configMarker']);
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

    var getNodes = function(container, marker){
        if(container){
            var sourceNodes = {};
            if(marker){
                sourceNodes = cm.getNodes(container)[marker] || {};
            }else{
                sourceNodes = cm.getNodes(container);
            }
            nodes = cm.merge(nodes, sourceNodes);
        }
        nodes = cm.merge(nodes, config['nodes']);
    };

    var getConfig = function(container, marker){
        if(container){
            marker = marker || 'data-config';
            var sourceConfig = container.getAttribute(marker);
            if(sourceConfig){
                config = cm.merge(config, JSON.parse(sourceConfig));
            }
        }
    };

    var lang = function(str){
        if(!config['langs'][str]){
            config['langs'][str] = str;
        }
        return config['langs'][str];
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