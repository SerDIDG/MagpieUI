cm.define('Com.Pagination', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onRebuild',
        'onStart',
        'onAbort',
        'onError',
        'onPageRender',
        'onPageRenderEnd',
        'onPageRenderError',
        'onPageSwitched',
        'onEnd',
        'onSetCount'
    ],
    'params' : {
        'controllerEvents' : true,
        'renderStructure' : false,                                  // Render wrapper nodes if not exists in html
        'embedStructureOnRender' : false,
        'embedStructure' : 'append',
        'scrollNode' : window,
        'data' : [],                                                // Static data
        'count' : 0,                                                // Total items
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'startPageToken' : '',
        'pageCount' : 0,
        'autoSend' : true,
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'barPosition' : 'bottom',                                   // top | bottom | both, require renderStructure
        'barAlign' : 'left',                                        // left | center | right, require renderStructure
        'barCountLR' : 3,
        'barCountM' : 1,                                            // 1 for drawing 3 center pagination buttons, 2 - 5, 3 - 7, etc
        'switchManually' : false,                                   // Switch pages manually
        'animateSwitch' : false,
        'animateDuration' : 'cm._config.animDuration',
        'animatePrevious' : false,                                  // Animating of hiding previous page, require animateSwitch
        'pageTag' : 'div',
        'pageAttributes' : {
            'class' : 'com__pagination__page'
        },
        'responseCountKey' : 'count',                               // Take items count from response
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseCodeKey' : 'code',
        'responseErrorsKey': 'errors',
        'responseMessageKey' : 'message',
        'responseHTML' : false,                                     // If true, html will append automatically
        'cache' : true,                                             // Cache response data
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %page%, %offset%, %token%, %perPage%, %limit%, %callback% for JSONP.
            'params' : ''                                           // Params object. Variables: %baseUrl%, %page%, %offset%, %token%, %perPage%, %limit%, %callback% for JSONP.
        },
        'overlayConstructor' : 'Com.Overlay',
        'overlayParams' : {
            'lazy' : true,
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        }
    },
    'strings' : {
        'prev' : 'Previous',
        'next' : 'Next',
        'server_error' : 'An unexpected error has occurred. Please try again later.'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.Pagination', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        // variables
        that.nodes = {
            'container' : cm.node('div'),
            'content' : cm.node('div'),
            'pages' : cm.node('div'),
            'bar' : []
        };

        that.components = {};
        that.animations = {};
        that.pages = {};
        that.ajaxHandler = null;
        that.currentAction = null;

        that.isAjax = false;
        that.isProcess = false;
        that.isRendering = false;

        that.page = null;
        that.pageToken = null;
        that.currentPage = null;
        that.previousPage = null;
        that.pageCount = 0;
        // Bind context
        that.nextHanlder = that.next.bind(that);
        that.prevHanlder = that.prev.bind(that);
        // Call parent method - renderViewModel
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onConstructEnd = function(){
        var that = this;
        that.params['autoSend'] && that.set(that.params['startPage']);
    };

    classProto.getLESSVariables = function(){
        var that = this;
        that.params['animateDuration'] = cm.getTransitionDurationFromLESS('ComPagination-Duration', that.params['animateDuration']);
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        // If URL parameter exists, use ajax data
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }else{
            if(!cm.isEmpty(that.params['data'])){
                that.params['count'] = that.params['data'].length;
            }
            that.params['showLoader'] = false;
        }
        if(that.params['pageCount'] === 0 && that.params['count'] && that.params['perPage']){
            that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
        }else{
            that.pageCount = that.params['pageCount'];
        }
        // Set start page token
        that.setToken(that.params['startPage'], that.params['startPageToken']);
        that.triggerEvent('onValidateParamsEnd');
    };

    classProto.renderView = function(){
        var that = this;
        // Render Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__pagination'},
            that.nodes['content'] = cm.node('div', {'class' : 'com__pagination__content'},
                that.nodes['pages'] = cm.node('div', {'class' : 'com__pagination__pages'})
            )
        );
        // Bars
        if(/top|both/.test(that.params['barPosition'])){
            that.nodes['bar'].push(
                that.callbacks.renderBar(that, {
                    'align' : that.params['barAlign'],
                    'position' : 'top'
                })
            );
        }
        if(/bottom|both/.test(that.params['barPosition'])){
            that.nodes['bar'].push(
                that.callbacks.renderBar(that, {
                    'align' : that.params['barAlign'],
                    'position' : 'bottom'
                })
            );
        }
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Reset styles and variables
        that.resetStyles();
        // Overlay
        cm.getConstructor(that.params['overlayConstructor'], function(classConstructor){
            that.components['loader'] = new classConstructor(
                cm.merge(that.params['overlayParams'], {
                    'container' : that.nodes['content']
                })
            );
        });
        // Animated
        if(that.params['animateSwitch']){
            cm.addClass(that.nodes['container'], 'is-animated');
        }
        that.animations['content'] = new cm.Animation(that.nodes['content']);
    };

    classProto.resetStyles = function(){
        var that = this;
        // Clear render pages
        cm.clearNode(that.nodes['pages']);
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

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
                'onError' : function(response){
                    that.callbacks.error(that, config, response);
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
            errorsItem = cm.reducePath(that.params['responseErrorsKey'], response),
            dataItem = cm.reducePath(that.params['responseKey'], response),
            countItem = cm.reducePath(that.params['responseCountKey'], response);
        if(cm.isEmpty(errorsItem)){
            if(!cm.isEmpty(dataItem)){
                data = dataItem;
            }
            if(!cm.isEmpty(countItem)){
                that.setCount(countItem);
            }
        }
        return data;
    };

    classProto.callbacks.response = function(that, config, response, errors, message, code){
        // Set next page
        that.setPage();
        // Response
        if(response){
            response = that.callbacks.filter(that, config, response);
        }
        that.callbacks.render(that, response, errors, message, code);
    };

    classProto.callbacks.error = function(that, config, response){
        var code,
            errors,
            message;
        if(!cm.isEmpty(response)){
            code = cm.reducePath(that.params.responseCodeKey, response);
            errors = cm.reducePath(that.params.responseErrorsKey, response);
            message = cm.reducePath(that.params.responseMessageKey, response);
        }
        that.triggerEvent('onError', {
            'response' : response,
            'code' : code,
            'errors' : errors,
            'message' : message
        });
        that.callbacks.response(that, config, null, errors, message, code);
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
            }else if(that.params['perPage'] > 0){
                length = data.length;
                start = (that.page - 1) * that.params['perPage'];
                end = (that.page * that.params['perPage']);
                if(start < length){
                    pageData = data.slice(start , Math.min(end, length));
                    that.callbacks.render(that, pageData);
                }
            }
        }else{
            that.callbacks.render(that, data);
        }
        that.callbacks.end(that);
    };

    classProto.callbacks.cached = function(that, data){
        that.callbacks.start(that);
        that.setPage();
        that.callbacks.render(that, data);
        that.callbacks.end(that);
    };

    /* *** RENDER PAGE *** */

    classProto.callbacks.renderContainer = function(that, page){
        return cm.node(that.params['pageTag'], that.params['pageAttributes']);
    };

    classProto.callbacks.render = function(that, data, errors, message, code){
        that.isRendering = true;
        var page = {
            'page' : that.page,
            'token' : that.pageToken,
            'pages' : that.nodes['pages'],
            'container' : cm.node(that.params['pageTag']),
            'data' : data,
            'code' : code,
            'errors' : errors,
            'message' : message,
            'total' : that.getCount(),
            'isVisible' : true,
            'isRendered' : true,
            'isError' : !data
        };
        if(cm.isEmpty(page['message'])){
            page['message'] = page['errors'];
        }
        // Render page
        page['container'] = that.callbacks.renderContainer(that, page);
        that.pages[that.page] = page;
        that.triggerEvent('onPageRender', page);
        if(page['data']){
            that.callbacks.renderPage(that, page);
        }else{
            that.callbacks.renderError(that, page);
        }
        // Embed
        cm.appendChild(page['container'], that.nodes['pages']);
        cm.addClass(page['container'], 'is-visible', true);
        that.triggerEvent('onPageRenderEnd', page);
        // Switch
        if(!that.params['switchManually']){
            that.callbacks.switchPage(that, page);
        }
    };

    classProto.callbacks.renderPage = function(that, page){
        var nodes;
        if(that.params['responseHTML']){
            nodes = cm.strToHTML(page['data']);
            cm.appendNodes(nodes, page['container']);
        }
    };

    classProto.callbacks.renderError = function(that, page){
        if(that.params['responseHTML']){
            page['container'].appendChild(
                cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'))
            );
        }
        that.triggerEvent('onPageRenderError', page);
    };

    classProto.callbacks.switchPage = function(that, page){
        var contentRect = cm.getRect(that.nodes['content']),
            pageRect = cm.getRect(page['container']);
        // Hide previous page
        if(that.previousPage){
            that.callbacks.hidePage(that, that.pages[that.previousPage]);
        }
        // Show new page
        if(that.params['animateSwitch']){
            that.nodes['content'].style.overflow = 'hidden';
            that.nodes['content'].style.height = [contentRect['height'], 'px'].join('');
            that.animations['content'].go({'style' : {'height' : [pageRect['height'], 'px'].join('')}, 'duration' : that.params['animateDuration'], 'anim' : 'smooth', 'onStop' : function(){
                that.nodes['content'].style.overflow = 'visible';
                that.nodes['content'].style.height = 'auto';
                that.isRendering = false;
                that.triggerEvent('onPageSwitched', page);
            }});
        }else{
            that.isRendering = false;
            that.triggerEvent('onPageSwitched', page);
        }
    };

    classProto.callbacks.hidePage = function(that, page){
        page['isVisible'] = false;
        if(that.params['animateSwitch']){
            if(that.params['animatePrevious']){
                cm.removeClass(page['container'], 'is-visible');
                setTimeout(function(){
                    cm.remove(page['container']);
                }, that.params['animateDuration']);
            }else{
                setTimeout(function(){
                    cm.remove(page['container']);
                    cm.removeClass(page['container'], 'is-visible');
                }, that.params['animateDuration']);
            }
        }else{
            cm.remove(page['container']);
            cm.removeClass(page['container'], 'is-visible');
        }
    };

    /* *** RENDER BAR *** */

    classProto.callbacks.renderBar = function(that, params){
        params = cm.merge({
            'align' : 'left',
            'position' : 'bottom'
        }, params);
        var item = {};
        // Structure
        item['container'] = cm.node('div', {'class' : 'com__pagination__bar'},
            item['items'] = cm.node('ul')
        );
        cm.addClass(item['container'], ['pull', params['align']].join('-'));
        // Embed
        switch(params['position']){
            case 'top':
                cm.insertFirst(item['container'], that.nodes['container']);
                break;
            case 'bottom':
                cm.insertLast(item['container'], that.nodes['container']);
                break;
        }
        return item;
    };

    classProto.callbacks.rebuildBars = function(that){
        cm.forEach(that.nodes['bar'], function(item){
            that.callbacks.rebuildBar(that, item);
        });
    };

    classProto.callbacks.rebuildBar = function(that, item){
        // Clear items
        cm.clearNode(item['items']);
        // Show / Hide
        if(that.pageCount < 2){
            cm.addClass(item['container'], 'is-hidden');
        }else{
            cm.removeClass(item['container'], 'is-hidden');
            // Render items
            that.callbacks.renderBarItems(that, item);
        }
    };

    classProto.callbacks.renderBarItems = function(that, item){
        var dots = false;
        // Previous page buttons
        that.callbacks.renderBarArrow(that, item, {
            'text' : '<',
            'title' : that.lang('prev'),
            'className' : 'prev',
            'callback' : that.prevHanlder
        });
        // Page buttons
        cm.forEach(that.pageCount, function(page){
            ++page;
            if(page === that.page){
                that.callbacks.renderBarItem(that, item, {
                    'page' : page,
                    'isActive' : true
                });
                dots = true;
            }else{
                if(
                    page <= that.params['barCountLR'] ||
                    (that.currentPage && page >= that.page - that.params['barCountM'] && page <= that.page + that.params['barCountM']) ||
                    page > that.pageCount - that.params['barCountLR']
                ){
                    dots = true;
                    that.callbacks.renderBarItem(that, item, {
                        'page' : page,
                        'isActive' : false
                    });
                }else if(dots){
                    dots = false;
                    that.callbacks.renderBarPoints(that, item, {});
                }

            }
        });
        // Next page buttons
        that.callbacks.renderBarArrow(that, item, {
            'text' : '>',
            'title' : that.lang('next'),
            'className' : 'next',
            'callback' : that.nextHanlder
        });
    };

    classProto.callbacks.renderBarArrow = function(that, item, params){
        params = cm.merge({
            'text' : '',
            'title' : '',
            'className' : '',
            'callback' : function(){}
        }, params);
        // Structure
        params['container'] = cm.node('li', {'class' : params['className']},
            params['link'] = cm.node('a', {'title' : params['title']}, params['text'])
        );
        // Events
        cm.addEvent(params['link'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            params['callback']();
        });
        // Append
        item['items'].appendChild(params['container']);
    };

    classProto.callbacks.renderBarPoints = function(that, item, params){
        params = cm.merge({
            'text' : '...',
            'className' : 'points'
        }, params);
        // Structure
        params['container'] = cm.node('li', {'class' : params['className']}, params['text']);
        // Append
        item['items'].appendChild(params['container']);
    };

    classProto.callbacks.renderBarItem = function(that, item, params){
        params = cm.merge({
            'page' : null,
            'isActive' : false
        }, params);
        // Structure
        params['container'] = cm.node('li',
            params['link'] = cm.node('a', params['page'])
        );
        // Active Class
        if(params['isActive']){
            cm.addClass(params['container'], 'active');
        }
        // Events
        cm.addEvent(params['link'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            that.set(params['page']);
        });
        // Append
        item['items'].appendChild(params['container']);
    };

    /* *** HELPERS *** */

    classProto.callbacks.start = function(that){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.components['loader'] && that.components['loader'].open();
        }
        cm.addClass(that.nodes['container'], 'is-loading');
        that.triggerEvent('onStart');
    };

    classProto.callbacks.end = function(that){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.components['loader'] && that.components['loader'].close();
        }
        cm.removeClass(that.nodes['container'], 'is-loading');
        that.triggerEvent('onEnd');
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
        that.pageCount = 0;
        // Set new parameters
        if(!cm.isEmpty(params)){
            that.setParams(params);
        }
        that.validateParams();
        // Reset styles and variables
        that.resetStyles();
        that.triggerEvent('onRebuild');
        // Render
        that.set(that.params['startPage']);
        return that;
    };

    classProto.set = function(page){
        var that = this,
            config;
        if(that.isProcess){
            that.abort();
        }
        if((!that.pageCount || page <= that.pageCount) && !that.isProcess && !that.isRendering){
            // Preset next page and page token
            that.page = page;
            that.pageToken = that.pages[that.page]? that.pages[that.page]['token'] : '';
            // Render bars
            that.callbacks.rebuildBars(that);
            // Request
            if(!that.currentPage || page !== that.currentPage){
                if(that.params['cache'] && that.pages[that.page] && that.pages[that.page]['isRendered']){
                    that.callbacks.cached(that, that.pages[that.page]['data']);
                }else if(that.isAjax){
                    config = cm.clone(that.params['ajax']);
                    that.ajaxHandler = that.callbacks.request(that, config);
                }else{
                    that.callbacks.data(that, that.params['data']);
                }
            }
        }
        return that;
    };

    classProto.next = function(){
        var that = this;
        that.set(that.pageCount === that.currentPage ? 1 : that.currentPage + 1);
        return that;
    };

    classProto.prev = function(){
        var that = this;
        that.set(that.currentPage - 1 || that.pageCount);
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
            that.callbacks.rebuildBars(that);
            that.triggerEvent('onSetCount', count);
        }
        return that;
    };

    classProto.getCount = function(){
        var that = this;
        return that.params['count'];
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
        that.currentPage = that.page;
        return that;
    };

    classProto.abort = function(){
        var that = this;
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    classProto.isOwnNode = classProto.isParent = function(node, flag){
        var that = this;
        return cm.isParent(that.nodes['container'], node, flag);
    };
});
