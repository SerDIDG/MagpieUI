cm.define('Com.AbstractInputContainer', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onRenderControllerStart',
        'onRenderControllerProcess',
        'onRenderController',
        'onRenderControllerEnd',
        'onSelect',
        'onChange',
        'onReset'
    ],
    'params' : {
        'renderStructure' : false,
        'embedStructureOnRender' : false,
        'controllerEvents' : true,
        'constructor' : 'Com.AbstractInput',
        'params' : {}
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractInputContainer', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        that.resetHandler = that.reset.bind(that);
        that.enableHandler = that.enable.bind(that);
        that.disableHandler = that.disable.bind(that);
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onValidateParams = function(){
        var that = this;
        that.components['formField'] = that.params['formField'];
        that.components['form'] = that.params['form'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Render Select
        that.renderController();
        return that;
    };

    classProto.renderController = function(){
        var that = this,
            params;
        cm.getConstructor(that.params['constructor'], function(classConstructor){
            that.triggerEvent('onRenderControllerStart');
            params = that.validateControllerParams();
            that.components['controller'] = new classConstructor(params);
            that.triggerEvent('onRenderControllerProcess', that.components['controller']);
            that.renderControllerEvents();
            that.triggerEvent('onRenderController', that.components['controller']);
            that.triggerEvent('onRenderControllerEnd', that.components['controller']);
        });
    };

    classProto.validateControllerParams = function(){
        var that = this;
        return cm.merge(that.params['params'], {
            'node' : that.params['node'],
            'value' : that.params['value'],
            'defaultValue' : that.params['defaultValue']
        });
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        that.components['controller'].addEvent('onSelect', function(controller, data){
            that.triggerEvent('onSelect', data);
        });
        that.components['controller'].addEvent('onChange', function(controller, data){
            that.triggerEvent('onChange', data);
        });
        that.components['controller'].addEvent('onReset', function(controller, data){
            that.triggerEvent('onReset', data);
        });
        return that;
    };

    /******* PUBLIC *******/

    classProto.set = function(value){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].set) && that.components['controller'].set(value);
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].get)  && that.components['controller'].get();
    };

    classProto.getRaw = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].getRaw)  && that.components['controller'].getRaw() || that.get();
    };

    classProto.reset = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].reset)  && that.components['controller'].reset();
    };

    classProto.enable = function(){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].enable)  && that.components['controller'].enable();
        return that;
    };

    classProto.disable = function(){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].disable)  && that.components['controller'].disable();
        return that;
    };
});