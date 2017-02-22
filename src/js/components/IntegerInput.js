cm.define('Com.IntegerInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'maxlength' : 3,
        'defaultValue' : 0,
        'allowNegative' : false
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.IntegerInput', function(classConstructor, className, classProto){
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
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'pt__input'},
            nodes['input'] = cm.node('input', {'type' : 'text'})
        );
        // Attributes
        if(that.params['maxlength']){
            nodes['input'].setAttribute('maxlength', that.params['maxlength']);
        }
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(nodes['input'], 'blur', that.setValueHandler);
        cm.addEvent(nodes['input'], 'keypress', function(e){
            if(cm.isKeyCode(e.keyCode, 'enter')){
                cm.preventDefault(e);
                that.setValue();
                nodes['input'].blur();
            }
        });

        if(that.params['allowNegative']){
            cm.allowOnlyNumbersInputEvent(nodes['input'], function(e, value){
                that.selectAction(that.validateValue(value), true);
            });
        }else{
            cm.allowOnlyDigitInputEvent(nodes['input'], function(e, value){
                that.selectAction(that.validateValue(value), true);
            });
        }
        that.triggerEvent('onRenderContentEnd');
        // Push
        return nodes['container'];
    };

    /* *** DATA VALUE *** */

    classProto.validateValue = function(value){
        var that = this;
        value = !cm.isEmpty(value) ? value : that.params['defaultValue'];
        that.rawValue = parseInt(value);
        return that.rawValue;
    };

    classProto.setValue = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.set(that.rawValue, triggerEvents);
        return that;
    };

    classProto.setData = function(){
        var that = this;
        that.nodes['content']['input'].value = that.rawValue;
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('integer-input', {
    'node' : cm.node('input', {'type' : 'text'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.IntegerInput'
});