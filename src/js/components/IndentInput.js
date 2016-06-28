cm.define('Com.IndentInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'maxlength' : 3,
        'units' : 'px'
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.IndentInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.setValueHandler = that.setValue.bind(that);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.validateValue = function(value){
        var that = this;
        that.rawValue = parseInt(value);
        return (that.rawValue + that.params['units']);
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'pt__input'},
            that.myNodes['input'] = cm.node('input', {'type' : 'text'})
        );
        // Attributes
        if(that.params['maxlength']){
            that.myNodes['input'].setAttribute('maxlength', that.params['maxlength']);
        }
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
        cm.allowOnlyDigitInputEvent(that.myNodes['input'], function(e, value){
            that.selectAction(that.validateValue(value), true);
        });
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.setValue = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.set(that.rawValue, triggerEvents);
        return that;
    };
});