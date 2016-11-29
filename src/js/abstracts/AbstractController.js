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
        'onConstructStart',
        'onConstructProcess',
        'onConstructEnd',
        'onInitComponentsStart',
        'onInitComponentsEnd',
        'onGetLESSVariablesStart',
        'onGetLESSVariablesProcess',
        'onGetLESSVariablesEnd',
        'onValidateParamsStart',
        'onValidateParamsProcess',
        'onValidateParamsEnd',
        'onRenderStart',
        'onRender',
        'onDestructStart',
        'onDestructProcess',
        'onDestructEnd',
        'onRedraw',
        'onScroll',
        'onSetEventsStart',
        'onSetEventsProcess',
        'onSetEventsEnd',
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
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'getDataNodes' : true,
        'getDataConfig' : true,
        'embedStructure' : 'append',
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'removeOnDestruct' : false,
        'className' : '',
        'customEvents' : true,
        'resizeEvent' : true,
        'scrollEvent' : false,
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

cm.getConstructor('Com.AbstractController', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        // Bind context to methods
        that.redrawHandler = that.redraw.bind(that);
        that.scrollHandler = that.scroll.bind(that);
        that.destructHandler = that.destruct.bind(that);
        that.constructCollectorHandler = that.constructCollector.bind(that);
        that.destructCollectorHandler = that.destructCollector.bind(that);
        // Configure class
        that.triggerEvent('onConstructStart');
        that.initComponents();
        that.getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.params['getDataNodes'] && that.getDataNodes(that.params['node']);
        that.params['getDataConfig'] && that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.setEvents();
        that.triggerEvent('onConstructProcess');
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.triggerEvent('onConstructEnd');
        return that;
    };

    classProto.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.triggerEvent('onDestructStart');
            that.isDestructed = true;
            that.triggerEvent('onDestructProcess');
            cm.customEvent.trigger(that.getStackNode(), 'destruct', {
                'type' : 'child',
                'self' : false
            });
            that.unsetEvents();
            that.params['removeOnDestruct'] && cm.remove(that.getStackNode());
            that.removeFromStack();
            that.triggerEvent('onDestructEnd');
        }
        return that;
    };

    classProto.redraw = function(){
        var that = this;
        animFrame(function(){
            that.triggerEvent('onRedraw');
        });
        return that;
    };

    classProto.scroll = function(){
        var that = this;
        animFrame(function(){
            that.triggerEvent('onScroll');
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
        that.triggerEvent('onGetLESSVariablesProcess');
        that.triggerEvent('onGetLESSVariablesEnd');
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParamsProcess');
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.params['renderStructure'] && that.renderView();
        that.renderViewModel();
        that.setAttributes();
        // Append
        that.params['embedStructureOnRender'] && that.embedStructure(that.nodes['container']);
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
        that.params['resizeEvent'] && cm.addEvent(window, 'resize', that.redrawHandler);
        that.params['scrollEvent'] && cm.addEvent(window, 'scroll', that.scrollHandler);
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
        that.params['resizeEvent'] && cm.removeEvent(window, 'resize', that.redrawHandler);
        that.params['scrollEvent'] && cm.removeEvent(window, 'scroll', that.scrollHandler);
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

    classProto.constructCollector = function(){
        var that = this;
        if(that.params['constructCollector']){
            if(that.params['collector']){
                that.params['collector'].construct(that.getStackNode());
            }else{
                cm.find('Com.Collector', null, null, function(classObject){
                    classObject.construct(that.getStackNode());
                });
            }
        }
        return that;
    };

    classProto.destructCollector = function(){
        var that = this;
        if(that.params['constructCollector']){
            if(that.params['collector']){
                that.params['collector'].destruct(that.getStackNode());
            }else{
                cm.find('Com.Collector', null, null, function(classObject){
                    classObject.destruct(that.getStackNode());
                });
            }
        }
        return that;
    };
});