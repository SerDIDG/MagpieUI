Com['Collector'] = function(o){
    var that = this,
        config = cm.merge({
            'attribute' : 'data-element',
            'events' : {}
        }, o),
        API = {
            'onConstructStart' : [],
            'onConstruct' : [],
            'onDestructStart' : [],
            'onDestruct' : []
        },
        stuck = {};

    var init = function(){
        convertEvents(config['events']);
    };

    var constructItem = function(item, name, parentNode){
        var nodes = [];
        // Find element in specified node
        if(parentNode.getAttribute(config['attribute']) == name){
            nodes.push(parentNode)
        }
        // Search for nodes in specified node
        nodes = nodes.concat(
            cm.clone(
                cm.getByAttr(config['attribute'], name, parentNode)
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
            if(parentNode.getAttribute(config['attribute']) == name){
                nodes.push(parentNode)
            }
            // Search for nodes in specified node
            nodes = nodes.concat(
                cm.clone(
                    cm.getByAttr(config['attribute'], name, parentNode)
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
            delete stuck[name];
        }
    };

    /* *** MISC FUNCTIONS *** */

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* *** MAIN *** */

    that.add = function(name, construct, destruct){
        if(name){
            if(!stuck[name]){
                stuck[name] = {
                    'construct' : [],
                    'destruct' : [],
                    'nodes' : []
                };
            }
            if(typeof construct == 'function'){
                stuck[name]['construct'].push(construct);
            }
            if(typeof destruct == 'function'){
                stuck[name]['destruct'].push(destruct);
            }
        }
        return that;
    };

    that.remove = function(name, construct, destruct){
        if(name && stuck[name]){
            if(construct || destruct){
                // Remove item's handlers
                if(typeof construct == 'function'){
                    stuck[name]['construct'] = stuck[name]['construct'].filter(function(handler){
                        return handler != construct;
                    });
                }
                if(typeof destruct == 'function'){
                    stuck[name]['destruct'] = stuck[name]['destruct'].filter(function(handler){
                        return handler != destruct;
                    });
                }
            }else{
                // Remove item from global array
                delete stuck[name];
            }
        }
        return that;
    };

    that.construct = function(node, name){
        node = node || document.body;
        executeEvent('onConstructStart', {
            'node' : node,
            'name' : name
        });
        if(name && stuck[name]){
            constructItem(stuck[name], name, node);
        }else{
            cm.forEach(stuck, function(item, name){
                constructItem(item, name, node);
            });
        }
        executeEvent('onConstruct', {
            'node' : node,
            'name' : name
        });
        return that;
    };

    that.destruct = function(node, name){
        node = node || null;
        executeEvent('onDestructStart', {
            'node' : node,
            'name' : name
        });
        if(name && stuck[name]){
            destructItem(stuck[name], name, node);
        }else{
            cm.forEach(stuck, function(item, name){
                destructItem(item, name, node);
            });
        }
        executeEvent('onDestruct', {
            'node' : node,
            'name' : name
        });
        return that;
    };

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