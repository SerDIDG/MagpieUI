/* ******* COMPONENTS: BIG CALENDAR ******* */

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
        'itemIndent' : 1,
        'dayIndent' : 4,
        'Com.Tooltip' : {
            'width' : '(targetWidth + %dayIndent%) * 2 - targetHeight * 2',
            'top' : 'targetHeight + %itemIndent%',
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
        if(rule = cm.getCSSRule('.com__calendar-event-helper__indent')[0]){
            that.params['itemIndent'] = cm.styleToNumber(rule.style.height);
        }
        if(rule = cm.getCSSRule('.com__calendar-week-helper__day-indent')[0]){
            that.params['dayIndent'] = cm.styleToNumber(rule.style.height);
        }
    };

    var validateParams = function(){
        if(that.params['Com.Tooltip']['width'] != 'auto'){
            that.params['Com.Tooltip']['width'] = cm.strReplace(that.params['Com.Tooltip']['width'], {
                '%itemIndent%' : that.params['itemIndent'],
                '%dayIndent%' : that.params['dayIndent']
            });
        }
        that.params['Com.Tooltip']['top'] = cm.strReplace(that.params['Com.Tooltip']['top'], {
            '%itemIndent%' : that.params['itemIndent'],
            '%dayIndent%' : that.params['dayIndent']
        });
        that.params['Com.Tooltip']['left'] = cm.strReplace(that.params['Com.Tooltip']['left'], {
            '%itemIndent%' : that.params['itemIndent'],
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
        'itemIndent' : 1,
        'dayIndent' : 4,
        'Com.Tooltip' : {
            'width' : '(targetWidth + %dayIndent%) * 2 - targetHeight * 2',
            'top' : 'targetHeight + %itemIndent%',
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
        if(rule = cm.getCSSRule('.com__calendar-event-helper__indent')[0]){
            that.params['itemIndent'] = cm.styleToNumber(rule.style.height);
        }
        if(rule = cm.getCSSRule('.com__calendar-week-helper__day-indent')[0]){
            that.params['dayIndent'] = cm.styleToNumber(rule.style.height);
        }
    };

    var validateParams = function(){
        that.params['Com.Tooltip']['width'] = cm.strReplace(that.params['Com.Tooltip']['width'], {
            '%itemIndent%' : that.params['itemIndent'],
            '%dayIndent%' : that.params['dayIndent']
        });
        that.params['Com.Tooltip']['top'] = cm.strReplace(that.params['Com.Tooltip']['top'], {
            '%itemIndent%' : that.params['itemIndent'],
            '%dayIndent%' : that.params['dayIndent']
        });
        that.params['Com.Tooltip']['left'] = cm.strReplace(that.params['Com.Tooltip']['left'], {
            '%itemIndent%' : that.params['itemIndent'],
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
        'itemIndent' : 1,
        'Com.Tooltip' : {
            'width' : 'targetWidth - targetHeight * 2',
            'top' : 'targetHeight + %itemIndent%',
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
        if(rule = cm.getCSSRule('.com__calendar-event-helper__indent')[0]){
            that.params['itemIndent'] = cm.styleToNumber(rule.style.height);
        }
    };

    var validateParams = function(){
        if(that.params['Com.Tooltip']['width'] != 'auto'){
            that.params['Com.Tooltip']['width'] = cm.strReplace(that.params['Com.Tooltip']['width'], {
                '%itemIndent%' : that.params['itemIndent']
            });
        }
        that.params['Com.Tooltip']['top'] = cm.strReplace(that.params['Com.Tooltip']['top'], {
            '%itemIndent%' : that.params['itemIndent']
        });
        that.params['Com.Tooltip']['left'] = cm.strReplace(that.params['Com.Tooltip']['left'], {
            '%itemIndent%' : that.params['itemIndent']
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