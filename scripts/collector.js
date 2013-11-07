Com['Collector'] = function(o){
    var that = this,
        config = cm.merge({
            'attribute' : 'data-element'
        }, o),
        parentNode,
        stuck = {};

    var constructItem = function(item, name){
        var nodes;
        // Search for nodes in specified node or document's body
        nodes = cm.clone(cm.getByAttr(config['attribute'], name, parentNode));
        // Filter off existing nodes
        nodes = nodes.filter(function(node){
            return !cm.inArray(item['nodes'], node);
        });
        // Construct
        cm.forEach(nodes, function(node){
            cm.forEach(item['construct'], function(handler){
                handler(node);
            });
        });
        // Push new nodes in constructed nodes array
        item['nodes'] = item['nodes'].concat(nodes);
    };

    var destructItem = function(item, name){
        var nodes, inArray;
        if(parentNode){
            // Search for nodes in specified node
            nodes = cm.clone(cm.getByAttr(config['attribute'], name, parentNode));
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

    /* Main */

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
        parentNode = node || document.body;
        if(name && stuck[name]){
            constructItem(stuck[name], name);
        }else{
            cm.forEach(stuck, constructItem);
        }
        return that;
    };

    that.destruct = function(node, name){
        parentNode = node || null;
        if(name && stuck[name]){
            destructItem(stuck[name], name);
        }else{
            cm.forEach(stuck, destructItem);
        }
        return that;
    };
};