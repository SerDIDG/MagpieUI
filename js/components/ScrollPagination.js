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
        'onEnd',
        'onFinalize'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'scrollNode' : 'document.html',
        'scrollIndent' : '%blockHeight% / 2',               // Variables: %blockHeight%.
        'data' : [],                                        // Static data
        'perPage' : 0,                                      // 0 - all
        'startPage' : 1,                                    // Start page token
        'showButton' : true,                                // true - always | once - show once after first loaded page
        'showLoader' : true,
        'loaderDelay' : 100,                                // in ms
        'stopOnESC' : true,
        'pageTag' : 'li',
        'pageContainer' : true,                             //
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                     // Request URL. Variables: %page%, %perPage%, %callback% for JSONP.
            'params' : ''                                   // Params object. %page%, %perPage%, %callback% for JSONP.
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
        if(that.isAjax = !cm.isEmpty(that.params['ajax']['url'])){
            //that.data = [];
        }else{
            //that.data = that.params['data'];
            that.params['showButton'] = false;
        }
        // Set next page token
        that.nextPage = that.params['startPage'];
    };

    var render = function(){
        // Load More Button
        if(!that.params['showButton']){
            that.isButton = false;
            cm.addClass(that.nodes['button'], 'is-hidden');
            cm.addClass(that.nodes['buttonContainer'], 'is-hidden');
        }else{
            that.isButton = true;
            cm.removeClass(that.nodes['button'], 'is-hidden');
            cm.removeClass(that.nodes['buttonContainer'], 'is-hidden');
        }
        cm.addEvent(that.nodes['button'], 'click', set);
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
            // Get next page and token
            that.page = that.nextPage;
            that.pageToken = that.pages[that.page]? that.pages[that.page]['token'] : that.page;
            // Request
            if(that.isAjax){
                request(cm.clone(that.params['ajax']));
            }else{
                //that.callbacks.data(that, that.params['data']);
                that.callbacks.render(that, that.params['data']);
            }
        }
    };

    var scrollHandler = function(){
        var blockHeight, scrollTop, scrollIndent, containerYBottom;
        if((!that.params['showButton'] || that.params['showButton'] == 'once' && that.params['startPage'] != that.currentPage) && !cm.isProcess && !that.isFinalize && !that.isButton){
            blockHeight = that.params['scrollNode'].clientHeight;
            scrollTop = cm.getScrollTop(that.params['scrollNode']);
            scrollIndent = eval(cm.strReplace(that.params['scrollIndent'], {'%blockHeight%' : blockHeight}));
            containerYBottom = cm.getRealY(that.nodes['pagesContainer']) + that.nodes['pagesContainer'].offsetHeight - cm.getRealY(that.params['scrollNode']) - scrollTop - blockHeight;
            if(containerYBottom <= scrollIndent){
                set();
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

    var ESCHandler = function(e){
        e = cm.getEvent(e);

        if(e.keyCode == 27){
            if(!cm.isProcess && !cm.isFinalize){
                that.isButton = true;
                cm.removeClass(that.nodes['button'], 'is-hidden');
                cm.removeClass(that.nodes['buttonContainer'], 'is-hidden');
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
        return response;
    };

    that.callbacks.response = function(that, config, response){
        // Set next page
        that.previousPage = that.currentPage;
        that.currentPage = that.nextPage;
        that.nextPage++;
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

    /* *** RENDER *** */

    that.callbacks.renderContainer = function(that, page){
        return cm.Node(that.params['pageTag']);
    };

    that.callbacks.render = function(that, data){
        var scrollTop = cm.getScrollTop(that.params['scrollNode']),
            page = {
                'page' : that.page,
                'token' : that.pageToken,
                'pagesContainer' : that.nodes['pagesContainer'],
                'container' : cm.Node(that.params['pageTag']),
                'data' : data
            };
        if(that.params['pageContainer']){
            page['container'] = that.callbacks.renderContainer(that, page);
        }
        that.pages[that.page] = page;
        that.triggerEvent('onPageRender', page);
        that.callbacks.renderPage(that, page);
        if(page['container']){
            that.nodes['pagesContainer'].appendChild(page['container']);
        }
        cm.setScrollTop(that.params['scrollNode'], scrollTop);
        that.triggerEvent('onPageRenderEnd', page);
    };

    that.callbacks.renderPage = function(that, page){

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
        // Show / Hide Load More Button
        if(!that.isFinalize && (that.params['showButton'] === true || that.params['showButton'] == 'once' && that.params['startPage'] == that.page)){
            that.isButton = true;
            cm.removeClass(that.nodes['button'], 'is-hidden');
            cm.removeClass(that.nodes['buttonContainer'], 'is-hidden');
        }else{
            that.isButton = false;
            cm.addClass(that.nodes['button'], 'is-hidden');
            cm.addClass(that.nodes['buttonContainer'], 'is-hidden');
        }
        that.triggerEvent('onEnd');
    };

    that.callbacks.finalize = function(that){
        that.isFinalize = true;
        that.isButton = false;
        cm.addClass(that.nodes['button'], 'is-hidden');
        cm.addClass(that.nodes['buttonContainer'], 'is-hidden');
        that.triggerEvent('onFinalize');
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