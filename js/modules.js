/* ******* PARAMS ******* */

Mod['Params'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']){
            that.build['params'] = {};
        }
    },
    'setParams' : function(params){
        var that = this;
        that.params = cm.merge(that.params, params);
        // Validate params
        cm.forEach(that.params, function(item, key){
            switch(item){
                case 'document.window':
                    that.params[key] = window;
                    break;

                case 'document.html':
                    that.params[key] = document.documentElement;
                    break;

                case 'document.body':
                    that.params[key] = document.body;
                    break;

                case 'document.head':
                    that.params[key] = document.getElementsByTagName('head')[0];
                    break;

                default:
                    if(/cm._config./i.test(item)){
                        that.params[key] = cm._config[item.replace('cm._config.', '')];
                    }
                    break
            }
        });
        return that;
    }
};

/* ******* EVENTS ******* */

Mod['Events'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['events']){
            that.build['params']['events'] = {};
        }
        that.build['events'] = {};
        cm.forEach(that.build._raw['events'], function(item){
            that.build['events'][item] = [];
            that.build[item] = function(handler){
                var that = this;
                that.addEvent(item, handler);
                return that;
            };
        });
    },
    'addEvent' : function(event, handler){
        var that = this;
        that.events = cm.clone(that.events);
        if(that.events[event]){
            if(typeof handler == 'function'){
                that.events[event].push(handler);
            }else{
                cm.errorLog({
                    'name' : that._name['full'],
                    'message' : ['Handler of event', cm.strWrap(event, '"'), 'must be a function.'].join(' ')
                });
            }
        }else{
            cm.errorLog({
                'name' : that._name['full'],
                'message' : [cm.strWrap(event, '"'), 'does not exists.'].join(' ')
            });
        }
        return that;
    },
    'addEvents' : function(o){
        var that = this;
        if(o){
            that.convertEvents(o);
        }
        return that;
    },
    'removeEvent' : function(event, handler){
        var that = this;
        that.events = cm.clone(that.events);
        if(that.events[event]){
            if(typeof handler == 'function'){
                that.events[event] = that.events[event].filter(function(item){
                    return item != handler;
                });
            }else{
                cm.errorLog({
                    'name' : that._name['full'],
                    'message' : ['Handler of event', cm.strWrap(event, '"'), 'must be a function.'].join(' ')
                });
            }
        }else{
            cm.errorLog({
                'name' : that._name['full'],
                'message' : [cm.strWrap(event, '"'), 'does not exists.'].join(' ')
            });
        }
        return that;
    },
    'triggerEvent' : function(event, params){
        var that = this;
        if(that.events[event]){
            cm.forEach(that.events[event], function(item){
                item(that, params || {});
            });
        }else{
            cm.errorLog({
                'name' : that._name['full'],
                'message' : [cm.strWrap(event, '"'), 'does not exists.'].join(' ')
            });
        }
        return that;
    },
    'convertEvents' : function(o){
        var that = this;
        cm.forEach(o, function(item, key){
            that.addEvent(key, item);
        });
        return that;
    }
};

/* ******* LANGS ******* */

Mod['Langs'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['langs']){
            that.build['params']['langs'] = {};
        }
    },
    'lang' : function(str, vars){
        var that = this,
            langStr;
        if(!str || cm.isEmpty(str)){
            return '';
        }
        if(!that.params['langs'][str]){
            that.params['langs'][str] = str;
        }
        langStr = that.params['langs'][str];
        // Process variables
        if(vars && cm.isObject(vars)){
            cm.forEach(vars, function(item, key){
                langStr = langStr.replace(new RegExp(key, 'g'), item);
            });
        }
        return langStr;
    },
    'setLangs' : function(o){
        var that = this;
        if(cm.isObject(o)){
            that.params['langs'] = cm.merge(that.params['langs'], o);
        }
        return that;
    }
};

/* ******* DATA CONFIG ******* */

Mod['DataConfig'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(typeof that.build['params']['configDataMarker'] == 'undefined'){
            that.build['params']['configDataMarker'] = 'data-config';
        }
    },
    'getDataConfig' : function(container, dataMarker){
        var that = this,
            sourceConfig;
        if(cm.isNode(container)){
            dataMarker = dataMarker || that.params['configDataMarker'];
            sourceConfig = container.getAttribute(dataMarker);
            if(sourceConfig && (sourceConfig = cm.parseJSON(sourceConfig))){
                that.setParams(sourceConfig);
            }
        }
        return that;
    },
    'getNodeDataConfig' : function(node, dataMarker){
        var that = this,
            sourceConfig;
        if(cm.isNode(node)){
            dataMarker = dataMarker || that.params['configDataMarker'];
            sourceConfig = node.getAttribute(dataMarker);
            if(sourceConfig && (sourceConfig = cm.parseJSON(sourceConfig))){
                return sourceConfig;
            }
        }
        return {};
    }
};

/* ******* DATA NODES ******* */

Mod['DataNodes'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['nodes']){
            that.build['params']['nodes'] = {};
        }
        if(typeof that.build['params']['nodesDataMarker'] == 'undefined'){
            that.build['params']['nodesDataMarker'] = 'data-node';
        }
        if(typeof that.build['params']['nodesMarker'] == 'undefined'){
            that.build['params']['nodesMarker'] = that.build._name['short'];
        }
        if(!that.build['nodes']){
            that.build['nodes'] = {};
        }
    },
    'getDataNodes' : function(container, dataMarker, className){
        var that = this,
            sourceNodes = {};
        container = typeof container == 'undefined'? document.body : container;
        if(container){
            dataMarker = typeof dataMarker == 'undefined'? that.params['nodesDataMarker'] : dataMarker;
            className = typeof className == 'undefined'? that.params['nodesMarker'] : className;
            if(className){
                sourceNodes = cm.getNodes(container, dataMarker)[className] || {};
            }else{
                sourceNodes = cm.getNodes(container, dataMarker);
            }
            that.nodes = cm.merge(that.nodes, sourceNodes);
        }
        that.nodes = cm.merge(that.nodes, that.params['nodes']);
        return that;
    }
};

/* ******* LOCAL STORAGE ******* */

Mod['Storage'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['name']){
            that.build['params']['name'] = '';
        }
    },
    'storageRead' : function(key){
        var that = this,
            storage = JSON.parse(cm.storageGet(that._name['full'])) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Storage cannot be read because "name" parameter not provided.'
            });
            return null;
        }
        if(!storage[that.params['name']] || typeof storage[that.params['name']][key] == 'undefined'){
            cm.errorLog({
                'type' : 'attention',
                'name' : that._name['full'],
                'message' : ['Parameter', cm.strWrap(key, '"'), 'does not exist or is not set.'].join(' ')
            });
            return null;
        }
        return storage[that.params['name']][key];
    },
    'storageReadAll' : function(){
        var that = this,
            storage = JSON.parse(cm.storageGet(that._name['full'])) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Storage cannot be read because "name" parameter not provided.'
            });
            return {};
        }
        if(!storage[that.params['name']]){
            cm.errorLog({
                'type' : 'attention',
                'name' : that._name['full'],
                'message' : 'Storage is empty.'
            });
            return {};
        }
        return storage[that.params['name']];
    },
    'storageWrite' : function(key, value){
        var that = this,
            storage = JSON.parse(cm.storageGet(that._name['full'])) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Storage cannot be written because "name" parameter not provided.'
            });
            return {};
        }
        if(!storage[that.params['name']]){
            storage[that.params['name']] = {};
        }
        storage[that.params['name']][key] = value;
        cm.storageSet(that._name['full'], JSON.stringify(storage));
        return storage[that.params['name']];
    },
    'storageWriteAll' : function(data){
        var that = this,
            storage = JSON.parse(cm.storageGet(that._name['full'])) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Storage cannot be written because "name" parameter not provided.'
            });
            return {};
        }
        storage[that.params['name']] = data;
        cm.storageSet(that._name['full'], JSON.stringify(storage));
        return storage[that.params['name']];
    }
};

/* ******* CALLBACKS ******* */

Mod['Callbacks'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['callbacks']){
            that.build['params']['callbacks'] = {};
        }
        that.build['callbacks'] = {};
        that.build['_callbacks'] = {};
    },
    'callbacksProcess' : function(){
        var that = this;
        // Save default callbacks
        cm.forEach(that.callbacks, function(callback, name){
            that._callbacks[name] = callback;
        });
        // Replace callbacks
        cm.forEach(that.params['callbacks'], function(callback, name){
            that.callbacks[name] = callback;
        });
        return that;
    },
    'callbacksRestore' : function(){
        var that = this;
        cm.forEach(that._callbacks, function(callback, name){
            that.callbacks[name] = callback;
        });
        return that;
    }
};

/* ******* STACK ******* */

Mod['Stack'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(!that.build['params']['name']){
            that.build['params']['name'] = '';
        }
        that.build['_stack'] = [];
    },
    'addToStack' : function(node){
        var that = this;
        that._stack.push({
            'name' : that.params['name'],
            'node' : node,
            'class' : that,
            'className' : that._name['full']
        });
        return that;
    },
    'findInStack' : function(name, parent, callback){
        var that = this,
            items = [];
        parent = parent || document.body;
        callback = typeof callback == 'function' ? callback : function(){};
        cm.forEach(that._stack, function(item){
            if((cm.isEmpty(name) || item['name'] == name) && cm.isParent(parent, item['node'], true)){
                items.push(item);
                callback(item['class'], item);
            }
        });
        return items;
    }
};

/* ******* EXTEND ******* */

Mod['Extend'] = {
    '_config' : {
        'extend' : true,
        'predefine' : true
    },
    '_construct' : function(){
        var that = this;
    },
    '_extend' : function(name, o){
        var that = this;
        if(!that.build._modules[name]){
            // Merge Config
            o._config = cm.merge({
                'extend' : false,
                'predefine' : false,
                'require' : []
            }, o._config);
            // Check Requires
            cm.forEach(o._config['require'], function(module){
                if(Mod[module]){
                    Mod['Extend']._extend.call(that, module, Mod[module]);
                }
            });
            // Extend class by module's methods
            if(o._config['extend']){
                cm.forEach(o, function(item, key){
                    if(!/^(_)/.test(key)){
                        that.build[key] = item;
                    }
                });
            }
            // Construct module
            if(typeof o._construct == 'function'){
                // Construct
                o._construct.call(that);
            }else{
                cm.errorLog({
                    'type' : 'error',
                    'name' : that.build._name['full'],
                    'message' : ['Module', cm.strWrap(name, '"'), 'does not have "_construct" method.'].join(' ')
                });
            }
            // Add into stack of class's modules
            that.build._modules[name] = o;
        }
    },
    'extend' : function(name, o){
        var that = this;
        if(!o){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Trying to extend the class by non-existing module.'
            });
        }else if(!name){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Module should have a name.'
            });
        }else if(that._modules[name]){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : ['Module with name', cm.strWrap(name, '"'), 'already constructed.'].join(' ')
            });
        }else{
            // Merge Config
            o._config = cm.merge({
                'extend' : false,
                'predefine' : false,
                'require' : []
            }, o._config);
            // Check Requires
            cm.forEach(o._config['require'], function(module){
                if(Mod[module]){
                    Mod['Extend']._extend.call(that, module, Mod[module]);
                }
            });
            // Extend class by module's methods
            if(o._config['extend']){
                cm.forEach(o, function(item, key){
                    if(!/^(_)/.test(key)){
                        cm.defineStack[that._name['full']].prototype[key] = item;
                    }
                });
            }
            // Construct module
            if(typeof o._construct == 'function'){
                // Construct
                o._construct.call(that);
            }else{
                cm.errorLog({
                    'type' : 'error',
                    'name' : that._name['full'],
                    'message' : ['Module', cm.strWrap(name, '"'), 'does not have "_construct" method.'].join(' ')
                });
            }
            // Add into stack of class's modules
            that._modules[name] = o;
        }
    }
};