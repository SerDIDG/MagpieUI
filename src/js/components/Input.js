cm.define('Com.Input', {
    'extend' : 'Com.AbstractInput',
    'params' : {
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.Input', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.setValueHandler = that.setValue.bind(that);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'pt__input'},
            that.myNodes['input'] = cm.node('input', {'type' : 'text'})
        );
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['input'], 'blur', that.setValueHandler);
        cm.addEvent(that.myNodes['input'], 'keypress', function(e){
            if(cm.isKeyCode(e.keyCode, 'enter')){
                cm.preventDefault(e);
                that.setValue();
                that.myNodes['input'].blur();
            }
        });
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.setValue = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.set(that.myNodes['input'].value, triggerEvents);
        return that;
    };
});