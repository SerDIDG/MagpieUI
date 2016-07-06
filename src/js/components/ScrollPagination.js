cm.define('Com.ScrollPagination', {
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
        'onSetCount'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : null,
        'name' : '',
        'renderStructure' : false,                                  // Render wrapper nodes if not exists in html
        'embedStructure' : 'append',
        'scrollNode' : window,
        'scrollIndent' : 'Math.min(%scrollHeight% / 2, 600)',       // Variables: %blockHeight%.
        'data' : [],                                                // Static data
        'count' : 0,
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'startPageToken' : '',
        'pageCount' : 0,                                            // Render only count of pages. 0 - infinity
        'showButton' : true,                                        // true - always | once - show once after first loaded page
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'stopOnESC' : true,
        'pageTag' : 'div',
        'pageAttributes' : {
            'class' : 'com__scroll-pagination__page'
        },
        'responseCountKey' : 'count',                               // Take items count from response
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : false,                                     // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseUrl%, %page%, %offset%, %token%, %limit%, %perPage%, %callback% for JSONP.
        },
        'langs' : {
            'load_more' : 'Load More'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.Node('div'),
        'scroll' : null,
        'bar' : cm.Node('div'),
        'content' : cm.Node('div'),
        'pages' : cm.Node('div'),
        'button' : cm.Node('div'),
        'loader' : cm.Node('div')
    };

    that.components = {};
    that.pages = {};
    that.ajaxHandler = null;
    that.loaderDelay = null;

    that.isAjax = false;
    that.isProcess = false;
    that.isFinalize = false;
    that.isButton = false;

    that.page = null;
    that.pageToken = null;
    that.currentPage = null;
    that.previousPage = null;
    that.nextPage = null;
    that.pageCount = 0;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        set();
    };

    var validateParams = function(){
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
        if(that.params['pageCount'] == 0 && that.params['perPage'] && that.params['count']){
            that.pageCount = Math.ceil(that.params['count'] / that.params['perPage']);
        }else{
            that.pageCount = that.params['pageCount'];
        }
        // Set start page token
        that.setToken(that.params['startPage'], that.params['startPageToken']);
        // Set next page token
        that.nextPage = that.params['startPage'];
    };

    var render = function(){
        // Render Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.Node('div', {'class' : 'com__scroll-pagination'},
                that.nodes['content'] = cm.Node('div', {'class' : 'com__scroll-pagination__content'},
                    that.nodes['pages'] = cm.Node('div', {'class' : 'com__scroll-pagination__pages'})
                ),
                that.nodes['bar'] = cm.Node('div', {'class' : 'com__scroll-pagination__bar'},
                    that.nodes['button'] = cm.Node('div', {'class' : 'button button-primary'}, that.lang('load_more')),
                    that.nodes['loader'] = cm.Node('div', {'class' : 'button button-clear has-icon has-icon has-icon-small'},
                        cm.Node('div', {'class' : 'icon small loader'})
                    )
                )
            );
            // Append
            that.embedStructure(that.nodes['container']);
        }
        // Reset styles and variables
        reset();
        // Events
        cm.addEvent(that.nodes['button'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            set();
        });
        if(that.params['stopOnESC']){
            cm.addEvent(window, 'keydown', ESCHandler);
        }
        cm.addScrollEvent(that.params['scrollNode'], scrollHandler);
        cm.addEvent(window, 'resize', resizeHandler);
    };

    var reset = function(){
        // Clear render pages
        cm.clearNode(that.nodes['pages']);
        // Load More Button
        if(!that.params['showButton']){
            that.callbacks.hideButton(that);
        }else{
            that.callbacks.showButton(that);
        }
        // Hide Loader
        cm.addClass(that.nodes['loader'], 'is-hidden');
    };

    var set = function(){
        var config;
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
    };

    var scrollHandler = function(){
        var scrollRect = cm.getRect(that.params['scrollNode']),
            pagesRect = cm.getRect(that.nodes['pages']),
            scrollIndent;
        if((!that.params['showButton'] || (that.params['showButton'] == 'once' && that.params['startPage'] != that.currentPage)) && !cm.isProcess && !that.isFinalize && !that.isButton){
            scrollIndent = eval(cm.strReplace(that.params['scrollIndent'], {
                '%scrollHeight%' : scrollRect['bottom'] - scrollRect['top']
            }));
            if(pagesRect['bottom'] - scrollRect['bottom'] <= scrollIndent){
                set();
            }
        }
        // Show / Hide non visible pages
        cm.forEach(that.pages, function(page){
            that.isPageVisible(page, scrollRect);
        });
    };

    var ESCHandler = function(e){
        e = cm.getEvent(e);

        if(e.keyCode == 27){
            if(!cm.isProcess && !cm.isFinalize){
                that.callbacks.showButton(that);
            }
        }
    };

    var resizeHandler = function(){
        // Show / Hide non visible pages
        cm.forEach(that.pages, function(page){
            that.isPageVisible(page);
        });
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
        return data;
    };

    that.callbacks.response = function(that, config, response){
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

    that.callbacks.error = function(that, config){
        that.callbacks.finalize(that);
        that.triggerEvent('onError');
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

    that.callbacks.renderContainer = function(that, page){
        return cm.Node(that.params['pageTag'], that.params['pageAttributes']);
    };

    that.callbacks.render = function(that, data){
        var scrollTop = cm.getScrollTop(that.params['scrollNode']),
            page = {
                'page' : that.page,
                'token' : that.pageToken,
                'pages' : that.nodes['pages'],
                'container' : cm.Node(that.params['pageTag']),
                'data' : data,
                'isVisible' : false
            };
        page['container'] = that.callbacks.renderContainer(that, page);
        that.pages[that.page] = page;
        that.triggerEvent('onPageRender', page);
        that.callbacks.renderPage(that, page);
        // Embed
        that.nodes['pages'].appendChild(page['container']);
        // Restore scroll position
        cm.setScrollTop(that.params['scrollNode'], scrollTop);
        that.triggerEvent('onPageRenderEnd', page);
        that.isPageVisible(page);
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

    /* *** HELPERS *** */

    that.callbacks.start = function(that){
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

    that.callbacks.end = function(that){
        that.isProcess = false;
        // Hide Loader
        that.loaderDelay && clearTimeout(that.loaderDelay);
        cm.addClass(that.nodes['loader'], 'is-hidden');
        // Check pages count
        if(that.pageCount > 0 && that.pageCount == that.currentPage){
            that.callbacks.finalize(that);
        }
        // Show / Hide Load More Button
        that.callbacks.toggleButton(that);
        that.triggerEvent('onEnd');
    };

    that.callbacks.finalize = function(that){
        if(!that.isFinalize){
            that.isFinalize = true;
            that.callbacks.hideButton(that);
            that.triggerEvent('onFinalize');
        }
    };

    that.callbacks.toggleButton = function(that){
        if(!that.isFinalize && (that.params['showButton'] === true || (that.params['showButton'] == 'once' && that.params['startPage'] == that.page))){
            that.callbacks.showButton(that);
        }else{
            that.callbacks.hideButton(that);
        }
    };

    that.callbacks.showButton = function(that){
        that.isButton = true;
        cm.removeClass(that.nodes['button'], 'is-hidden');
        cm.removeClass(that.nodes['bar'], 'is-hidden');
    };

    that.callbacks.hideButton = function(that){
        that.isButton = false;
        cm.addClass(that.nodes['button'], 'is-hidden');
        cm.addClass(that.nodes['bar'], 'is-hidden');
    };

    /* ******* PUBLIC ******* */

    that.set = function(){
        set();
        return that;
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
            if(that.pageCount > 0 && that.pageCount == that.currentPage){
                that.callbacks.finalize(that);
            }
            that.triggerEvent('onSetCount', count);
        }
        return that;
    };

    that.setPage = function(){
        that.previousPage = that.currentPage;
        that.currentPage = that.nextPage;
        that.nextPage++;
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
        // Set new parameters
        that.setParams(params);
        validateParams();
        // Reset styles and variables
        reset();
        that.triggerEvent('onRebuild');
        // Render new pge
        set();
    };

    that.isPageVisible = function(page, scrollRect){
        if(page['container']){
            scrollRect = typeof scrollRect == 'undefined' ? cm.getRect(that.params['scrollNode']) : scrollRect;
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

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.isParent = function(node, flag){
        return cm.isParent(that.nodes['container'], node, flag);
    };

    init();
});