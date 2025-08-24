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
        'onEnterPress',
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
        node: cm.node('input', {type: 'text'}),                  // HTML input node to decorate.
        target: false,                                           // HTML node.
        holdTarget: null,                                        // Tooltip holder HTML node.
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
        preloadData: false,                                      // ToDo: Rename to cache data?
        preselectQuery: false,
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
                top: cm._config.tooltipDown,
                ariaRole: 'listbox',
            },
        },
        
        suggestion: {
            enable: false,                                       // Show suggestion option when search query was empty
            queryKey: 'text',
            constructor: 'Com.AbstractContainer',
            constructorParams: {},
        },
    },
    strings: {
        loader: 'Searching for <b>%query%</b>…',
        suggestion: '<b>%query%</b> not found. Add?'
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.Autocomplete', function(classConstructor, className, classProto, classInherit) {
    classProto.onConstructStart = function() {
        const that = this;

        // Variables
        that.disabled = false;
        that.ajaxHandler = null;
        that.isOpen = false;
        that.isAjax = false;
        that.requestData = {};
        that.requestDelay = null;
        that.clickTarget = null;

        that.registeredItems = [];
        that.suggestionItem = null;
        that.suggestionItemFocus = false;
        that.selectedItemIndex = null;
        that.value = null;
        that.previousValue = null;
        that.valueText = null;
        that.rawValue = null;

        // Binds
        that.requestHandler = that.request.bind(that);
        that.setInputActionHandler = that.setInputAction.bind(that);

        that.afterFocusHandler = that.afterFocus.bind(that);
        that.afterBlurHandler = that.afterBlur.bind(that);
        that.afterKeypressHandler = that.afterKeypress.bind(that);
        that.afterBodyClickHandler = that.afterBodyClick.bind(that);
    };

    classProto.onValidateParams = function() {
        const that = this;

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
        const that = this;

        // Set target input
        that.setInput(that.params.node);

        // Set value
        !cm.isEmpty(that.params.value) && that.set(that.params.value, false);

        // Set disabled state
        that.params.disabled && that.disable();
    };

    classProto.onDestructStart = function() {
        const that = this;
        that.callbacks.destructListSuggestion(that, that.suggestionItem);
        that.unsetInputEvents();
    };

    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init tooltip
        cm.getConstructor(that.params.tooltip.constructor, classConstructor => {
            that.components.tooltip = new classConstructor(
                cm.merge(that.params.tooltip.constructorParams, {
                    container: that.params.container,
                    target: that.params.target,
                    holdTarget: that.getTooltipHoldTarget(),
                    events: {
                        onShowStart: that.afterShow.bind(that),
                        onHideStart: that.afterHide.bind(that),
                    }
                })
            );
        });
    };

    /******* INPUT *******/

    classProto.setInputEvents = function() {
        const that = this;
        cm.addEvent(that.params.node, 'input', that.requestHandler);
        cm.addEvent(that.params.node, 'keydown', that.afterKeypressHandler);
        cm.addEvent(that.params.node, 'focus', that.afterFocusHandler);
        cm.addEvent(that.params.node, 'blur', that.afterBlurHandler);
    };

    classProto.unsetInputEvents = function() {
        const that = this;
        cm.removeEvent(that.params.node, 'input', that.requestHandler);
        cm.removeEvent(that.params.node, 'keydown', that.afterKeypressHandler);
        cm.removeEvent(that.params.node, 'focus', that.afterFocusHandler);
        cm.removeEvent(that.params.node, 'blur', that.afterBlurHandler);
    };

    classProto.getInputValue = function() {
        const that = this;
        return that.params.node.value.trim();
    };

    classProto.setInputAction = function() {
        const that = this;
        that.abort();

        // Set value form input
        const text = that.getInputValue();
        const item = that.getItemAction(null, text);

        if (item) {
            // If registered item exists, set their value
            if (that.value !== item.value) {
                that.set(item, true);
            }
        } else {
            // Reset input if the value is empty
            if (that.params.clearOnEmpty || cm.isEmpty(text)) {
                that.clear();
            } else if (that.params.preselectQuery && that.isAjax) {
                that.requestAction({
                    behavior: 'preselect',
                    showLoader: false,
                });
            } else {
                that.set(text, true);
            }
        }
    };

    classProto.getTooltipHoldTarget = function() {
        const that = this;
        if (cm.isNode(that.params.holdTarget)) return that.params.holdTarget;
        if (that.params.target === that.params.node) return that.params.target.parentNode;
        return that.params.target;
    };

    /******* LIST *******/

    classProto.setListAction = function(index) {
        const that = this;

        if (that.params.suggestion.enable) {
            that.callbacks.suggestionItemUnselect(that,  that.suggestionItem);
        }

        const previousItem = that.registeredItems[that.selectedItemIndex];
        if (previousItem) {
            previousItem.container.setAttribute('aria-selected', 'false');
            cm.removeClass(previousItem.container, 'active');
        }

        const item = that.registeredItems[index];
        if (item) {
            that.selectedItemIndex = index;
            item.container.setAttribute('aria-selected', 'true');
            cm.addClass(item.container, 'active');
            that.components.tooltip.scrollToNode(item.container);
            that.setRegisteredItem(item);
        }
    };

    classProto.getItemAction = function(value, text) {
        const that = this;
        let item = null;

        // Get from stored items
        if (
            that.rawValue && (
                (!cm.isUndefined(value) && value === that.rawValue.value) ||
                (!cm.isEmpty(text) && text === that.rawValue.text)
            )
        ) {
            item = that.rawValue;
        }

        // Get from item list
        if (!item) {
            item = that.getRequestItem(value, text);
        }

            // Get from a params data list
        if (!item) {
            item = that.getItem(value, text);
        }

        return item;
    };

    /******* EVENTS *******/

    classProto.afterFocus = function() {
        const that = this;
        if (that.params.showListOnEmpty) {
            that.request();
        }
        that.triggerEvent('onFocus', that.value);
    };

    classProto.afterBlur = function() {
        const that = this;
        if (!that.isOwnNode(that.clickTarget)) {
            that.hide();
            that.setInputAction();
        }
        that.clickTarget = null;
        that.triggerEvent('onBlur', that.value);
    };

    classProto.afterShow = function() {
        const that = this;
        that.isOpen = true;
        cm.addEvent(document, 'mousedown', that.afterBodyClickHandler);
    };

    classProto.afterHide = function() {
        const that = this;
        that.isOpen = false;
        cm.removeEvent(document, 'mousedown', that.afterBodyClickHandler);
    };

    classProto.afterKeypress = function(event) {
        const that = this;

        // Key actions map
        const actions = {
            ArrowUp: () => that.setListAction(that.findPreviousIndex(that.selectedItemIndex)),
            ArrowDown: () => that.setListAction(that.findNextIndex(that.selectedItemIndex)),
            Home: () => that.setListAction(that.findFirstIndex()),
            End: () => that.setListAction(that.findLastIndex()),
        };

        // Execute action if key exists
        if (actions[event.code]) {
            event.preventDefault();
            if (that.registeredItems.length) {
                actions[event.code]();
            } else {
                that.callbacks.suggestionItemSelect(that,  that.suggestionItem);
            }
        }

        // Set item
        if (event.code === 'Enter') {
            if (that.suggestionItemFocus) {
                that.callbacks.listSuggestionItemEvent(that,  that.suggestionItem);
            } else {
                that.hide();
                that.setInputAction();
            }
            that.triggerEvent('onEnterPress');
        }
    };

    classProto.afterChange = function() {
        const that = this;
        if (that.value !== that.previousValue) {
            that.triggerEvent('onChange', that.value);
        }
    };

    classProto.afterBodyClick = function(e) {
        const that = this;
        that.clickTarget = cm.getEventTarget(e);
        if (!that.isOwnNode(that.clickTarget)) {
            that.hide();
            that.setInputAction();
        }
    };

    /******* NAVIGATION *******/

    classProto.findFirstIndex = function() {
        const that = this;
        return 0;
    };

    classProto.findLastIndex = function() {
        const that = this;
        return that.registeredItems.length - 1;
    };

    classProto.findPreviousIndex = function(index) {
        const that = this;
        if (!cm.isNumber(index)) {
            return that.findLastIndex();
        }
        return (index - 1 + that.registeredItems.length) % that.registeredItems.length;
    };

    classProto.findNextIndex = function(index) {
        const that = this;
        if (!cm.isNumber(index)) {
            return that.findFirstIndex();
        }
        return (index + 1) % that.registeredItems.length;
    };

    /******* REQUEST *******/

    classProto.request = function() {
        const that = this;
        const query = that.getInputValue();

        // Clear tooltip ajax/static delay and filtered items list
        that.valueText = query;
        that.selectedItemIndex = null;
        that.registeredItems = [];
        that.abort();

        // Request
        if (that.params.showListOnEmpty || query.length >= that.params.minLength) {
            const delay = that.params.showListOnEmpty && cm.isEmpty(query) ? 0 : that.params.delay;
            that.requestDelay = setTimeout(() => {
                if (that.params.preloadData && !cm.isEmpty(that.requestData.data)) {
                    that.callbacks.data(that, {
                        data: that.requestData.data,
                        query: query
                    });
                } else if (that.isAjax) {
                    that.requestAction();
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

    classProto.requestAction = function(params) {
        const that = this;

        // Validate params
        params = cm.merge({
            query: that.getInputValue(),
            config: cm.clone(that.params.ajax),
            behavior: 'query',
            showLoader: that.params.showLoader,
        }, params);

        if (params.showLoader) {
            that.callbacks.renderLoader(that, params);
            that.show();
        }
        that.ajaxHandler = that.callbacks.request(that, params);
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
            query: '',
            behavior: 'query',
        }, params);

        // Validate config
        params.config = that.callbacks.prepare(that, params);

        // Export
        that.requestData = params;

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
        const dataItem = cm.reducePath(that.params.responseKey, params.response);
        return !cm.isEmpty(dataItem) ? dataItem : [];
    };

    classProto.callbacks.response = function(that, params) {
        if (!cm.isEmpty(params.response)) {
            params.data = that.callbacks.filter(that, params);
        }
        if (!cm.isEmpty(params.data)) {
            params.data = that.callbacks.convert(that, params.data);
        }
        if (params.behavior === 'preselect') {
            that.callbacks.preselect(that, params);
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
            return data.map(item => that.callbacks.convertItem(that, item));
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
        const options = [];
        cm.forEach(data, (text, value) => {
            options.push({text: text, value: value});
        });
        return options;
    };

    /*** LIST ***/

    classProto.callbacks.renderList = function(that, params) {
        that.triggerEvent('onRenderListStart');

        // Render structure
        const nodes = that.callbacks.renderListStructure(that, params);

        // Render list's items
        cm.forEach(params.data, (item, i) => {
            that.callbacks.renderItem(that, params, {data: item, i: i}, nodes.items);
        });

        // Append nodes to tooltip
        that.callbacks.embed(that, nodes.container);
        that.triggerEvent('onRenderListEnd');
    };

    classProto.callbacks.renderListStructure = function(that, params) {
        const nodes = {};
        nodes.container = cm.node('div', {classes: that.params.classes.list},
            nodes.items = cm.node('ul', {role: 'listbox'})
        );
        return nodes;
    };

    classProto.callbacks.renderItem = function(that, params, item, container) {
        // Render structure of list's item
        item.nodes = that.callbacks.renderItemStructure(that, params, item);
        that.params.listItemNowrap && cm.addClass(item.nodes.container, 'is-nowrap');
        
        // Highlight a selected option
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
        const nodes = {};
        nodes.container = cm.node('li', {classes: that.params.classes.listItem, role: 'option', 'aria-selected': 'false'},
            cm.node('div', {classes: 'inner'},
                cm.node('div', {classes: 'content', innerHTML: item.data.text})
            )
        );
        return nodes;
    };

    /*** LIST LOADER ***/

    classProto.callbacks.renderLoader = function(that, params) {
        // Structure
        const nodes = that.callbacks.renderListStructure(that, params);
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
        const nodes = {};
        nodes.container = cm.node('li', {classes: that.params.classes.listItem, role: 'status'},
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
        const nodes = that.callbacks.renderListStructure(that, params);

        // Render item structure
        nodes.item = that.callbacks.renderListSuggestionItem(that, params, {}, nodes.items);

        // Append nodes to tooltip
        that.callbacks.embed(that, nodes.container);
    };

    classProto.callbacks.destructListSuggestion = function(that, item) {
        item && cm.isFunction(item.controller.destruct) && item.controller.destruct();
    };

    classProto.callbacks.renderListSuggestionItem = function(that, params, item, container) {
        // Params
        item.params = params;

        // Structure
        item.nodes = that.callbacks.renderListSuggestionItemStructure(that, item);
        that.params.listItemNowrap && cm.addClass(item.nodes.container, 'is-nowrap');

        // Callbacks
        if (that.params.suggestion.constructor) {
            that.callbacks.renderListSuggestionItemConstructor(that, item);
        }

        // Append
        cm.appendChild(item.nodes.container, container);

        // Export
        that.suggestionItem = item;
        that.suggestionItemFocus = false;
        return item;
    };

    classProto.callbacks.renderListSuggestionItemConstructor = function(that, item) {
        // If controller was not cached, render new one
        const isCachedController = that.suggestionItem && that.suggestionItem.controller && !that.suggestionItem.controller.isDestructed;
        if (!isCachedController) {
            that.callbacks.renderListSuggestionItemController(that, item);
        } else {
            that.callbacks.renderListSuggestionItemControllerCached(that, item);
        }

        // Set query data on link click and hide tooltip
        cm.click.add(item.nodes.container, () => {
            that.callbacks.listSuggestionItemEvent(that, item);
        });
    };

    classProto.callbacks.renderListSuggestionItemStructure = function(that, item) {
        // Structure
        const nodes = {};
        nodes.container = cm.node('li', {classes: that.params.classes.listItem, role: 'option'},
            cm.node('div', {classes: 'inner'},
                cm.node('div', {classes: 'content'},
                    cm.node('span', {classes: 'icon small add'}),
                    cm.node('span', {innerHTML: that.lang('suggestion', {'%query%': item.params.query})})
                )
            )
        );

        // Export
        return nodes;
    };

    classProto.callbacks.renderListSuggestionItemController = function(that, item) {
        // Render controller
        cm.getConstructor(that.params.suggestion.constructor, classConstructor => {
            item.controller = new classConstructor(
                cm.merge(that.params.suggestion.constructorParams, {
                    events: {
                        onSuccess: function(controller, data) {
                            that.set(data, true);
                        },
                    },
                })
            );
        });
    };

    classProto.callbacks.renderListSuggestionItemControllerCached = function(that, item) {
        item.controller = that.suggestionItem.controller;
    };

    classProto.callbacks.listSuggestionItemEvent = function(that, item) {
        const data = {};
        data[that.params.suggestion.queryKey] = item.params.query;

        // Set Query Data
        item.controller.set(data);
        item.controller.open();

        // Hide tooltip on item click
        that.hide();
        that.clear();
    };

    classProto.callbacks.suggestionItemSelect = function(that, item) {
        if (!item) return;
        that.suggestionItemFocus = true;
        cm.addClass(item.nodes.container, 'active');
    };

    classProto.callbacks.suggestionItemUnselect = function(that, item) {
        if (!item) return;
        that.suggestionItemFocus = false;
        cm.removeClass(item.nodes.container, 'active');
    };

    /*** HELPERS ***/

    classProto.callbacks.query = function(that, params) {
        const filteredItems = [];
        cm.forEach(params.data, item => {
            if (that.callbacks.isContain(that, item.text, params.query)) {
                filteredItems.push(item);
            }
        });
        return filteredItems;
    };

    classProto.callbacks.preselect = function(that, params) {
        let item;
        cm.forEach(params.data, (data, i) => {
            if (data.text !== params.query) return;
            item = {
                data: data,
                i: i,
            };
        });

        if (item) {
            that.callbacks.registerItem(that, params, item);
            that.set(item.data, true);
        } else {
            if (that.params.clearOnEmpty) {
                that.clear();
            } else {
                that.set(params.query, true);
            }
        }
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
        if (!cm.isEmpty(params.data)) {
            that.callbacks.renderList(that, params);
            that.show();
        } else if (that.params.suggestion.enable) {
            that.callbacks.renderListSuggestion(that, params);
            that.show();
        } else {
            that.hide();
        }
    };

    classProto.callbacks.registerItem = function(that, params, item) {
        if (item.nodes) {
            item.container = item.nodes.container;
            cm.click.add(item.container, () => {
                that.setRegisteredItem(item);
                that.hide();
                that.triggerEvent('onClickSelect', that.value);
            });
        }
        that.registeredItems.push(item);
    };

    classProto.callbacks.embed = function(that, container) {
        that.components.tooltip.setContent(container);
    };

    /******* PUBLIC *******/

    classProto.set = function(item, triggerEvents) {
        const that = this;

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
        const that = this;
        that.params.data = that.callbacks.convert(that, data);
        return that;
    };

    classProto.setInput = function(node) {
        const that = this;
        if (cm.isNode(node)) {
            that.unsetInputEvents();
            that.params.node = node;
            that.setInputEvents();

            // Set tooltip container
            let tooltipContainer = that.params.container;
            if (tooltipContainer === 'targetParent') {
                tooltipContainer = that.params.node.parentNode;
            }
            that.components.tooltip.setContainer(tooltipContainer);
        }
        return that;
    };

    classProto.setTarget = function(node) {
        const that = this;
        if (cm.isNode(node)) {
            that.params.target = node;
            that.components.tooltip.setTarget(node);
        }
        return that;
    };

    classProto.setRegisteredItem = function(item, triggerEvents) {
        const that = this;
        if (cm.inArray(that.registeredItems, item)) {
            that.set(item.data, triggerEvents);
        }
        return that;
    };

    classProto.get = function() {
        const that = this;
        return that.value;
    };

    classProto.getText = function() {
        const that = this;
        return that.valueText;
    };

    classProto.getRaw = function() {
        const that = this;
        return that.rawValue;
    };

    classProto.getItem = function(value, text) {
        const that = this;
        if (cm.isEmpty(that.params.data)) return;
        return that.params.data.find(item => {
            if (!cm.isUndefined(value)) {
                return item.value === value;
            }
            if (!cm.isEmpty(text)) {
                return item.text === text;
            }
        });
    };

    classProto.getRequestItem = function(value, text) {
        const that = this;
        if (cm.isEmpty(that.requestData.data)) return;
        return that.requestData.data.find(item => {
            if (!cm.isUndefined(value)) {
                return item.value === value;
            }
            if (!cm.isEmpty(text)) {
                return item.text === text;
            }
        });
    };

    classProto.getRegisteredItem = function(value, text) {
        const that = this;
        if (cm.isEmpty(that.registeredItems)) return;
        return that.registeredItems.find(item => {
            if (!cm.isUndefined(value)) {
                return item.data.value === value;
            }
            if (!cm.isEmpty(text)) {
                return item.data.text === text;
            }
        });
    };

    classProto.reset = classProto.clear = function(triggerEvents) {
        const that = this;
        triggerEvents = typeof triggerEvents === 'undefined' ? true : triggerEvents;
        that.previousValue = that.value;
        that.value = null;
        that.rawValue = null;
        that.valueText = null;
        that.params.node.value = '';

        // Trigger events
        if (triggerEvents) {
            that.triggerEvent('onClear', that.value);
            that.triggerEvent('onReset', that.value);
            that.afterChange();
        }
        return that;
    };

    classProto.show = function() {
        const that = this;
        that.components.tooltip.show();
        return that;
    };

    classProto.hide = function() {
        const that = this;
        that.components.tooltip.hide();
        return that;
    };

    classProto.setAction = function(o, mode, update) {
        const that = this;
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
        const that = this;
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
        const that = this;
        that.requestDelay && clearTimeout(that.requestDelay);
        if (that.ajaxHandler && that.ajaxHandler.abort) {
            that.ajaxHandler.abort();
        }
        return that;
    };

    classProto.focus = function(selection) {
        const that = this;
        if (selection === true) {
            const value = that.params.node.value;
            that.params.node.setSelectionRange(0, value.length);
        }
        that.params.node.focus();
        return that;
    };

    classProto.blur = function() {
        const that = this;
        that.params.node.blur();
        return that;
    };

    classProto.enable = function() {
        const that = this;
        if (that.disabled) {
            that.disabled = false;
            that.params.node.disabled = false;
            that.triggerEvent('onEnable');
        }
        return that;
    };

    classProto.disable = function() {
        const that = this;
        if (!that.disabled) {
            that.disabled = true;
            that.params.node.disabled = true;
            that.triggerEvent('onDisable');
        }
        return that;
    };

    classProto.isOwnNode = function(node) {
        const that = this;
        return cm.isParent(that.params.target, node, true) || that.components.tooltip.isOwnNode(node);
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('autocomplete', {
    node: cm.node('input', {type: 'search', autocomplete: 'none'}),
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.Autocomplete'
});
