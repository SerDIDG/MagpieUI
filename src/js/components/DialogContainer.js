cm.define('Com.DialogContainer', {
    'extend' : 'Com.AbstractContainer',
    'params' : {
        'constructor' : 'Com.Dialog',
        'container' : 'document.body',
        'params' : {
            'removeOnClose' : false,
            'destructOnRemove' : false,
            'autoOpen' : false
        }
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    // Call parent class construct
    Com.AbstractContainer.apply(that, arguments);
});

cm.getConstructor('Com.DialogContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.validateParamsEndHandler = that.validateParamsEnd.bind(that);
        // Add events
        that.addEvent('onValidateParamsEnd', that.validateParamsEndHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.validateParamsEnd = function(){
        var that = this;
        if(cm.isObject(that.params['content'])){
            that.params['params']['title'] = that.params['content']['title'] || that.params['params']['title'];
            that.params['params']['content'] = that.params['content']['content'] || that.params['params']['content'];
            that.params['params']['buttons'] = that.params['content']['buttons'] || that.params['params']['buttons'];
        }
        return that;
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        that.components['controller'].addEvent('onOpenStart', that.afterOpenControllerHandler);
        that.components['controller'].addEvent('onCloseEnd', that.afterCloseControllerHandler);
        return that;
    };
});