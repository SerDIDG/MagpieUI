cm.define('Com.ScrollPagination', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onRebuild',
        'onStart',
        'onAbort',
        'onError',
        'onPageRender',
        'onPageRenderEnd',
        'onPageShow',
        'onPageHide',
        'onEnd',
        'onFinalize',
        'onSetCount',
        'onButtonShow',
        'onButtonHide'
    ],
    'params' : {
        'controllerEvents' : true,
        'renderStructure' : false,                                  // Render wrapper nodes if not exists in html
        'embedStructureOnRender' : false,
        'embedStructure' : 'append',
        'resizeEvent' : true,
        'scrollEvent' : true,
        'scrollNode' : window,
        'scrollIndent' : 'Math.max(%scrollHeight% / 2, 600)',       // Variables: %blockHeight%.
        'disabled' : false,
        'data' : [],                                                // Static data
        'count' : 0,
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'startPageToken' : '',
        'pageCount' : 0,                                            // Render only count of pages. 0 - infinity
        'useToken' : false,
        'autoSend' : true,
        'showButton' : true,                                        // true - always | once - show once after first loaded page | none - don't show and don't scroll
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'stopOnESC' : true,
        'pageTag' : 'div',
        'pageAttributes' : {
            'class' : 'com__scroll-pagination__page'
        },
        'responseCountKey' : 'count',                               // Take items count from response
        'responseTokenKey' : 'token',                               // Token key name
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseErrorsKey': 'errors',
        'responseHTML' : false,                                     // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseUrl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
        }
    },
    'strings' : {
        'load_more' : 'Load More',
        'server_error' : 'An unexpected error has occurred. Please try again later.'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.ScrollPagination', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        // variables
        that.nodes = {
            'container' : cm.node('div'),
            'scroll' : null,
            'bar' : cm.node('div'),
            'barHolder' : cm.node('div'),
            'content' : cm.node('div'),
            'pages' : cm.node('div'),
            'button' : cm.node('div'),
            'loader' : cm.node('div')
        };

        that.pages = {};
        that.ajaxHandler = null;
        that.loaderDelay = null;
        that.currentAction = null;

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
        that.pageCount = 0;
        // Binds
        that.keyDownEventHandler = that.keyDownEvent.bind(that);
        // Call parent method - renderViewModel
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onConstructEnd = function(){
        var that = this;
        that.params['autoSend'] && that.set();
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        that.isDisabled = that.params['disabled'];
        // Set Scroll Node
        if(that.nodes['scroll']){
            that.params['scrollNode'] = that.nodes['scroll'];
        }
        // If URL parameter exists, use ajax data
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }else{
            that.params['showLoader'] = false;
        }
        if(that.params['pageCount'] === 0 && that.params['perPage'] && that.params['count']){
            that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
        }else{
            that.pageCount = that.params['pageCount'];
        }
        // Set start page token
        that.setToken(that.params['startPage'], that.params['startPageToken']);
        // Set next page token
        that.nextPage = that.params['startPage'];
        that.triggerEvent('onValidateParamsEnd');
    };

    classProto.onScroll = function(){
        var that = this,
            scrollRect = cm.getRect(that.params['scrollNode']),
            pagesRect = cm.getRect(that.nodes['pages']),
            scrollIndent;
        if(
            !that.isDisabled &&
            (!that.params['showButton'] || that.params['showButton'] !== 'none' || (that.params['showButton'] === 'once' && that.params['startPage'] !== that.currentPage)) &&
            !cm.isProcess && !that.isFinalize && !that.isButton
        ){
            scrollIndent = eval(cm.strReplace(that.params['scrollIndent'], {
                '%scrollHeight%' : scrollRect['bottom'] - scrollRect['top']
            }));
            if(pagesRect['bottom'] - scrollRect['bottom'] <= scrollIndent){
                that.set();
            }
        }
        // Show / Hide non visible pages
        cm.forEach(that.pages, function(page){
            that.isPageVisible(page, scrollRect);
        });
    };

    classProto.onRedraw = function(){
        var that = this;
        cm.forEach(that.pages, function(page){
            that.isPageVisible(page);
        });
    };

    /******* VIEW - MODEL *******/

    classProto.renderView = function(){
        var that = this;
        // Render Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__scroll-pagination'},
            that.nodes['content'] = cm.node('div', {'class' : 'com__scroll-pagination__content'},
                that.nodes['pages'] = cm.node('div', {'class' : 'com__scroll-pagination__pages'})
            ),
            that.nodes['bar'] = cm.node('div', {'class' : 'com__scroll-pagination__bar'},
                that.nodes['button'] = cm.node('div', {'class' : 'button button-primary'}, that.lang('load_more')),
                that.nodes['loader'] = cm.node('div', {'class' : 'button button-clear has-icon has-icon has-icon-small'},
                    cm.node('div', {'class' : 'icon small loader'})
                )
            )
        );
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Reset styles and variables
        that.resetStyles();
        // Events
        cm.addEvent(that.nodes['button'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            that.set();
        });
        if(that.params['stopOnESC']){
            cm.addEvent(window, 'keydown', that.keyDownEventHandler);
        }
    };

    /******* HELPERS *******/

    classProto.resetStyles = function(){
        var that = this;
        // Load More Button
        if(!that.params['showButton'] || that.params['showButton'] === 'none'){
            that.callbacks.hideButton(that);
        }else{
            that.callbacks.showButton(that);
        }
        // Hide Loader
        cm.addClass(that.nodes['loader'], 'is-hidden');
    };

    classProto.keyDownEvent = function(e){
        var that = this;
        cm.handleKey(e, 'escape', function(){
            if(!cm.isProcess && !cm.isFinalize && that.params['showButton'] !== 'none'){
                that.callbacks.showButton(that);
            }
        });
    };

    /******* CALLBACKS *******/

    /*** AJAX ***/

    classProto.callbacks.prepare = function(that, config){
        config = that.callbacks.beforePrepare(that, config);
        config['url'] = cm.strReplace(config['url'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseUrl%' : cm._baseUrl
        });
        config = that.callbacks.afterPrepare(that, config);
        return config;
    };

    classProto.callbacks.beforePrepare = function(that, config){
        return config;
    };

    classProto.callbacks.afterPrepare = function(that, config){
        return config;
    };

    classProto.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        that.currentAction = config;
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that);
                },
                'onSuccess' : function(response){
                    that.callbacks.response(that, config, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, config);
                },
                'onAbort' : function(){
                    that.callbacks.abort(that, config);
                },
                'onEnd' : function(){
                    that.callbacks.end(that);
                }
            })
        );
    };

    classProto.callbacks.filter = function(that, config, response){
        var data = [],
            errorsItem = cm.objectPath(that.params['responseErrorsKey'], response),
            dataItem = cm.objectPath(that.params['responseKey'], response),
            countItem = cm.objectPath(that.params['responseCountKey'], response),
            tokenItem = cm.objectPath(that.params['responseTokenKey'], response);
        if(cm.isEmpty(errorsItem)){
            if(!cm.isEmpty(dataItem)){
                if(!that.params['responseHTML'] && that.params['perPage']){
                    data = dataItem.slice(0, that.params['perPage']);
                }else{
                    data = dataItem;
                }
            }
            if(countItem){
                that.setCount(countItem);
            }
            if(tokenItem){
                that.setToken(that.nextPage, tokenItem);
            }
            if(that.params['useToken'] && !tokenItem){
                that.callbacks.finalize(that);
            }
        }
        return data;
    };

    classProto.callbacks.response = function(that, config, response){
        // Set next page
        that.setPage();
        // Response
        if(response){
            response = that.callbacks.filter(that, config, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.render(that, response);
        }else{
            that.callbacks.finalize(that);
        }
    };

    classProto.callbacks.error = function(that, config){
        that.callbacks.finalize(that);
        that.triggerEvent('onError');
    };

    classProto.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** STATIC *** */

    classProto.callbacks.data = function(that, data){
        var length, start, end, pageData;
        that.callbacks.start(that);
        that.setPage();
        if(!cm.isEmpty(data)){
            // Get page data and render
            if(that.params['perPage'] === 0){
                that.callbacks.render(that, data);
                that.callbacks.finalize(that);
            }else if(that.params['perPage'] > 0){
                length = data.length;
                start = (that.page - 1) * that.params['perPage'];
                end = (that.page * that.params['perPage']);
                if(start >= length){
                    that.callbacks.finalize(that);
                }else{
                    pageData = data.slice(start , Math.min(end, length));
                    that.callbacks.render(that, pageData);
                }
                if(end >= length){
                    that.callbacks.finalize(that);
                }
            }
        }else{
            that.callbacks.render(that, data);
        }
        that.callbacks.end(that);
    };

    /* *** RENDER *** */

    classProto.callbacks.renderContainer = function(that, page){
        return cm.node(that.params['pageTag'], that.params['pageAttributes']);
    };

    classProto.callbacks.render = function(that, data){
        var scrollTop = cm.getScrollTop(that.params['scrollNode']),
            page = {
                'page' : that.page,
                'token' : that.pageToken,
                'pages' : that.nodes['pages'],
                'container' : cm.node(that.params['pageTag']),
                'data' : data,
                'isVisible' : false
            };
        // Clear container
        if(that.page === that.params['startPage']){
            cm.clearNode(that.nodes['pages']);
        }
        // Render page
        page['container'] = that.callbacks.renderContainer(that, page);
        that.pages[that.page] = page;
        that.triggerEvent('onPageRender', page);
        that.callbacks.renderPage(that, page);
        // Embed
        cm.appendChild(page['container'], that.nodes['pages']);
        cm.addClass(page['container'], 'is-loaded', true);
        // Restore scroll position
        cm.setScrollTop(that.params['scrollNode'], scrollTop);
        that.triggerEvent('onPageRenderEnd', page);
        that.isPageVisible(page);
    };

    classProto.callbacks.renderPage = function(that, page){
        var nodes;
        if(that.params['responseHTML']){
            nodes = cm.strToHTML(page['data']);
            cm.appendNodes(nodes, page['container']);
        }
    };

    /* *** HELPERS *** */

    classProto.callbacks.start = function(that){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            if(that.isButton){
                cm.addClass(that.nodes['button'], 'is-hidden');
                cm.removeClass(that.nodes['loader'], 'is-hidden');
            }else{
                that.loaderDelay = setTimeout(function(){
                    cm.removeClass(that.nodes['loader'], 'is-hidden');
                    cm.removeClass(that.nodes['bar'], 'is-hidden');
                }, that.params['loaderDelay']);
            }
        }
        that.triggerEvent('onStart');
    };

    classProto.callbacks.end = function(that){
        that.isProcess = false;
        // Hide Loader
        that.loaderDelay && clearTimeout(that.loaderDelay);
        cm.addClass(that.nodes['loader'], 'is-hidden');
        // Check pages count
        if(that.pageCount > 0 && that.pageCount === that.currentPage){
            that.callbacks.finalize(that);
        }
        // Show / Hide Load More Button
        that.callbacks.toggleButton(that);
        that.triggerEvent('onEnd');
    };

    classProto.callbacks.finalize = function(that){
        if(!that.isFinalize){
            that.isFinalize = true;
            that.callbacks.hideButton(that);
            that.triggerEvent('onFinalize');
        }
    };

    classProto.callbacks.toggleButton = function(that){
        if(
            !that.isFinalize && 
            (that.params['showButton'] === true || (that.params['showButton'] === 'once' && that.params['startPage'] === that.page))
        ){
            that.callbacks.showButton(that);
        }else{
            that.callbacks.hideButton(that);
        }
    };

    classProto.callbacks.showButton = function(that){
        that.isButton = true;
        cm.removeClass(that.nodes['button'], 'is-hidden');
        cm.removeClass(that.nodes['bar'], 'is-hidden');
        cm.removeClass(that.nodes['barHolder'], 'is-hidden');
        that.triggerEvent('onButtonShow');
    };

    classProto.callbacks.hideButton = function(that){
        that.isButton = false;
        cm.addClass(that.nodes['button'], 'is-hidden');
        cm.addClass(that.nodes['bar'], 'is-hidden');
        cm.addClass(that.nodes['barHolder'], 'is-hidden');
        that.triggerEvent('onButtonHide');
    };

    /* ******* PUBLIC ******* */

    classProto.rebuild = function(params){
        var that = this;
        // Cleanup
        if(that.isProcess){
            that.abort();
        }
        that.pages = {};
        that.page = null;
        that.pageToken = null;
        that.currentPage = null;
        that.previousPage = null;
        that.nextPage = null;
        that.pageCount = 0;
        that.isFinalize = false;
        // Set new parameters
        if(!cm.isEmpty(params)){
            that.setParams(params);
        }
        that.validateParams();
        // Reset styles and variables
        that.resetStyles();
        that.triggerEvent('onRebuild');
        // Render new pge
        that.set();
        return that;
    };

    classProto.set = function(){
        var that = this,
            config;
        if(!that.isProcess && !that.isFinalize){
            // Preset next page and page token
            that.page = that.nextPage;
            that.pageToken = that.pages[that.page]? that.pages[that.page]['token'] : '';
            // Request
            if(that.isAjax){
                config = cm.clone(that.params['ajax']);
                that.ajaxHandler = that.callbacks.request(that, config);
            }else{
                that.callbacks.data(that, that.params['data']);
            }
        }
        return that;
    };

    classProto.setToken = function(page, token){
        var that = this;
        if(!that.pages[page]){
            that.pages[page] = {};
        }
        that.pages[page]['token'] = token;
        return that;
    };

    classProto.setCount = function(count){
        var that = this;
        if(!cm.isUndefined(count)){
            count = parseInt(count.toString());
        }
        if(cm.isNumber(count) && count !== that.params['count']){
            that.params['count'] = count;
            if(that.params['pageCount'] === 0 && that.params['count'] && that.params['perPage']){
                that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
            }else{
                that.pageCount = that.params['pageCount'];
            }
            if(that.pageCount > 0 && that.pageCount === that.currentPage){
                that.callbacks.finalize(that);
            }
            that.triggerEvent('onSetCount', count);
        }
        return that;
    };

    classProto.setAction = function(o, mode, update){
        var that = this;
        mode = cm.inArray(['raw', 'update', 'current'], mode) ? mode : 'current';
        switch(mode){
            case 'raw':
                that.params['ajax'] = cm.merge(that._raw.params['ajax'], o);
                break;
            case 'current':
                that.params['ajax'] = cm.merge(that.params['ajax'], o);
                break;
            case 'update':
                that.params['ajax'] = cm.merge(that._update.params['ajax'], o);
                break;
        }
        if(update){
            that._update.params['ajax'] = cm.clone(that.params['ajax']);
        }
        that.rebuild();
        return that;
    };

    classProto.getAction = function(){
        var that = this;
        return that.params['ajax'];
    };

    classProto.getCurrentAction = function(){
        var that = this;
        return that.currentAction;
    };

    classProto.setPage = function(){
        var that = this;
        that.previousPage = that.currentPage;
        that.currentPage = that.nextPage;
        that.nextPage++;
        return that;
    };

    classProto.isPageVisible = function(page, scrollRect){
        var that = this;
        if(page['container']){
            scrollRect = cm.isUndefined(scrollRect) ? cm.getRect(that.params['scrollNode']) : scrollRect;
            var pageRect = cm.getRect(page['container']);

            if(cm.inRange(pageRect['top'], pageRect['bottom'], scrollRect['top'], scrollRect['bottom'])){
                if(!page['isVisible']){
                    page['isVisible'] = true;
                    cm.removeClass(page['container'], 'is-hidden');
                    cm.triggerEvent('onPageShow', page);
                }
            }else{
                if(page['isVisible']){
                    page['isVisible'] = false;
                    cm.addClass(page['container'], 'is-hidden');
                    cm.triggerEvent('onPageHide', page);
                }
            }
            return page['isVisible'];
        }
        return false;
    };

    classProto.abort = function(){
        var that = this;
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    classProto.disable = function(){
        var that = this;
        that.isDisabled = true;
        return that;
    };

    classProto.enable = function(){
        var that = this;
        that.isDisabled = false;
        return that;
    };

    classProto.embedButton = function(node){
        var that = this;
        that.nodes['barHolder'] = node;
        cm.appendChild(that.nodes['bar'], node);
    };

    classProto.isParent = function(node, flag){
        var that = this;
        return cm.isParent(that.nodes['container'], node, flag);
    };
});