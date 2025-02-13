/* ******* EXTEND ******* */

Mod['Extend'] = {
    '_config' : {
        'extend' : true,
        'predefine' : true
    },
    '_construct' : function(){},
    '_extend' : function(name, o){
        var that = this;
        if(!that.build._modules[name]){
            // Merge Config
            o._config = cm.merge({
                'extend' : false,
                'predefine' : false,
                'require' : [],
                'events' : []
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
            // Extend class events
            if(!cm.isEmpty(o._config['events'])){
                that.build._raw['events'] = cm.extend(that.build._raw['events'], o._config['events']);
            }
            // Construct module
            if(cm.isFunction(o._construct)){
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
                'require' : [],
                'events' : []
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
                        cm._defineStack[that._name['full']].prototype[key] = item;
                    }
                });
            }
            // Extend events
            if(!cm.isEmpty(o._config['events'])){
                cm._defineStack[that._name['full']].prototype._raw['events'] = cm.extend(cm._defineStack[that._name['full']].prototype._raw['events'], o._config['events']);
            }
            // Construct module
            if(cm.isFunction(o._construct)){
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
        if(typeof that.build['params']['consoleLogErrors'] === 'undefined'){
            that.build['params']['consoleLogErrors'] = true;
        }
    },
    'renderComponent' : function(){
        var that = this;
        cm.forEach(that._modules, function(module){
            cm.isFunction(module._render) && module._render.call(that);
        })
    },
    'cloneComponent' : function(params){
        var that = this,
            component = null;
        cm.getConstructor(that._className, function(classConstructor){
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
        'require' : ['Extend'],
        'events' : ['onSetParams']
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
    '_render' : function(){
        var that = this;
        if(that._inherit){
            that.params = cm.merge(that._inherit.prototype['params'], that.params);
        }
    },
    'setParams' : function(params, replace, triggerEvents){
        var that = this;
        replace = cm.isUndefined(replace) ? false : replace;
        triggerEvents = !cm.isUndefined(triggerEvents) ? triggerEvents : true;
        that.params = cm.merge(replace ? that._raw.params : that.params, params);
        that._update = cm.clone(that._update);
        that._update.params = cm.merge(that._update.params, that.params);
        // Validate params
        cm.forEach(that.params, function(item, key){
            switch(key){
                case 'messages':
                case 'strings':
                case 'langs':
                    cm.isFunction(that.setLangs) && that.setLangs(item);
                    break;

                default:
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
                            if(/^cm._config./i.test(item)){
                                that.params[key] = cm._config[item.replace('cm._config.', '')];
                            }
                            if(/^@LESS./i.test(item)){
                                that.params[key] = window.LESS[item.replace('@LESS.', '')];
                            }
                            break;
                    }
                    break
            }
        });
        // Trigger event if module defined
        if(triggerEvents && that._modules['Events']){
            that.triggerEvent('onSetParams');
        }
        return that;
    },
    'getParams' : function(key){
        var that = this;
        return key ? that.params[key] : that.params;
    },
    'getRawParams' : function(key){
        var that = this;
        return key ? that._raw.params[key] : that._raw.params;
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
            that.build['params']['events'] = cm.extend(that.build._inherit.prototype['params']['events'], that.build['params']['events'], true);
            that.build['events'] = cm.extend(that.build._inherit.prototype['events'], that.build['events'], true);
        }
    },
    '_render' : function(){
        var that = this;
        if(that._inherit){
            that.params['events'] = cm.extend(that._inherit.prototype['params']['events'], that.params['events'], true);
            that.events = cm.extend(that._inherit.prototype['events'], that.events, true);
        }
    },
    'addEvent' : function(event, handler){
        var that = this;
        // ToDo: investigate this clone and remove it
        that.events = cm.clone(that.events);
        if(that.events[event]){
            if(cm.isFunction(handler)){
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
        // ToDo: investigate this clone and remove it
        that.events = cm.clone(that.events);
        if(that.events[event]){
            if(cm.isFunction(handler)){
                that.events[event] = that.events[event].filter(function(item){
                    return item !== handler;
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
    'removeAllEvent' : function(event){
        var that = this;
        // ToDo: investigate this clone and remove it
        that.events = cm.clone(that.events);
        if(that.events[event]){
            that.events = [];
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
        var that = this,
            data = cm.clone(arguments),
            events;
        // Replace event name parameter with context (legacy) in data
        data[0] = that;
        if(that.events[event]){
            // ToDo: investigate this clone and remove it
            events = cm.clone(that.events[event]);
            cm.forEach(events, function(event){
                event.apply(that, data);
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
            if(cm.isArray(item)){
                cm.forEach(item, function(itemA){
                    that.addEvent(key, itemA);
                });
            }else{
                that.addEvent(key, item);
            }
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
        if(!that.build['strings']){
            that.build['strings'] = {};
        }
        if(!that.build['params']['langs']){
            that.build['params']['langs'] = {};
        }
    },
    '_render' : function(){
        var that = this;
        that.strings = cm.merge(that.strings, that.params['langs']);
    },
    'lang' : function(str, vars, plural){
        var that = this,
            langStr;
        if(cm.isUndefined(str) || cm.isEmpty(str)){
            return '';
        }
        // Get string
        langStr = that.getLang(str);
        if(cm.isUndefined(langStr)){
            langStr = str;
        }
        // Process variable
        if(cm.isObject(langStr) || cm.isArray(langStr)){
            langStr = cm.objectReplace(langStr, vars);
        }else{
            langStr = cm.strReplace(langStr, vars);
        }
        // Plural
        if(!cm.isUndefined(plural) && cm.isArray(langStr)){
            langStr = cm.plural(plural, langStr);
        }
        return langStr;
    },
    'message' : function(){
        var that = this;
        return that.lang.apply(that, arguments);
    },
    'msg' : function(){
        var that = this;
        return that.lang.apply(that, arguments);
    },
    'getLang' : function(str){
        var that = this,
            objStr,
            langStr;
        if(cm.isUndefined(str) || cm.isEmpty(str)){
            return;
        }
        // Try to get string from current controller params array
        objStr = str === '*' ? undefined : str;
        langStr = cm.reducePath(objStr, that.params.langs);
        // Try to get string from current controller strings array
        if(cm.isUndefined(langStr) || cm.isObject(langStr)){
            var controllerLangStr = cm.reducePath(objStr, that.strings);
            if(cm.isObject(langStr)) {
                langStr = cm.merge(controllerLangStr, langStr);
            }else{
                langStr = controllerLangStr;
            }
        }
        // Try to get string from parent controller
        if(that._inherit && (cm.isUndefined(langStr) || cm.isObject(langStr))){
            var inheritLangStr = that._inherit.prototype.getLang(str);
            if(cm.isObject(langStr)){
                langStr = cm.merge(inheritLangStr, langStr);
            }else{
                langStr = inheritLangStr;
            }
        }
        return langStr;
    },
    'getMessage' : function(){
        var that = this;
        return that.getLang.apply(that, arguments);
    },
    'getMsg' : function(){
        var that = this;
        return that.getLang.apply(that, arguments);
    },
    'langObject' : function(str){
        var that = this,
            o = that.lang(str);
        if (cm.isFunction(o)) {
            return o(str);
        } else {
            return cm.isObject(o) || cm.isArray(o) ? o : {};
        }
    },
    'messageObject' : function(){
        var that = this;
        return that.langObject.apply(that, arguments);
    },
    'msgObject' : function(){
        var that = this;
        return that.langObject.apply(that, arguments);
    },
    'setLangs' : function(o){
        var that = this;
        if(cm.isObject(o)){
            if(cm.isFunction(that)){
                that.prototype.strings = cm.merge(that.prototype.strings, o);
            }else{
                that.strings = cm.merge(that.strings, o);
            }
        }
        return that;
    },
    'setMessages' : function(){
        var that = this;
        return that.setLangs.apply(that, arguments);
    },
    'setMsgs' : function(){
        var that = this;
        return that.setLangs.apply(that, arguments);
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
        if(cm.isUndefined(that.build['params']['configDataMarker'])){
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
        container = cm.isUndefined(container) ? document.body : container;
        if(container){
            dataMarker = cm.isUndefined(dataMarker) ? that.params['nodesDataMarker'] : dataMarker;
            className = cm.isUndefined(className) ? that.params['nodesMarker'] : className;
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
            sourceNodes;
        container = typeof container === 'undefined'? document.body : container;
        dataMarker = typeof dataMarker === 'undefined'? that.params['nodesDataMarker'] : dataMarker;
        className = typeof className === 'undefined'? that.params['nodesMarker'] : className;
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
    'storageGet' : function(key, session){
        var that = this,
            method = session ? 'sessionStorageGet' : 'storageGet',
            storage = cm.parseJSON(cm[method](that._className)) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._className,
                'message' : 'Storage cannot be read because "name" parameter not provided.'
            });
            return null;
        }
        if(!storage[that.params['name']] || cm.isUndefined(storage[that.params['name']][key])){
            cm.errorLog({
                'type' : 'attention',
                'name' : that._className,
                'message' : ['Parameter', cm.strWrap(key, '"'), 'does not exist or is not set in component with name', cm.strWrap(that.params['name'], '"'), '.'].join(' ')
            });
            return null;
        }
        return storage[that.params['name']][key];
    },
    'storageRead' : function(){
        var that = this;
        return that.storageGet.apply(that, arguments);
    },
    'storageGetAll' : function(session){
        var that = this,
            method = session ? 'sessionStorageGet' : 'storageGet',
            storage = cm.parseJSON(cm[method](that._className)) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._className,
                'message' : 'Storage cannot be read because "name" parameter not provided.'
            });
            return {};
        }
        if(!storage[that.params['name']]){
            cm.errorLog({
                'type' : 'attention',
                'name' : that._className,
                'message' : 'Storage is empty.'
            });
            return {};
        }
        return storage[that.params['name']];
    },
    'storageReadAll' : function(){
        var that = this;
        return that.storageGetAll.apply(that, arguments);
    },
    'storageSet' : function(key, value, session){
        var that = this,
            method = session ? 'sessionStorageGet' : 'storageGet',
            storage = cm.parseJSON(cm[method](that._className)) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._className,
                'message' : 'Storage cannot be written because "name" parameter not provided.'
            });
            return {};
        }
        if(!storage[that.params['name']]){
            storage[that.params['name']] = {};
        }
        storage[that.params['name']][key] = value;
        method = session ? 'sessionStorageSet' : 'storageSet';
        cm[method](that._className, JSON.stringify(storage));
        return storage[that.params['name']];
    },
    'storageWrite' : function(){
        var that = this;
        return that.storageSet.apply(that, arguments);
    },
    'storageSetAll' : function(data, session){
        var that = this,
            method = session ? 'sessionStorageGet' : 'storageGet',
            storage = cm.parseJSON(cm[method](that._className)) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._className,
                'message' : 'Storage cannot be written because "name" parameter not provided.'
            });
            return {};
        }
        storage[that.params['name']] = data;
        method = session ? 'sessionStorageSet' : 'storageSet';
        cm[method](that._className, JSON.stringify(storage));
        return storage[that.params['name']];
    },
    'storageWriteAll' : function(){
        var that = this;
        return that.storageSetAll.apply(that, arguments);
    },
    'storageRemove' : function(key, session){
        var that = this,
            method = session ? 'sessionStorageGet' : 'storageGet',
            storage = cm.parseJSON(cm[method](that._className)) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'type' : 'error',
                'name' : that._className,
                'message' : 'Storage cannot be written because "name" parameter not provided.'
            });
            return {};
        }
        if(!storage[that.params['name']]){
            storage[that.params['name']] = {};
        }
        delete storage[that.params['name']][key];
        method = session ? 'sessionStorageSet' : 'storageSet';
        cm[method](that._className, JSON.stringify(storage));
        return storage[that.params['name']];
    },
    'storageClear' : function(){
        var that = this;
        return that.storageRemove.apply(that, arguments);
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
        if(that.build._inherit){
            that.build['params']['callbacks'] = cm.extend(that.build._inherit.prototype['params']['callbacks'], that.build['params']['callbacks']);
            that.build['callbacks'] = cm.extend(that.build._inherit.prototype['callbacks'], that.build['callbacks']);
        }
    },
    '_render' : function(){
        var that = this;
        if(that._inherit){
            that.params['callbacks'] = cm.merge(that._inherit.prototype['params']['callbacks'], that.params['callbacks']);
            that.callbacks = cm.extend(that._inherit.prototype['callbacks'], that.callbacks);
        }
    },
    'callbacksProcess' : function(){
        var that = this;
        // ToDo: investigate this clone and remove it
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
        // ToDo: investigate this clone and remove it
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
        var that = this,
            name = cm.isNumber(that.params['name']) ? that.params['name'].toString() : that.params['name'];
        if(!that._stackItem){
            that._stackItem = {
                'name' : name,
                'node' : node,
                'class' : that, // ToDo: Deprecated
                'classObject': that,
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
        name = cm.isNumber(name) ? name.toString() : name;
        callback = cm.isFunction(callback) ? callback : function(){};
        if((cm.isEmpty(name) || item['name'] === name) && (cm.isEmpty(parent) || cm.isParent(parent, item['node'], true))){
            callback(item['classObject'], item, name);
            return true;
        }
        return false;
    },
    'findInStack' : function(name, parent, callback){
        var that = this,
            items = [];
        name = cm.isNumber(name) ? name.toString() : name;
        callback = cm.isFunction(callback) ? callback : function(){};
        cm.forEach(that._stack, function(item){
            if((cm.isEmpty(name) || item['name'] === name) && (cm.isEmpty(parent) || cm.isParent(parent, item['node'], true))){
                items.push(item);
                callback(item['classObject'], item, name);
            }
        });
        return items;
    },
    'getStackNode' : function(){
        var that = this;
        return that._stackItem ? that._stackItem['node'] : null;
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
        if(cm.isUndefined(that.build['params']['renderStructure'])){
            that.build['params']['renderStructure'] = true;
        }
        if(cm.isUndefined(that.build['params']['embedStructure'])){
            that.build['params']['embedStructure'] = 'append';
        }
    },
    'embedStructure' : function(node, container){
        var that = this;
        switch(that.params['embedStructure']){
            case 'replace':
                that.replaceStructure(node);
                break;
            case 'append':
            case 'last':
                that.appendStructure(node, 'insertLast', container);
                break;
            case 'prepend':
            case 'first':
                that.appendStructure(node, 'insertFirst', container);
                break;
        }
        return that;
    },
    'appendStructure' : function(node, type, container){
        var that = this;
        container = container || that.params['container'] || that.params['node'];
        container && cm[type](node, container);
        return that;
    },
    'replaceStructure' : function(node, container){
        var that = this;
        container = container || that.params['container'];
        if(container){
            if(that.params['container'] === that.params['node']){
                cm.insertBefore(node, that.params['node']);
            }else{
                that.params['container'].appendChild(node);
            }
        }else if(that.params['node']){
            cm.insertBefore(node, that.params['node']);
        }
        cm.remove(that.params['node']);
        return that;
    }
};
