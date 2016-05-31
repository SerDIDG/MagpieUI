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
        'onGetLESSVariablesEnd',
        'onValidateParamsStart',
        'onValidateParamsEnd',
        'onRenderStart',
        'onRender',
        'onDestructStart',
        'onDestructProcess',
        'onDestructEnd',
        'onRedraw',
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
        'onRenderViewEnd',
        'onSetAttributesStart',
        'onSetAttributesEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append',
        'customEvents' : true,
        'removeOnDestruct' : false,
        'className' : '',
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
        that.destructHandler = that.destruct.bind(that);
        that.constructCollectorHandler = that.constructCollector.bind(that);
        that.destructCollectorHandler = that.destructCollector.bind(that);
        // Configure class
        that.triggerEvent('onConstructStart');
        that.initComponents();
        that.getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
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
            that.unsetEvents();
            that.removeFromStack();
            that.params['removeOnDestruct'] && cm.remove(that.nodes['container']);
            that.triggerEvent('onDestructEnd');
        }
        return that;
    };

    classProto.redraw = function(){
        var that = this;
        that.triggerEvent('onRedraw');
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
        that.triggerEvent('onGetLESSVariablesEnd');
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.renderView();
        // Attributes
        that.setAttributes();
        // Append
        that.embedStructure(that.nodes['container']);
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

    classProto.setAttributes = function(){
        var that = this;
        that.triggerEvent('onSetAttributesStart');
        cm.addClass(that.nodes['container'], that.params['className']);
        that.triggerEvent('onSetAttributesEnd');
        return that;
    };

    classProto.setEvents = function(){
        var that = this;
        that.triggerEvent('onSetEventsStart');
        // Windows events
        cm.addEvent(window, 'resize', that.redrawHandler);
        that.triggerEvent('onSetEventsProcess');
        // Add custom events
        if(that.params['customEvents']){
            cm.customEvent.add(that.nodes['container'], 'redraw', that.redrawHandler);
            cm.customEvent.add(that.nodes['container'], 'destruct', that.destructHandler);
            that.triggerEvent('onSetCustomEvents');
        }
        that.triggerEvent('onSetEventsEnd');
        return that;
    };

    classProto.unsetEvents = function(){
        var that = this;
        that.triggerEvent('onUnsetEventsStart');
        // Windows events
        cm.removeEvent(window, 'resize', that.redrawHandler);
        that.triggerEvent('onUnsetEventsProcess');
        // Remove custom events
        if(that.params['customEvents']){
            cm.customEvent.remove(that.nodes['container'], 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.nodes['container'], 'destruct', that.destructHandler);
            that.triggerEvent('onUnsetCustomEvents');
        }
        that.triggerEvent('onUnsetEventsEnd');
        return that;
    };

    classProto.constructCollector = function(){
        var that = this;
        if(that.params['constructCollector']){
            if(that.params['collector']){
                that.params['collector'].construct(that.nodes['container']);
            }else{
                cm.find('Com.Collector', null, null, function(classObject){
                    classObject.construct(that.nodes['container']);
                });
            }
        }
        return that;
    };

    classProto.destructCollector = function(){
        var that = this;
        if(that.params['constructCollector']){
            if(that.params['collector']){
                that.params['collector'].destruct(that.nodes['container']);
            }else{
                cm.find('Com.Collector', null, null, function(classObject){
                    classObject.destruct(that.nodes['container']);
                });
            }
        }
        return that;
    };
});