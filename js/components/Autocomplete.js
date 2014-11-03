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
        'onChange'
    ],
    'params' : {
        'input' : cm.Node('input', {'type' : 'text'}),      // HTML input node
        'target' : false,                                   // HTML node
        'container' : 'document.body',
        'minLength' : 3,
        'delay' : 300,
        'clearOnEmpty' : true,
        'showLoader' : true,
        'data' : [],                                        // Example: [{'value' : 'foo', 'text' : 'Bar'}].
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                     // Request URL, Variables: %query%, %callback%
            'params' : ''                                   // Params string or object
        },
        'Com.Tooltip' : {
            'hideOnOut' : true,
            'targetEvent' : 'none',
            'className' : 'com__ac-tooltip',
            'width' : 'targetWidth',
            'top' : 'targetHeight + 3'
        },
        'langs' : {
            'loader' : 'Searching for: %query%.'
        }
    }
},
function(params){
    var that = this,
        requestDelay,
        ajaxHandler;

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
    };

    var render = function(){
        // Init tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['container'],
                'target' : that.params['target']
            })
        );
        // Add events
        cm.addEvent(that.params['input'], 'input', requestHelper);
        cm.addEvent(that.params['input'], 'keydown', inputHelper);
        cm.addEvent(that.params['input'], 'blur', blurHandler);
        that.triggerEvent('onRender');
    };

    var inputHelper = function(e){
        var listLength, listIndex;
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
        clear();
        that.hide();
    };

    var requestHelper = function(){
        var query = that.params['input'].value;
        // Clear tooltip ajax/static delay and filtered items list
        that.selectedItemIndex = null;
        that.registeredItems = [];
        requestDelay && clearTimeout(requestDelay);
        that.callbacks.abort(that, ajaxHandler);

        if(query.length >= that.params['minLength']){
            requestDelay = setTimeout(function(){
                if(that.isAjax){
                    if(that.params['showLoader']){
                        that.callbacks.loader(that, query);
                    }
                    ajaxHandler = that.callbacks.request(that, query, that.params['ajax']);
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
        that.callbacks.abort(that, ajaxHandler);
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

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, query, config){
        config['url'] = config['url'].replace('%query%', query);
        config['params'] = config['params'].replace('%query%', query);
        return config;
    };

    that.callbacks.request = function(that, query, config){
        config = that.callbacks.prepare(that, query, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'handler' : function(response){
                    that.callbacks.response(that, query, config, response);
                }
            })
        );
    };

    that.callbacks.response = function(that, query, config, response){
        if(response){
            if(/json|jsonp/i.test(config['type'])){
                if(response['data']){
                    that.callbacks.render(that, response['data']);
                }
            }
        }
    };

    that.callbacks.abort = function(that, ajaxHandler){
        if(ajaxHandler && ajaxHandler.abort){
            ajaxHandler.abort();
        }
        return ajaxHandler;
    };

    that.callbacks.loader = function(that, query){
        var nodes = {};
        // Render Structure
        nodes['container'] = cm.Node('div', {'class' : 'cm-items-list disabled'},
            cm.Node('ul',
                cm.Node('li',
                    cm.Node('a',
                        cm.Node('span', {'class' : 'icon small loader-circle'}),
                        cm.Node('span', that.lang('loader').replace('%query%', query))
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
        items = that.callbacks.filter(that, query, items);
        that.callbacks.render(that, items);
    };

    /* *** HELPERS *** */

    that.callbacks.filter = function(that, query, items){
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
        nodes['container'] = cm.Node('div', {'class' : 'cm-items-list'},
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

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = null;
        that.params['input'].value = '';
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

    init();
});