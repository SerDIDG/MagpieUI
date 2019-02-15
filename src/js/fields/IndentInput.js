cm.define('Com.IndentInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'maxLength' : 3,
        'units' : 'px',
        'defaultValue' : '',
        'allowCustom' : false,
        'allowNegative' : false
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.IndentInput', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.setValueHandler = that.setValue.bind(that);
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
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
        // Placeholder
        if(!cm.isEmpty(that.params['placeholder'])){
            nodes['input'].placeholder = that.params['placeholder'];
        }
        // Min / Max length
        cm.setInputMaxLength(nodes['input'], that.params['maxLength'], that.params['max']);
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
        if(that.params['allowCustom']){
            cm.addEvent(nodes['input'], 'input', function(e){
                that.selectAction(nodes['input'].value, true);
            });
        }else if(that.params['allowNegative']){
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
        that.rawValue = !cm.isEmpty(value) ? value : that.params['defaultValue'];
        return cm.isEmpty(that.rawValue) || isNaN(that.rawValue) ? that.rawValue : (that.rawValue + that.params['units']);
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