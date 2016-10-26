cm.define('Com.TabsetHelper', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Callbacks',
        'DataNodes',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onTabShowStart',
        'onTabShow',
        'onTabHideStart',
        'onTabHide',
        'onLabelTarget',
        'onRequestStart',
        'onRequestEnd',
        'onRequestError',
        'onRequestSuccess',
        'onRequestAbort',
        'onContentRenderStart',
        'onContentRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'active' : null,
        'items' : [],
        'targetEvent' : 'click',                                    // click | hover
        'setFirstTabImmediately' : true,
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',                     // in ms
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : true,                                      // If true, html will append automatically
        'cache' : false,
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %tab%, %callback% for JSONP.
            'params' : ''                                           // Params object. %tab%, %baseUrl%, %callback% for JSONP.
        },
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        },
        'langs' : {
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        }
    }
},
function(params){
    var that = this;

    that.components = {};
    that.nodes = {
        'container': cm.Node('div'),
        'labels' : [],
        'tabs' : []
    };

    that.ajaxHandler = null;
    that.isAjax = false;
    that.isProcess = false;
    that.loaderDelay = null;
    that.targetEvent = null;

    that.current = false;
    that.previous = false;
    that.items = {};
    that.itemsList = [];

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
        // Set active tab
        if(that.params['active'] && that.items[that.params['active']]){
            set(that.params['active']);
        }
    };

    var validateParams = function(){
        // Ajax
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }
        // Target Event
        switch(that.params['targetEvent']){
            case 'hover':
                that.targetEvent = 'mouseover';
                break;
            case 'click':
            default:
                that.targetEvent = 'click';
                break;
        }
    };

    var render = function(){
        // Process tabs
        that.processTabs(that.nodes['tabs'], that.nodes['labels']);
        // Process tabs in parameters
        cm.forEach(that.params['items'], function(item){
            renderTab(item);
        });
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor){
            that.components['loader'] = new classConstructor(that.params['Com.Overlay']);
        });
    };

    var renderTab = function(item){
        item = cm.merge({
            'id' : '',
            'title' : '',
            'tab' : {
                'container' : cm.node('li'),
                'inner' : cm.node('div')
            },
            'label' : {
                'container' : cm.node('li'),
                'link' : cm.node('a')
            },
            'isHidden' : false,
            'isShow' : false,
            'isAjax' : false,
            'isCached' : false,
            'ajax' : {}
        }, item);
        if(!cm.isEmpty(item['ajax']['url'])){
            item.isAjax = true;
        }
        if(!cm.isEmpty(item['id']) && !that.items[item['id']]){
            that.itemsList.push(item);
            that.items[item['id']] = item;
            if(item.isHidden){
                cm.addClass(item['label']['container'], 'hidden');
                cm.addClass(item['tab']['container'], 'hidden');
            }
            cm.addEvent(item['label']['container'], that.targetEvent, function(){
                that.triggerEvent('onLabelTarget', {
                    'item' : item
                });
                set(item['id']);
            });
        }
    };

    var set = function(id){
        var item;
        if(that.current != id){
            that.triggerEvent('onTabShowStart', {
                'item' : that.items[id]
            });
            // Hide previous tab
            unset();
            // Show new tab
            that.current = id;
            item = that.items[that.current];
            item.isShow = true;
            if(!that.previous && that.params['setFirstTabImmediately']){
                cm.addClass(item['tab']['container'], 'is-immediately');
                cm.addClass(item['label']['container'], 'is-immediately');
                setTimeout(function(){
                    cm.removeClass(item['tab']['container'], 'is-immediately');
                    cm.removeClass(item['label']['container'], 'is-immediately');
                }, 5);
            }
            cm.addClass(item['tab']['container'], 'active');
            cm.addClass(item['label']['container'], 'active');
            if(item.isAjax && (!that.params['cache'] || (that.params['cache'] && !item.isCached))){
                that.ajaxHandler = that.callbacks.request(that, item, cm.merge(that.params['ajax'], item['ajax']));
            }else{
                that.triggerEvent('onTabShow', {
                    'item' : item
                });
            }
        }
    };

    var unset = function(){
        var item;
        if(that.current && that.items[that.current]){
            item = that.items[that.current];
            if(that.isProcess){
                that.abort();
            }
            that.previous = that.current;
            item.isShow = false;
            that.triggerEvent('onTabHideStart', {
                'item' : item
            });
            cm.removeClass(item['tab']['container'], 'active');
            cm.removeClass(item['label']['container'], 'active');
            that.triggerEvent('onTabHide', {
                'item' : item
            });
            that.current = null;
        }
    };

    var unsetHead = function(){
        var item;
        if(that.current && that.items[that.current]){
            item = that.items[that.current];
            cm.removeClass(item['label']['container'], 'active');
        }
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, item, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%tab%' : item['id'],
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%tab%' : item['id'],
            '%baseUrl%' : cm._baseUrl
        });
        return config;
    };

    that.callbacks.request = function(that, item, config){
        config = that.callbacks.prepare(that, item, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that, item, config);
                },
                'onSuccess' : function(response){
                    that.callbacks.response(that, item, config, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, item, config);
                },
                'onAbort' : function(){
                    that.callbacks.abort(that, item, config);
                },
                'onEnd' : function(){
                    that.callbacks.end(that, item,  config);
                }
            })
        );
    };

    that.callbacks.start = function(that, item, config){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.loaderDelay = setTimeout(function(){
                if(that.components['loader'] && !that.components['loader'].isOpen){
                    that.components['loader']
                        .embed(item['tab']['container'])
                        .open();
                }
            }, that.params['loaderDelay']);
        }
        that.triggerEvent('onRequestStart', {
            'item' : item
        });
    };

    that.callbacks.end = function(that, item, config){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.loaderDelay && clearTimeout(that.loaderDelay);
            if(that.components['loader'] && that.components['loader'].isOpen){
                that.components['loader'].close();
            }
        }
        that.triggerEvent('onRequestEnd', {
            'item' : item
        });
    };

    that.callbacks.filter = function(that, item, config, response){
        var data,
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    that.callbacks.response = function(that, item, config, response){
        if(!cm.isEmpty(response)){
            response = that.callbacks.filter(that, item, config, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.success(that, item, response);
        }else{
            that.callbacks.error(that, item, config);
        }
    };

    that.callbacks.error = function(that, item, config){
        that.callbacks.renderError(that, item, config);
        that.triggerEvent('onRequestError', {
            'item' : item
        });
    };

    that.callbacks.success = function(that, item, response){
        that.callbacks.render(that, item, response);
        that.triggerEvent('onRequestSuccess', {
            'tab' : item,
            'response' : response
        });
    };

    that.callbacks.abort = function(that, item, config){
        that.triggerEvent('onRequestAbort', {
            'item' : item
        });
    };

    /* *** RENDER *** */

    that.callbacks.render = function(that, item, data){
        item['data'] = data;
        item.isCached = true;
        // Render
        that.triggerEvent('onContentRenderStart', {
            'item' : item,
            'data' : data
        });
        that.callbacks.renderContent(that, item, data);
        that.triggerEvent('onContentRender', {
            'item' : item,
            'data' : data
        });
        that.triggerEvent('onTabShow', {
            'item' : item,
            'data' : data
        });
    };

    that.callbacks.renderContent = function(that, item, data){
        var nodes;
        if(that.params['responseHTML']){
            cm.clearNode(item['tab']['inner']);
            nodes = cm.strToHTML(data);
            if(!cm.isEmpty(nodes)){
                if(cm.isNode(nodes)){
                    item['tab']['inner'].appendChild(nodes);
                }else{
                    while(nodes.length){
                        if(cm.isNode(nodes[0])){
                            item['tab']['inner'].appendChild(nodes[0]);
                        }else{
                            cm.remove(nodes[0]);
                        }
                    }
                }
            }
        }
    };

    that.callbacks.renderError = function(that, item, config){
        if(that.params['responseHTML']){
            cm.clearNode(item['tab']['inner']);
            item['tab']['inner'].appendChild(
                cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'))
            );
        }
    };

    /* ******* PUBLIC ******* */

    that.set = function(id){
        if(id && that.items[id]){
            set(id);
        }
        return that;
    };

    that.setByIndex = function(index){
        var item;
        if(item = that.itemsList[index]){
            set(item['id']);
        }
        return that;
    };

    that.unset = function(){
        unset();
        that.previous = null;
        return that;
    };

    that.unsetHead = function(){
        unsetHead();
        return that;

    };

    that.get = function(){
        return that.current;
    };

    that.addTab = function(item){
        renderTab(item);
        return that;
    };

    that.addTabs = function(items){
        cm.forEach(items, function(item){
            renderTab(item);
        });
        return that;
    };

    that.processTabs = function(tabs, labels){
        var items = [],
            label,
            config,
            item;
        cm.forEach(tabs, function(tab, key){
            label = labels[key];
            config = cm.merge(that.getNodeDataConfig(tab['container']), that.getNodeDataConfig(label['container']));
            item = cm.merge(config, {
                'tab' : tab,
                'label' : label
            });
            items.push(item);
        });
        that.addTabs(items);
        return that;
    };

    that.getTab = function(id){
        if(id && that.items[id]){
            return that.items[id];
        }
        return null;
    };

    that.getTabs = function(){
        return that.items;
    };

    that.getCurrentTab = function(){
        return that.items[that.current];
    };

    that.isTabEmpty = function(id){
        var item = that.getTab(id);
        return !(item && item['tab']['inner'].childNodes.length);
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    init();
});