cm.define('Com.Input', {
    'extend': 'Com.AbstractInput',
    'events': [
        'onInputStart',
        'onEnterPress',
        'onKeyPress',
        'onKeyDown',
        'onKeyUp',
        'onIconClick',
        'onFocus',
        'onBlur'
    ],
    'params': {
        'controllerEvents': true,
        'type': 'text',
        'inputmode': null,
        'trimValue': true,
        'inputClasses': [],
        'lazy': false,
        'delay': 'cm._config.requestDelay',
        'icon': null,
        'iconTitle': null,
        'iconInsertMethod': 'appendChild',
        'autoResize': false,
        'enterPressBehavior': false,
    }
},
function() {
    Com.AbstractInput.apply(this, arguments);
});

cm.getConstructor('Com.Input', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function() {
        var that = this;
        
        // Variables
        that.selectionStartInitial = null;
        that.selectionEndInitial = null;
        that.isFocus = false;
        that.wasFocus = false;
        that.lazyDelay = null;
        that.constraints = {};
        
        // Bind context to methods
        that.focusHandler = that.focus.bind(that);
        that.blurHandler = that.blur.bind(that);
        that.inputEventHandler = that.inputEvent.bind(that);
        that.focusEventHandler = that.focusEvent.bind(that);
        that.blurEventHandler = that.blurEvent.bind(that);
        that.setValueHandler = that.setValue.bind(that);
        that.selectValueHandler = that.selectValue.bind(that);
        that.lazyValueHandler = that.lazyValue.bind(that);
        that.inputKeyDownHanlder = that.inputKeyDown.bind(that);
        that.inputKeyUpHanlder = that.inputKeyUp.bind(that);
        that.inputKeyPressHanlder = that.inputKeyPress.bind(that);
        that.iconEventHanlder = that.iconEvent.bind(that);
        
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onEnable = function() {
        var that = this;
        that.nodes.content.input.disabled = false;
    };

    classProto.onDisable = function() {
        var that = this;
        that.nodes.content.input.disabled = true;
    };

    classProto.onAfterRender = function() {
        var that = this;
        
        // Autoresize textarea
        if (that.params.type === 'textarea' && that.params.autoResize) {
            cm.addClass(that.nodes.content.input, 'cm-autoresize');
            Part.Autoresize(that.nodes.container);
        }
    };

    /*** VIEW MODEL ***/

    classProto.renderContent = function() {
        var that = this;
        that.triggerEvent('onRenderContentStart');

        // Structure
        that.nodes.content = that.renderContentView();

        // Attributes
        that.renderContentAttributes();

        // Events
        that.triggerEvent('onRenderContentProcess');
        that.renderContentEvents();
        that.triggerEvent('onRenderContentEnd');

        // Push
        return that.nodes.content.container;
    };

    classProto.renderContentView = function() {
        var that = this;

        // Structure
        var nodes = {};
        nodes.container = cm.node('div', {classes: 'pt__input'},
            nodes.inner = cm.node('div', {classes: 'inner'})
        );

        // Input
        if (that.params.type === 'textarea') {
            nodes.input = cm.node('textarea', {classes: that.params.inputClasses});
            cm.addClass(nodes.container, 'pt__input--textarea');
            cm.addClass(that.nodes.container, 'com__input--textarea');
        } else {
            nodes.input = cm.node('input', {classes: that.params.inputClasses, type: that.params.type});
        }
        cm.appendChild(nodes.input, nodes.inner);

        // Icon
        if (that.params.icon) {
            if (cm.isNode(that.params.icon)) {
                nodes.icon = that.params.icon
            } else {
                nodes.icon = cm.node('div', {classes: that.params.icon});
            }
            if (!cm.isEmpty(that.params.iconTitle)) {
                nodes.icon.title = that.params.iconTitle;
            }
            cm[that.params.iconInsertMethod](nodes.icon, nodes.inner);
        }

        // Append
        return nodes;
    };

    classProto.renderContentAttributes = function() {
        var that = this;

        // Required
        that.nodes.content.input.required = that.params.required;
        
        // Min / Max length
        cm.setInputMinLength(that.nodes.content.input, that.params.minLength, that.params.min);
        cm.setInputMaxLength(that.nodes.content.input, that.params.maxLength, that.params.max, that.params.limitMaxLength);
        
        // Placeholder / Title
        if (!cm.isEmpty(that.params.placeholder)) {
            that.nodes.content.input.placeholder = that.params.placeholder;
            if (that.nodes.content.icon) {
                that.nodes.content.icon.title = that.params.placeholder;
            }
        }
        if (!cm.isEmpty(that.params.title)) {
            that.nodes.content.input.title = that.params.title;
            if (that.nodes.content.icon) {
                that.nodes.content.icon.title = that.params.title;
            }
        }
        if (!cm.isEmpty(that.params.ariaLabel)) {
            that.nodes.content.input.setAttribute('aria-label', that.params.ariaLabel);
        }

        // Attributes
        if (!cm.isEmpty(that.params.id)) {
            that.nodes.content.input.setAttribute('id', that.params.id);
        }
        if (!cm.isEmpty(that.params.inputmode)) {
            that.nodes.content.input.setAttribute('inputmode', that.params.inputmode);
        }
        if (!cm.isEmpty(that.params.autocomplete)) {
            that.nodes.content.input.setAttribute('autocomplete', that.params.autocomplete);
        }
        if (that.params.renderName) {
            that.nodes.content.input.name = that.params.visibleName || that.params.name;
        }
    };

    classProto.renderContentEvents = function() {
        var that = this;
        cm.addEvent(that.nodes.content.input, 'input', that.inputEventHandler);
        cm.addEvent(that.nodes.content.input, 'focus', that.focusEventHandler);
        cm.addEvent(that.nodes.content.input, 'blur', that.blurEventHandler);
        cm.addEvent(that.nodes.content.input, 'change', that.setValueHandler);
        cm.addEvent(that.nodes.content.input, 'keydown', that.inputKeyDownHanlder);
        cm.addEvent(that.nodes.content.input, 'keyup', that.inputKeyUpHanlder);
        cm.addEvent(that.nodes.content.input, 'keypress', that.inputKeyPressHanlder);
        cm.addEvent(that.nodes.content.icon, 'mousedown', that.iconEventHanlder);
        cm.addEvent(that.nodes.content.icon, 'click', that.iconEventHanlder);
    };

    /*** EVENTS ***/

    classProto.inputKeyDown = function(e) {
        var that = this;
        that.triggerEvent('onKeyDown', that.value, e);
        that.selectionStartInitial = that.nodes.content.input.selectionStart;
        that.selectionEndInitial = that.nodes.content.input.selectionStart;
        that.triggerEvent('onInputStart', that.value);

        // Handle enter key
        if (cm.isKeyCode(e.keyCode, 'enter')) {
            // For input
            if (that.params.type !== 'textarea') {
                cm.preventDefault(e);
                that.setValue();
                that.blur();
                that.triggerEvent('onEnterPress', that.value);
            }

            // Special behavior for textarea: press Enter without Shift key for triggering onEnterPress event
            if (
                that.params.type === 'textarea' &&
                that.params.enterPressBehavior && (that.params.enterPressBehavior === 'all' || !e.shiftKey)
            ) {
                cm.preventDefault(e);
                that.setValue();
                that.blur();
                that.triggerEvent('onEnterPress', that.value);
            }
        }
    };

    classProto.inputKeyUp = function(e) {
        var that = this;
        that.triggerEvent('onKeyUp', that.value, e);
    };

    classProto.inputKeyPress = function(e) {
        var that = this;
        that.triggerEvent('onKeyPress', that.value, e);
    };

    classProto.inputEvent = function() {
        var that = this;
        that.execConstraint('onInput', false);
        that.selectValue(true);
        if (that.params['lazy']) {
            that.lazyValue(true);
        }
    };

    classProto.focusEvent = function() {
        var that = this;
        that.isFocus = true;
        that.execConstraint('onFocus', false);
        that.triggerEvent('onFocus', that.value);
    };

    classProto.blurEvent = function() {
        var that = this;
        that.isFocus = false;
        that.execConstraint('onBlur', false);
        that.setValue(true);
        that.triggerEvent('onBlur', that.value);
    };

    classProto.iconEvent = function(e) {
        var that = this;
        cm.preventDefault(e);
        if (e.type === 'mousedown') {
            that.wasFocus = that.isFocus;
        }
        if (e.type === 'click') {
            if (!that.wasFocus) {
                that.focus(true);
            }
            that.triggerEvent('onIconClick');
        }
    };

    /*** CONSTRAINT ***/

    classProto.addConstraint = function(eventName, handler) {
        var that = this;
        if (cm.isFunction(handler)) {
            that.constraints[eventName] = handler;
        }
        return that;
    };

    classProto.removeConstraint = function(eventName, handler) {
        var that = this;
        that.constraints[eventName] = null;
        return that;
    };

    classProto.execConstraint = function(eventName, triggerEvents) {
        var that = this,
            selectionStart,
            value,
            valueBounded;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        if (cm.isFunction(that.constraints[eventName])) {
            selectionStart = that.nodes.content.input.selectionStart;
            value = that.nodes.content.input.value;
            valueBounded = that.constraints[eventName](value);
            
            // Set bounded value
            that.nodes.content.input.value = that.constraints[eventName](value);
            
            // Restore caret position
            if (value.indexOf(valueBounded) > -1 || value === valueBounded) {
                that.nodes.content.input.setSelectionRange(selectionStart, selectionStart);
            } else {
                that.nodes.content.input.setSelectionRange(that.selectionStartInitial, that.selectionStartInitial);
            }
            
            // Trigger events
            if (triggerEvents) {
                switch (eventName) {
                    case 'onInput':
                        that.selectValue(true);
                        break;
                    case 'onChange':
                        that.setValue(true);
                        break;
                }
            }
        }
        return that;
    };

    /*** DATA VALUE ***/

    classProto.lazyValue = function(triggerEvents) {
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.lazyDelay && clearTimeout(that.lazyDelay);
        that.lazyDelay = setTimeout(function() {
            triggerEvents && that.setValue(true);
        }, that.params.delay);
    };

    classProto.setValue = function(triggerEvents) {
        var that = this,
            value = that.nodes.content.input.value;
        if (that.params.trimValue) {
            value = value.trim();
        }
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.set(value, triggerEvents);
        return that;
    };

    classProto.selectValue = function(triggerEvents) {
        var that = this,
            value = that.nodes.content.input.value;
        if (that.params.trimValue) {
            value = value.trim();
        }
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.selectAction(value, triggerEvents);
        return that;
    };

    classProto.setData = function(value) {
        var that = this;
        that.nodes.content.input.value = !cm.isUndefined(value) ? value : that.value;
        return that;
    };

    /******* PUBLIC *******/

    classProto.focus = function(selection) {
        var that = this;
        if (selection === true) {
            var value = that.nodes.content.input.value;
            that.nodes.content.input.setSelectionRange(0, value.length);
        }
        that.nodes.content.input.focus();
        return that;
    };

    classProto.blur = function() {
        var that = this;
        that.nodes.content.input.blur();
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('input', {
    'node': cm.node('input', {'type': 'text'}),
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.Input',
    'constructorParams': {
        'type': 'text'
    }
});

Com.FormFields.add('textarea', {
    'node': cm.node('textarea'),
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.Input',
    'constructorParams': {
        'type': 'textarea'
    }
});

Com.FormFields.add('password', {
    'node': cm.node('input', {'type': 'password'}),
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.Input',
    'constructorParams': {
        'type': 'password'
    }
});

Com.FormFields.add('email', {
    'node': cm.node('input', {'type': 'email'}),
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.Input',
    'constructorParams': {
        'type': 'email'
    }
});

Com.FormFields.add('url', {
    'node': cm.node('input', {'type': 'url'}),
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.Input',
    'constructorParams': {
        'type': 'url'
    }
});


Com.FormFields.add('search', {
    'node': cm.node('input', {'type': 'search', 'inputmode': 'search', 'autocomplete': 'off'}),
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.Input',
    'constructorParams': {
        'type': 'search',
        'inputmode': 'search',
    }
});

Com.FormFields.add('phone', {
    'node': cm.node('input', {'type': 'tel'}),
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.Input',
    'constructorParams': {
        'type': 'tel'
    }
});

Com.FormFields.add('number', {
    'node': cm.node('input', {'type': 'number'}),
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.Input',
    'constructorParams': {
        'type': 'number'
    }
});

Com.FormFields.add('hidden', {
    'node': cm.node('input', {'type': 'hidden'}),
    'visible': false,
    'adaptive': false,
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.Input',
    'constructorParams': {
        'type': 'hidden'
    }
});
