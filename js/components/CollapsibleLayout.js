Com['CollapsibleLayout'] = function(o){
    var that = this,
        config = cm.merge({
            'node' : cm.Node('div'),
            'events' : {},
            'nodes' : {}
        }, o),
        API = {
            'onRender' : [],
            'onCollapse' : [],
            'onExpand' : [],
            'onChange' : []
        },
        nodes = {
            'leftButton' : cm.Node('div'),
            'rightButton': cm.Node('div')
        };

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        convertEvents(config['events']);
        getNodes(config['node'], 'ComCollapsibleLayout');
        render();
    };

    var render = function(){
        // Left Sidebar
        cm.addEvent(nodes['leftButton'], 'click', function(){
            if(cm.isClass(config['node'], 'is-sidebar-left-collapsed')){
                cm.removeClass(config['node'], 'is-sidebar-left-collapsed');
                // API onExpand event
                executeEvent('onExpand', {'sidebar' : 'left'});
            }else{
                cm.addClass(config['node'], 'is-sidebar-left-collapsed');
                // API onCollapse event
                executeEvent('onCollapse', {'sidebar' : 'left'});
            }
            // API onChange event
            executeEvent('onChange', {
                'sidebar' : 'left',
                'isCollapsed' : cm.isClass(config['node'], 'is-sidebar-left-collapsed')
            });
        });
        // Right sidebar
        cm.addEvent(nodes['rightButton'], 'click', function(){
            if(cm.isClass(config['node'], 'is-sidebar-right-collapsed')){
                cm.removeClass(config['node'], 'is-sidebar-right-collapsed');
                // API onExpand event
                executeEvent('onExpand', {'sidebar' : 'right'});
            }else{
                cm.addClass(config['node'], 'is-sidebar-right-collapsed');
                // API onCollapse event
                executeEvent('onCollapse', {'sidebar' : 'right'});
            }
            // API onChange event
            executeEvent('onChange', {
                'sidebar' : 'right',
                'isCollapsed' : cm.isClass(config['node'], 'is-sidebar-right-collapsed')
            });
        });
        // API onRender event
        executeEvent('onRender');
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