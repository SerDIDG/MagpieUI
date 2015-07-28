cm.define('Com.ScrollPagination', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
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
        'onPageShow',
        'onPageHide',
        'onEnd',
        'onFinalize'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'scrollNode' : window,
        'scrollIndent' : 'Math.min(%scrollHeight% / 2, 600)',       // Variables: %blockHeight%.
        'data' : [],                                                // Static data
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'endPage' : 0,                                              // Last page. Render only count of pages. 0 - infinity
        'showButton' : true,                                        // true - always | once - show once after first loaded page
        'showLoader' : true,
        'loaderDelay' : 100,                                        // in ms
        'stopOnESC' : true,
        'pageTag' : 'ul',
        'pageAttributes' : {
            'class' : 'com__scroll-pagination__page'
        },
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : false,                                     // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %page%, %perPage%, %callback% for JSONP.
            'params' : ''                                           // Params object. %page%, %perPage%, %callback% for JSONP.
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.Node('div'),
        'scrollNode' : null,
        'buttonContainer' : cm.Node('div'),
        'pagesContainer' : cm.Node('ul'),
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
        if(that.nodes['scrollNode']){
            that.params['scrollNode'] = that.nodes['scrollNode'];
        }
        // If URL parameter exists, use ajax data
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }else{
            that.params['showLoader'] = false;
        }
        // Set next page token
        that.nextPage = that.params['startPage'];
    };

    var render = function(){
        // Load More Button
        if(!that.params['showButton']){
            that.callbacks.hideButton(that);
        }else{
            that.callbacks.showButton(that);
        }
        cm.addEvent(that.nodes['button'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            set();
        });
        // Hide Loader
        cm.addClass(that.nodes['loader'], 'is-hidden');
        // ESC event
        if(that.params['stopOnESC']){
            cm.addEvent(window, 'keydown', ESCHandler);
        }
        // Scroll Event
        cm.addScrollEvent(that.params['scrollNode'], scrollHandler);
    };

    var set = function(){
        if(!that.isProcess && !that.isFinalize){
            that.isProcess = true;
            // Preset next page and page token
            that.preSetPage();
            // Request
            if(that.isAjax){
                request(cm.clone(that.params['ajax']));
            }else{
                that.callbacks.data(that, that.params['data']);
            }
        }
    };

    var scrollHandler = function(){
        var scrollRect = cm.getRect(that.params['scrollNode']),
            pagesRect = cm.getRect(that.nodes['pagesContainer']),
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

    var request = function(config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        that.ajaxHandler = cm.ajax(
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

    var ESCHandler = function(e){
        e = cm.getEvent(e);

        if(e.keyCode == 27){
            if(!cm.isProcess && !cm.isFinalize){
                that.callbacks.showButton(that);
            }
        }
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%perPage%' : that.params['perPage'],
            '%page%' : that.pageToken
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%perPage%' : that.params['perPage'],
            '%page%' : that.pageToken
        });
        return config;
    };

    that.callbacks.filter = function(that, config, response){
        var data = [],
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
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
                'pagesContainer' : that.nodes['pagesContainer'],
                'container' : cm.Node(that.params['pageTag']),
                'data' : data,
                'isVisible' : false
            };
        page['container'] = that.callbacks.renderContainer(that, page);
        that.pages[that.page] = page;
        that.triggerEvent('onPageRender', page);
        that.callbacks.renderPage(that, page);
        // Embed
        that.nodes['pagesContainer'].appendChild(page['container']);
        // Restore scroll position
        cm.setScrollTop(that.params['scrollNode'], scrollTop);
        that.triggerEvent('onPageRenderEnd', page);
        that.isPageVisible(page);
    };

    that.callbacks.renderPage = function(that, page){
        var nodes;
        if(that.params['responseHTML']){
            nodes = cm.strToHTML(page['data']);
            if(cm.isNode(nodes)){
                page['container'].appendChild(nodes);
            }else if(cm.isArray(nodes)){
                cm.forEach(nodes, function(node){
                    if(cm.isNode(node)){
                        page['container'].appendChild(node);
                    }
                });
            }
        }
    };

    /* *** HELPERS *** */

    that.callbacks.start = function(that){
        // Show Loader
        if(that.params['showLoader']){
            if(that.isButton){
                cm.addClass(that.nodes['button'], 'is-hidden');
                cm.removeClass(that.nodes['loader'], 'is-hidden');
            }else{
                that.loaderDelay = setTimeout(function(){
                    cm.removeClass(that.nodes['loader'], 'is-hidden');
                    cm.removeClass(that.nodes['buttonContainer'], 'is-hidden');
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
        if(that.params['endPage'] > 0 && that.params['endPage'] == that.currentPage){
            that.callbacks.finalize(that);
        }
        // Show / Hide Load More Button
        if(!that.isFinalize && (that.params['showButton'] === true || (that.params['showButton'] == 'once' && that.params['startPage'] == that.page))){
            that.callbacks.showButton(that);
        }else{
            that.callbacks.hideButton(that);
        }
        that.triggerEvent('onEnd');
    };

    that.callbacks.finalize = function(that){
        if(!that.isFinalize){
            that.isFinalize = true;
            that.callbacks.hideButton(that);
            that.triggerEvent('onFinalize');
        }
    };

    that.callbacks.showButton = function(that){
        that.isButton = true;
        cm.removeClass(that.nodes['button'], 'is-hidden');
        cm.removeClass(that.nodes['buttonContainer'], 'is-hidden');
    };

    that.callbacks.hideButton = function(that){
        that.isButton = false;
        cm.addClass(that.nodes['button'], 'is-hidden');
        cm.addClass(that.nodes['buttonContainer'], 'is-hidden');
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

    that.preSetPage = function(){
        that.page = that.nextPage;
        that.pageToken = that.pages[that.page]? that.pages[that.page]['token'] : that.page;
        return that;
    };

    that.setPage = function(){
        that.previousPage = that.currentPage;
        that.currentPage = that.nextPage;
        that.nextPage++;
        return that;
    };

    that.isPageVisible = function(page, scrollRect){
        if(page['container']){
            scrollRect = typeof scrollRect == 'undefined' ? cm.getRect(that.params['scrollNode']) : scrollRect;
            var pageRect = cm.getRect(page['container']);
            if(pageRect['top'] >= scrollRect['top'] && pageRect['top'] <= scrollRect['bottom'] || pageRect['top'] < scrollRect['top'] && pageRect['bottom'] >= scrollRect['top']){
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