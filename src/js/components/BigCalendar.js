/* ******* COMPONENTS: BIG CALENDAR ******* */

cm.define('Com.BigCalendar', {
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
        'onRenderStart',
        'onRender',
        'onError',
        'onAbort',
        'onSuccess',
        'onSendStart',
        'onSendEnd',
        'onProcessEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'animateDuration' : 'cm._config.animDuration',
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : true,                                      // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseurl%, %view%, %year%, %month%, %week%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseurl%, %view%, %year%, %month%, %week%, %callback% for JSONP.
        },
        'langs' : {
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        },
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'buttons' : {
            'views' : {
                'agenda' : cm.node('div'),
                'week' : cm.node('div'),
                'month' : cm.node('div')
            }
        }
    };
    that.components = {};
    that.animations = {};

    that.ajaxHandler = null;
    that.isProcess = false;
    that.isRendering = false;
    that.loaderDelay = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['Com.Overlay']['container'] = that.nodes['container'];
    };

    var render = function(){
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor, className){
            that.components['loader'] = new classConstructor(that.params[className]);
        });
        // Animations
        that.animations['response'] = new cm.Animation(that.nodes['holder']['container']);
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        config = that.callbacks.beforePrepare(that, config);
        config['url'] = cm.strReplace(config['url'], {
            '%baseurl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
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
        var data,
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    that.callbacks.start = function(that, config){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.loaderDelay = setTimeout(function(){
                if(that.components['loader'] && !that.components['loader'].isOpen){
                    that.components['loader'].open();
                }
            }, that.params['loaderDelay']);
        }
        that.triggerEvent('onSendStart');
    };

    that.callbacks.end = function(that, config){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.loaderDelay && clearTimeout(that.loaderDelay);
            if(that.components['loader'] && that.components['loader'].isOpen){
                that.components['loader'].close();
            }
        }
        that.triggerEvent('onSendEnd');
        that.triggerEvent('onProcessEnd', that.nodes['response']['inner']);
    };

    that.callbacks.response = function(that, config, response){
        if(!cm.isEmpty(response)){
            response = that.callbacks.filter(that, config, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.success(that, response);
        }else{
            that.callbacks.error(that, config);
        }
    };

    that.callbacks.error = function(that, config){
        that.callbacks.renderError(that, config);
        that.triggerEvent('onError');
    };

    that.callbacks.success = function(that, response){
        that.callbacks.render(that, response);
        that.triggerEvent('onSuccess', response);
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** RENDER *** */

    that.callbacks.renderTemporary = function(that){
        return cm.node('div', {'class' : 'calendar__temporary'});
    };

    that.callbacks.render = function(that, data){
        var nodes, temporary;
        if(that.params['responseHTML']){
            that.isRendering = true;
            temporary = that.callbacks.renderTemporary(that);
            nodes = cm.strToHTML(data);
            if(!cm.isEmpty(nodes)){
                if(cm.isNode(nodes)){
                    temporary.appendChild(nodes);
                }else{
                    while(nodes.length){
                        if(cm.isNode(nodes[0])){
                            temporary.appendChild(nodes[0]);
                        }else{
                            cm.remove(nodes[0]);
                        }
                    }
                }
            }
            that.callbacks.append(that, temporary);
        }
    };

    that.callbacks.renderError = function(that, config){
        if(that.params['responseHTML']){
            that.isRendering = true;
            var temporary = that.callbacks.renderTemporary(that);
            temporary.appendChild(
                cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'))
            );
            that.callbacks.append(that, temporary);
        }
    };

    that.callbacks.append = function(that, temporary){
        var height;
        // Wrap old content
        if(!that.nodes['temporary']){
            that.nodes['temporary'] = that.callbacks.renderTemporary(that);
            cm.forEach(that.nodes['holder'].childNodes, function(node){
                cm.appendChild(node, that.nodes['temporary']);
            });
            cm.appendChild(that.nodes['temporary'], that.nodes['holder']);
        }
        cm.removeClass(that.nodes['temporary'], 'is-show', true);
        // Append temporary
        cm.appendChild(temporary, that.nodes['holder']);
        cm.addClass(temporary, 'is-show', true);
        // Animate
        height = temporary.offsetHeight;
        that.animations['response'].go({
            'style' : {'height' : [height, 'px'].join('')},
            'duration' : that.params['animateDuration'],
            'anim' : 'smooth',
            'onStop' : function(){
                cm.remove(that.nodes['temporary']);
                that.nodes['temporary'] = temporary;
                that.isRendering = false;
            }
        });
    };

    /* ******* PUBLIC ******* */

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    init();
});

/* *** CALENDAR EVENT *** */

cm.define('Com.CalendarEvent', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'data' : {
            'title' : null,
            'date' : null,
            'description' : null
        },
        'Com.Tooltip' : {
            'delay' : 'cm._config.hideDelayLong',
            'className' : 'com__calendar-event-tooltip',
            'minWidth' : 250
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'template' : null
    };
    that.components = {};
    that.template = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.triggerEvent('onRender');
    };

    var render = function(){
        // Render tooltip
        cm.getConstructor('Com.Tooltip', function(classConstructor, className){
            that.components['tooltip'] = new classConstructor(
                cm.merge(that.params[className],{
                    'target' : that.params['node']
                })
            );
        });
    };

    var renderContent = function(template){
        if(!cm.isEmpty(that.params['data']['title'])){
            template['title'].innerHTML = that.params['data']['title'];
        }
        if(!cm.isEmpty(that.params['data']['date'])){
            template['date'].innerHTML = that.params['data']['date'];
        }
        if(!cm.isEmpty(that.params['data']['description'])){
            template['description'].innerHTML = that.params['data']['description'];
        }else{
            cm.remove(template['description-container']);
        }
        if(!cm.isEmpty(that.params['data']['url'])){
            template['button'].setAttribute('href', that.params['data']['url']);
        }else{
            cm.remove(template['button-container']);
        }
    };

    /* ******* PUBLIC ******* */

    that.setTemplate = function(node){
        that.nodes['template'] = cm.getNodes(node);
        if(that.nodes['template']){
            renderContent(that.nodes['template']);
            that.components['tooltip'] && that.components['tooltip'].setContent(that.nodes['template']['container']);
        }
        return that;
    };

    that.setTooltipParams = function(o){
        that.params['Com.Tooltip'] = cm.merge(that.params['Com.Tooltip'], o);
        that.components['tooltip'] && that.components['tooltip'].setParams(that.params['Com.Tooltip']);
        return that;
    };

    init();
});

/* *** CALENDAR MONTH VIEW *** */

cm.define('Com.CalendarMonth', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'itemShortIndent' : 1,
        'itemShortHeight' : 24,
        'dayIndent' : 4,
        'Com.Tooltip' : {
            'width' : '(targetWidth + %dayIndent%) * 2 - targetHeight * 2',
            'top' : 'targetHeight + %itemShortIndent%',
            'left' : '-(selfWidth - targetWidth) - targetHeight'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'templates' : {}
    };
    that.days = [];

    var init = function(){
        getCSSHelpers();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.triggerEvent('onRender');
    };

    var getCSSHelpers = function(){
        var rule;
        if(rule = cm.getCSSRule('.com__calendar-event-helper__short-indent')[0]){
            that.params['itemShortIndent'] = cm.styleToNumber(rule.style.height);
        }
        if(rule = cm.getCSSRule('.com__calendar-event-helper__short-height')[0]){
            that.params['itemShortHeight'] = cm.styleToNumber(rule.style.height);
        }
        if(rule = cm.getCSSRule('.com__calendar-week-helper__day-indent')[0]){
            that.params['dayIndent'] = cm.styleToNumber(rule.style.height);
        }
    };

    var validateParams = function(){
        if(that.params['Com.Tooltip']['width'] != 'auto'){
            that.params['Com.Tooltip']['width'] = cm.strReplace(that.params['Com.Tooltip']['width'], {
                '%itemShortIndent%' : that.params['itemShortIndent'],
                '%itemShortHeight%' : that.params['itemShortHeight'],
                '%dayIndent%' : that.params['dayIndent']
            });
        }
        that.params['Com.Tooltip']['top'] = cm.strReplace(that.params['Com.Tooltip']['top'], {
            '%itemShortIndent%' : that.params['itemShortIndent'],
            '%itemShortHeight%' : that.params['itemShortHeight'],
            '%dayIndent%' : that.params['dayIndent']
        });
        that.params['Com.Tooltip']['left'] = cm.strReplace(that.params['Com.Tooltip']['left'], {
            '%itemShortIndent%' : that.params['itemShortIndent'],
            '%itemShortHeight%' : that.params['itemShortHeight'],
            '%dayIndent%' : that.params['dayIndent']
        });
    };

    var render = function(){
        cm.log(that.nodes);
        var template;
        // Find events and set template and tooltip config
        new cm.Finder('Com.CalendarEvent', null, that.params['node'], function(classObject){
            // Clone template
            template = cm.clone(that.nodes['templates']['event']['container'], true);
            // Set Node
            classObject
                .setTooltipParams(that.params['Com.Tooltip'])
                .setTemplate(template);
        });
        // Process Days
        cm.forEach(that.nodes['days'], processDay);
    };

    var processDay = function(nodes){
        var item = {
            'isShow' : false,
            'nodes' : nodes
        };
        // Show all events on more button click
        cm.addEvent(item.nodes['more-button'], 'click', function(){
            showMoreEvents(item);
        });
        // Prevent document scrolling while scroll all events block
        cm.addIsolateScrolling(item.nodes['more-holder']);
        // Push
        that.days.push(item);
    };

    var showMoreEvents = function(item){
        item.delay && clearTimeout(item.delay);
        if(!item.isShow){
            item.isShow = true;
            cm.setScrollTop(item.nodes['more-holder'], 0);
            cm.addClass(item.nodes['more-holder'], 'is-show');
        }
    };

    var hideMoreEvents = function(item, isImmediately){
        item.delay && clearTimeout(item.delay);
        if(item.isShow){
            if(isImmediately){
                item.isShow = false;
                cm.removeClass(item.nodes['more-holder'], 'is-show');
            }else{
                item.delay = setTimeout(function(){
                    item.isShow = false;
                    cm.removeClass(item.nodes['more-holder'], 'is-show');
                }, that.params['delay']);
            }
        }
    };

    /* ******* PUBLIC ******* */

    init();
});

/* *** CALENDAR AGENDA VIEW *** */

cm.define('Com.CalendarWeek', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'itemShortIndent' : 1,
        'itemShortHeight' : 24,
        'dayIndent' : 4,
        'Com.Tooltip' : {
            'width' : '(targetWidth + %dayIndent%) * 2 - targetHeight * 2',
            'top' : 'targetHeight + %itemShortIndent%',
            'left' : 'targetHeight'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'templates' : {}
    };
    that.days = [];

    var init = function(){
        getCSSHelpers();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.triggerEvent('onRender');
    };

    var getCSSHelpers = function(){
        var rule;
        if(rule = cm.getCSSRule('.com__calendar-event-helper__short-indent')[0]){
            that.params['itemShortIndent'] = cm.styleToNumber(rule.style.height);
        }
        if(rule = cm.getCSSRule('.com__calendar-event-helper__short-height')[0]){
            that.params['itemShortHeight'] = cm.styleToNumber(rule.style.height);
        }
        if(rule = cm.getCSSRule('.com__calendar-week-helper__day-indent')[0]){
            that.params['dayIndent'] = cm.styleToNumber(rule.style.height);
        }
    };

    var validateParams = function(){
        that.params['Com.Tooltip']['width'] = cm.strReplace(that.params['Com.Tooltip']['width'], {
            '%itemShortIndent%' : that.params['itemShortIndent'],
            '%itemShortHeight%' : that.params['itemShortHeight'],
            '%dayIndent%' : that.params['dayIndent']
        });
        that.params['Com.Tooltip']['top'] = cm.strReplace(that.params['Com.Tooltip']['top'], {
            '%itemShortIndent%' : that.params['itemShortIndent'],
            '%itemShortHeight%' : that.params['itemShortHeight'],
            '%dayIndent%' : that.params['dayIndent']
        });
        that.params['Com.Tooltip']['left'] = cm.strReplace(that.params['Com.Tooltip']['left'], {
            '%itemShortIndent%' : that.params['itemShortIndent'],
            '%itemShortHeight%' : that.params['itemShortHeight'],
            '%dayIndent%' : that.params['dayIndent']
        });
    };

    var render = function(){
        cm.log(that.nodes);
        var template;
        // Find events and set template and tooltip config
        new cm.Finder('Com.CalendarEvent', null, that.params['node'], function(classObject){
            // Clone template
            template = cm.clone(that.nodes['templates']['event']['container'], true);
            // Set Node
            classObject
                .setTooltipParams(that.params['Com.Tooltip'])
                .setTemplate(template);
        });
    };

    /* ******* PUBLIC ******* */

    init();
});

/* *** CALENDAR AGENDA VIEW *** */

cm.define('Com.CalendarAgenda', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'itemShortIndent' : 1,
        'itemShortHeight' : 24,
        'Com.Tooltip' : {
            'width' : 'targetWidth - %itemShortHeight% * 2',
            'top' : 'targetHeight + %itemShortIndent%',
            'left' : 'targetHeight'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'templates' : {}
    };
    that.days = [];

    var init = function(){
        getCSSHelpers();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.triggerEvent('onRender');
    };

    var getCSSHelpers = function(){
        var rule;
        if(rule = cm.getCSSRule('.com__calendar-event-helper__short-indent')[0]){
            that.params['itemShortIndent'] = cm.styleToNumber(rule.style.height);
        }
        if(rule = cm.getCSSRule('.com__calendar-event-helper__short-height')[0]){
            that.params['itemShortHeight'] = cm.styleToNumber(rule.style.height);
        }
    };

    var validateParams = function(){
        if(that.params['Com.Tooltip']['width'] != 'auto'){
            that.params['Com.Tooltip']['width'] = cm.strReplace(that.params['Com.Tooltip']['width'], {
                '%itemShortIndent%' : that.params['itemShortIndent'],
                '%itemShortHeight%' : that.params['itemShortHeight']
            });
        }
        that.params['Com.Tooltip']['top'] = cm.strReplace(that.params['Com.Tooltip']['top'], {
            '%itemShortIndent%' : that.params['itemShortIndent'],
            '%itemShortHeight%' : that.params['itemShortHeight']
        });
        that.params['Com.Tooltip']['left'] = cm.strReplace(that.params['Com.Tooltip']['left'], {
            '%itemShortIndent%' : that.params['itemShortIndent'],
            '%itemShortHeight%' : that.params['itemShortHeight']
        });
    };

    var render = function(){
        cm.log(that.nodes);
        // Find events and set template and tooltip config
        new cm.Finder('Com.CalendarEvent', null, that.params['node'], function(classObject){
            // Clone template
            var template = cm.clone(that.nodes['templates']['event']['container'], true);
            // Set Node
            classObject
                .setTooltipParams(that.params['Com.Tooltip'])
                .setTemplate(template);
        });
    };

    /* ******* PUBLIC ******* */

    init();
});