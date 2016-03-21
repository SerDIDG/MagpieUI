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
        'defaultView' : 'agenda',                                   // agenda | week | month
        'isViewPreloaded' : false,
        'animateDuration' : 'cm._config.animDuration',
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : true,                                      // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseurl%, %view%, %year%, %month%, %week%, %callback% for JSONP.
            'params' : {                                            // Params object. %baseurl%, %view%, %year%, %month%, %week%, %callback% for JSONP.
                'view' : '%view%',
                'week' : '%week%',
                'month' : '%month%',
                'year' : '%year%',
                'query' : '%query%'
            }
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
    var that = this,
        viewDetailsPattern = {
            'view' : null,
            'week' : null,
            'month' : null,
            'year' : null,
            'query' : null
        };

    that.nodes = {
        'container' : cm.node('div'),
        'buttons' : {
            'views' : {
                'agenda' : cm.node('div'),
                'week' : cm.node('div'),
                'month' : cm.node('div')
            }
        },
        'holder' : {
            'container' : cm.node('div'),
            'inner' : cm.node('div')
        }
    };
    that.components = {};
    that.animations = {};

    that.ajaxHandler = null;
    that.isProcess = false;
    that.isRendering = false;
    that.loaderDelay = null;
    that.viewDetails = cm.clone(viewDetailsPattern);

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
        that.params['defaultView'] = cm.inArray(['agenda', 'week', 'month'], that.params['defaultView']) ? that.params['defaultView'] : 'month';
        that.params['Com.Overlay']['container'] = that.nodes['container'];
    };

    var render = function(){
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor, className){
            that.components['loader'] = new classConstructor(that.params[className]);
        });
        // Animations
        that.animations['response'] = new cm.Animation(that.nodes['holder']['container']);
        // View Buttons
        cm.forEach(that.nodes['buttons']['views'], function(node, key){
            cm.addEvent(node, 'click', function(e){
                cm.preventDefault(e);
                setView({
                    'view' : key
                });
            });
        });
        // View Finder
        new cm.Finder('Com.CalendarAgenda', that.params['name'], that.nodes['holder']['inner'], function(classObject){
            classObject.addEvent('onRequestView', function(calendar, data){
                setView(data);
            });
        }, {'multiple' : true});
        new cm.Finder('Com.CalendarWeek', that.params['name'], that.nodes['holder']['inner'], function(classObject){
            classObject.addEvent('onRequestView', function(calendar, data){
                setView(data);
            });
        }, {'multiple' : true});
        new cm.Finder('Com.CalendarMonth', that.params['name'], that.nodes['holder']['inner'], function(classObject){
            classObject.addEvent('onRequestView', function(calendar, data){
                setView(data);
            });
        }, {'multiple' : true});
        // Render View
        !that.params['isViewPreloaded'] && setView({
            'view' : that.params['defaultView']
        });
    };

    var setViewDetails = function(data){
        that.viewDetails = cm.merge(viewDetailsPattern, data);
    };

    var setView = function(data){
        if(that.isProcess){
            that.abort();
        }
        if(!that.isProcess && !that.isRendering){
            setViewDetails(data);
            cm.forEach(that.nodes['buttons']['views'], function(node, key){
                if(key === that.viewDetails['view']){
                    cm.replaceClass(node, 'button-secondary', 'button-primary');
                }else{
                    cm.replaceClass(node, 'button-primary', 'button-secondary');
                }
            });
            that.ajaxHandler = that.callbacks.request(that, cm.clone(that.params['ajax']));
        }
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        config = that.callbacks.beforePrepare(that, config);
        config['url'] = cm.strReplace(config['url'], {
            '%baseurl%' : cm._baseUrl,
            '%view%' : that.viewDetails['view'],
            '%year%' : that.viewDetails['year'],
            '%month%' : that.viewDetails['month'],
            '%week%' : that.viewDetails['week'],
            '%query%' : that.viewDetails['query']
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%baseurl%' : cm._baseUrl,
            '%view%' : that.viewDetails['view'],
            '%year%' : that.viewDetails['year'],
            '%month%' : that.viewDetails['month'],
            '%week%' : that.viewDetails['week'],
            '%query%' : that.viewDetails['query']
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
        that.triggerEvent('onProcessEnd', that.nodes['holder']['inner']);
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
        if(!that.nodes['holder']['temporary']){
            that.nodes['holder']['temporary'] = that.callbacks.renderTemporary(that);
            cm.forEach(that.nodes['holder']['inner'].childNodes, function(node){
                cm.appendChild(node, that.nodes['holder']['temporary']);
            });
            cm.appendChild(that.nodes['holder']['temporary'], that.nodes['holder']['inner']);
        }
        cm.removeClass(that.nodes['holder']['temporary'], 'is-show', true);
        // Append temporary
        cm.appendChild(temporary, that.nodes['holder']['inner']);
        cm.addClass(temporary, 'is-show', true);
        // Animate
        cm.removeClass(that.nodes['holder']['container'], 'is-loaded', true);
        cm.addClass(that.nodes['holder']['container'], 'is-show', true);
        height = temporary.offsetHeight;
        that.animations['response'].go({
            'style' : {'height' : [height, 'px'].join('')},
            'duration' : that.params['animateDuration'],
            'anim' : 'smooth',
            'onStop' : function(){
                that.nodes['holder']['container'].style.height = '';
                cm.remove(that.nodes['holder']['temporary']);
                cm.addClass(that.nodes['holder']['container'], 'is-loaded', true);
                that.nodes['holder']['temporary'] = temporary;
                that.isRendering = false;
            }
        });
    };

    /* ******* PUBLIC ******* */

    that.refresh = function(){
        setView(that.viewDetails);
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.setAction = function(o, mode, update){
        mode = cm.inArray(['raw', 'update', 'current'], mode)? mode : 'current';
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

/* *** CALENDAR VIEW ABSTRACT *** */

cm.define('Com.AbstractCalendarView', {
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
        'onRender',
        'onRequestView'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'viewName' : '',
        'itemShortIndent' : 1,
        'itemShortHeight' : 24,
        'dayIndent' : 4,
        'Com.Tooltip' : {}
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'buttons' : {
            'container' : cm.node('div'),
            'prev' : cm.node('div'),
            'next' : cm.node('div'),
            'search-button' : cm.node('div'),
            'search-input' : cm.node('input'),
            'views' : {
                'agenda' : cm.node('div'),
                'week' : cm.node('div'),
                'month' : cm.node('div')
            }
        },
        'templates' : {
            'event' : {}
        }
    };
    that.components = {};
    that.days = [];

    var init = function(){
        that.getCSSHelpers();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.renderToolbar();
        that.render();
        that.triggerEvent('onRender');
    };

    /* ******* PUBLIC ******* */

    init();
});

cm.getConstructor('Com.AbstractCalendarView', function(classConstructor){
    classConstructor.prototype.getCSSHelpers = function(){
        var that = this;
        var rule;
        if(rule = cm.getCSSRule('.com__calendar-event-helper__short-indent')[0]){
            that.params['itemShortIndent'] = cm.styleToNumber(rule.style.height);
        }
        if(rule = cm.getCSSRule('.com__calendar-event-helper__short-height')[0]){
            that.params['itemShortHeight'] = cm.styleToNumber(rule.style.height);
        }
        return that;
    };

    classConstructor.prototype.validateParams = function(){
        var that = this;
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
        return that;
    };

    classConstructor.prototype.render = function(){
        var that = this;
        // Find events and set template and tooltip config
        new cm.Finder('Com.CalendarEvent', null, that.params['node'], function(classObject){
            // Clone template
            var template = cm.clone(that.nodes['templates']['event']['container'], true);
            // Set Node
            classObject
                .setTooltipParams(that.params['Com.Tooltip'])
                .setTemplate(template);
        }, {'multiple' : true});
        return that;
    };

    classConstructor.prototype.renderToolbar = function(){
        var that = this;
        // Toolbar Controls
        new cm.Finder('Com.Select', 'week', that.nodes['buttons']['container'], function(classObject){
            that.components['week'] = classObject
                .addEvent('onChange', function(){
                    that.updateView();
                });
        });
        new cm.Finder('Com.Select', 'month', that.nodes['buttons']['container'], function(classObject){
            that.components['month'] = classObject
                .addEvent('onChange', function(){
                    that.updateView();
                });
        });
        new cm.Finder('Com.Select', 'year', that.nodes['buttons']['container'], function(classObject){
            that.components['year'] = classObject
                .addEvent('onChange', function(){
                    that.updateView();
                });
        });
        // Search
        cm.addEvent(that.nodes['buttons']['search-input'], 'keypress', function(e){
            if(e.keyCode == 13){
                cm.preventDefault(e);
                that.updateView();
            }
        });
        cm.addEvent(that.nodes['buttons']['search-button'], 'click', function(e){
            cm.preventDefault(e);
            that.updateView();
        });
        // View Buttons
        cm.forEach(that.nodes['buttons']['views'], function(node, key){
            if(key === that.params['viewName']){
                cm.replaceClass(node, 'button-secondary', 'button-primary');
            }else{
                cm.replaceClass(node, 'button-primary', 'button-secondary');
            }
            cm.addEvent(node, 'click', function(e){
                cm.preventDefault(e);
                that.requestView({
                    'view' : key
                });
            });
        });
        // Prev / Next Buttons
        cm.addEvent(that.nodes['buttons']['prev'], 'click', function(e){
            cm.preventDefault(e);
            that.prev();
        });
        cm.addEvent(that.nodes['buttons']['next'], 'click', function(e){
            cm.preventDefault(e);
            that.next();
        });
        return that;
    };

    classConstructor.prototype.searchQuery = function(str){
        var that = this;
        var data = that.getData();
        data.query = str;
        that.requestView(data);
        return that;
    };

    classConstructor.prototype.requestView = function(data){
        var that = this;
        that.triggerEvent('onRequestView', data);
        return that;
    };

    classConstructor.prototype.getData = function(){
        var that = this;
        return {
            'query' : that.nodes['buttons']['search-input'].value,
            'view' : that.params['viewName'],
            'year' : that.components['year'] ? that.components['year'].get() : null,
            'month' : that.components['month'] ? that.components['month'].get() : null,
            'week' : that.components['week'] ? that.components['week'].get() : null
        };
    };

    classConstructor.prototype.updateView = function(){
        var that = this;
        that.triggerEvent('onRequestView', that.getData());
        return that;
    };

    classConstructor.prototype.prev = function(){
        var that = this;
        var data = that.getData();
        if(data['week'] !== null){
            if(data['week'] == 1){
                data['year']--;
                data['week'] = cm.getWeeksInYear(data['year']);
            }else{
                data['week']--;
            }
        }else if(data['month'] !== null){
            if(data['month'] == 0){
                data['year']--;
                data['month'] = 11;
            }else{
                data['month']--;
            }
        }else{
            data['year']--;
        }
        that.requestView(data);
        return that;
    };

    classConstructor.prototype.next = function(){
        var that = this;
        var data = that.getData();
        if(data['week'] !== null){
            if(data['week'] == cm.getWeeksInYear(data['year'])){
                data['year']++;
                data['week'] = 1;
            }else{
                data['week']++;
            }
        }else if(data['month'] !== null){
            if(data['month'] == 11){
                data['year']++;
                data['month'] = 0;
            }else{
                data['month']++;
            }
        }else {
            data['year']++;
        }
        that.requestView(data);
        return that;
    };
});

/* *** CALENDAR MONTH VIEW *** */

cm.define('Com.CalendarMonth', {
    'extend' : 'Com.AbstractCalendarView',
    'params' : {
        'viewName' : 'month',
        'Com.Tooltip' : {
            'width' : '(targetWidth + %dayIndent%) * 2 - targetHeight * 2',
            'top' : 'targetHeight + %itemShortIndent%',
            'left' : '-(selfWidth - targetWidth) - targetHeight'
        }
    }
},
function(params){
    var that = this;
    that._inherit.apply(that, arguments);

    var processDay = function(nodes){
        var that = this;
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

    that.getCSSHelpers = function(){
        var that = this;
        var rule;
        that._inherit.prototype.getCSSHelpers.call(that);
        if(rule = cm.getCSSRule('.com__calendar-month-helper__day-indent')[0]){
            that.params['dayIndent'] = cm.styleToNumber(rule.style.height);
        }
    };

    that.render = function(){
        var that = this;
        that._inherit.prototype.render.call(that);
        cm.forEach(that.nodes['days'], processDay);
    };
});

/* *** CALENDAR WEEK VIEW *** */

cm.define('Com.CalendarWeek', {
    'extend' : 'Com.AbstractCalendarView',
    'params' : {
        'viewName' : 'week',
        'Com.Tooltip' : {
            'width' : '(targetWidth + %dayIndent%) * 2 - targetHeight * 2',
            'top' : 'targetHeight + %itemShortIndent%',
            'left' : 'targetHeight'
        }
    }
},
function(params){
    var that = this;
    that._inherit.apply(that, arguments);

    /* ******* PUBLIC ******* */

    that.getCSSHelpers = function(){
        var that = this;
        var rule;
        that._inherit.prototype.getCSSHelpers.call(that);
        if(rule = cm.getCSSRule('.com__calendar-week-helper__day-indent')[0]){
            that.params['dayIndent'] = cm.styleToNumber(rule.style.height);
        }
    };
});

/* *** CALENDAR AGENDA VIEW *** */

cm.define('Com.CalendarAgenda', {
    'extend' : 'Com.AbstractCalendarView',
    'params' : {
        'viewName' : 'agenda',
        'Com.Tooltip' : {
            'width' : 'targetWidth - %itemShortHeight% * 2',
            'top' : 'targetHeight + %itemShortIndent%',
            'left' : 'targetHeight'
        }
    }
},
function(params){
    var that = this;
    that._inherit.apply(that, arguments);
});