/* ******* PARAMS ******* */

Mod['Params'] = {
    '_define' : function(){
        var that = this;
        if(!that.extendObject['params']){
            that.extendObject['params'] = {};
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
    '_define' : function(){
        var that = this;
        if(!that.data['params']['events']){
            that.data['params']['events'] = {};
        }
        that.extendObject['events'] = that.data['events'];
        that.extendObject['eventsStack'] = {};
        cm.forEach(that.data['events'], function(item){
            that.extendObject['eventsStack'][item] = [];
            that.extendObject[item] = function(handler){
                var that = this;
                that.addEvent(item, handler);
                return that;
            };
        });
    },
    'addEvent' : function(event, handler){
        var that = this;
        that.eventsStack = cm.clone(that.eventsStack);
        if(that.eventsStack[event]){
            if(typeof handler == 'function'){
                that.eventsStack[event].push(handler);
            }else{
                cm.errorLog({
                    'name' : that.className,
                    'message' : ['Handler of event', cm.strWrap(event, '"'), 'must be a function.'].join(' ')
                });
            }
        }else{
            cm.errorLog({
                'name' : that.className,
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
        that.eventsStack = cm.clone(that.eventsStack);
        if(that.eventsStack[event]){
            if(typeof handler == 'function'){
                that.eventsStack[event] = that.eventsStack[event].filter(function(item){
                    return item != handler;
                });
            }else{
                cm.errorLog({
                    'name' : that.className,
                    'message' : ['Handler of event', cm.strWrap(event, '"'), 'must be a function.'].join(' ')
                });
            }
        }else{
            cm.errorLog({
                'name' : that.className,
                'message' : [cm.strWrap(event, '"'), 'does not exists.'].join(' ')
            });
        }
        return that;
    },
    'triggerEvent' : function(event, params){
        var that = this;
        if(that.eventsStack[event]){
            cm.forEach(that.eventsStack[event], function(item){
                item(that, params || {});
            });
        }else{
            cm.errorLog({
                'name' : that.className,
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
    '_define' : function(){
        var that = this;
        if(!that.data['params']['langs']){
            that.data['params']['langs'] = {};
        }
    },
    'lang' : function(str){
        var that = this;
        if(cm.isEmpty(str)){
            return that.params['langs'];
        }
        if(!that.params['langs'][str]){
            that.params['langs'][str] = str;
        }
        return that.params['langs'][str];
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
    '_define' : function(){
        var that = this;
        if(typeof that.data['params']['configDataMarker'] == 'undefined'){
            that.data['params']['configDataMarker'] = 'data-config';
        }
    },
    'getDataConfig' : function(container, dataMarker){
        var that = this,
            sourceConfig;
        if(cm.isNode(container)){
            dataMarker = dataMarker || that.params['configDataMarker'];
            sourceConfig = container.getAttribute(dataMarker);
            if(sourceConfig && (sourceConfig = JSON.parse(sourceConfig))){
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
            if(sourceConfig && (sourceConfig = JSON.parse(sourceConfig))){
                return sourceConfig;
            }
        }
        return {};
    }
};

/* ******* DATA NODES ******* */

Mod['DataNodes'] = {
    '_define' : function(){
        var that = this;
        if(!that.data['params']['nodes']){
            that.data['params']['nodes'] = {};
        }
        if(typeof that.data['params']['nodesDataMarker'] == 'undefined'){
            that.data['params']['nodesDataMarker'] = 'data-node';
        }
        if(typeof that.data['params']['nodesMarker'] == 'undefined'){
            that.data['params']['nodesMarker'] = that.classNameShort;
        }
        if(!that.extendObject['nodes']){
            that.extendObject['nodes'] = {};
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
    '_define' : function(){
        var that = this;
        if(!that.data['params']['name']){
            that.data['params']['name'] = '';
        }
    },
    'storageRead' : function(key){
        var that = this,
            storage = JSON.parse(cm.storageGet(that.className)) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'name' : that.className,
                'message' : 'Storage cannot be read because "name" parameter not provided.'
            });
            return null;
        }
        if(!storage[that.params['name']] || typeof storage[that.params['name']][key] == 'undefined'){
            cm.errorLog({
                'type' : 'attention',
                'name' : that.className,
                'message' : ['Parameter', cm.strWrap(key, '"'), 'does not exist or is not set.'].join(' ')
            });
            return null;
        }
        return storage[that.params['name']][key];
    },
    'storageReadAll' : function(){
        var that = this,
            storage = JSON.parse(cm.storageGet(that.className)) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'name' : that.className,
                'message' : 'Storage cannot be read because "name" parameter not provided.'
            });
            return {};
        }
        if(!storage[that.params['name']]){
            cm.errorLog({
                'type' : 'attention',
                'name' : that.className,
                'message' : 'Storage is empty.'
            });
            return {};
        }
        return storage[that.params['name']];
    },
    'storageWrite' : function(key, value){
        var that = this,
            storage = JSON.parse(cm.storageGet(that.className)) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'name' : that.className,
                'message' : 'Storage cannot be written because "name" parameter not provided.'
            });
            return {};
        }
        if(!storage[that.params['name']]){
            storage[that.params['name']] = {};
        }
        storage[that.params['name']][key] = value;
        cm.storageSet(that.className, JSON.stringify(storage));
        return storage[that.params['name']];
    },
    'storageWriteAll' : function(data){
        var that = this,
            storage = JSON.parse(cm.storageGet(that.className)) || {};
        if(cm.isEmpty(that.params['name'])){
            cm.errorLog({
                'name' : that.className,
                'message' : 'Storage cannot be written because "name" parameter not provided.'
            });
            return {};
        }
        storage[that.params['name']] = data;
        cm.storageSet(that.className, JSON.stringify(storage));
        return storage[that.params['name']];
    }
};