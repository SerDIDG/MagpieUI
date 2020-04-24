cm.define('Com.AbstractController', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onConstruct',
        'onConstructStart',
        'onConstructProcess',
        'onConstructEnd',
        'onInitComponentsStart',
        'onInitComponentsEnd',
        'onGetLESSVariables',
        'onGetLESSVariablesStart',
        'onGetLESSVariablesProcess',
        'onGetLESSVariablesEnd',
        'onValidateParams',
        'onValidateParamsStart',
        'onValidateParamsProcess',
        'onValidateParamsEnd',
        'onRenderStart',
        'onRender',
        'onRenderEnd',
        'onBeforeRender',
        'onAfterRender',
        'onRenderViewModel',
        'onDestruct',
        'onDestructStart',
        'onDestructProcess',
        'onDestructEnd',
        'onRedraw',
        'onScroll',
        'onSetEvents',
        'onSetEventsStart',
        'onSetEventsProcess',
        'onSetEventsEnd',
        'onUnsetEvents',
        'onUnsetEventsStart',
        'onUnsetEventsProcess',
        'onUnsetEventsEnd',
        'onSetCustomEvents',
        'onUnsetCustomEvents',
        'onRenderViewStart',
        'onRenderViewProcess',
        'onRenderViewEnd'
    ],
    'params' : {
        'node' : null,
        'container' : null,
        'name' : '',
        'getDataNodes' : true,
        'getDataConfig' : true,
        'embedStructure' : 'append',
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'redrawOnRender' : 'immediately',
        'removeOnDestruct' : false,
        'className' : '',
        'controllerEvents' : false,
        'customEvents' : true,
        'resizeEvent' : true,
        'resizeNode' : window,
        'scrollEvent' : false,
        'scrollNode' : window,
        'collector' : null,
        'constructCollector' : false,
        'destructCollector' : false
    }
},
function(params){
    var that = this;
    that.isDestructed = false;
    that.nodes = {};
    that.components = {};
    that.construct(params);
});

cm.getConstructor('Com.AbstractController', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(params){
        var that = this;
        // Bind context to methods
        that.redrawHandler = that.redraw.bind(that);
        that.scrollHandler = that.scroll.bind(that);
        that.destructHandler = that.destruct.bind(that);
        that.constructCollectorHandler = that.constructCollector.bind(that);
        that.destructCollectorHandler = that.destructCollector.bind(that);
        // Configure class
        that.params['controllerEvents'] && that.bindControllerEvents();
        that.triggerEvent('onConstructStart');
        that.renderComponent();
        that.initComponents();
        that.getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.params['getDataNodes'] && that.getDataNodes(that.params['node']);
        that.params['getDataConfig'] && that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onConstruct');
        that.triggerEvent('onRenderStart');
        that.triggerEvent('onBeforeRender');
        that.render();
        that.triggerEvent('onAfterRender');
        that.triggerEvent('onConstructProcess');
        that.addToStack(that.nodes['container']);
        that.setEvents();
        that.triggerEvent('onRender');
        that.triggerEvent('onRenderEnd');
        that.triggerEvent('onConstructEnd');
        return that;
    };

    classProto.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.triggerEvent('onDestructStart');
            that.triggerEvent('onDestruct');
            that.triggerEvent('onDestructProcess');
            cm.customEvent.trigger(that.getStackNode(), 'destruct', {
                'direction' : 'child',
                'self' : false
            });
            that.unsetEvents();
            that.params['removeOnDestruct'] && cm.remove(that.getStackNode());
            that.removeFromStack();
            that.triggerEvent('onDestructEnd');
        }
        return that;
    };

    classProto.redraw = function(params){
        var that = this;
        switch(params){
            case 'full':
                cm.customEvent.trigger(that.nodes['container'], 'redraw', {
                    'direction' : 'child',
                    'self' : true
                });
                break;
            case 'immediately':
                that.triggerEvent('onRedraw');
                break;
            default:
                animFrame(function(){
                    that.triggerEvent('onRedraw');
                });
                break;
        }
        return that;
    };

    classProto.scroll = function(params){
        var that = this;
        if(params === 'immediately'){
            that.triggerEvent('onScroll');
        }else{
            animFrame(function(){
                that.triggerEvent('onScroll');
            });
        }
        return that;
    };

    classProto.bindControllerEvents = function(){
        var that = this;
        cm.forEach(that._raw['events'], function(name){
            if(!that[name]){
                that[name] = function(){};
            }
            if(!that[name + 'Handler']){
                that[name + 'Handler'] = that[name].bind(that);
            }
            that.addEvent(name, that[name + 'Handler']);
        });
        return that;
    };

    classProto.initComponents = function(){
        var that = this;
        that.triggerEvent('onInitComponentsStart');
        that.triggerEvent('onInitComponentsEnd');
        return that;
    };

    classProto.getLESSVariables = function(){
        var that = this;
        that.triggerEvent('onGetLESSVariablesStart');
        that.triggerEvent('onGetLESSVariables');
        that.triggerEvent('onGetLESSVariablesProcess');
        that.triggerEvent('onGetLESSVariablesEnd');
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.params['renderStructure'] && that.renderView();
        that.setAttributes();
        // Render model
        that.renderViewModel();
        // Append
        if(that.params['embedStructureOnRender']){
            that.embedStructure(that.nodes['container']);
            if(that.params['redrawOnRender'] === true){
                that.redraw();
            }else if(cm.isString(that.params['redrawOnRender'])){
                that.redraw(that.params['redrawOnRender'])
            }
        }
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__abstract'});
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        that.triggerEvent('onRenderViewModel');
        return that;
    };

    classProto.setAttributes = function(){
        var that = this;
        cm.addClass(that.nodes['container'], that.params['className']);
        return that;
    };

    classProto.setEvents = function(){
        var that = this;
        that.triggerEvent('onSetEventsStart');
        // Windows events
        that.params['resizeEvent'] && cm.addEvent(that.params['resizeNode'], 'resize', that.redrawHandler);
        that.params['scrollEvent'] && cm.addEvent(that.params['scrollNode'], 'scroll', that.scrollHandler);
        that.triggerEvent('onSetEvents');
        that.triggerEvent('onSetEventsProcess');
        // Add custom events
        if(that.params['customEvents']){
            cm.customEvent.add(that.getStackNode(), 'redraw', that.redrawHandler);
            cm.customEvent.add(that.getStackNode(), 'destruct', that.destructHandler);
            that.triggerEvent('onSetCustomEvents');
        }
        that.triggerEvent('onSetEventsEnd');
        return that;
    };

    classProto.unsetEvents = function(){
        var that = this;
        that.triggerEvent('onUnsetEventsStart');
        // Windows events
        that.params['resizeEvent'] && cm.removeEvent(that.params['resizeNode'], 'resize', that.redrawHandler);
        that.params['scrollEvent'] && cm.removeEvent(that.params['scrollNode'], 'scroll', that.scrollHandler);
        that.triggerEvent('onUnsetEvents');
        that.triggerEvent('onUnsetEventsProcess');
        // Remove custom events
        if(that.params['customEvents']){
            cm.customEvent.remove(that.getStackNode(), 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.getStackNode(), 'destruct', that.destructHandler);
            that.triggerEvent('onUnsetCustomEvents');
        }
        that.triggerEvent('onUnsetEventsEnd');
        return that;
    };

    classProto.constructCollector = function(node){
        var that = this;
        node = cm.isUndefined(node) ? that.getStackNode() : node;
        if(that.params['constructCollector']){
            if(that.params['collector']){
                that.params['collector'].construct(node);
            }else{
                cm.find('Com.Collector', null, null, function(classObject){
                    classObject.construct(node);
                });
            }
        }
        return that;
    };

    classProto.destructCollector = function(node){
        var that = this;
        node = cm.isUndefined(node) ? that.getStackNode() : node;
        if(that.params['destructCollector']){
            if(that.params['collector']){
                that.params['collector'].destruct(node);
            }else{
                cm.find('Com.Collector', null, null, function(classObject){
                    classObject.destruct(node);
                });
            }
        }
        return that;
    };
});