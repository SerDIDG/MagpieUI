cm.define('Com.Collector', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onConstructStart',
        'onConstruct',
        'onDestructStart',
        'onDestruct'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'attribute' : 'data-element'
    }
},
function(params){
    var that = this;

    that.stack = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var constructItem = function(item, name, parentNode){
        var nodes = [];
        // Find element in specified node
        if(parentNode.getAttribute(that.params['attribute']) == name){
            nodes.push(parentNode)
        }
        // Search for nodes in specified node
        nodes = nodes.concat(
            cm.clone(
                cm.getByAttr(that.params['attribute'], name, parentNode)
            )
        );
        // Filter off existing nodes
        nodes = nodes.filter(function(node){
            return !cm.inArray(item['nodes'], node);
        });
        // Push new nodes in constructed nodes array
        item['nodes'] = item['nodes'].concat(nodes);
        // Construct
        cm.forEach(nodes, function(node){
            cm.forEach(item['construct'], function(handler){
                handler(node);
            });
        });
    };

    var destructItem = function(item, name, parentNode){
        var nodes = [],
            inArray;
        if(parentNode){
            // Find element in specified node
            if(parentNode.getAttribute(that.params['attribute']) == name){
                nodes.push(parentNode)
            }
            // Search for nodes in specified node
            nodes = nodes.concat(
                cm.clone(
                    cm.getByAttr(that.params['attribute'], name, parentNode)
                )
            );
            // Filter off not existing nodes and remove existing from global array
            nodes = nodes.filter(function(node){
                if(inArray = cm.inArray(item['nodes'], node)){
                    item['nodes'].splice(item['nodes'].indexOf(node), 1);
                }
                return inArray;
            });
            // Destruct
            cm.forEach(nodes, function(node){
                cm.forEach(item['destruct'], function(handler){
                    handler(node);
                });
            });
        }else{
            cm.forEach(item['nodes'], function(node){
                cm.forEach(item['destruct'], function(handler){
                    handler(node);
                });
            });
            delete that.stack[name];
        }
    };

    /* ******* PUBLIC ******* */
    
    that.add = function(name, construct, destruct){
        if(name){
            if(!that.stack[name]){
                that.stack[name] = {
                    'construct' : [],
                    'destruct' : [],
                    'nodes' : []
                };
            }
            if(typeof construct == 'function'){
                that.stack[name]['construct'].push(construct);
            }
            if(typeof destruct == 'function'){
                that.stack[name]['destruct'].push(destruct);
            }
        }
        return that;
    };

    that.remove = function(name, construct, destruct){
        if(name && that.stack[name]){
            if(construct || destruct){
                // Remove item's handlers
                if(typeof construct == 'function'){
                    that.stack[name]['construct'] = that.stack[name]['construct'].filter(function(handler){
                        return handler != construct;
                    });
                }
                if(typeof destruct == 'function'){
                    that.stack[name]['destruct'] = that.stack[name]['destruct'].filter(function(handler){
                        return handler != destruct;
                    });
                }
            }else{
                // Remove item from global array
                delete that.stack[name];
            }
        }
        return that;
    };

    that.construct = function(node, name){
        node = node || document.body;
        that.triggerEvent('onConstructStart', {
            'node' : node,
            'name' : name
        });
        if(name && that.stack[name]){
            constructItem(that.stack[name], name, node);
        }else{
            cm.forEach(that.stack, function(item, name){
                constructItem(item, name, node);
            });
        }
        that.triggerEvent('onConstruct', {
            'node' : node,
            'name' : name
        });
        return that;
    };

    that.destruct = function(node, name){
        node = node || null;
        that.triggerEvent('onDestructStart', {
            'node' : node,
            'name' : name
        });
        if(name && that.stack[name]){
            destructItem(that.stack[name], name, node);
        }else{
            cm.forEach(that.stack, function(item, name){
                destructItem(item, name, node);
            });
        }
        that.triggerEvent('onDestruct', {
            'node' : node,
            'name' : name
        });
        return that;
    };
    
    init();
});