cm.define('Com.TabsetHelper', {
    extend: 'Com.AbstractController',
    events: [
        'onTabChangeStart',
        'onTabChange',
        'onTabChangeEnd',
        'onTabShowStart',
        'onTabShow',
        'onTabShowProcess',
        'onTabShowEnd',
        'onTabHideStart',
        'onTabHide',
        'onTabHideProcess',
        'onTabHideEnd',
        'onTabRemoveStart',
        'onTabRemove',
        'onTabRemoveEnd',
        'onLabelTarget',
        'onUnsetStart',
        'onUnset',
        'onRequestStart',
        'onRequestEnd',
        'onRequestError',
        'onRequestSuccess',
        'onRequestAbort',
        'onContentRenderStart',
        'onContentRender',
        'onContentRenderEnd'
    ],
    params: {
        renderStructure: false,
        embedStructureOnRender: false,
        controllerEvents: true,
        renderTabView: false,
        setInitialTab: false,                                    // Set possible initial tab even if "active" is not defined
        setInitialTabImmediately: true,                          // Set initial tab without animation
        active: null,
        items: [],
        processTabs: true,
        targetEvent: 'click',                                    // click | hover | none
        toggleOnHashChange: false,                               // URL hash change handler
        showLoader: true,
        responseKey: 'data',                                     // Instead of using filter callback, you can provide response array key
        responseHTML: true,                                      // If true, html will append automatically
        cache: false,                                            // Cache ajax tab content
        ajax: {
            type: 'json',
            method: 'get',
            url: '',                                             // Request URL. Variables: %baseUrl%, %tab%, %callback% for JSONP.
            params: ''                                           // Params object. %tab%, %baseUrl%, %callback% for JSONP.
        },
        overlayConstructor: 'Com.Overlay',
        overlayParams: {
            position: 'absolute',
            lazy: true,
            autoOpen: false,
            removeOnClose: true
        }
    },
    strings: {
        'server_error': 'An unexpected error has occurred. Please try again later.'
    }
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.TabsetHelper', function(classConstructor, className, classProto, classInherit) {
    /*** SYSTEM ***/

    classProto.construct = function() {
        var that = this;
        // Variables
        that.nodes = {
            container: cm.node('div'),
            labels: [],
            tabs: [],
            select: cm.node('select')
        };
        that.ajaxHandler = null;
        that.isAjax = false;
        that.isProcess = false;
        that.targetEvent = null;
        that.current = false;
        that.previous = false;
        that.items = {};
        that.itemsList = [];
        // Binds
        that.hashChangeHandler = that.hashChange.bind(that);
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.validateParams = function() {
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        // Ajax
        if (!cm.isEmpty(that.params.ajax.url)) {
            that.isAjax = true;
        }
        // Target Event
        switch (that.params.targetEvent) {
            case 'hover':
                that.targetEvent = 'mouseover';
                break;
            case 'click':
            default:
                that.targetEvent = 'click';
                break;
        }
        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        that.triggerEvent('onValidateParamsEnd');
    };

    classProto.onSetEvents = function() {
        var that = this;
        that.params.toggleOnHashChange && cm.addEvent(window, 'hashchange', that.hashChangeHandler);
    };

    classProto.onUnsetEvents = function() {
        var that = this;
        that.params.toggleOnHashChange && cm.removeEvent(window, 'hashchange', that.hashChangeHandler);
    };

    classProto.onConstructEnd = function() {
        var that = this;
        that.setInitialTab();
    };

    /******* VIEW MODEL *******/

    classProto.renderViewModel = function() {
        var that = this;
        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Process tabs
        if (that.params.processTabs) {
            that.processTabs(that.nodes.tabs, that.nodes.labels);
        }
        // Process tabs in parameters
        cm.forEach(that.params.items, function(item) {
            that.renderTab(item);
        });
        // Process select
        that.processSelect(that.nodes.select);
        // Overlay
        cm.getConstructor(that.params.overlayConstructor, function(classConstructor) {
            that.components.loader = new classConstructor(that.params.overlayParams);
        });
        return that;
    };

    /******* TABS *******/

    classProto.processTab = function(tab, label) {
        var that = this,
            config = cm.merge(that.getNodeDataConfig(tab.container), that.getNodeDataConfig(label.container)),
            item = cm.merge(config, {
                tab: tab,
                label: label
            });
        that.addTab(item);
    };

    classProto.processTabs = function(tabs, labels) {
        var that = this,
            itemsToProcess = tabs.length ? tabs : labels,
            items = [],
            label,
            config,
            item;
        cm.forEach(itemsToProcess, function(tab, key) {
            label = labels[key];
            config = cm.merge(that.getNodeDataConfig(tab.container), that.getNodeDataConfig(label.container));
            item = cm.merge(config, {
                tab: tab,
                label: label
            });
            items.push(item);
        });
        that.addTabs(items);
        return that;
    };

    classProto.renderTab = function(item) {
        var that = this;
        // Merge tab configuration
        item = cm.merge({
            index: that.itemsList.length,
            id: '',
            title: '',
            titleContent: null,
            content: null,
            tab: {
                container: cm.node('li'),
                inner: cm.node('div'),
            },
            label: {
                container: cm.node('li'),
                link: cm.node('a'),
            },
            menu: {
                container: cm.node('li'),
                link: cm.node('a'),
            },
            callback: null,
            constructor: null,
            constructorParams: {},
            constructorEventName: 'onLoadEnd',
            className: '',
            cache: null,
            ajax: {},
            isHidden: false,
            isShow: false,
            isAjax: false,
            isCached: false
        }, item);
        // Set names
        item.tabName = ['tabset', that.params.name, 'tab', (!cm.isEmpty(item.id) ? item.id : item.index)].join('--');
        item.labelName = ['tabset', that.params.name, 'label', (!cm.isEmpty(item.id) ? item.id : item.index)].join('--');
        // Cache
        if (!cm.isBoolean(item.cache)) {
            item.cache = that.params.cache;
        }
        // Render tab view
        if (that.params.renderTabView) {
            that.renderTabView(item);
        }
        // Check for ajax
        if (!cm.isEmpty(item.ajax.url)) {
            item.isAjax = true;
        }
        // Class name
        if (!cm.isEmpty(item.className)) {
            cm.addClass(item.label.container, item.className);
            cm.addClass(item.menu.container, item.className);
            cm.addClass(item.tab.container, item.className);
        }
        // Push
        if (!cm.isEmpty(item.id) && !that.items[item.id]) {
            // Hide nodes
            if (item.isHidden) {
                cm.addClass(item.label.container, 'hidden');
                cm.addClass(item.menu.container, 'hidden');
                cm.addClass(item.tab.container, 'hidden');
            }
            // Target events
            that.renderTabTarget(item, item.label.container);
            that.renderTabTarget(item, item.menu.container);
            // Export
            that.itemsList.push(item);
            that.items[item.id] = item;
        }
        return that;
    };

    classProto.renderTabTarget = function(item, node) {
        var that = this;
        if (!that.targetEvent) {
            return;
        }
        if (that.targetEvent === 'click') {
            cm.click.add(node, function(event) {
                cm.preventDefault(event);
                cm.stopPropagation(event);
                that.tabTarget(item);
            });
        } else {
            cm.addEvent(node, that.targetEvent, function(event) {
                cm.preventDefault(event);
                cm.stopPropagation(event);
                that.tabTarget(item);
            });
        }
    };

    classProto.tabTarget = function(item) {
        var that = this;
        that.triggerEvent('onLabelTarget', item);
        // Set
        if (that.params.toggleOnHashChange) {
            window.location.hash = item.id;
        } else {
            that.setTab(item.id);
        }
    };

    classProto.renderTabView = function(item) {
        var that = this;
    };

    classProto.removeTab = function(id) {
        var that = this,
            item = that.items[id];
        if (item) {
            that.triggerEvent('onTabRemove', item);
            // Set new active tab, if current active is nominated for remove
            if (item.id === that.current) {
                that.setByIndex(0);
            }
            // Remove tab from list and array
            cm.remove(item.tab.container);
            cm.remove(item.label.container);
            that.itemsList = cm.arrayRemove(that.itemsList, item);
            delete that.items[item.id];
            that.triggerEvent('onTabRemove', item);
            that.triggerEvent('onTabRemoveEnd', item);
        }
        return that;
    };

    /*** SET / UNSET ***/

    classProto.setTab = function(id, params) {
        var that = this;

        // Deprecated argument isInitial
        if (cm.isBoolean(params)) {
            params = {isInitial: params};
        }

        // Validate params
        params = cm.merge({
            isInitial: false,
        }, params);

        var item = that.items[id];
        if (item && that.current !== id) {
            that.isInitial = params.isInitial;
            that.tabChangeStart(item);
            // Unset and hide previous tab
            that.unsetTab(that.current, {action: 'onSetTab'});
            // Set and show new tab
            that.triggerEvent('onTabShowStart', item);
            that.previous = that.current;
            that.current = id;
            item.isShow = true;
            that.triggerEvent('onTabShowProcess', item);
            if (!that.previous && that.params.setInitialTabImmediately) {
                cm.addClass(item.tab.container, 'is-immediately');
                cm.addClass(item.label.container, 'is-immediately');
                setTimeout(function() {
                    cm.removeClass(item.tab.container, 'is-immediately');
                    cm.removeClass(item.label.container, 'is-immediately');
                }, 5);
            }
            cm.addClass(item.label.container, 'active', true);
            cm.addClass(item.tab.container, 'active', true);
            // Set select menu
            cm.setSelect(that.nodes.select, that.current);
            // Trigger events
            that.refreshTab(that.current);
        }
        return that;
    };

    classProto.unsetTab = function(id, params) {
        var that = this;

        // Validate params
        params = cm.merge({
            action: null,
        }, params);

        var item = that.items[id];
        if (item) {
            if (that.isProcess) {
                that.abort();
            }
            that.triggerEvent('onTabHideStart', item);
            item.isShow = false;
            that.triggerEvent('onTabHideProcess', item);
            cm.removeClass(item.label.container, 'active');
            cm.removeClass(item.tab.container, 'active');
            that.tabHideEnd(item, params);
        }
        return that;
    };

    classProto.refreshTab = function(id) {
        var that = this,
            item = that.items[id],
            controllerEvents = {};
        if (item.constructor) {
            // Controller
            if (item.controller) {
                item.controller.refresh && item.controller.refresh();
            } else {
                cm.getConstructor(item.constructor, function(classConstructor) {
                    controllerEvents[item.constructorEventName] = function() {
                        that.tabShowEnd(item, {});
                    };
                    item.controller = new classConstructor(
                        cm.merge(item.constructorParams, {
                            container: item.tab.inner,
                            events: controllerEvents
                        })
                    );
                });
            }
        } else if (cm.isFunction(item.callback)) {
            item.callback(item);
            that.tabShowEnd(item, {});
        } else if (
            item.isAjax &&
            (!item.cache || (item.cache && !item.isCached))
        ) {
            that.ajaxHandler = classProto.callbacks.request(that, {
                config: cm.merge(that.params.ajax, item.ajax)
            }, item);
        } else {
            that.tabShowEnd(item, {});
        }
    };

    classProto.unsetHead = function() {
        var that = this,
            item = that.items[that.current];
        if (item) {
            cm.removeClass(item.label.container, 'active');
        }
        return that;
    };

    classProto.getInitialTab = function() {
        var that = this;
        var id;
        if (cm.isEmpty(that.itemsList) || cm.isEmpty(that.items)) {
            return null;
        }
        // Get tab from hash if exists
        if (that.params.toggleOnHashChange) {
            id = window.location.hash.slice(1);
            if (that.isValidTab(id)) {
                return id;
            }
        }
        // Get tab from parameters if exists
        id = that.params.active;
        if (that.isValidTab(id)) {
            return id;
        }
        // Get first tab in the list
        return that.itemsList[0].id;
    };

    classProto.setInitialTab = function() {
        var that = this,
            id;
        // Set default active tab
        if (that.params.setInitialTab) {
            id = that.getInitialTab();
        } else {
            id = that.params.active
        }
        if (that.isValidTab(id)) {
            that.setTab(id, true);
        }
    };

    classProto.isValidTab = function(id) {
        var that = this;
        return !!that.getTab(id);
    };

    /*** SHOW / HIDE ***/

    classProto.tabChangeStart = function(item) {
        var that = this;
        that.triggerEvent('onTabChangeStart', item);
    };

    classProto.tabShowEnd = function(item, params) {
        var that = this;
        if (item.id !== that.current) {
            return;
        }

        // Validate params
        params = cm.merge({
            redrawContent: true,
            triggerEvents: true,
        }, params);

        if (params.redrawContent) {
            that.redrawTabContent(item);
        }

        if (params.triggerEvents) {
            that.triggerEvent('onTabShow', item, params);
            that.triggerEvent('onTabShowEnd', item, params);
            if (that.current !== that.previous) {
                that.triggerEvent('onTabChange', item, params);
                that.triggerEvent('onTabChangeEnd', item, params);
            }
        }
    };

    classProto.tabHideEnd = function(item, params) {
        var that = this;

        // Validate params
        params = cm.merge({
            triggerEvents: true,
        }, params);

        if (params.triggerEvents) {
            that.triggerEvent('onTabHide', item);
            that.triggerEvent('onTabHideEnd', item);
        }
    };

    classProto.redrawTabContent = function(item) {
        var that = this;
        cm.customEvent.trigger(item.tab.container, 'redraw', {
            direction: 'child',
            self: false
        });
    };

    /******* SELECT *******/

    classProto.processSelect = function(container) {
        var that = this;
        cm.addEvent(container, 'change', function() {
            that.setTab(container.value);
        })
    };

    /******* URL HASH HANDLING *******/

    classProto.hashChange = function() {
        var that = this,
            id = decodeURIComponent(window.location.hash.slice(1));
        if (that.isValidTab(id)) {
            that.setTab(id);
        }
    };

    /******* CALLBACKS *******/

    /*** AJAX ***/

    classProto.callbacks.prepare = function(that, params, item) {
        params.config = that.callbacks.beforePrepare(that, params, item);
        params.config.url = cm.strReplace(params.config.url, {
            '%tab%': item.id,
            '%baseUrl%': cm._baseUrl
        });
        params.config.params = cm.objectReplace(params.config.params, {
            '%tab%': item.id,
            '%baseUrl%': cm._baseUrl
        });
        params.config = that.callbacks.afterPrepare(that, params, item);
        return params.config;
    };

    classProto.callbacks.beforePrepare = function(that, params, item) {
        return params.config;
    };

    classProto.callbacks.afterPrepare = function(that, params, item) {
        return params.config;
    };

    classProto.callbacks.request = function(that, params, item) {
        params = cm.merge({
            response: null,
            config: null,
            data: null
        }, params);
        // Validate config
        params.config = that.callbacks.prepare(that, params, item);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(params.config, {
                onStart: function() {
                    classProto.callbacks.start(that, params, item);
                },
                onSuccess: function(response) {
                    params.response = response;
                    classProto.callbacks.response(that, params, item);
                },
                onError: function() {
                    classProto.callbacks.error(that, params, item);
                },
                onAbort: function() {
                    classProto.callbacks.abort(that, params, item);
                },
                onEnd: function() {
                    classProto.callbacks.end(that, params, item);
                }
            })
        );
    };

    classProto.callbacks.start = function(that, params, item) {
        that.isProcess = true;
        // Show Loader
        if (that.params.showLoader) {
            that.components.loader
                .embed(item.tab.container)
                .open();
        }
        that.triggerEvent('onRequestStart', item, params);
    };

    classProto.callbacks.end = function(that, params, item) {
        that.isProcess = false;
        // Hide Loader
        if (that.params.showLoader) {
            that.components.loader.close();
        }
        that.triggerEvent('onRequestEnd', item, params);
    };

    classProto.callbacks.filter = function(that, params, item) {
        var data,
            dataItem = cm.objectSelector(that.params.responseKey, params.response);
        if (dataItem && !cm.isEmpty(dataItem)) {
            data = dataItem;
        }
        return data;
    };

    classProto.callbacks.response = function(that, params, item) {
        if (!cm.isEmpty(params.response)) {
            params.data = classProto.callbacks.filter(that, params, item);
        }
        if (!cm.isEmpty(params.data)) {
            classProto.callbacks.success(that, params, item);
        } else {
            classProto.callbacks.error(that, params, item);
        }
    };

    classProto.callbacks.error = function(that, params, item) {
        classProto.callbacks.renderError(that, params, item);
        that.triggerEvent('onRequestError', item, params);
    };

    classProto.callbacks.success = function(that, params, item) {
        classProto.callbacks.render(that, params, item);
        that.triggerEvent('onRequestSuccess', item, params);
    };

    classProto.callbacks.abort = function(that, params, item) {
        that.triggerEvent('onRequestAbort', item, params);
    };

    /*** RENDER ***/

    classProto.callbacks.render = function(that, params, item) {
        item.data = params.data;
        item.isCached = true;
        // Render
        that.triggerEvent('onContentRenderStart', item, params);
        classProto.callbacks.renderContent(that, params, item);
        that.triggerEvent('onContentRender', item, params);
        that.triggerEvent('onContentRenderEnd', item, params);
        // Show tab
        that.tabShowEnd(item, params);
    };

    classProto.callbacks.renderContent = function(that, params, item) {
        var nodes;
        if (that.params.responseHTML) {
            nodes = cm.strToHTML(params.data);
            cm.clearNode(item.tab.inner);
            cm.appendNodes(nodes, item.tab.inner);
        }
    };

    classProto.callbacks.renderError = function(that, params, item) {
        if (that.params.responseHTML) {
            cm.clearNode(item.tab.inner);
            item.tab.inner.appendChild(
                cm.node('div', {classes: 'cm__empty'}, that.lang('server_error'))
            );
        }
    };

    /******* PUBLIC *******/

    classProto.set = function(id, params) {
        var that = this,
            item = that.items[id];
        item && that.setTab(id, params);
        return that;
    };

    classProto.setByIndex = function(index, params) {
        var that = this,
            item = that.itemsList[index];
        item && that.setTab(item.id, params);
        return that;
    };

    classProto.unset = function() {
        var that = this;
        that.triggerEvent('onUnsetStart');
        that.unsetTab(that.current, {action: 'onUnset'});
        // Reset
        if (that.params.toggleOnHashChange) {
            window.location.hash = '';
        }
        that.current = null;
        that.previous = null;
        that.triggerEvent('onUnset');
        return that;
    };

    classProto.get = function() {
        var that = this;
        return that.current;
    };

    classProto.refresh = function() {
        var that = this;
        if (!cm.isUndefined(that.current)) {
            that.refreshTab(that.current);
        }
        return that;
    };

    classProto.addTab = function(item) {
        var that = this;
        that.renderTab(item);
        return that;
    };

    classProto.addTabs = function(items) {
        var that = this;
        cm.forEach(items, function(item) {
            that.renderTab(item);
        });
        return that;
    };

    classProto.getTab = function(id) {
        var that = this;
        if (id && that.items[id]) {
            return that.items[id];
        }
        return null;
    };

    classProto.getTabs = function() {
        var that = this;
        return that.items;
    };

    classProto.getCurrentTab = function() {
        var that = this;
        return that.items[that.current];
    };

    classProto.getTabsCount = function() {
        var that = this;
        return that.itemsList.length;
    };

    classProto.isTabEmpty = function(id) {
        var that = this;
        var item = that.getTab(id);
        return !(item && item.tab.inner.childNodes.length);
    };

    classProto.abort = function() {
        var that = this;
        if (that.ajaxHandler && that.ajaxHandler.abort) {
            that.ajaxHandler.abort();
        }
        return that;
    };
});
