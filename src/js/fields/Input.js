cm.define('Com.Input', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'controllerEvents' : true,
        'maxlength' : 0,
        'max' : 0,
        'type' : 'text'
    }
},
function(params){
    var that = this;
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

    /*** VIEW MODEL ***/

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        if(that.params['type'] === 'textarea'){
            nodes['container'] = nodes['input'] = cm.node('textarea');
        }else{
            nodes['container'] = cm.node('div', {'class' : 'pt__input'},
                nodes['input'] = cm.node('input', {'type' : that.params['type']})
            );
        }
        // Attributes
        cm.setInputMaxLength(nodes['input'], that.params['maxlength'], that.params['max']);
        if(!cm.isEmpty(that.params['placeholder'])){
            nodes['input'].placeholder = that.params['placeholder'];
        }
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(nodes['input'], 'blur', that.setValueHandler);
        cm.addEvent(nodes['input'], 'blur', that.setValueHandler);
        cm.addEvent(nodes['input'], 'keypress', function(e){
            if(cm.isKeyCode(e.keyCode, 'enter')){
                cm.preventDefault(e);
                that.setValue();
                nodes['input'].blur();
            }
        });
        that.triggerEvent('onRenderContentEnd');
        // Push
        return nodes['container'];
    };

    /* *** DATA VALUE *** */

    classProto.setValue = function(triggerEvents){
        var that = this,
            value = that.nodes['content']['input'].value;
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
        that.set(value, triggerEvents);
        return that;
    };

    classProto.setData = function(){
        var that = this;
        that.nodes['content']['input'].value = that.value;
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('input', {
    'node' : cm.node('input', {'type' : 'text'}),
    'value' : '',
    'defaultValue' : '',
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Input',
    'constructorParams' : {
        'type' : 'text'
    }
});

Com.FormFields.add('textarea', {
    'node' : cm.node('textarea'),
    'value' : '',
    'defaultValue' : '',
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Input',
    'constructorParams' : {
        'type' : 'textarea'
    }
});

Com.FormFields.add('password', {
    'node' : cm.node('input', {'type' : 'password'}),
    'value' : '',
    'defaultValue' : '',
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Input',
    'constructorParams' : {
        'type' : 'password'
    }
});

Com.FormFields.add('email', {
    'node' : cm.node('input', {'type' : 'email'}),
    'value' : '',
    'defaultValue' : '',
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Input',
    'constructorParams' : {
        'type' : 'email'
    }
});

Com.FormFields.add('phone', {
    'node' : cm.node('input', {'type' : 'phone'}),
    'value' : '',
    'defaultValue' : '',
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Input',
    'constructorParams' : {
        'type' : 'phone'
    }
});

Com.FormFields.add('number', {
    'node' : cm.node('input', {'type' : 'number'}),
    'value' : '',
    'defaultValue' : '',
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Input',
    'constructorParams' : {
        'type' : 'number'
    }
});

Com.FormFields.add('hidden', {
    'node' : cm.node('input', {'type' : 'hidden'}),
    'visible' : false,
    'value' : '',
    'defaultValue' : '',
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Input',
    'constructorParams' : {
        'type' : 'hidden'
    }
});