cm.define('Com.Pagination', {
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
        'onEnd'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'renderStructure' : false,                                  // Render wrapper nodes if not exists in html
        'container' : false,
        'data' : [],                                                // Static data
        'count' : 0,
        'perPage' : 0,                                              // 0 - render all data in one page
        'startPage' : 1,                                            // Start page
        'startPageToken' : '',
        'pageCount' : 0,
        'showLoader' : true,
        'loaderDelay' : 100,                                        // in ms
        'barCountLR' : 3,
        'barCountM' : 1,                                            // must be 1, for drawing 3 center pagination buttons, 2 - 5, 3 - 7, etc
        'pageTag' : 'div',
        'pageAttributes' : {
            'class' : 'com__pagination__page'
        },
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : false,                                     // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %page%, %token%, %perPage%, %callback% for JSONP.
            'params' : ''                                           // Params object. %page%, %token%, %perPage%, %callback% for JSONP.
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.Node('div'),
        'content' : cm.Node('div'),
        'pages' : cm.Node('div'),
        'loader' : cm.Node('div'),
        'bar' : []
    };

    that.components = {};
    that.pages = {};
    that.ajaxHandler = null;
    that.loaderDelay = null;

    that.isAjax = false;
    that.isProcess = false;

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
        // If URL parameter exists, use ajax data
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }else{
            if(!cm.isEmpty(that.params['data'])){
                that.params['count'] = that.params['data'].length;
            }
            that.params['showLoader'] = false;
        }
        if(that.params['pageCount'] == 0){
            that.params['pageCount'] = Math.ceil(that.params['count'] / that.params['perPage']);
        }
        // Set start page token
        that.setToken(that.params['startPage'], that.params['startPageToken']);
        // Set next page token
        that.nextPage = that.params['startPage'];
    };

    var render = function(){
        // Render Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.Node('div', {'class' : 'com__pagination'},
                that.nodes['pages'] = cm.Node('div', {'class' : 'com__pagination__pages'})
            );
            if(that.params['container']){
                that.params['container'].appendChild(that.nodes['container']);
            }
        }
        // Render bars
        cm.forEach(that.nodes['bar'], function(item){
            that.callbacks.renderBar(that, item);
        });
        // Hide Loader
        cm.addClass(that.nodes['loader'], 'is-hidden');
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

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%perPage%' : that.params['perPage'],
            '%page%' : that.page,
            '%token%' : that.pageToken
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%perPage%' : that.params['perPage'],
            '%page%' : that.page,
            '%token%' : that.pageToken
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

    /* *** RENDER *** */

    that.callbacks.renderContainer = function(that, page){
        return cm.Node(that.params['pageTag'], that.params['pageAttributes']);
    };

    that.callbacks.render = function(that, data){
        var page = {
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
        that.triggerEvent('onPageRenderEnd', page);
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

    /* *** RENDER BAR *** */

    that.callbacks.renderBar = function(that, item, params){
        item = cm.merge({
            'container' : cm.Node('div', {'class' : 'com__pagination__bar'}),
            'list' : cm.Node('ul')
        }, item);
        params = cm.merge({
            'align' : 'left'
        }, params);
        // Clear items
        cm.clearNode(item['list']);
        // Show / Hide
        if(that.params['pageCount'] < 2){
            cm.addClass(item['container'], 'is-hidden');
        }else{
            cm.removeClass(item['container'], 'is-hidden');
            // Render items
            that.callbacks.renderBarItems(that, item);
        }
        // Embed
        if(!cm.inDOM(item['container'])){
            cm.addClass(item['container'], ['pull', params['align']].join('-'));
            that.nodes['container'].appendChild(item['container']);
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
        cm.forEach(that.params['pageCount'], function(page){
            ++page;
            if(page == that.currentPage){
                that.callbacks.renderBarItem(that, item, {
                    'page' : page,
                    'isActive' : true
                });
                dots = true;
            }else{
                if(
                    page <= that.params['barCountLR'] ||
                    (that.currentPage && page >= that.currentPage - that.params['barCountM'] && page <= that.currentPage + that.params['barCountM']) ||
                    page > that.params['pageCount'] - that.params['barCountLR']
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
            'title' : that.lang('prev'),
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
        // Show Loader
        if(that.params['showLoader']){
            cm.removeClass(that.nodes['loader'], 'is-hidden');
        }
        that.triggerEvent('onStart');
    };

    that.callbacks.end = function(that){
        that.isProcess = false;
        // Hide Loader
        that.loaderDelay && clearTimeout(that.loaderDelay);
        cm.addClass(that.nodes['loader'], 'is-hidden');
        that.triggerEvent('onEnd');
    };

    /* ******* PUBLIC ******* */

    that.set = function(page){
        set(page || that.nextPage);
        return that;
    };

    that.next = function(){
        set(that.params['pageCount'] == that.currentPage ? 1 : that.currentPage + 1);
        return that;
    };

    that.prev = function(){
        set(that.currentPage - 1 || that.params['pageCount']);
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
        that.pageToken = that.pages[that.page]? that.pages[that.page]['token'] : '';
        return that;
    };

    that.setPage = function(){
        that.previousPage = that.currentPage;
        that.currentPage = that.nextPage;
        that.nextPage++;
        return that;
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