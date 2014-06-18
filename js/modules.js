/* ******* EVENTS ******* */

Mod['Events'] = {
    '_define' : function(definer){
        if(!definer.data['params']['events']){
            definer.data['params']['events'] = {};
        }
        definer.extendObject['eventsList'] = definer.data['events'];
        definer.extendObject['events'] = {};
        cm.forEach(definer.data['events'], function(item){
            definer.extendObject['events'][item] = [];
            definer.extendObject[item] = function(handler){
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
        if(that.events[event]){
            cm.forEach(that.events[event], function(item){
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
    '_define' : function(definer){
        if(!definer.data['params']['langs']){
            definer.data['params']['langs'] = {};
        }
    },
    'lang' : function(str){
        var that = this;
        if(!that.params['langs'][str]){
            that.params['langs'][str] = str;
        }
        return that.params['langs'][str];
    }
};

/* ******* DATA CONFIG ******* */

Mod['DataConfig'] = {
    '_define' : function(definer){
        if(typeof definer.data['params']['configDataMarker'] == 'undefined'){
            definer.data['params']['configDataMarker'] = 'data-config';
        }
    },
    'getDataConfig' : function(container, dataMarker){
        var that = this,
            sourceConfig;
        if(container){
            dataMarker = dataMarker || that.params['configDataMarker'];
            sourceConfig = container.getAttribute(dataMarker);
            if(sourceConfig && (sourceConfig = JSON.parse(sourceConfig))){
                that.params = cm.merge(that.params, sourceConfig);
            }
        }
        return that;
    }
};

/* ******* DATA NODES ******* */

Mod['DataNodes'] = {
    '_define' : function(definer){
        if(!definer.data['params']['nodes']){
            definer.data['params']['nodes'] = {};
        }
        if(typeof definer.data['params']['nodesDataMarker'] == 'undefined'){
            definer.data['params']['nodesDataMarker'] = 'data-node';
        }
        if(typeof definer.data['params']['nodesMarker'] == 'undefined'){
            definer.data['params']['nodesMarker'] = definer.name.join('');
        }
        if(!definer.extendObject['nodes']){
            definer.extendObject['nodes'] = {};
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
    '_define' : function(definer){
        if(!definer.data['params']['name']){
            definer.data['params']['name'] = '';
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