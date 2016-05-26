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
        'onConstructEnd',
        'onValidateParams',
        'onRenderStart',
        'onRender',
        'onDestructStart',
        'onDestruct',
        'onDestructEnd',
        'onRedraw',
        'onSetEventsStart',
        'onSetEvents',
        'onSetEventsEnd',
        'onUnsetEventsStart',
        'onUnsetEvents',
        'onUnsetEventsEnd',
        'onSetCustomEvents',
        'onUnsetCustomEvents'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append',
        'customEvents' : true
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
        that.redrawHandler = that.redraw.bind(that);
        that.destructHandler = that.destruct.bind(that);
        that.triggerEvent('onConstructStart');
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
        that.triggerEvent('onConstruct');
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.triggerEvent('onConstructEnd');
        return that;
    };

    classProto.destruct = function(){
        var that = this;
        that.triggerEvent('onDestructStart');
        if(!that.isDestructed){
            that.isDestructed = true;
            that.triggerEvent('onDestruct');
            that.unsetEvents();
            that.removeFromStack();
            that.triggerEvent('onDestructEnd');
        }
        return that;
    };

    classProto.redraw = function(){
        var that = this;
        that.triggerEvent('onRedraw');
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParams');
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.nodes['container'] = cm.node('div');
        // Append
        that.embedStructure(that.nodes['container']);
        return that;
    };

    classProto.setEvents = function(){
        var that = this;
        that.triggerEvent('onSetEventsStart');
        // Windows events
        cm.addEvent(window, 'resize', that.redrawHandler);
        that.triggerEvent('onSetEvents');
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
        that.triggerEvent('onUnsetEvents');
        // Remove custom events
        if(that.params['customEvents']){
            cm.customEvent.remove(that.nodes['container'], 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.nodes['container'], 'destruct', that.destructHandler);
            that.triggerEvent('onUnsetCustomEvents');
        }
        that.triggerEvent('onUnsetEventsEnd');
        return that;
    };
});