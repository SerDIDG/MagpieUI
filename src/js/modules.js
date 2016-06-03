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

/* ******* COMPONENTS ******* */

Mod['Component'] = {
    '_config' : {
        'extend' : true,
        'predefine' : true
    },
    '_construct' : function(){
        var that = this;
        that.build._isComponent = true;
        if(typeof that.build['params']['consoleLogErrors'] == 'undefined'){
            that.build['params']['consoleLogErrors'] = true;
        }
    },
    'cloneComponent' : function(params){
        var that = this,
            component;
        cm.getConstructor(that._name['full'], function(classConstructor){
            component = new classConstructor(
                cm.merge(that.params, params)
            );
        });
        return component;
    }
};

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
        if(!that.build._update['params']){
            that.build._update['params'] = {};
        }
        if(that.build._inherit){
            that.build['params'] = cm.merge(that.build._inherit.prototype['params'], that.build['params']);
        }
    },
    'setParams' : function(params, replace){
        var that = this;
        replace = typeof replace == 'undefined'? false : replace;
        that.params = cm.merge(replace ? that._raw.params : that.params, params);
        that._update = cm.clone(that._update);
        that._update.params = cm.merge(that._update.params, that.params);
        // Validate params
        cm.forEach(that.params, function(item, key){
            switch(item){
                case 'document.window':
                    that.params[key] = window;
                    break;

                case 'document.html':
                    if(cm.getDocumentHtml()){
                        that.params[key] = cm.getDocumentHtml();
                    }
                    break;

                case 'document.body':
                    if(document.body){
                        that.params[key] = document.body;
                    }
                    break;

                case 'top.document.body':
                    if(window.top.document.body){
                        that.params[key] = window.top.document.body;
                    }
                    break;

                case 'document.head':
                    if(cm.getDocumentHead()){
                        that.params[key] = cm.getDocumentHead();
                    }
                    break;

                default:
                    if(/cm._config./i.test(item)){
                        that.params[key] = cm._config[item.replace('cm._config.', '')];
                    }
                    break;
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
        that.build['events'] = {};
        cm.forEach(that.build._raw['events'], function(item){
            that.build['events'][item] = [];
        });
        if(!that.build['params']['events']){
            that.build['params']['events'] = {};
        }
        if(that.build._inherit){
            that.build['params']['events'] = cm.merge(that.build._inherit.prototype['params']['events'], that.build['params']['events']);
            that.build['events'] = cm.merge(that.build._inherit.prototype['events'], that.build['events']);
        }
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
                'type' : 'attention',
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
                'type' : 'attention',
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
                'type' : 'attention',
                'name' : that._name['full'],
                'message' : [cm.strWrap(event, '"'), 'does not exists.'].join(' ')
            });
        }
        return that;
    },
    'hasEvent' : function(event){
        var that = this;
        return !!that.events[event];
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
        if(!that.build._update['params']['langs']){
            that.build._update['params']['langs'] = {};
        }
        if(that.build._inherit){
            that.build['params']['langs'] = cm.merge(that.build._inherit.prototype['params']['langs'], that.build['params']['langs']);
        }
    },
    'lang' : function(str, vars){
        var that = this,
            langStr;
        if(typeof str == 'undefined'){
            return that.params['langs'];
        }
        if(!str || cm.isEmpty(str)){
            return '';
        }
        if(typeof that.params['langs'][str] == 'undefined'){
            that.params['langs'][str] = str;
        }
        langStr = that.params['langs'][str];
        // Process variables
        langStr = cm.strReplace(langStr, vars);
        return langStr;
    },
    'updateLangs' : function(){
        var that = this;
        if(cm.isFunction(that)){
            that.prototype.params['langs'] = cm.merge(that.prototype._raw.params['langs'], that.prototype._update.params['langs']);
            if(that.prototype._inherit){
                that.prototype._inherit.prototype.updateLangs.call(that.prototype._inherit);
                that.prototype.params['langs'] = cm.merge(that.prototype._inherit.prototype.params['langs'], that.prototype.params['langs']);
            }
        }else{
            that.params['langs'] = cm.merge(that._raw.params['langs'], that._update.params['langs']);
            if(that._inherit){
                that._inherit.prototype.updateLangs.call(that._inherit);
                that.params['langs'] = cm.merge(that._inherit.prototype.params['langs'], that.params['langs']);
            }
        }
        return that;
    },
    'setLangs' : function(o){
        var that = this;
        if(cm.isObject(o)){
            if(cm.isFunction(that)){
                that.prototype.updateLangs.call(that.prototype);
                that.prototype.params['langs'] = cm.merge(that.prototype.params['langs'], o);
                that.prototype._update.params['langs'] = cm.merge(that.prototype._update.params['langs'], o);
            }else{
                that.updateLangs();
                that.params['langs'] = cm.merge(that.params['langs'], o);
                that._update = cm.clone(that._update);
                that._update.params['langs'] = cm.merge(that._update.params['langs'], o);
            }
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
        that.build['params']['nodesDataMarker'] = 'data-node';
        that.build['params']['nodesMarker'] = that.build._name['short'];
        if(!that.build['nodes']){
            that.build['nodes'] = {};
        }
        if(that.build._inherit){
            that.build['params']['nodes'] = cm.merge(that.build._inherit.prototype['params']['nodes'], that.build['params']['nodes']);
            that.build['nodes'] = cm.merge(that.build._inherit.prototype['nodes'], that.build['nodes']);
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
    },
    'getDataNodesObject' : function(container, dataMarker, className){
        var that = this,
            sourceNodes = {};
        container = typeof container == 'undefined'? document.body : container;
        dataMarker = typeof dataMarker == 'undefined'? that.params['nodesDataMarker'] : dataMarker;
        className = typeof className == 'undefined'? that.params['nodesMarker'] : className;
        if(className){
            sourceNodes = cm.getNodes(container, dataMarker)[className] || {};
        }else{
            sourceNodes = cm.getNodes(container, dataMarker);
        }
        return sourceNodes;
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
                'message' : ['Parameter', cm.strWrap(key, '"'), 'does not exist or is not set in component with name', cm.strWrap(that.params['name'], '"'), '.'].join(' ')
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
        that.callbacks = cm.clone(that.callbacks);
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
        that.callbacks = cm.clone(that.callbacks);
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
        if(!that._stackItem){
            that._stackItem = {
                'name' : that.params['name'],
                'node' : node,
                'class' : that,
                'className' : that._name['full']
            };
            that._stack.push(that._stackItem);
        }else if(cm.isNode(node)){
            that._stackItem['node'] = node;
        }
        return that;
    },
    'removeFromStack' : function(){
        var that = this;
        cm.arrayRemove(that._stack, that._stackItem);
        that._stackItem = null;
        return that;
    },
    'isAppropriateToStack' : function(name, parent, callback){
        var that = this,
            item = that._stackItem;
        if((cm.isEmpty(name) || item['name'] == name) && cm.isParent(parent, item['node'], true)){
            callback(item['class'], item, name);
            return true;
        }
        return false;
    },
    'findInStack' : function(name, parent, callback){
        var that = this,
            items = [];
        callback = typeof callback == 'function' ? callback : function(){};
        cm.forEach(that._stack, function(item){
            if((cm.isEmpty(name) || item['name'] == name) && (cm.isEmpty(parent) || cm.isParent(parent, item['node'], true))){
                items.push(item);
                callback(item['class'], item, name);
            }
        });
        return items;
    },
    'getStackNode' : function(){
        var that = this;
        return that._stackItem['node'];
    }
};

/* ****** STRUCTURE ******* */

Mod['Structure'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(typeof that.build['params']['renderStructure'] == 'undefined'){
            that.build['params']['renderStructure'] = true;
        }
        if(typeof that.build['params']['embedStructure'] == 'undefined'){
            that.build['params']['embedStructure'] = 'append';
        }
    },
    'embedStructure' : function(node){
        var that = this;
        switch(that.params['embedStructure']){
            case 'replace':
                that.replaceStructure(node);
                break;
            case 'append':
                that.appendStructure(node);
                break;
        }
        return that;
    },
    'appendStructure' : function(node){
        var that = this;
        if(that.params['container']){
            that.params['container'].appendChild(node);
        }else if(that.params['node']){
            that.params['node'].appendChild(node);
        }
        return that;
    },
    'replaceStructure' : function(node){
        var that = this;
        if(that.params['container']){
            if(that.params['container'] === that.params['node']){
                cm.insertBefore(node, that.params['node']);
            }else{
                that.params['container'].appendChild(node);
            }
        }else if(that.params['node'].parentNode){
            cm.insertBefore(node, that.params['node']);
        }
        cm.remove(that.params['node']);
        return that;
    }
};

/* ******* CONTROLLER ******* */

Mod['Controller'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        if(typeof that.build['params']['removeOnDestruct'] == 'undefined'){
            that.build['params']['removeOnDestruct'] = true;
        }
        if(that.build['params']['customEvents'] !== false){
            that.build['params']['customEvents'] = cm.merge({
                'destruct' : true,
                'redraw' : true,
                'refresh' : true,
                'resume' : true,
                'suspend' : true
            }, that.build['params']['customEvents']);
        }
        if(that.build['params']['triggerCustomEvents'] !== false){
            that.build['params']['triggerCustomEvents'] = cm.merge({
                'destruct' : true,
                'redraw' : true,
                'refresh' : true,
                'resume' : true,
                'suspend' : true
            }, that.build['params']['triggerCustomEvents']);
        }
        that.build._isConstructed = false;
        that.build._isDestructed = false;
        that.build._isSuspended = false;
    },
    'construct' : function(){
        var that = this;
        var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
        if(!that._isConstructed){
            that._isConstructed = true;
            that._isDestructed = false;
            that._isSuspended = false;
            if(that.params['customEvents']){
                if(that.params['customEvents'] === true){
                    cm.customEvent.add(node, 'destruct', that.destruct);
                    cm.customEvent.add(node, 'redraw', that.redraw);
                    cm.customEvent.add(node, 'refresh', that.refresh);
                    cm.customEvent.add(node, 'resume', that.resume);
                    cm.customEvent.add(node, 'suspend', that.suspend);
                }else{
                    cm.forEach(that.params['customEvents'], function(bool, key){
                        bool && cm.customEvent.add(node, 'destruct', that[key]);
                    });
                }
            }
            that.constructHook(node);
        }
        return that;
    },
    'destruct' : function(){
        var that = this;
        if(that._isConstructed && !that._isDestructed){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that._isConstructed = false;
            that._isDestructed = true;
            that.destructHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['destruct'])){
                cm.customEvent.trigger(node, 'destruct', {
                    'type' : 'child',
                    'self' : false
                });
            }
            if(that.params['customEvents']){
                if(that.params['customEvents'] === true){
                    cm.customEvent.remove(node, 'destruct', that.destruct);
                    cm.customEvent.remove(node, 'redraw', that.redraw);
                    cm.customEvent.remove(node, 'refresh', that.refresh);
                    cm.customEvent.remove(node, 'resume', that.resume);
                    cm.customEvent.remove(node, 'suspend', that.suspend);
                }else{
                    cm.forEach(that.params['customEvents'], function(bool, key){
                        bool && cm.customEvent.remove(node, 'destruct', that[key]);
                    });
                }
            }
            that._modules['Stack'] && that.removeFromStack();
            that.params['removeOnDestruct'] && cm.remove(node);
        }
        return that;
    },
    'resume' : function(){
        var that = this;
        if(that._isSuspended){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that._isSuspended = false;
            that.resumeHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['resume'])){
                cm.customEvent.trigger(node, 'resume', {
                    'type' : 'child',
                    'self' : false
                });
            }
        }
        return that;
    },
    'suspend' : function(){
        var that = this;
        if(!that._isSuspended){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that._isSuspended = true;
            that.suspendHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['suspend'])){
                cm.customEvent.trigger(node, 'suspend', {
                    'type' : 'child',
                    'self' : false
                });
            }
        }
        return that;
    },
    'refresh' : function(){
        var that = this;
        if(!that._isSuspended){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that.refreshHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['refresh'])){
                cm.customEvent.trigger(node, 'refresh', {
                    'type' : 'child',
                    'self' : false
                });
            }
        }
        return that;
    },
    'redraw' : function(){
        var that = this;
        if(!that._isSuspended){
            var node = that._modules['Stack'] ? that.getStackNode() : that.params['node'];
            that.redrawHook(node);
            if(that.params['triggerCustomEvents'] && (that.params['triggerCustomEvents'] === true || that.params['triggerCustomEvents']['redraw'])){
                cm.customEvent.trigger(node, 'redraw', {
                    'type' : 'child',
                    'self' : false
                });
            }
        }
        return that;
    },
    'constructHook' : function(node){
        var that = this;
        return that;
    },
    'destructHook' : function(node){
        var that = this;
        return that;
    },
    'resumeHook' : function(node){
        var that = this;
        return that;
    },
    'suspendHook' : function(node){
        var that = this;
        return that;
    },
    'refreshHook' : function(node){
        var that = this;
        return that;
    },
    'redrawHook' : function(node){
        var that = this;
        return that;
    }
};