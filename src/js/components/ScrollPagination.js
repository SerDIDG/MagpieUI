cm.define('Com.ScrollPagination', {
    extend: 'Com.AbstractController',
    events: [
        'onRebuild',
        'onStart',
        'onAbort',
        'onError',
        'onEmpty',
        'onPageRender',
        'onPageRenderEnd',
        'onPageShow',
        'onPageHide',
        'onPlaceholderRender',
        'onPlaceholderRenderEnd',
        'onPlaceholderRemove',
        'onPlaceholderRemoveEnd',
        'onEnd',
        'onFinalize',
        'onSetCount',
        'onButtonShow',
        'onButtonHide',
        'onLoaderShow',
        'onLoaderHide'
    ],
    params: {
        controllerEvents: true,
        renderStructure: false,                                  // Render wrapper nodes if not exists in html
        embedStructureOnRender: false,
        embedStructure: 'append',
        clearOnRebuild: false,
        resizeEvent: true,
        scrollEvent: true,
        scrollNode: window,
        scrollIndent: 'Math.max(%scrollHeight% / (3 / 2), 600)', // Variables: %blockHeight%.
        disabled: false,
        data: [],                                                // Static data
        count: null,
        perPage: 0,                                              // 0 - render all data in one page
        startPage: 1,                                            // Start page
        startPageToken: '',
        startOffset: 0,
        pageCount: 0,                                            // Render only count of pages. 0 - infinity
        useToken: false,
        autoSend: true,
        showButton: undefined,                                   // Deprecated, user button.enable
        showLoader: true,
        loaderDelay: 'cm._config.loadDelay',
        setDelay: 'cm._config.loadDelay',
        stopOnESC: true,

        pageTag: 'div',
        pageAttributes: {
            class: 'com__scroll-pagination__page',
        },
        button: {
            enable: true,                                        // true - always | once - show once after first loaded page | false - don't show | none - don't show even on ESK press
            classes: ['button', 'button-primary'],
        },
        placeholder: {
            enable: false,                                       // true - always | auto - show starting from a second page | false - don't show
            embedLoader: true,                                   // append loader node inside placeholder
        },

        responseCountKey: 'count',                               // Take items count from response
        responseTokenKey: 'token',                               // Token key name
        responseKey: 'data',                                     // Instead of using filter callback, you can provide response array key
        responseErrorsKey: 'errors',
        responseHTML: false,                                     // If true, HTML will append automatically
        ajax: {
            type: 'json',
            method: 'get',
            url: '',                                             // Request URL. Variables: %baseUrl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
            params: '',                                          // Params object. %baseUrl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
        },
    },
    strings: {
        'load_more': 'Load More',
        'server_error': 'An unexpected error has occurred. Please try again later.'
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.ScrollPagination', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function() {
        const that = this;

        // variables
        that.nodes = {
            container: cm.node('div'),
            scroll: null,
            bar: cm.node('div'),
            barHolder: cm.node('div'),
            content: cm.node('div'),
            pages: cm.node('div'),
            button: cm.node('div'),
            loader: cm.node('div')
        };

        that.pages = [];
        that.ajaxHandler = null;
        that.loaderDelay = null;
        that.setDelay = null;
        that.currentAction = null;
        that.currentPlaceholder = null;

        that.isAjax = false;
        that.isProcess = false;
        that.isFinalize = false;
        that.isButton = false;
        that.isDisabled = false;

        that.page = null;
        that.pageToken = null;
        that.currentPage = null;
        that.previousPage = null;
        that.nextPage = null;
        that.itemCount = null;
        that.pageCount = null;
        
        // Binds
        that.keyDownEventHandler = that.keyDownEvent.bind(that);
        that.setHandler = that.set.bind(that);
        
        // Call parent method - renderViewModel
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.validateParams = function() {
        const that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        
        // States
        that.isDisabled = that.params.disabled;
        
        // Set Scroll Node
        if (that.nodes.scroll) {
            that.params.scrollNode = that.nodes.scroll;
        }
        
        // Validate deprecated buttons parameters
        if (!cm.isUndefined(that.params.showButton)) {
            that.params.button.enable = that.params.showButton;
        }
        
        // If URL parameter exists, use ajax data
        if (!cm.isEmpty(that.params.ajax.url)) {
            that.isAjax = true;
        } else {
            that.params.showLoader = false;
        }
        that.itemCount = that.params.count;
        that.setPageCount();
        
        // Set start page token
        that.setToken(that.params.startPage, that.params.startPageToken);
        
        // Set next page token
        that.nextPage = that.params.startPage;
        
        that.triggerEvent('onValidateParamsEnd');
    };

    classProto.setEventsHandler = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.setEventsHandler.apply(that, arguments);

        // Suspend pagination on press ESC
        if (that.params.stopOnESC) {
            cm.addEvent(window, 'keydown', that.keyDownEventHandler);
        }
    };

    classProto.unsetEventsHandler = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.unsetEventsHandler.apply(that, arguments);

        // Suspend pagination on press ESC
        if (that.params.stopOnESC) {
            cm.removeEvent(window, 'keydown', that.keyDownEventHandler);
        }
    };

    classProto.onConstructEnd = function() {
        const that = this;
        that.params.autoSend && that.set();
    };

    classProto.onDestructStart = function() {
        const that = this;
        that.components.observer?.disconnect();
    };

    classProto.onScrollUpdate = function() {
        const that = this;
        if (that.checkForRequest()) {
            that.set();
        }
    };

    /******* VIEW - MODEL *******/

    classProto.renderView = function() {
        const that = this;

        // Render Structure
        that.nodes.container = cm.node('div', {classes: 'com__scroll-pagination'},
            that.nodes.content = cm.node('div', {classes: 'com__scroll-pagination__content'},
                that.nodes.pages = cm.node('div', {classes: 'com__scroll-pagination__pages'})
            )
        );

        // Button and loader
        that.nodes.bar = cm.node('div', {classes: 'com__scroll-pagination__bar'},
            that.nodes.button = cm.node('button', {classes: that.params.button.classes}, that.lang('load_more')),
            that.nodes.loader = cm.node('div', {classes: 'button button-clear has-icon has-icon has-icon-small'},
                cm.node('div', {classes: 'icon small loader'})
            )
        );
        that.embedButton(that.nodes.container);
    };

    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init scroll intersection observer
        that.components.observer = new IntersectionObserver(
            that.isPagesVisible.bind(that),
            {
                root: null,
                rootMargin: '0px',
                threshold: that.params.threshold,
            }
        );

        // Reset styles and variables
        that.resetStyles();

        // Events
        cm.click.add(that.nodes.button, event => {
            cm.preventDefault(event);
            that.set();
        });
    };

    /******* HELPERS *******/

    classProto.resetStyles = function() {
        const that = this;

        // Remove placeholder
        that.callbacks.removePlaceholder(that, that.currentPlaceholder);
        that.currentPlaceholder = null;

        // Load More Button
        if (!that.params.button.enable || that.params.button.enable === 'none') {
            that.callbacks.hideButton(that);
        } else {
            that.callbacks.showButton(that);
        }

        // Hide Loader
        that.callbacks.hideLoader(that);
    };

    classProto.keyDownEvent = function(e) {
        const that = this;
        cm.handleKey(e, 'Escape', () => {
            if (!that.isDisabled && !that.isProcess && !that.isFinalize && that.params.button.enable !== 'none') {
                that.callbacks.showButton(that);
            }
        });
    };

    classProto.checkForScrollBottom = function() {
        const that = this;
        const scrollTop = cm.getScrollTop(that.params.scrollNode);
        const scrollHeight = cm.getScrollHeight(that.params.scrollNode);
        const scrollRect = cm.getRect(that.params.scrollNode);
        return scrollTop + scrollRect.height >= scrollHeight;
    };

    classProto.checkForRequest = function() {
        const that = this;
        const scrollRect = cm.getRect(that.params.scrollNode);
        const pagesRect = cm.getRect(that.nodes.pages);
        if (!that.isDisabled && !cm.isProcess && !that.isFinalize && !that.isButton && !that.checkForButton()) {
            const scrollIndent = eval(
                cm.strReplace(that.params.scrollIndent, {
                    '%scrollHeight%': scrollRect.bottom - scrollRect.top
                })
            );
            if (pagesRect.bottom - scrollRect.bottom <= scrollIndent) {
                return true;
            }
        }
        return false;
    };

    classProto.checkForButton = function() {
        const that = this;
        return (
            that.params.button.enable === true ||
            (that.params.button.enable === 'once' && that.params.startPage === that.page)
        );
    };

    classProto.checkForPlaceholder = function() {
        const that = this;
        return (
            that.params.placeholder.enable === true ||
            (that.params.placeholder.enable === 'auto' && that.params.startPage !== that.page && !that.isButton)
        );
    };

    /******* CALLBACKS *******/

    /*** AJAX ***/

    classProto.callbacks.prepare = function(that, config) {
        config = that.callbacks.beforePrepare(that, config);
        config.url = cm.strReplace(config.url, {
            '%perPage%': that.params.perPage,
            '%limit%': that.params.perPage,
            '%page%': that.page,
            '%offset%': (that.page - 1) * that.params.perPage + that.params.startOffset,
            '%token%': that.pageToken,
            '%baseUrl%': cm._baseUrl
        });
        config.params = cm.objectReplace(config.params, {
            '%perPage%': that.params.perPage,
            '%limit%': that.params.perPage,
            '%page%': that.page,
            '%offset%': (that.page - 1) * that.params.perPage + that.params.startOffset,
            '%token%': that.pageToken,
            '%baseUrl%': cm._baseUrl
        });
        config = that.callbacks.afterPrepare(that, config);
        return config;
    };

    classProto.callbacks.beforePrepare = function(that, config) {
        return config;
    };

    classProto.callbacks.afterPrepare = function(that, config) {
        return config;
    };

    classProto.callbacks.request = function(that, config) {
        config = that.callbacks.prepare(that, config);
        that.currentAction = config;

        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                onStart: function() {
                    that.callbacks.start(that, config);
                },
                onSuccess: function(response) {
                    that.callbacks.response(that, config, response);
                },
                onError: function() {
                    that.callbacks.error(that, config);
                },
                onAbort: function() {
                    that.callbacks.abort(that, config);
                },
                onEnd: function() {
                    that.callbacks.end(that);
                }
            })
        );
    };

    classProto.callbacks.filter = function(that, config, response) {
        const errorsItem = cm.objectPath(that.params.responseErrorsKey, response);
        const dataItem = cm.objectPath(that.params.responseKey, response);
        const countItem = cm.objectPath(that.params.responseCountKey, response);
        const tokenItem = cm.objectPath(that.params.responseTokenKey, response);

        let data = [];
        if (cm.isEmpty(errorsItem)) {
            if (!cm.isEmpty(dataItem)) {
                if (cm.isArray(dataItem) && that.params.perPage) {
                    data = dataItem.slice(0, that.params.perPage);
                } else {
                    data = dataItem;
                }
            }
            if (!cm.isEmpty(countItem)) {
                that.setCount(countItem);
            }
            if (!cm.isEmpty(tokenItem)) {
                that.setToken(that.nextPage, tokenItem);
            }
            if (that.params.useToken && cm.isEmpty(tokenItem)) {
                that.callbacks.finalize(that);
            }
        }
        return data;
    };

    classProto.callbacks.response = function(that, config, response) {
        // Set the next page
        that.setPage();

        // Response
        if (response) {
            response = that.callbacks.filter(that, config, response);
        }

        if (!cm.isEmpty(response)) {
            that.callbacks.render(that, response);
        } else {
            that.triggerEvent('onEmpty');
            that.callbacks.finalize(that);
        }
    };

    classProto.callbacks.error = function(that, config) {
        that.callbacks.finalize(that);
        that.triggerEvent('onError');
    };

    classProto.callbacks.abort = function(that, config) {
        that.triggerEvent('onAbort');
    };

    /* *** STATIC *** */

    classProto.callbacks.data = function(that, data) {
        that.callbacks.start(that);
        that.setPage();

        // Get page data and render
        if (!cm.isEmpty(data)) {
            if (that.params.perPage === 0) {
                that.callbacks.render(that, data);
                that.callbacks.finalize(that);
            } else if (that.params.perPage > 0) {
                const length = data.length;
                const start = (that.page - 1) * that.params.perPage;
                const end = (that.page * that.params.perPage);

                if (start >= length) {
                    that.callbacks.finalize(that);
                } else {
                    const pageData = data.slice(start, Math.min(end, length));
                    that.callbacks.render(that, pageData);
                }

                if (end >= length) {
                    that.callbacks.finalize(that);
                }
            }
        } else {
            that.callbacks.render(that, data);
        }
        that.callbacks.end(that);
    };

    /* *** RENDER *** */

    classProto.callbacks.renderContainer = function(that, page) {
        return cm.node(that.params.pageTag, that.params.pageAttributes);
    };

    classProto.callbacks.render = function(that, data) {
        const scrollTop = cm.getScrollTop(that.params.scrollNode);
        const isScrollAtBottom = that.checkForScrollBottom();

        // Configure
        const page = {
            page: that.page,
            token: that.pageToken,
            pages: that.nodes.pages,
            container: cm.node(that.params.pageTag),
            data: data,
            isEmpty: false,
            isVisible: false,
            isRendered: true,
        };

        // Render page
        page.container = that.callbacks.renderContainer(that, page);
        that.pages[that.page] = page;
        that.triggerEvent('onPageRender', page);
        that.callbacks.renderPage(that, page);

        // Append
        if (that.currentPlaceholder) {
            cm.insertBefore(page.container, that.currentPlaceholder.container);
        } else {
            cm.appendChild(page.container, that.nodes.pages);
        }
        cm.addClass(page.container, 'is-loaded', true);

        // Add node to the observer watcher
        that.components.observer.observe(page.container);

        // Restore scroll position when at the bottom to prevent overflow-anchoring
        if (isScrollAtBottom) cm.setScrollTop(that.params.scrollNode, scrollTop);

        that.triggerEvent('onPageRenderEnd', page);
    };

    classProto.callbacks.renderPage = function(that, page) {
        if (!that.params.responseHTML) return;
        const nodes = cm.strToHTML(page.data);
        cm.appendNodes(nodes, page.container);
    };

    classProto.callbacks.removePage = function(that, page) {
        if (!page || !page.isRendered) return;
        that.components.observer.unobserve(page.container);
        cm.remove(page.container);
    };

    classProto.callbacks.renderPlaceholder = function(that, config) {
        const placeholder = {};

        // Render container
        placeholder.container = that.callbacks.renderContainer(that);
        cm.addClass(placeholder.container, 'is-placeholder');
        that.triggerEvent('onPlaceholderRender', placeholder);

        // Append
        cm.appendChild(placeholder.container, that.nodes.pages);
        that.triggerEvent('onPlaceholderRenderEnd', placeholder);

        return placeholder;
    };

    classProto.callbacks.removePlaceholder = function(that, placeholder) {
        if (!placeholder) return;
        that.triggerEvent('onPlaceholderRemove', placeholder);
        cm.remove(placeholder.container);
        that.triggerEvent('onPlaceholderRemoveEnd', placeholder);
    };

    /* *** HELPERS *** */

    classProto.callbacks.start = function(that, config) {
        that.isProcess = true;

        // Render space placeholder to prevent overflow-anchoring
        if (that.currentPlaceholder) {
            that.callbacks.removePlaceholder(that, that.currentPlaceholder);
            that.currentPlaceholder = null;
        }
        if (that.checkForPlaceholder()) {
            that.currentPlaceholder = that.callbacks.renderPlaceholder(that, config);
        }

        // Show Loader
        if (that.params.showLoader) {
            if (that.currentPlaceholder && that.params.placeholder.embedLoader) {
                cm.appendChild(that.nodes.bar, that.currentPlaceholder.container);
            }
            if (that.isButton) {
                that.callbacks.showLoader(that);
            } else {
                that.loaderDelay = setTimeout(() => that.callbacks.showLoader(that), that.params.loaderDelay);
            }
        }

        that.triggerEvent('onStart');
    };

    classProto.callbacks.end = function(that) {
        that.isProcess = false;

        // Hide Loader
        if (that.params.showLoader) {
            if (that.currentPlaceholder) {
                cm.appendChild(that.nodes.bar, that.nodes.barHolder);
            }
            that.loaderDelay && clearTimeout(that.loaderDelay);
            that.callbacks.hideLoader(that);
        }

        // Remove space placeholder to prevent overflow-anchoring
        that.callbacks.removePlaceholder(that, that.currentPlaceholder);
        that.currentPlaceholder = null;

        // Check pages count
        if (that.itemCount === 0 || (that.pageCount > 0 && that.pageCount === that.currentPage)) {
            that.callbacks.finalize(that);
        }

        // Show / Hide Load More Button
        that.callbacks.toggleButton(that);
        that.triggerEvent('onEnd');

        // Request more pages if container has empty space below
        if (that.checkForRequest()) {
            that.setDelay = setTimeout(that.setHandler, that.params.setDelay);
        }
    };

    classProto.callbacks.finalize = function(that) {
        if (!that.isFinalize) {
            that.isFinalize = true;
            that.callbacks.hideButton(that);
            that.triggerEvent('onFinalize');
        }
    };

    classProto.callbacks.toggleButton = function(that) {
        if (!that.isFinalize && that.checkForButton()) {
            that.callbacks.showButton(that);
        } else {
            that.callbacks.hideButton(that);
        }
    };

    classProto.callbacks.showButton = function(that) {
        that.isButton = true;
        cm.removeClass(that.nodes.button, 'is-hidden');
        cm.removeClass(that.nodes.bar, 'is-hidden');
        if (that.nodes.barHolder !== that.nodes.container) {
            cm.removeClass(that.nodes.barHolder, 'is-hidden');
        }
        that.triggerEvent('onButtonShow');
    };

    classProto.callbacks.hideButton = function(that) {
        that.isButton = false;
        cm.addClass(that.nodes.button, 'is-hidden');
        cm.addClass(that.nodes.bar, 'is-hidden');
        if (that.nodes.barHolder !== that.nodes.container) {
            cm.addClass(that.nodes.barHolder, 'is-hidden');
        }
        that.triggerEvent('onButtonHide');
    };

    classProto.callbacks.showLoader = function(that) {
        cm.addClass(that.nodes.button, 'is-hidden');
        cm.removeClass(that.nodes.loader, 'is-hidden');
        cm.removeClass(that.nodes.bar, 'is-hidden');
        that.triggerEvent('onLoaderShow');
    };

    classProto.callbacks.hideLoader = function(that) {
        cm.addClass(that.nodes.loader, 'is-hidden');
        that.triggerEvent('onLoaderHide');
    };

    /* ******* PUBLIC ******* */

    classProto.rebuild = classProto.request = function(params) {
        const that = this;

        // Cleanup
        if (that.isProcess) {
            that.abort();
        }
        that.pages = [];
        that.page = null;
        that.pageToken = null;
        that.currentPage = null;
        that.previousPage = null;
        that.nextPage = null;
        that.itemCount = null;
        that.pageCount = null;
        that.isFinalize = false;

        // Set new parameters
        if (!cm.isEmpty(params)) {
            that.setParams(params);
        }
        that.validateParams();

        // Reset styles and variables
        that.resetStyles();
        if (that.params.clearOnRebuild) {
            that.clear();
        }
        that.triggerEvent('onRebuild');

        // Render new pge
        that.set();
        return that;
    };

    classProto.clear = function() {
        const that = this;

        // Remove pages
        cm.forEach(that.pages, page => that.callbacks.removePage(that, page))
        cm.clearNode(that.nodes.pages);
        return that;
    };

    classProto.set = function() {
        const that = this;
        that.setDelay && clearTimeout(that.setDelay);
        if (!that.isProcess && !that.isFinalize) {
            // Preset next page and page token
            that.page = that.nextPage;
            that.pageToken = that.pages[that.page] ? that.pages[that.page].token : '';
            // Request
            if (that.isAjax) {
                const config = cm.clone(that.params.ajax);
                that.ajaxHandler = that.callbacks.request(that, config);
            } else {
                that.callbacks.data(that, that.params.data);
            }
        }
        return that;
    };

    classProto.setToken = function(page, token) {
        const that = this;
        if (!that.pages[page]) {
            that.pages[page] = {};
        }
        that.pages[page].token = token;
        return that;
    };

    classProto.setCount = function(count) {
        const that = this;
        if (cm.isString(count)) {
            count = parseInt(count);
        }
        if (cm.isNumber(count) && count !== that.itemCount) {
            that.itemCount = count;
            that.setPageCount();
            if (that.itemCount === 0 || (that.pageCount > 0 && that.pageCount === that.currentPage)) {
                that.callbacks.finalize(that);
            }
            that.triggerEvent('onSetCount', count);
        }
        return that;
    };

    classProto.setPageCount = function() {
        const that = this;
        if (that.params.pageCount === 0 && that.itemCount && that.params.perPage) {
            that.pageCount = Math.ceil(that.itemCount / that.params.perPage);
        } else {
            that.pageCount = that.params.pageCount;
        }
        return that;
    };

    classProto.setAction = function(o, mode, update, rebuild) {
        const that = this;
        mode = cm.inArray(['raw', 'update', 'current'], mode) ? mode : 'current';
        update = cm.isUndefined(update) ? false : update;
        rebuild = cm.isUndefined(rebuild) ? true : rebuild;
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
        if (rebuild) {
            that.rebuild();
        }
        return that;
    };

    classProto.getAction = function() {
        const that = this;
        return that.params.ajax;
    };

    classProto.getCurrentAction = function() {
        const that = this;
        return that.currentAction;
    };

    classProto.getPages = function() {
        const that = this;
        return that.pages;
    };

    classProto.setPage = function() {
        const that = this;
        that.previousPage = that.currentPage;
        that.currentPage = that.nextPage;
        that.nextPage++;
        return that;
    };

    classProto.isPagesVisible = function(entries) {
        const that = this;

        cm.forEach(that.pages, page => {
            cm.forEach(entries, entry => {
                if (page.container !== entry.target) return;

                if (entry.isIntersecting) {
                    page.isVisible = true;
                    cm.removeClass(page.container, 'is-hidden');
                    that.triggerEvent('onPageShow', page);
                } else {
                    page.isVisible = false;
                    cm.addClass(page.container, 'is-hidden');
                    that.triggerEvent('onPageHide', page);
                }
            });
        });
    };

    classProto.isEmpty = function() {
        const that = this;
        const page = that.pages.find(page => !page?.isEmpty);
        return !page;
    };

    classProto.finalize = function() {
        const that = this;
        that.callbacks.finalize(that);
        return that;
    };

    classProto.abort = function() {
        const that = this;
        if (that.ajaxHandler && that.ajaxHandler.abort) {
            that.ajaxHandler.abort();
        }
        return that;
    };

    classProto.disable = function() {
        const that = this;
        that.isDisabled = true;
        return that;
    };

    classProto.enable = function() {
        const that = this;
        that.isDisabled = false;
        return that;
    };

    classProto.embedButton = function(node) {
        const that = this;
        that.nodes.barHolder = node;
        cm.appendChild(that.nodes.bar, node);
    };

    classProto.isParent = function(node, flag) {
        const that = this;
        return cm.isParent(that.nodes.container, node, flag);
    };
});
