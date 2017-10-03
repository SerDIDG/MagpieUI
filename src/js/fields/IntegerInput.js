cm.define('Com.IntegerInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'controllerEvents' : true,
        'maxlength' : 3,
        'max' : 0,
        'defaultValue' : 0,
        'allowNegative' : false,
        'type' : 'text'
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

    classProto.onValidateParams = function(){
        var that = this;
        if(cm.isNode(that.params['node'])){
            that.params['type'] = that.params['node'].getAttribute('type') || that.params['max'];
            that.params['max'] = that.params['node'].getAttribute('max') || that.params['max'];
        }
        return that;
    };

    /*** VIEW MODEL ***/

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'pt__input'},
            nodes['input'] = cm.node('input', {'type' : that.params['type']})
        );
        // Attributes
        cm.setInputMaxLength(nodes['input'], that.params['maxlength'], that.params['max']);
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

    /*** DATA VALUE ***/

    classProto.validateValue = function(value){
        var that = this;
        value = !cm.isEmpty(value) ? value : that.params['defaultValue'];
        value = parseInt(value);
        that.rawValue = !isNaN(value) ? value : '';
        return that.rawValue;
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

Com.FormFields.add('integer', {
    'node' : cm.node('input', {'type' : 'text'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.IntegerInput'
});