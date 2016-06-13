cm.define('Com.Pagination', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onStart',
        'onAbort',
        'onError',
        'onPageRender',
        'onPageRenderEnd',
        'onPageSwitched',
        'onEnd',
        'onSetCount'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : null,
        'name' : '',
        'renderStructure' : false,                                  // Render wrapper nodes if not exists in html
        'embedStructure' : 'append',
        'scrollNode' : window,
        'data' : [],                                                // Static data
        'count' : 0,
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'startPageToken' : '',
        'pageCount' : 0,
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
        'responseHTML' : false,                                     // If true, html will append automatically
        'cache' : true,                                             // Cache response data
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseurl%, %page%, %offset%, %token%, %perPage%, %limit%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseurl%, %page%, %offset%, %token%, %perPage%, %limit%, %callback% for JSONP.
        },
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        },
        'langs' : {
            'prev' : 'Previous',
            'next' : 'Next',
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.Node('div'),
        'content' : cm.Node('div'),
        'pages' : cm.Node('div'),
        'bar' : []
    };

    that.components = {};
    that.animations = {};
    that.pages = {};
    that.ajaxHandler = null;
    that.loaderDelay = null;

    that.isAjax = false;
    that.isProcess = false;
    that.isRendering = false;

    that.page = null;
    that.pageToken = null;
    that.currentPage = null;
    that.previousPage = null;
    that.pageCount = 0;

    var init = function(){
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        set(that.params['startPage']);
    };

    var getLESSVariables = function(){
        that.params['animateDuration'] = cm.getTransitionDurationFromLESS('ComPagination-Duration', that.params['animateDuration']);
    };

    var validateParams = function(){
        // If URL parameter exists, use ajax data
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }else{
            if(!cm.isEmpty(that.params['data'])){
                that.params['count'] = that.params['data'].length;
            }
            that.params['showLoader'] = false;
        }
        if(that.params['pageCount'] == 0 && that.params['count'] && that.params['perPage']){
            that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
        }else{
            that.pageCount = that.params['pageCount'];
        }
        // Set start page token
        that.setToken(that.params['startPage'], that.params['startPageToken']);
        // Loader
        that.params['Com.Overlay']['container'] = that.nodes['content'];
    };

    var render = function(){
        // Render Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.Node('div', {'class' : 'com__pagination'},
                that.nodes['content'] = cm.Node('div', {'class' : 'com__pagination__content'},
                    that.nodes['pages'] = cm.Node('div', {'class' : 'com__pagination__pages'})
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
            // Append
            that.embedStructure(that.nodes['container']);
        }
        // Reset styles and variables
        reset();
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor){
            that.components['loader'] = new classConstructor(that.params['Com.Overlay']);
        });
        // Animated
        if(that.params['animateSwitch']){
            cm.addClass(that.nodes['container'], 'is-animated');
        }
        that.animations['content'] = new cm.Animation(that.nodes['content']);
    };

    var reset = function(){
        // Clear render pages
        cm.clearNode(that.nodes['pages']);
    };

    var set = function(page){
        var config;
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
            if(!that.currentPage || page != that.currentPage){
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
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        config = that.callbacks.beforePrepare(that, config);
        config['url'] = cm.strReplace(config['url'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseurl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%perPage%' : that.params['perPage'],
            '%limit%' : that.params['perPage'],
            '%page%' : that.page,
            '%offset%' : (that.page - 1) * that.params['perPage'],
            '%token%' : that.pageToken,
            '%baseurl%' : cm._baseUrl
        });
        config = that.callbacks.afterPrepare(that, config);
        return config;
    };

    that.callbacks.beforePrepare = function(that, config){
        return config;
    };

    that.callbacks.afterPrepare = function(that, config){
        return config;
    };

    that.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
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

    that.callbacks.filter = function(that, config, response){
        var data = [],
            dataItem = cm.objectSelector(that.params['responseKey'], response),
            countItem = cm.objectSelector(that.params['responseCountKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        if(countItem){
            that.setCount(countItem);
        }
        return data;
    };

    that.callbacks.response = function(that, config, response){
        that.setPage();
        // Response
        if(response){
            response = that.callbacks.filter(that, config, response);
        }
        that.callbacks.render(that, response);
    };

    that.callbacks.error = function(that, config){
        that.triggerEvent('onError');
        that.callbacks.response(that, config);
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** STATIC *** */

    that.callbacks.data = function(that, data){
        var length, start, end, pageData;
        that.callbacks.start(that);
        that.setPage();
        if(!cm.isEmpty(data)){
            // Get page data and render
            if(that.params['perPage'] == 0){
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

    that.callbacks.cached = function(that, data){
        that.callbacks.start(that);
        that.setPage();
        that.callbacks.render(that, data);
        that.callbacks.end(that);
    };

    /* *** RENDER PAGE *** */

    that.callbacks.renderContainer = function(that, page){
        return cm.node(that.params['pageTag'], that.params['pageAttributes']);
    };

    that.callbacks.render = function(that, data){
        that.isRendering = true;
        var page = {
            'page' : that.page,
            'token' : that.pageToken,
            'pages' : that.nodes['pages'],
            'container' : cm.node(that.params['pageTag']),
            'data' : data,
            'isVisible' : true,
            'isRendered' : true,
            'isError' : !data
        };
        page['container'] = that.callbacks.renderContainer(that, page);
        that.pages[that.page] = page;
        // Render
        that.triggerEvent('onPageRender', page);
        if(page['data']){
            that.callbacks.renderPage(that, page);
        }else{
            that.callbacks.renderError(that, page);
        }
        // Embed
        that.nodes['pages'].appendChild(page['container']);
        cm.addClass(page['container'], 'is-visible', true);
        that.triggerEvent('onPageRenderEnd', page);
        // Switch
        if(!that.params['switchManually']){
            that.callbacks.switchPage(that, page);
        }
    };

    that.callbacks.renderPage = function(that, page){
        var nodes;
        if(that.params['responseHTML']){
            nodes = cm.strToHTML(page['data']);
            if(!cm.isEmpty(nodes)){
                if(cm.isNode(nodes)){
                    page['container'].appendChild(nodes);
                }else{
                    while(nodes.length){
                        if(cm.isNode(nodes[0])){
                            page['container'].appendChild(nodes[0]);
                        }else{
                            cm.remove(nodes[0]);
                        }
                    }
                }
            }
        }
    };

    that.callbacks.renderError = function(that, page){
        if(that.params['responseHTML']){
            page['container'].appendChild(
                cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'))
            );
        }
    };

    that.callbacks.switchPage = function(that, page){
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

    that.callbacks.hidePage = function(that, page){
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

    that.callbacks.renderBar = function(that, params){
        params = cm.merge({
            'align' : 'left',
            'position' : 'bottom'
        }, params);
        var item = {};
        // Structure
        item['container'] = cm.Node('div', {'class' : 'com__pagination__bar'},
            item['items'] = cm.Node('ul')
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

    that.callbacks.rebuildBars = function(that){
        cm.forEach(that.nodes['bar'], function(item){
            that.callbacks.rebuildBar(that, item);
        });
    };

    that.callbacks.rebuildBar = function(that, item){
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

    that.callbacks.renderBarItems = function(that, item){
        var dots = false;
        // Previous page buttons
        that.callbacks.renderBarArrow(that, item, {
            'text' : '<',
            'title' : that.lang('prev'),
            'className' : 'prev',
            'callback' : that.prev
        });
        // Page buttons
        cm.forEach(that.pageCount, function(page){
            ++page;
            if(page == that.page){
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
            'callback' : that.next
        });
    };

    that.callbacks.renderBarArrow = function(that, item, params){
        params = cm.merge({
            'text' : '',
            'title' : '',
            'className' : '',
            'callback' : function(){}
        }, params);
        // Structure
        params['container'] = cm.Node('li', {'class' : params['className']},
            params['link'] = cm.Node('a', {'title' : params['title']}, params['text'])
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

    that.callbacks.renderBarPoints = function(that, item, params){
        params = cm.merge({
            'text' : '...',
            'className' : 'points'
        }, params);
        // Structure
        params['container'] = cm.Node('li', {'class' : params['className']}, params['text']);
        // Append
        item['items'].appendChild(params['container']);
    };

    that.callbacks.renderBarItem = function(that, item, params){
        params = cm.merge({
            'page' : null,
            'isActive' : false
        }, params);
        // Structure
        params['container'] = cm.Node('li',
            params['link'] = cm.Node('a', params['page'])
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

    that.callbacks.start = function(that){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.loaderDelay = setTimeout(function(){
                if(that.components['loader'] && !that.components['loader'].isOpen){
                    that.components['loader'].open();
                }
            }, that.params['loaderDelay']);
        }
        that.triggerEvent('onStart');
    };

    that.callbacks.end = function(that){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.loaderDelay && clearTimeout(that.loaderDelay);
            if(that.components['loader'] && that.components['loader'].isOpen){
                that.components['loader'].close();
            }
        }
        that.triggerEvent('onEnd');
    };

    /* ******* PUBLIC ******* */

    that.set = function(page){
        set(page);
        return that;
    };

    that.next = function(){
        set(that.pageCount == that.currentPage ? 1 : that.currentPage + 1);
        return that;
    };

    that.prev = function(){
        set(that.currentPage - 1 || that.pageCount);
        return that;
    };

    that.rebuild = function(params){
        // Cleanup
        if(that.isProcess){
            that.abort();
        }
        that.pages = {};
        that.currentPage = null;
        that.previousPage = null;
        // Reset styles and variables
        reset();
        // Set new parameters
        that.setParams(params);
        validateParams();
        // Render
        set(that.params['startPage']);
    };

    that.setToken = function(page, token){
        if(!that.pages[page]){
            that.pages[page] = {};
        }
        that.pages[page]['token'] = token;
        return that;
    };

    that.setCount = function(count){
        if(count && (count = parseInt(count.toString())) && count != that.params['count']){
            that.params['count'] = count;
            if(that.params['pageCount'] == 0 && that.params['count'] && that.params['perPage']){
                that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
            }else{
                that.pageCount = that.params['pageCount'];
            }
            that.callbacks.rebuildBars(that);
            that.triggerEvent('onSetCount', count);
        }
        return that;
    };

    that.setPage = function(){
        that.previousPage = that.currentPage;
        that.currentPage = that.page;
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.isOwnNode = that.isParent = function(node, flag){
        return cm.isParent(that.nodes['container'], node, flag);
    };

    init();
});