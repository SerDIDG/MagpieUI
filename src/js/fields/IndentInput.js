cm.define('Com.IndentInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'maxlength' : 3,
        'units' : 'px',
        'defaultValue' : 0,
        'allowNegative' : false
    }
},
function(params){
    var that = this;
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
        if(!cm.isEmpty(that.params['maxlength']) && that.params['maxlength'] > 0){
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
        value = parseInt(value);
        that.rawValue = !isNaN(value) ? value : '';
        return (that.rawValue + that.params['units']);
    };

    classProto.setValue = function(triggerEvents){
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
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

Com.FormFields.add('indent', {
    'node' : cm.node('input', {'type' : 'text'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.IndentInput'
});