cm.define('Com.Autocomplete', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage',
        'Callbacks',
        'Stack'
    ],
    'require' : [
        'Com.Tooltip'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onClear',
        'onReset',
        'onSelect',
        'onChange',
        'onClickSelect',
        'onAbort',
        'onError',
        'onRenderListStart',
        'onRenderListEnd'
    ],
    'params' : {
        'input' : null,                                             // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),               // Html input node to decorate.
        'target' : false,                                           // HTML node.
        'container' : 'document.body',
        'name' : '',
        'minLength' : 3,
        'direction' : 'auto',                                       // auto | start
        'className' : '',
        'delay' : 'cm._config.requestDelay',
        'clearOnEmpty' : true,                                      // Clear input and value if item didn't selected from tooltip
        'showListOnEmpty' : false,                                  // Show options list, when input is empty
        'listItemNowrap' : false,
        'showLoader' : true,                                        // Show ajax spinner in tooltip, for ajax mode only.
        'data' : [],                                                // Examples: [{'value' : 'foo', 'text' : 'Bar'}] or ['Foo', 'Bar'].
        'value' : {},
        'showSuggestion' : false,                                   // Show suggestion option when search query was empty
        'suggestionConstructor' : 'Com.AbstractContainer',
        'suggestionParams' : {},
        'suggestionQueryName' : 'text',
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %query%, %callback%.
            'params' : ''                                           // Params object. Variables: %baseUrl%, %query%, %callback%.
        },
        'classes' : {
            'list' : 'pt__list',
            'listItem' : 'pt__list__item'
        },
        'icons' : {
            'search' : 'icon default linked'
        },
        'Com.Tooltip' : {
            'hideOnOut' : true,
            'targetEvent' : 'none',
            'width' : 'targetWidth',
            'top' : 'targetHeight + 4'
        }
    },
    'strings' : {
        'loader' : 'Searching for <b>"%query%"</b>…',
        'suggestion' : '<b>"%query%"</b> not found. Add?'
    }
},
function(params){
    var that = this;
    
    that.components = {};

    that.isDestructed = false;
    that.ajaxHandler = null;
    that.isOpen = false;
    that.isAjax = false;
    that.requestDelay = null;

    that.registeredItems = [];
    that.suggestionItem = null;
    that.selectedItemIndex = null;
    that.value = null;
    that.previousValue = null;
    that.rawValue = null;

    var init = function(){
        that.renderComponent();
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(!that.params['target']){
            that.params['target'] = that.params['node'];
        }
        // If URL parameter exists, use ajax data
        that.isAjax = !cm.isEmpty(that.params['ajax']['url']);
        // Prepare data
        that.params['data'] = that.callbacks.convert(that, that.params['data']);
        that.params['value'] = that.callbacks.convertItem(that, that.params['value']);
        // Tooltip
        that.params['Com.Tooltip']['className'] = [
            'com__ac-tooltip',
            [that.params['className'], 'tooltip'].join('__')
        ].join(' ');
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
        that.setInput(that.params['node']);
        // Set
        !cm.isEmpty(that.params['value']) && that.set(that.params['value'], false);
    };

    var setListItem = function(index){
        var previousItem = that.registeredItems[that.selectedItemIndex],
            item = that.registeredItems[index];
        if(previousItem){
            cm.removeClass(previousItem['container'], 'active');
        }
        if(item){
            cm.addClass(item['container'], 'active');
            that.components['tooltip'].scrollToNode(item['container']);
        }
        that.selectedItemIndex = index;
        // Set input data
        set(that.selectedItemIndex);
    };

    var inputHandler = function(e){
        var listLength,
            listIndex;
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
                    if(that.selectedItemIndex === null){
                        listIndex = listLength - 1;
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
                    if(that.selectedItemIndex === null){
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

    var requestHandler = function(){
        var query = that.params['node'].value,
            config = cm.clone(that.params['ajax']);
        // Clear tooltip ajax/static delay and filtered items list
        that.requestDelay && clearTimeout(that.requestDelay);
        that.selectedItemIndex = null;
        that.registeredItems = [];
        that.abort();
        // Request
        if(that.params['showListOnEmpty'] || query.length >= that.params['minLength']){
            that.requestDelay = setTimeout(function(){
                if(that.isAjax){
                    if(that.params['showLoader']){
                        that.callbacks.renderLoader(that, {
                            'config' : config,
                            'query' : query
                        });
                        that.show();
                    }
                    that.ajaxHandler = that.callbacks.request(that, {
                        'config' : config,
                        'query' : query
                    });
                }else{
                    that.callbacks.data(that, {
                        'data' : that.params['data'],
                        'query' : query
                    });
                }
            }, that.params['delay']);
        }else{
            that.hide();
        }
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
        that.requestDelay && clearTimeout(that.requestDelay);
        that.abort();
        // Clear input
        if(that.params['clearOnEmpty']){
            item = getSavedItemData(that.value);
            if(!item || item['text'] != that.params['node'].value){
                that.clear();
            }
        }
    };

    var getSavedItemData = function(value){
        if(that.rawValue && that.rawValue['value'] == value){
            return that.rawValue
        }
        // Get form items list
        var item = that.getRegisteredItem(value);
        if(item){
            return item['data'];
        }
        return null;
    };

    var onChange = function(){
        if(that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
        }
    };

    var blurHandler = function(){
        if(!that.isOpen){
            clear();
        }
    };

    var clickHandler = function(){
        if(that.params['showListOnEmpty']){
            requestHandler();
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

    var setEvents = function(){
        cm.addEvent(that.params['node'], 'input', requestHandler);
        cm.addEvent(that.params['node'], 'keydown', inputHandler);
        cm.addEvent(that.params['node'], 'blur', blurHandler);
        cm.addEvent(that.params['node'], 'click', clickHandler);
    };

    var unsetEvents = function(){
        cm.removeEvent(that.params['node'], 'input', requestHandler);
        cm.removeEvent(that.params['node'], 'keydown', inputHandler);
        cm.removeEvent(that.params['node'], 'blur', blurHandler);
        cm.removeEvent(that.params['node'], 'click', clickHandler);
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, params){
        params['config'] = that.callbacks.beforePrepare(that, params);
        params['config']['url'] = cm.strReplace(params['config']['url'], {
            '%query%' : params['query'],
            '%baseUrl%' : cm._baseUrl
        });
        params['config']['params'] = cm.objectReplace(params['config']['params'], {
            '%query%' : params['query'],
            '%baseUrl%' : cm._baseUrl
        });
        params['config'] = that.callbacks.afterPrepare(that, params);
        return params['config'];
    };

    that.callbacks.beforePrepare = function(that, params){
        return params['config'];
    };

    that.callbacks.afterPrepare = function(that, params){
        return params['config'];
    };

    that.callbacks.request = function(that, params){
        params = cm.merge({
            'response' : null,
            'data' : null,
            'config' : null,
            'query' : ''
        }, params);
        // Validate config
        params['config'] = that.callbacks.prepare(that, params);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(params['config'], {
                'onSuccess' : function(response){
                    params['response'] = response;
                    that.callbacks.response(that, params);
                },
                'onError' : function(){
                    that.callbacks.error(that, params);
                }
            })
        );
    };

    that.callbacks.filter = function(that, params){
        var data = [],
            dataItem = cm.objectSelector(that.params['responseKey'], params['response']);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    that.callbacks.response = function(that, params){
        if(!cm.isEmpty(params['response'])){
            params['data'] = that.callbacks.filter(that, params);
        }
        if(!cm.isEmpty(params['data'])){
            params['data'] = that.callbacks.convert(that, params['data']);
            that.callbacks.render(that, params);
        }else{
            that.callbacks.render(that, params);
        }
    };

    that.callbacks.error = function(that, params){
        that.hide();
        that.triggerEvent('onError');
    };

    /* *** STATIC DATA *** */

    that.callbacks.data = function(that, params){
        // Filter data
        params['data'] = that.callbacks.query(that, params);
        that.callbacks.render(that, params);
    };

    /* *** HELPERS *** */

    that.callbacks.query = function(that, params){
        var filteredItems = [];
        cm.forEach(params['data'], function(item){
            if(that.callbacks.isContain(that, item['text'], params['query'])){
                filteredItems.push(item);
            }
        });
        return filteredItems;
    };

    that.callbacks.isContain = function(that, text, query){
        text = text.toLowerCase();
        query = query.toLowerCase();
        // Direction
        switch(that.params['direction']){
            case 'start':
                return new RegExp('^' + query, 'i').test(text);
            default:
                return text.indexOf(query) > -1;
        }
    };

    that.callbacks.render = function(that, params){
        if(params['data'].length){
            that.callbacks.renderList(that, params);
            that.show();
        }else if(that.params['showSuggestion']){
            that.callbacks.renderListSuggestion(that, params);
            that.show();
        }else{
            that.hide();
        }
    };

    that.callbacks.registerItem = function(that, params, item){
        item['container'] = item['nodes']['container'];
        cm.addEvent(item['container'], 'click', function(){
            that.setRegistered(item, true);
            that.triggerEvent('onClickSelect', that.value);
            that.hide();
        });
        that.registeredItems.push(item);
    };

    that.callbacks.embed = function(that, container){
        that.components['tooltip'].setContent(container);
    };

    /* ******* MAIN ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.callbacks.destructListSuggestion(that, that.suggestionItem);
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.set = function(item, triggerEvents){
        triggerEvents = typeof triggerEvents === 'undefined'? true : triggerEvents;
        that.rawValue = that.callbacks.convertItem(that, item);
        that.previousValue = that.value;
        that.value = that.rawValue['value'];
        that.params['node'].value = that.rawValue['text'];
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            onChange();
        }
        return that;
    };

    that.setRegistered = function(item, triggerEvents){
        triggerEvents = typeof triggerEvents === 'undefined'? true : triggerEvents;
        that.set(item['data'], triggerEvents);
        return that;
    };

    that.setInput = function(node){
        if(cm.isNode(node)){
            unsetEvents();
            that.params['node'] = node;
            setEvents();
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

    that.getRaw = function(){
        return that.rawValue;
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

    that.reset = that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents === 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = null;
        that.rawValue = null;
        if(that.params['clearOnEmpty']){
            that.params['node'].value = '';
        }
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            that.triggerEvent('onReset', that.value);
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

    that.focus = function(){
        that.params['node'].focus();
        return that;
    };

    that.isOwnNode = function(node){
        return cm.isParent(that.params['target'], node, true) || that.components['tooltip'].isOwnNode(node);
    };

    init();
});

cm.getConstructor('Com.Autocomplete', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    /*** DATA ***/

    classProto.callbacks.convert = function(that, data){
        return data.map(function(item){
            return that.callbacks.convertItem(that, item);
        });
    };

    classProto.callbacks.convertItem = function(that, item){
        if(cm.isEmpty(item)){
            return null
        }else if(!cm.isObject(item)){
            return {'text' : item, 'value' : item};
        }else{
            if(cm.isUndefined(item['value'])){
                item['value'] = item['text']
            }
            return item;
        }
    };

    /*** LIST ***/

    classProto.callbacks.renderList = function(that, params){
        cm.triggerEvent('onRenderListStart');
        // Render structure
        var nodes = that.callbacks.renderListStructure(that, params);
        // Render list's items
        cm.forEach(params['data'], function(item, i){
            that.callbacks.renderItem(that, params, {'data' : item, 'i' : i}, nodes['items']);
        });
        // Embed nodes to tooltip
        that.callbacks.embed(that, nodes['container']);
        cm.triggerEvent('onRenderListEnd');
    };

    classProto.callbacks.renderListStructure = function(that, params){
        var nodes = {};
        nodes['container'] = cm.node('div', {'class' : that.params['classes']['list']},
            nodes['items'] = cm.node('ul')
        );
        return nodes;
    };

    classProto.callbacks.renderItem = function(that, params, item, container){
        // Render structure of list's item
        item['nodes'] = that.callbacks.renderItemStructure(that, params, item);
        that.params['listItemNowrap'] && cm.addClass(item['nodes']['container'], 'is-nowrap');
        // Highlight selected option
        if(that.value == item['data']['value']){
            cm.addClass(item['nodes']['container'], 'active');
            that.selectedItemIndex = item['i'];
        }
        // Register item
        that.callbacks.registerItem(that, params, item);
        // Embed item to list
        cm.appendChild(item['nodes']['container'], container);
    };

    classProto.callbacks.renderItemStructure = function(that, params, item){
        var nodes = {};
        nodes['container'] = cm.node('li', {'class' : that.params['classes']['listItem']},
            cm.node('div', {'class' : 'inner'},
                cm.node('div', {'class' : 'content', 'innerHTML' : item['data']['text']})
            )
        );
        return nodes;
    };

    /*** LIST LOADER ***/

    classProto.callbacks.renderLoader = function(that, params){
        // Structure
        var nodes = that.callbacks.renderListStructure(that, params);
        cm.addClass(nodes['container'], 'disabled');
        // Render item structure
        nodes['item'] = that.callbacks.renderLoaderItemStructure(that, params);
        that.params['listItemNowrap'] && cm.addClass(nodes['item']['container'], 'is-nowrap');
        cm.appendChild(nodes['item']['container'], nodes['items']);
        // Embed nodes to tooltip
        that.callbacks.embed(that, nodes['container']);
    };

    classProto.callbacks.renderLoaderItemStructure = function(that, params){
        var nodes = {};
        // Structure
        nodes['container'] = cm.node('li', {'class' : that.params['classes']['listItem']},
            cm.node('div', {'class' : 'inner'},
                cm.node('div', {'class' : 'content'},
                    cm.node('span', {'class' : 'icon small cm-ia__spinner'}),
                    cm.node('span', {'innerHTML' : that.lang('loader', {'%query%' : params['query']})})
                )
            )
        );
        // Export
        return nodes;
    };

    /*** LIST SUGGESTION ***/

    classProto.callbacks.renderListSuggestion = function(that, params){
        // Structure
        var nodes = that.callbacks.renderListStructure(that, params);
        // Render item structure
        nodes['item'] = that.callbacks.renderListSuggestionItem(that, params, {}, nodes['items']);
        // Embed nodes to tooltip
        that.callbacks.embed(that, nodes['container']);
    };

    classProto.callbacks.destructListSuggestion = function(that, item){
        item && cm.isFunction(item['controller'].destruct) && item['controller'].destruct();
    };

    classProto.callbacks.renderListSuggestionItem = function(that, params, item, container){
        // Structure
        item['nodes'] = that.callbacks.renderListSuggestionItemStructure(that, params, item);
        that.params['listItemNowrap'] && cm.addClass(item['nodes']['container'], 'is-nowrap');
        // Callbacks
        if(that.params['suggestionConstructor']){
            that.callbacks.renderListSuggestionItemConstructor(that, params, item);
        }
        // Embed
        cm.appendChild(item['nodes']['container'], container);
        // Export
        that.suggestionItem = item;
        return item;
    };

    classProto.callbacks.renderListSuggestionItemConstructor = function(that, params, item){
        // If controller was not cached, render new one
        var isCachedController = that.suggestionItem && that.suggestionItem['controller'] && !that.suggestionItem['controller'].isDestructed;
        if(!isCachedController){
            that.callbacks.renderListSuggestionItemController(that, params, item);
        }else{
            that.callbacks.renderListSuggestionItemControllerCached(that, params, item);
        }
        // Set query data on link click and hide tooltip
        cm.addEvent(item['nodes']['container'], 'click', function(){
            that.callbacks.renderListSuggestionItemEvent(that, params, item);
        });
    };

    classProto.callbacks.renderListSuggestionItemEvent = function(that, params, item){
        var data = {};
        data[that.params['suggestionQueryName']] = params['query'];
        // Set Query Data
        item['controller'].set(data);
        // Hide tooltip on item click
        that.hide();
        that.clear();
    };

    classProto.callbacks.renderListSuggestionItemStructure = function(that, params, item){
        var nodes = {};
        // Structure
        nodes['container'] = cm.node('li', {'class' : that.params['classes']['listItem']},
            cm.node('div', {'class' : 'inner'},
                cm.node('div', {'class' : 'content'},
                    cm.node('span', {'class' : 'icon small add'}),
                    cm.node('span', {'innerHTML' : that.lang('suggestion', {'%query%' : params['query']})})
                )
            )
        );
        // Export
        return nodes;
    };

    classProto.callbacks.renderListSuggestionItemController = function(that, params, item){
        // Render controller
        cm.getConstructor(that.params['suggestionConstructor'], function(classConstructor){
            item['controller'] = new classConstructor(
                cm.merge(item['suggestionParams'], {
                    'node' : item['nodes']['container']
                })
            );
            item['controller'].addEvent('onSuccess', function(my, data){
                that.set(data, true);
            });
        });
    };

    classProto.callbacks.renderListSuggestionItemControllerCached = function(that, params, item){
        item['controller'] = that.suggestionItem['controller'];
        item['controller'].setTarget(item['nodes']['container']);
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('autocomplete', {
    'node' : cm.node('input', {'type' : 'search', 'autocomplete' : 'off'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Autocomplete'
});