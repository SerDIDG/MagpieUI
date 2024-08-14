cm.define('Com.Autocomplete', {
    extend: 'Com.AbstractController',
    require: [
        'Com.Tooltip'
    ],
    events: [
        'onFocus',
        'onBlur',
        'onClear',
        'onReset',
        'onSelect',
        'onChange',
        'onEnable',
        'onDisable',
        'onClickSelect',
        'onAbort',
        'onError',
        'onRenderListStart',
        'onRenderListEnd',
    ],
    params: {
        controllerEvents: true,
        renderStructure: false,
        embedStructureOnRender: false,
        embedStructure: 'append',

        input: null,                                             // Deprecated, use 'node' parameter instead.
        node: cm.node('input', {type: 'text'}),                  // Html input node to decorate.
        target: false,                                           // HTML node.
        container: 'document.body',                              // 'document.body', 'targetParent'
        name: '',
        minLength: 3,
        direction: 'auto',                                       // auto | start
        disabled: false,
        delay: 'cm._config.requestDelay',
        clearOnEmpty: true,                                      // Clear input and value if item didn't selected from tooltip
        showListOnEmpty: false,                                  // Show options list, when input is empty
        listItemNowrap: false,

        className: '',
        classes: {
            list: 'pt__list',
            listItem: 'pt__list__item'
        },
        icons: {
            search: 'icon default linked'
        },

        data: [],                                                // Examples: [{value: 'foo', text: 'Bar'}] or ['Foo', 'Bar'].
        options: [],
        value: {},
        defaultValue: '',

        showLoader: true,                                        // Show ajax spinner in tooltip, for ajax mode only.
        responseKey: 'data',                                     // Instead of using filter callback, you can provide response array key
        preloadData: false,
        ajax: {
            type: 'json',
            method: 'get',
            url: '',                                             // Request URL. Variables: %baseUrl%, %query%, %callback%.
            params: ''                                           // Params object. Variables: %baseUrl%, %query%, %callback%.
        },

        tooltip: {
            limitWidth: true,
            constructor: 'Com.Tooltip',
            constructorParams: {
                hideOnOut: true,
                targetEvent: 'none',
                width: 'targetWidth',
                minWidth: 'targetWidth',
                top: cm._config.tooltipDown
            },
        },

        showSuggestion: false,                                   // Show suggestion option when search query was empty
        suggestionConstructor: 'Com.AbstractContainer',
        suggestionParams: {},
        suggestionQueryName: 'text',
    },
    strings: {
        loader: 'Searching for <b>"%query%"</b>…',
        suggestion: '<b>"%query%"</b> not found. Add?'
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.Autocomplete', function(classConstructor, className, classProto, classInherit) {
    classProto.onConstructStart = function() {
        var that = this;

        // Variables
        that.disabled = false;
        that.ajaxHandler = null;
        that.isOpen = false;
        that.isAjax = false;
        that.ajaxParams = {};
        that.requestDelay = null;

        that.registeredItems = [];
        that.suggestionItem = null;
        that.selectedItemIndex = null;
        that.value = null;
        that.previousValue = null;
        that.valueText = null;
        that.rawValue = null;

        // Binds
        that.requestActionHandler = that.requestAction.bind(that);
        that.clearActionHandler = that.clearAction.bind(that);

        that.afterClickHandler = that.afterClick.bind(that);
        that.afterFocusHandler = that.afterFocus.bind(that);
        that.afterBlurHandler = that.afterBlur.bind(that);
        that.afterKeypressHandler = that.afterKeypress.bind(that);
        that.afterBodyClickHandler = that.afterBodyClick.bind(that);
    };

    classProto.onValidateParams = function() {
        var that = this;

        if (cm.isNode(that.params.input)) {
            that.params.node = that.params.input;
        }

        if (!that.params.target) {
            that.params.target = that.params.node;
        }

        // If URL parameter exists, use ajax data
        that.isAjax = !cm.isEmpty(that.params.ajax.url);

        // Prepare data
        that.params.data = cm.merge(that.params.data, that.params.options);
        that.setData(that.params.data);

        // Value
        that.params.value = !cm.isEmpty(that.params.value) ? that.params.value : that.params.defaultValue;

        // Input
        that.params.disabled = that.params.node.disabled || that.params.node.readOnly || that.params.disabled;

        // Tooltip
        // ToDo: Deprecated legacy parameter
        if (cm.isObject(that.params['Com.Tooltip'])) {
            that.params.tooltip.constructorParams = cm.merge(that.params.tooltip.constructorParams, that.params['Com.Tooltip']);
        }
        if (!that.params.tooltip.limitWidth) {
            that.params.tooltip.constructorParams.width = 'auto';
        }
        that.params.tooltip.constructorParams.className = [
            'com__ac-tooltip',
            [that.params.className, 'tooltip'].join('__')
        ].join(' ');
    };

    classProto.onAfterRender = function() {
        var that = this;

        // Set target input
        that.setInput(that.params.node);

        // Set value
        !cm.isEmpty(that.params.value) && that.set(that.params.value, false);

        // Set disabled state
        that.params.disabled && that.disable();
    };

    classProto.onDestructStart = function() {
        var that = this;
        that.callbacks.destructListSuggestion(that, that.suggestionItem);
        that.unsetInputEvents();
    };

    classProto.renderViewModel = function() {
        var that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init tooltip
        cm.getConstructor(that.params.tooltip.constructor, function(classConstructor) {
            that.components.tooltip = new classConstructor(
                cm.merge(that.params.tooltip.constructorParams, {
                    container: that.params.container,
                    target: that.params.target,
                    events: {
                        onShowStart: function() {
                            that.isOpen = true;
                            cm.addEvent(document, 'mousedown', that.afterBodyClickHandler);
                        },
                        onHideStart: function() {
                            that.isOpen = false;
                            cm.removeEvent(document, 'mousedown', that.afterBodyClickHandler);
                        }
                    }
                })
            );
        });
    };

    /******* INPUT *******/

    classProto.setInputEvents = function() {
        var that = this;
        cm.addEvent(that.params.node, 'input', that.requestActionHandler);
        cm.addEvent(that.params.node, 'keydown', that.afterKeypressHandler);
        cm.addEvent(that.params.node, 'focus', that.afterFocusHandler);
        cm.addEvent(that.params.node, 'blur', that.afterBlurHandler);
        cm.addEvent(that.params.node, 'click', that.afterClickHandler);
    };

    classProto.unsetInputEvents = function() {
        var that = this;
        cm.removeEvent(that.params.node, 'input', that.requestActionHandler);
        cm.removeEvent(that.params.node, 'keydown', that.afterKeypressHandler);
        cm.removeEvent(that.params.node, 'focus', that.afterFocusHandler);
        cm.removeEvent(that.params.node, 'blur', that.afterBlurHandler);
        cm.removeEvent(that.params.node, 'click', that.afterClickHandler);
    };

    /******* LIST *******/

    /******* EVENTS *******/

    classProto.afterFocus = function() {
        var that = this;
        that.afterClick();
        that.triggerEvent('onFocus', that.value);
    };

    classProto.afterBlur = function() {
        var that = this;
        if (!that.isOpen) {
            that.clearAction();
        }
        that.hide();
        that.triggerEvent('onBlur', that.value);
    };

    classProto.afterClick = function() {
        var that = this;
        if (that.params.showListOnEmpty) {
            that.requestAction();
        }
    };

    classProto.afterKeypress = function(e) {
        var that = this;
        var listLength = that.registeredItems.length;
        var listIndex;
        switch (e.keyCode) {
            // Enter
            case 13:
                that.clearAction();
                that.hide();
                break;

            // Arrow Up
            case 38:
                if (listLength) {
                    if (that.selectedItemIndex === null) {
                        listIndex = listLength - 1;
                    } else if (that.selectedItemIndex - 1 >= 0) {
                        listIndex = that.selectedItemIndex - 1;
                    } else {
                        listIndex = listLength - 1;
                    }
                    that.setListAction(listIndex);
                }
                break;

            // Arrow Down
            case 40:
                if (listLength) {
                    if (that.selectedItemIndex === null) {
                        listIndex = 0;
                    } else if (that.selectedItemIndex + 1 < listLength) {
                        listIndex = that.selectedItemIndex + 1;
                    } else {
                        listIndex = 0;
                    }
                    that.setListAction(listIndex);
                }
                break;
        }
    };

    classProto.afterChange = function() {
        var that = this;
        if (that.value !== that.previousValue) {
            that.triggerEvent('onChange', that.value);
        }
    };

    classProto.afterBodyClick = function(e) {
        var that = this;
        var target = cm.getEventTarget(e);
        if (!that.isOwnNode(target)) {
            that.clearAction();
            that.hide();
        }
    };

    /******* HELPERS *******/

    classProto.requestAction = function() {
        var that = this;
        var query = that.params.node.value.trim();
        var config = cm.clone(that.params.ajax);
        var delay = that.params.showListOnEmpty && cm.isEmpty(query) ? 0 : that.params.delay;

        // Clear tooltip ajax/static delay and filtered items list
        that.valueText = query;
        that.requestDelay && clearTimeout(that.requestDelay);
        that.selectedItemIndex = null;
        that.registeredItems = [];
        that.abort();

        // Request
        if (that.params.showListOnEmpty || query.length >= that.params.minLength) {
            that.requestDelay = setTimeout(function() {
                if (that.params.preloadData && !cm.isEmpty(that.ajaxParams.data)) {
                    that.callbacks.data(that, {
                        data: that.ajaxParams.data,
                        query: query
                    });
                } else if (that.isAjax) {
                    if (that.params.showLoader) {
                        that.callbacks.renderLoader(that, {
                            config: config,
                            query: query
                        });
                        that.show();
                    }
                    that.ajaxHandler = that.callbacks.request(that, {
                        config: config,
                        query: query
                    });
                } else {
                    that.callbacks.data(that, {
                        data: that.params.data,
                        query: query
                    });
                }
            }, delay);
        } else {
            that.hide();
        }
    };

    classProto.clearAction = function() {
        var that = this;

        // Kill timeout interval and ajax request
        that.requestDelay && clearTimeout(that.requestDelay);
        that.abort();

        // Clear input
        if (that.params.clearOnEmpty) {
            var item = that.getItemAction(that.value);
            var value = that.params.node.value;
            if (!item || item.text !== value) {
                that.clear();
            }
        }
    };

    classProto.getItemAction = function(value) {
        var that = this;

        // Get stored item
        if (that.rawValue && that.rawValue.value === value) {
            return that.rawValue
        }

        // Get form items list
        var item = that.getRegisteredItem(value);
        if (item) {
            return item.data;
        }

        return null;
    };

    classProto.setListAction = function(index) {
        var that = this;

        var previousItem = that.registeredItems[that.selectedItemIndex];
        if (previousItem) {
            cm.removeClass(previousItem.container, 'active');
        }

        var item = that.registeredItems[index];
        if (item) {
            that.selectedItemIndex = index;
            cm.addClass(item.container, 'active');
            that.components.tooltip.scrollToNode(item.container);
            that.setRegisteredItem(item);
        }
    };

    /******* CALLBACKS *******/

    /*** AJAX ***/

    classProto.callbacks.prepare = function(that, params) {
        params.config = that.callbacks.beforePrepare(that, params);
        params.config.url = cm.strReplace(params.config.url, {
            '%query%': params.query,
            '%baseUrl%': cm._baseUrl
        });
        params.config.params = cm.objectReplace(params.config.params, {
            '%query%': params.query,
            '%baseUrl%': cm._baseUrl
        });
        params.config = that.callbacks.afterPrepare(that, params);
        return params.config;
    };

    classProto.callbacks.beforePrepare = function(that, params) {
        return params.config;
    };

    classProto.callbacks.afterPrepare = function(that, params) {
        return params.config;
    };

    classProto.callbacks.request = function(that, params) {
        params = cm.merge({
            response: null,
            data: null,
            config: null,
            query: ''
        }, params);

        // Validate config
        params.config = that.callbacks.prepare(that, params);

        // Export
        that.ajaxParams = params;

        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(params.config, {
                onSuccess: function(response) {
                    params.response = response;
                    that.callbacks.response(that, params);
                },
                onError: function() {
                    that.callbacks.error(that, params);
                },
            })
        );
    };

    classProto.callbacks.filter = function(that, params) {
        var data = [];
        var dataItem = cm.reducePath(that.params.responseKey, params.response);
        if (!cm.isEmpty(dataItem)) {
            data = dataItem;
        }
        return data;
    };

    classProto.callbacks.response = function(that, params) {
        if (!cm.isEmpty(params.response)) {
            params.data = that.callbacks.filter(that, params);
        }
        if (!cm.isEmpty(params.data)) {
            params.data = that.callbacks.convert(that, params.data);
            that.callbacks.render(that, params);
        } else {
            that.callbacks.render(that, params);
        }
    };

    classProto.callbacks.error = function(that, params) {
        that.hide();
        that.triggerEvent('onError');
    };

    /*** DATA ***/

    classProto.callbacks.data = function(that, params) {
        // Filter data
        params.data = that.callbacks.query(that, params);
        that.callbacks.render(that, params);
    };

    classProto.callbacks.convert = function(that, data) {
        if (cm.isObject(data)) {
            return that.callbacks.convertObject(that, data);
        } else {
            return data.map(function(item) {
                return that.callbacks.convertItem(that, item);
            });
        }
    };

    classProto.callbacks.convertItem = function(that, item) {
        if (cm.isEmpty(item)) {
            return null;
        } else if (!cm.isObject(item)) {
            return {text: item, value: item};
        } else {
            if (cm.isUndefined(item.value)) {
                item.value = item.text
            }
            return item;
        }
    };

    classProto.callbacks.convertObject = function(that, data) {
        var a = [];
        cm.forEach(data, function(text, value) {
            a.push({text: text, value: value});
        });
        return a;
    };

    /*** LIST ***/

    classProto.callbacks.renderList = function(that, params) {
        that.triggerEvent('onRenderListStart');
        // Render structure
        var nodes = that.callbacks.renderListStructure(that, params);
        // Render list's items
        cm.forEach(params.data, function(item, i) {
            that.callbacks.renderItem(that, params, {data: item, i: i}, nodes.items);
        });
        // Append nodes to tooltip
        that.callbacks.embed(that, nodes.container);
        that.triggerEvent('onRenderListEnd');
    };

    classProto.callbacks.renderListStructure = function(that, params) {
        var nodes = {};
        nodes.container = cm.node('div', {classes: that.params.classes.list},
            nodes.items = cm.node('ul')
        );
        return nodes;
    };

    classProto.callbacks.renderItem = function(that, params, item, container) {
        // Render structure of list's item
        item.nodes = that.callbacks.renderItemStructure(that, params, item);
        that.params.listItemNowrap && cm.addClass(item.nodes.container, 'is-nowrap');
        
        // Highlight selected option
        if (that.value === item.data.value) {
            cm.addClass(item.nodes.container, 'active');
            that.selectedItemIndex = item.i;
        }
        
        // Register item
        that.callbacks.registerItem(that, params, item);
        
        // Append item to list
        cm.appendChild(item.nodes.container, container);
    };

    classProto.callbacks.renderItemStructure = function(that, params, item) {
        var nodes = {};
        nodes.container = cm.node('li', {classes: that.params.classes.listItem},
            cm.node('div', {classes: 'inner'},
                cm.node('div', {classes: 'content', innerHTML: item.data.text})
            )
        );
        return nodes;
    };

    /*** LIST LOADER ***/

    classProto.callbacks.renderLoader = function(that, params) {
        // Structure
        var nodes = that.callbacks.renderListStructure(that, params);
        cm.addClass(nodes.container, 'disabled');

        // Render item structure
        nodes.item = that.callbacks.renderLoaderItemStructure(that, params);
        that.params.listItemNowrap && cm.addClass(nodes.item.container, 'is-nowrap');
        cm.appendChild(nodes.item.container, nodes.items);

        // Append nodes to tooltip
        that.callbacks.embed(that, nodes.container);
    };

    classProto.callbacks.renderLoaderItemStructure = function(that, params) {
        // Structure
        var nodes = {};
        nodes.container = cm.node('li', {classes: that.params.classes.listItem},
            cm.node('div', {classes: 'inner'},
                cm.node('div', {classes: 'content'},
                    cm.node('span', {classes: 'icon small cm-ia__spinner'}),
                    cm.node('span', {innerHTML: that.lang('loader', {'%query%': params.query})})
                )
            )
        );

        // Export
        return nodes;
    };

    /*** LIST SUGGESTION ***/

    classProto.callbacks.renderListSuggestion = function(that, params) {
        // Structure
        var nodes = that.callbacks.renderListStructure(that, params);

        // Render item structure
        nodes.item = that.callbacks.renderListSuggestionItem(that, params, {}, nodes.items);

        // Append nodes to tooltip
        that.callbacks.embed(that, nodes.container);
    };

    classProto.callbacks.destructListSuggestion = function(that, item) {
        item && cm.isFunction(item.controller.destruct) && item.controller.destruct();
    };

    classProto.callbacks.renderListSuggestionItem = function(that, params, item, container) {
        // Structure
        item.nodes = that.callbacks.renderListSuggestionItemStructure(that, params, item);
        that.params.listItemNowrap && cm.addClass(item.nodes.container, 'is-nowrap');

        // Callbacks
        if (that.params.suggestionConstructor) {
            that.callbacks.renderListSuggestionItemConstructor(that, params, item);
        }

        // Append
        cm.appendChild(item.nodes.container, container);

        // Export
        that.suggestionItem = item;
        return item;
    };

    classProto.callbacks.renderListSuggestionItemConstructor = function(that, params, item) {
        // If controller was not cached, render new one
        var isCachedController = that.suggestionItem && that.suggestionItem.controller && !that.suggestionItem.controller.isDestructed;
        if (!isCachedController) {
            that.callbacks.renderListSuggestionItemController(that, params, item);
        } else {
            that.callbacks.renderListSuggestionItemControllerCached(that, params, item);
        }

        // Set query data on link click and hide tooltip
        cm.click.add(item.nodes.container, function() {
            that.callbacks.renderListSuggestionItemEvent(that, params, item);
        });
    };

    classProto.callbacks.renderListSuggestionItemEvent = function(that, params, item) {
        var data = {};
        data[that.params.suggestionQueryName] = params.query;

        // Set Query Data
        item.controller.set(data);

        // Hide tooltip on item click
        that.hide();
        that.clear();
    };

    classProto.callbacks.renderListSuggestionItemStructure = function(that, params, item) {
        // Structure
        var nodes = {};
        nodes.container = cm.node('li', {classes: that.params.classes.listItem},
            cm.node('div', {classes: 'inner'},
                cm.node('div', {classes: 'content'},
                    cm.node('span', {classes: 'icon small add'}),
                    cm.node('span', {innerHTML: that.lang('suggestion', {'%query%': params.query})})
                )
            )
        );

        // Export
        return nodes;
    };

    classProto.callbacks.renderListSuggestionItemController = function(that, params, item) {
        // Render controller
        cm.getConstructor(that.params.suggestionConstructor, function(classConstructor) {
            item.controller = new classConstructor(
                cm.merge(item.suggestionParams, {
                    node: item.nodes.container,
                    events: {
                        onSuccess: function(controller, data) {
                            that.set(data, true);
                        },
                    },
                })
            );
        });
    };

    classProto.callbacks.renderListSuggestionItemControllerCached = function(that, params, item) {
        item.controller = that.suggestionItem.controller;
        item.controller.setTarget(item.nodes.container);
    };

    /*** HELPERS ***/

    classProto.callbacks.query = function(that, params) {
        var filteredItems = [];
        cm.forEach(params.data, function(item) {
            if (that.callbacks.isContain(that, item.text, params.query)) {
                filteredItems.push(item);
            }
        });
        return filteredItems;
    };

    classProto.callbacks.isContain = function(that, text, query) {
        text = text.trim().toLowerCase();
        query = query.trim().toLowerCase();
        // Direction
        switch (that.params.direction) {
            case 'start':
                return new RegExp('^' + query, 'i').test(text);
            default:
                return text.indexOf(query) > -1;
        }
    };

    classProto.callbacks.render = function(that, params) {
        if (params.data.length) {
            that.callbacks.renderList(that, params);
            that.show();
        } else if (that.params.showSuggestion) {
            that.callbacks.renderListSuggestion(that, params);
            that.show();
        } else {
            that.hide();
        }
    };

    classProto.callbacks.registerItem = function(that, params, item) {
        item.container = item.nodes.container;
        cm.click.add(item.container, function() {
            that.setRegisteredItem(item);
            that.hide();
            that.triggerEvent('onClickSelect', that.value);
        });
        that.registeredItems.push(item);
    };

    classProto.callbacks.embed = function(that, container) {
        that.components.tooltip.setContent(container);
    };

    /******* PUBLIC *******/

    classProto.set = function(item, triggerEvents) {
        var that = this;

        that.rawValue = that.callbacks.convertItem(that, item);
        that.previousValue = that.value;
        that.value = !cm.isEmpty(that.rawValue) ? that.rawValue.value : null;
        that.valueText = !cm.isEmpty(that.rawValue) ? that.rawValue.text : '';
        that.params.node.value = that.valueText;

        // Trigger events
        triggerEvents = typeof triggerEvents === 'undefined' ? true : triggerEvents;
        if (triggerEvents) {
            that.triggerEvent('onSelect', that.value);
            that.afterChange();
        }
        return that;
    };

    classProto.setData = function(data) {
        var that = this;
        that.params.data = that.callbacks.convert(that, data);
        return that;
    };

    classProto.setInput = function(node) {
        var that = this;
        if (cm.isNode(node)) {
            that.unsetInputEvents();
            that.params.node = node;
            that.setInputEvents();

            // Set tooltip container
            var tooltipContainer = that.params.container;
            if (tooltipContainer === 'targetParent') {
                tooltipContainer = that.params.node.parentNode;
            }
            that.components.tooltip.setContainer(tooltipContainer);
        }
        return that;
    };

    classProto.setTarget = function(node) {
        var that = this;
        if (cm.isNode(node)) {
            that.params.target = node;
            that.components.tooltip.setTarget(node);
        }
        return that;
    };

    classProto.setRegisteredItem = function(item, triggerEvents) {
        var that = this;
        if (cm.inArray(that.registeredItems, item)) {
            that.set(item.data, triggerEvents);
        }
        return that;
    };

    classProto.get = function() {
        var that = this;
        return that.value;
    };

    classProto.getText = function() {
        var that = this;
        return that.valueText;
    };

    classProto.getRaw = function() {
        var that = this;
        return that.rawValue;
    };

    classProto.getItem = function(value) {
        var that = this;
        if (!value) {
            return;
        }
        return that.params.data.find(function(dataItem) {
            return dataItem.value === value;
        });
    };

    classProto.getRegisteredItem = function(value) {
        var that = this;
        if (!value) {
            return;
        }
        return that.registeredItems.find(function(regItem) {
            return regItem.data.value === value;
        });
    };

    classProto.reset = classProto.clear = function(triggerEvents) {
        var that = this;
        triggerEvents = typeof triggerEvents === 'undefined' ? true : triggerEvents;
        that.previousValue = that.value;
        that.value = null;
        that.rawValue = null;
        that.valueText = null;
        if (that.params.clearOnEmpty) {
            that.params.node.value = '';
        }

        // Trigger events
        if (triggerEvents) {
            that.triggerEvent('onClear', that.value);
            that.triggerEvent('onReset', that.value);
            that.afterChange();
        }
        return that;
    };

    classProto.show = function() {
        var that = this;
        that.components.tooltip.show();
        return that;
    };

    classProto.hide = function() {
        var that = this;
        that.components.tooltip.hide();
        return that;
    };

    classProto.setAction = function(o, mode, update) {
        var that = this;
        mode = cm.inArray(['raw', 'update', 'current'], mode) ? mode : 'current';
        switch (mode) {
            case 'raw':
                that.params.ajax = cm.merge(that._raw.params.ajax, o);
                break;
            case 'current':
                that.params.ajax = cm.merge(that.params.ajax, o);
                break;
            case 'update':
                that.params.ajax = cm.merge(that._update.params.ajax, o);
                break;
        }
        if (update) {
            that._update.params.ajax = cm.clone(that.params.ajax);
        }
        return that;
    };

    classProto.setVariables = function(o, mode, update) {
        var that = this;
        mode = cm.inArray(['raw', 'update', 'current'], mode) ? mode : 'current';
        switch (mode) {
            case 'raw':
                that.params.ajax.variables = cm.merge(that._raw.params.ajax.variables, o);
                break;
            case 'current':
                that.params.ajax.variables = cm.merge(that.params.ajax.variables, o);
                break;
            case 'update':
                that.params.ajax.variables = cm.merge(that._update.params.ajax.variables, o);
                break;
        }
        if (update) {
            that._update.params.ajax.variables = cm.clone(that.params.ajax.variables);
        }
        return that;
    };

    classProto.abort = function() {
        var that = this;
        if (that.ajaxHandler && that.ajaxHandler.abort) {
            that.ajaxHandler.abort();
        }
        return that;
    };

    classProto.focus = function() {
        var that = this;
        that.params.node.focus();
        return that;
    };

    classProto.enable = function() {
        var that = this;
        if (that.disabled) {
            that.disabled = false;
            that.params.node.disabled = false;
            that.triggerEvent('onEnable');
        }
        return that;
    };

    classProto.disable = function() {
        var that = this;
        if (!that.disabled) {
            that.disabled = true;
            that.params.node.disabled = true;
            that.triggerEvent('onDisable');
        }
        return that;
    };

    classProto.isOwnNode = function(node) {
        var that = this;
        return cm.isParent(that.params.target, node, true) || that.components.tooltip.isOwnNode(node);
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('autocomplete', {
    node: cm.node('input', {type: 'search', autocomplete: 'none'}),
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.Autocomplete'
});
