cm.define('Com.Autocomplete', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage',
        'Callbacks'
    ],
    'require' : [
        'Com.Tooltip'
    ],
    'events' : [
        'onRender',
        'onClear',
        'onSelect',
        'onChange',
        'onClickSelect',
        'onAbort',
        'onError'
    ],
    'params' : {
        'input' : cm.Node('input', {'type' : 'text'}),              // HTML input node.
        'target' : false,                                           // HTML node.
        'container' : 'document.body',
        'minLength' : 3,
        'delay' : 300,
        'clearOnEmpty' : true,                                      // Clear input and value if item didn't selected from tooltip
        'showLoader' : true,                                        // Show ajax spinner in tooltip, for ajax mode only.
        'data' : [],                                                // Examples: [{'value' : 'foo', 'text' : 'Bar'}] or ['Foo', 'Bar'].
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseurl%, %query%, %callback%.
            'params' : ''                                           // Params object. Variables: %baseurl%, %query%, %callback%.
        },
        'langs' : {
            'loader' : 'Searching for: %query%.'                    // Variable: %query%.
        },
        'Com.Tooltip' : {
            'hideOnOut' : true,
            'targetEvent' : 'none',
            'className' : 'com__ac-tooltip',
            'width' : 'targetWidth',
            'top' : 'targetHeight + 4'
        }
    }
},
function(params){
    var that = this,
        requestDelay,
        ajaxHandler;

    that.isOpen = false;
    that.isAjax = false;
    that.components = {};
    that.registeredItems = [];
    that.selectedItemIndex = null;
    that.value = null;
    that.previousValue = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['input']);
        that.callbacksProcess();
        validateParams();
        render();
    };

    var validateParams = function(){
        if(!that.params['target']){
            that.params['target'] = that.params['input'];
        }
        // If URL parameter exists, use ajax data
        that.isAjax = !cm.isEmpty(that.params['ajax']['url']);
        // Convert params object to URI string
        if(cm.isObject(that.params['ajax']['params'])){
            that.params['ajax']['params'] = cm.obj2URI(that.params['ajax']['params']);
        }
        // Prepare data
        that.params['data'] = that.convertData(that.params['data']);
    };

    var render = function(){
        // Init tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['container'],
                'target' : that.params['target'],
                'events' : {
                    'onShowStart' : function(){
                        that.isOpen = true;
                        cm.addEvent(document, 'mousedown', bodyEvent);
                    },
                    'onHideStart' : function(){
                        that.isOpen = false;
                        cm.removeEvent(document, 'mousedown', bodyEvent);
                    }
                }
            })
        );
        // Set input
        that.setInput(that.params['input']);
        that.triggerEvent('onRender');
    };

    var inputHandler = function(e){
        var listLength,
            listIndex;
        e = cm.getEvent(e);

        switch(e.keyCode){
            // Enter
            case 13:
                clear();
                that.hide();
                break;
            // Arrow Up
            case 38:
                listLength = that.registeredItems.length;
                if(listLength){
                    if(that.selectedItemIndex == null){
                        that.selectedItemIndex = listLength - 1;
                    }else if(that.selectedItemIndex - 1 >= 0){
                        listIndex = that.selectedItemIndex - 1;
                    }else{
                        listIndex = listLength - 1;
                    }
                    setListItem(listIndex);
                }
                break;
            // Arrow Down
            case 40:
                listLength = that.registeredItems.length;
                if(listLength){
                    if(that.selectedItemIndex == null){
                        listIndex = 0;
                    }else if(that.selectedItemIndex + 1 < listLength){
                        listIndex = that.selectedItemIndex + 1;
                    }else{
                        listIndex = 0;
                    }
                    setListItem(listIndex);
                }
                break;
        }
    };

    var blurHandler = function(){
        if(!that.isOpen){
            clear();
        }
    };

    var requestHandler = function(){
        var query = that.params['input'].value,
            config = cm.clone(that.params['ajax']);
        // Clear tooltip ajax/static delay and filtered items list
        requestDelay && clearTimeout(requestDelay);
        that.selectedItemIndex = null;
        that.registeredItems = [];
        that.abort();

        if(query.length >= that.params['minLength']){
            requestDelay = setTimeout(function(){
                if(that.isAjax){
                    if(that.params['showLoader']){
                        that.callbacks.loader(that, config, query);
                    }
                    that.ajaxHandler = that.callbacks.request(that, config, query);
                }else{
                    that.callbacks.data(that, query, that.params['data']);
                }
            }, that.params['delay']);
        }else{
            that.hide();
        }
    };

    var setListItem = function(index){
        var previousItem = that.registeredItems[that.selectedItemIndex],
            item = that.registeredItems[index];
        if(previousItem){
            cm.removeClass(previousItem['node'], 'active');
        }
        if(item){
            cm.addClass(item['node'], 'active');
            that.components['tooltip'].scrollToNode(item['node']);
        }
        that.selectedItemIndex = index;
        // Set input data
        set(that.selectedItemIndex);
    };

    var set = function(index){
        var item = that.registeredItems[index];
        if(item){
            that.setRegistered(item, true);
        }
    };

    var clear = function(){
        var item;
        // Kill timeout interval and ajax request
        requestDelay && clearTimeout(requestDelay);
        that.abort();
        // Clear input
        if(that.params['clearOnEmpty']){
            item = that.getRegisteredItem(that.value);
            if(!item || item['data']['text'] != that.params['input'].value){
                that.clear();
            }
        }
    };

    var onChange = function(){
        if(that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
        }
    };

    var bodyEvent = function(e){
        e = cm.getEvent(e);
        var target = cm.getEventTarget(e);
        if(!that.isOwnNode(target)){
            clear();
            that.hide();
        }
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config, query){
        config = that.callbacks.beforePrepare(that, config, query);
        config['url'] = cm.strReplace(config['url'], {
            '%query%' : query,
            '%baseurl%' : cm._baseUrl
        });
        config['params'] = cm.strReplace(config['params'], {
            '%query%' : query,
            '%baseurl%' : cm._baseUrl
        });
        config = that.callbacks.afterPrepare(that, config, query);
        return config;
    };

    that.callbacks.beforePrepare = function(that, config, query){
        return config;
    };

    that.callbacks.afterPrepare = function(that, config, query){
        return config;
    };

    that.callbacks.request = function(that, config, query){
        config = that.callbacks.prepare(that, config, query);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onSuccess' : function(response){
                    that.callbacks.response(that, config, query, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, config, query);
                }
            })
        );
    };

    that.callbacks.filter = function(that, config, query, response){
        var data = [],
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    that.callbacks.response = function(that, config, query, response){
        if(response){
            response = that.callbacks.filter(that, config, query, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.render(that, that.convertData(response));
        }else{
            that.callbacks.render(that, []);
        }
    };

    that.callbacks.error = function(that, config, query){
        that.hide();
        that.triggerEvent('onError');
    };

    that.callbacks.loader = function(that, config, query){
        var nodes = {};
        // Render Structure
        nodes['container'] = cm.Node('div', {'class' : 'pt__listing-items disabled'},
            cm.Node('ul',
                cm.Node('li',
                    cm.Node('a',
                        cm.Node('span', {'class' : 'icon small loader-circle'}),
                        cm.Node('span', that.lang('loader', {'%query%' : query}))
                    )
                )
            )
        );
        // Embed nodes to Tooltip
        that.callbacks.embed(that, nodes['container']);
        // Show Tooltip
        that.show();
    };

    /* *** STATIC DATA *** */

    that.callbacks.data = function(that, query, items){
        // Filter data
        items = that.callbacks.query(that, query, items);
        that.callbacks.render(that, items);
    };

    /* *** HELPERS *** */

    that.callbacks.query = function(that, query, items){
        var filteredItems = [];
        cm.forEach(items, function(item){
            if(item['text'].toLowerCase().indexOf(query.toLowerCase()) > -1){
                filteredItems.push(item);
            }
        });
        return filteredItems;
    };

    that.callbacks.render = function(that, items){
        if(items.length){
            // Render List Nodes
            that.callbacks.renderList(that, items);
            // Show menu
            that.show();
        }else{
            that.hide();
        }
    };

    that.callbacks.renderList = function(that, items){
        var nodes = {};
        // Render structure
        nodes['container'] = cm.Node('div', {'class' : 'pt__listing-items'},
            nodes['items'] = cm.Node('ul')
        );
        // Render List Items
        cm.forEach(items, function(item, i){
            that.callbacks.renderItem(that, nodes['items'], item, i);
        });
        // Embed nodes to Tooltip
        that.callbacks.embed(that, nodes['container']);
    };

    that.callbacks.renderItem = function(that, container, item, i){
        var nodes = {};
        // Render Structure of List Item
        nodes['container'] = cm.Node('li',
            cm.Node('a', {'innerHTML' : item['text']})
        );
        // Highlight selected option
        if(that.value == item['value']){
            cm.addClass(nodes['container'], 'active');
            that.selectedItemIndex = i;
        }
        // Register item
        that.callbacks.registerItem(that, nodes['container'], item, i);
        // Embed Item to List
        cm.appendChild(nodes['container'], container);
    };

    that.callbacks.registerItem = function(that, node, item, i){
        var regItem = {
            'data' : item,
            'node' : node,
            'i' : i
        };
        cm.addEvent(regItem['node'], 'click', function(){
            that.setRegistered(regItem, true);
            that.triggerEvent('onClickSelect', that.value);
            that.hide();
        });
        that.registeredItems.push(regItem);
    };

    that.callbacks.embed = function(that, container){
        that.components['tooltip'].setContent(container);
    };

    /* ******* MAIN ******* */

    that.set = function(item, triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = typeof item['value'] != 'undefined'? item['value'] : item['text'];
        that.params['input'].value = item['text'];
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            onChange();
        }
        return that;
    };

    that.setRegistered = function(item, triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.set(item['data'], triggerEvents);
        return that;
    };

    that.setInput = function(node){
        if(cm.isNode(node)){
            that.params['input'] = node;
            cm.addEvent(that.params['input'], 'input', requestHandler);
            cm.addEvent(that.params['input'], 'keydown', inputHandler);
            cm.addEvent(that.params['input'], 'blur', blurHandler);
        }
        return that;
    };

    that.setTarget = function(node){
        if(cm.isNode(node)){
            that.params['target'] = node;
            that.components['tooltip'].setTarget(node);
        }
        return that;
    };

    that.get = function(){
        return that.value;
    };

    that.getItem = function(value){
        var item;
        if(value){
            cm.forEach(that.params['data'], function(dataItem){
                if(dataItem['value'] == value){
                    item = dataItem;
                }
            });
        }
        return item;
    };

    that.getRegisteredItem = function(value){
        var item;
        if(value){
            cm.forEach(that.registeredItems, function(regItem){
                if(regItem['data']['value'] == value){
                    item = regItem;
                }
            });
        }
        return item;
    };

    that.convertData = function(data){
        var newData = data.map(function(item){
            if(!cm.isObject(item)){
                return {'text' : item, 'value' : item};
            }else{
                return item;
            }
        });
        return newData;
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = null;
        if(that.params['clearOnEmpty']){
            that.params['input'].value = '';
        }
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            onChange();
        }
        return that;
    };

    that.show = function(){
        that.components['tooltip'].show();
        return that;
    };

    that.hide = function(){
        that.components['tooltip'].hide();
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.isOwnNode = function(node){
        return that.components['tooltip'].isOwnNode(node);
    };

    init();
});