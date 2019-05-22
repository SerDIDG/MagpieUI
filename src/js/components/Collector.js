cm.define('Com.Collector', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onAdd',
        'onRemove',
        'onConstructStart',
        'onConstruct',
        'onDestructStart',
        'onDestruct'
    ],
    'params' : {
        'node' : 'document.body',
        'name' : '',
        'attribute' : 'data-element',
        'autoInit' : false
    }
},
function(params){
    var that = this;

    that.isChanged = false;
    that.stackList = [];
    that.stackNodes = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        if(that.params['autoInit']){
            cm.forEach(cm._defineStack, function(classConstructor){
                that.add(classConstructor.prototype._name['full'], function(node){
                    new classConstructor({
                        'node' : node
                    });
                }, null, classConstructor.prototype.params['collectorPriority']);
            });
        }
    };

    var findNodes = function(parentNode, name){
        var nodes = [];
        // Find element in specified node
        if(parentNode.getAttribute(that.params['attribute']) === name){
            nodes.push(parentNode);
        }
        // Search for nodes in specified node
        nodes = nodes.concat(
            cm.clone(
                cm.getByAttr(that.params['attribute'], name, parentNode)
            )
        );
        return nodes;
    };

    var addNodes = function(parentNode, name){
        var nodes = findNodes(parentNode, name);
        // Filter off existing nodes
        nodes = nodes.filter(function(node){
            return !cm.inArray(that.stackNodes[name], node);
        });
        // Push new nodes in constructed nodes array
        that.stackNodes[name] = that.stackNodes[name].concat(nodes);
        return nodes;
    };

    var removeNodes = function(parentNode, name){
        var nodes = findNodes(parentNode, name),
            inArray;
        // Filter off not existing nodes and remove existing from global array
        nodes = nodes.filter(function(node){
            if(inArray = cm.inArray(that.stackNodes[name], node)){
                that.stackNodes[name].splice(that.stackNodes[name].indexOf(node), 1);
            }
            return inArray;
        });
        return nodes;
    };

    var sortList = function(){
        if(that.isChanged){
            that.stackList.sort(function(a, b){
                return a['priority'] - b['priority'];
            });
        }
        that.isChanged = false;
    };

    var constructAll = function(parentNode){
        var processNodes = {},
            processArray = that.stackList.slice(0);
        // Find new nodes to process
        cm.forEach(that.stackNodes, function(item, name){
            processNodes[name] = addNodes(parentNode, name);
        });
        // Process nodes
        cm.forEach(processArray, function(item){
            cm.forEach(processNodes[item['name']], function(node){
                item['construct'] && item['construct'](node, item['priority']);
            });
        });
    };

    var constructItem = function(parentNode, name){
        var processNodes = addNodes(parentNode, name),
            processArray = that.stackList.filter(function(item){
                return item['name'] === name;
            });
        cm.forEach(processArray, function(item){
            cm.forEach(processNodes, function(node){
                item['construct'] && item['construct'](node, item['priority']);
            });
        });
    };

    var destructAll = function(parentNode){
        var processNodes = {},
            processArray = that.stackList.slice(0);
        if(cm.isNode(parentNode)){
            cm.forEach(that.stackNodes, function(item, name){
                processNodes[name] = removeNodes(parentNode, name);
            });
            cm.forEach(processArray, function(item){
                cm.forEach(processNodes[item['name']], function(node){
                    item['destruct'] && item['destruct'](node, item['priority']);
                });
            });
        }else if(cm.isWindow(window)){
            cm.forEach(processArray, function(item){
                cm.forEach(that.stackNodes[item['name']], function(node){
                    item['destruct'] && item['destruct'](node, item['priority']);
                });
            });
            cm.forEach(that.stackNodes, function(item, name){
                that.stackNodes[name] = [];
            });
        }
    };

    var destructItem = function(parentNode, name){
        var processNodes = {},
            processArray = that.stackList.filter(function(item){
                return item['name'] === name;
            });
        if(cm.isNode(parentNode)){
            processNodes = removeNodes(parentNode, name);
            cm.forEach(processArray, function(item){
                cm.forEach(processNodes, function(node){
                    item['destruct'] && item['destruct'](node, item['priority']);
                });
            });
        }else if(cm.isWindow(window)){
            cm.forEach(processArray, function(item){
                cm.forEach(that.stackNodes[item['name']], function(node){
                    item['destruct'] && item['destruct'](node, item['priority']);
                });
            });
            that.stackNodes[name] = [];
        }
    };

    /* ******* PUBLIC ******* */

    that.add = function(name, construct, destruct, priority){
        if(name){
            if(!that.stackNodes[name]){
                that.stackNodes[name] = [];
            }
            var item = {
                'name' : name,
                'priority' : priority || 0,
                'construct' : construct,
                'destruct' : destruct
            };
            if(!cm.isUndefined(priority) && cm.isNumber(priority)){
                that.stackList.splice(priority, 0, item);
            }else{
                that.stackList.push(item);
            }
            that.isChanged = true;
            that.triggerEvent('onAdd', item);
        }
        return that;
    };

    that.remove = function(name, construct, destruct){
        if(name){
            if(cm.isUndefined(construct)){
                that.stackList = that.stackList.filter(function(item){
                    return !(item['name'] === name);
                });
            }else{
                that.stackList = that.stackList.filter(function(item){
                    return !(item['name'] === name && item['construct'] === construct && item['destruct'] === destruct);
                });
            }
            that.isChanged = true;
            that.triggerEvent('onRemove', {
                'name' : name
            });
        }
        return that;
    };

    that.construct = function(node, name){
        var timer = Date.now();
        node = node || document.body;
        that.triggerEvent('onConstructStart', {
            'node' : node,
            'name' : name
        });
        sortList();
        if(name){
            constructItem(node, name);
        }else{
            constructAll(node);
        }
        that.triggerEvent('onConstruct', {
            'node' : node,
            'name' : name
        });
        cm.errorLog({
            'type' : 'common',
            'name' : 'Com.Collector',
            'message' : ['Construct time', (Date.now() - timer), 'ms.'].join(' ')
        });
        return that;
    };

    that.destruct = function(node, name){
        var timer = Date.now();
        node = node || null;
        that.triggerEvent('onDestructStart', {
            'node' : node,
            'name' : name
        });
        sortList();
        if(name){
            destructItem(node, name);
        }else{
            destructAll(node);
        }
        that.triggerEvent('onDestruct', {
            'node' : node,
            'name' : name
        });
        cm.errorLog({
            'type' : 'common',
            'name' : 'Com.Collector',
            'message' : ['Destruct time', (Date.now() - timer), 'ms.'].join(' ')
        });
        return that;
    };

    init();
});