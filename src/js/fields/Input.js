cm.define('Com.Input', {
    'extend' : 'Com.AbstractInput',
    'events' : [
        'onEnterPress',
        'onFocus',
        'onBlur'
    ],
    'params' : {
        'controllerEvents' : true,
        'type' : 'text',
        'lazy' : false,
        'delay' : 'cm._config.requestDelay',
        'icon' : null
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.Input', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        // Variables
        that.lazyDelay = null;
        // Bind context to methods
        that.focusHandler = that.focus.bind(that);
        that.blurHandler = that.blur.bind(that);
        that.inputEventHandler = that.inputEvent.bind(that);
        that.focusEventHandler = that.focusEvent.bind(that);
        that.blurEventHandler = that.blurEvent.bind(that);
        that.setValueHandler = that.setValue.bind(that);
        that.selectValueHandler = that.selectValue.bind(that);
        that.lazyValueHandler = that.lazyValue.bind(that);
        that.inputKeyPressHanlder = that.inputKeyPress.bind(that);
        that.iconEventHanlder = that.iconEvent.bind(that);
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onEnable = function(){
        var that = this;
        that.nodes['content']['input'].disabled = false;
    };

    classProto.onDisable = function(){
        var that = this;
        that.nodes['content']['input'].disabled = true;
    };

    /*** VIEW MODEL ***/

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.nodes['content'] = that.renderContentView();
        // Attributes
        that.renderContentAttributes();
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.renderContentEvents();
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.nodes['content']['container'];
    };

    classProto.renderContentView = function(){
        var that = this,
            nodes = {};
        if(that.params['type'] === 'textarea'){
            nodes['container'] = nodes['input'] = cm.node('textarea');
        }else{
            nodes['container'] = cm.node('div', {'class' : 'pt__input'},
                nodes['input'] = cm.node('input', {'type' : that.params['type']})
            );
            if(that.params['icon']){
                nodes['icon'] = cm.node('div', {'class' : that.params['icon']});
                cm.appendChild(nodes['icon'], nodes['container']);
            }
        }
        return nodes;
    };

    classProto.renderContentAttributes = function(){
        var that = this;
        that.nodes['content']['input'].required = that.params['required'];
        // Min / Max length
        cm.setInputMinLength(that.nodes['content']['input'], that.params['minLength'], that.params['min']);
        cm.setInputMaxLength(that.nodes['content']['input'], that.params['maxLength'], that.params['max']);
        // Placeholder / Title
        if(!cm.isEmpty(that.params['placeholder'])){
            that.nodes['content']['input'].placeholder = that.params['placeholder'];
            if(that.nodes['content']['icon']){
                that.nodes['content']['icon'].title = that.params['placeholder'];
            }
        }
        if(!cm.isEmpty(that.params['title'])){
            that.nodes['content']['input'].title = that.params['title'];
            if(that.nodes['content']['icon']){
                that.nodes['content']['icon'].title = that.params['title'];
            }
        }
        if(that.params['renderName']){
            that.nodes['content']['input'].name = that.params['visibleName'] || that.params['name'];
        }
    };

    classProto.renderContentEvents = function(){
        var that = this;
        cm.addEvent(that.nodes['content']['input'], 'input', that.inputEventHandler);
        cm.addEvent(that.nodes['content']['input'], 'focus', that.focusEventHandler);
        cm.addEvent(that.nodes['content']['input'], 'blur', that.blurEventHandler);
        cm.addEvent(that.nodes['content']['input'], 'change', that.setValueHandler);
        cm.addEvent(that.nodes['content']['input'], 'keypress', that.inputKeyPressHanlder);
        cm.addEvent(that.nodes['content']['icon'], 'click', that.iconEventHanlder);
    };

    /*** EVENTS ***/

    classProto.inputKeyPress = function(e){
        var that = this;
        if(cm.isKeyCode(e.keyCode, 'enter')){
            cm.preventDefault(e);
            that.setValue();
            that.nodes['content']['input'].blur();
            that.triggerEvent('onEnterPress', that.value);
        }
    };

    classProto.inputEvent = function(){
        var that = this;
        that.selectValue(true);
        if(that.params['lazy']){
            that.lazyValue(true);
        }
    };

    classProto.focusEvent = function(){
        var that = this;
        that.triggerEvent('onFocus', that.value);
    };

    classProto.blurEvent = function(){
        var that = this;
        that.setValue(true);
        that.triggerEvent('onBlur', that.value);
    };

    classProto.iconEvent = function(e){
        var that = this,
            value = that.nodes['content']['input'].value;
        cm.preventDefault(e);
        that.nodes['content']['input'].setSelectionRange(0, value.length);
        that.focus();
    };

    /*** DATA VALUE ***/

    classProto.lazyValue = function(triggerEvents){
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
        that.lazyDelay && clearTimeout(that.lazyDelay);
        that.lazyDelay = setTimeout(function(){
            triggerEvents && that.setValue(true);
        }, that.params['delay']);
    };

    classProto.setValue = function(triggerEvents){
        var that = this,
            value = that.nodes['content']['input'].value;
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
        that.set(value, triggerEvents);
        return that;
    };

    classProto.selectValue = function(triggerEvents){
        var that = this,
            value = that.nodes['content']['input'].value;
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
        that.selectAction(value, triggerEvents);
        return that;
    };

    classProto.setData = function(){
        var that = this;
        that.nodes['content']['input'].value = that.value;
        return that;
    };

    /******* PUBLIC *******/

    classProto.focus = function(){
        var that = this;
        that.nodes['content']['input'].focus();
        return that;
    };

    classProto.blur = function(){
        var that = this;
        that.nodes['content']['input'].blur();
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