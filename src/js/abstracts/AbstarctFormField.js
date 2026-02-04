cm.define('Com.AbstractFormField', {
    'extend': 'Com.AbstractController',
    'events': [
        'onShow',
        'onHide',
        'onFocus',
        'onBlur',
        'onValidate',
        'onChange',
        'onInput',
        'onSelect',
        'onReset',
        'onRequestStart',
        'onRequestEnd',
        'onRequestSuccess',
        'onRequestError',
        'onRequestAbort',
        'onFieldConstructed',
    ],
    'params': {
        'renderStructure': true,
        'embedStructureOnRender': true,
        'removeOnDestruct': false,
        'controllerEvents': true,
        'renderStructureField': true,
        'renderStructureContent': true,
        'renderError': true,
        'renderErrorMessage': true,
        'renderRequiredMessage': false,
        'form': false,
        'outputValueType': 'auto',      // 'auto' | 'raw' | 'text' | 'option'
        'inputValueType': 'auto',       // 'auto' | 'unset'
        'validateValueType': 'auto',
        'value': null,
        'values': null,
        'defaultValue': null,
        'dataValue': null,
        'isValueOption': false,
        'setHiddenValue': true,
        'minLength': 0,
        'maxLength': 0,
        'min': 0,
        'max': 0,
        'multiple': false,
        'type': false,
        'label': '',
        'icon': false,
        'placeholder': '',
        'placeholderAsterisk': true,
        'autocomplete': null,
        'showPlaceholderAbove': false,
        'title': '',
        'hint': '',
        'messagePosition': 'content', // label | content
        'adaptive': true,
        'visible': true,
        'disabled': false,
        'readOnly': false,
        'checked': null,
        'renderName': false,
        'inputClasses': [],
        'options': [],
        'constraints': [
            /* cm.constraintsPattern(/^\s*$/g, false, message), */
            /* cm.constraintsPattern(10, false, message) */
            /* cm.constraintsPattern(function, true, message) */
        ],
        'required': false,
        'requiredAsterisk': true,
        'validate': false,
        'constructor': false,
        'constructorParams': {
            'removeOnDestruct': false
        },
        'preload': false,
        'responseKey': 'data',
        'ajax': {
            'type': 'json',
            'method': 'get'
        },

        'help': null,
        'helpType': 'tooltip', // tooltip | container
        'helpAlign': 'left',
        'helpConstructor': 'Com.HelpBubble',
        'helpParams': {
            'renderStructure': true,
            'embedStructureOnRender': true
        }
    },
    'strings': {
        'required': 'This field is required.',
        'too_short': 'Value should be at least %count% characters.',
        'too_long': 'Value should be less than %count% characters.',
        'asterisk': {
            'char': '*',
            'title': 'Required',
            'ariaLabel': '(required)',
        },
    }
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.AbstractFormField', function(classConstructor, className, classProto, classInherit) {
    /******* SYSTEM *******/

    classProto.onConstructStart = function() {
        const that = this;
        
        // Variables
        that.fieldName = null;
        that.isVisible = null;
        that.isAjax = false;
        that.isProcess = false;
        that.isPreloaded = false;
        that.isFocus = false;
        that.wasFocus = false;
        that.nodeTagName = null;
        
        // Bind context
        that.focusHandler = that.focus.bind(that);
        that.blurHandler = that.blur.bind(that);
        that.focusEventHandler = that.focusEvent.bind(that);
        that.blurEventHandler = that.blurEvent.bind(that);
        that.inputEventHandler = that.inputEvent.bind(that);
        that.selectEventHandler = that.selectEvent.bind(that);
        that.changeEventHandler = that.changeEvent.bind(that);
        that.resetEventHandler = that.resetEvent.bind(that);
        that.iconEventHandler = that.iconEvent.bind(that);
    };

    classProto.onAfterRender = function() {
        const that = this;
        that.params.disabled && that.disable();
        return that;
    };

    classProto.onConstructEnd = function() {
        const that = this;
        if (that.isAjax) {
            that.ajaxHandler = that.callbacks.request(that, cm.clone(that.params.ajax));
        }
    };

    classProto.onDestruct = function() {
        const that = this;
        if (that.isAjax) {
            that.ajaxHandler.abort();
        }
        that.controller && cm.isFunction(that.controller.destruct) && that.controller.destruct();
    };

    classProto.onValidateParams = function() {
        const that = this;
        that.validateParamsValue();

        // Validate
        that.nodeTagName = that.params.node.tagName.toLowerCase();
        that.fieldName = that.params.formName + '[' + that.params.name + ']';
        if (
            that.params.required &&
            that.params.requiredAsterisk &&
            that.params.placeholderAsterisk &&
            !cm.isEmpty(that.params.placeholder)
        ) {
            that.params.placeholder = [that.params.placeholder, that.msg('asterisk.char')].join(' ');
        }
        if (that.params.validateValueType === 'auto') {
            that.params.validateValueType = that.params.outputValueType;
        }

        // Validate options
        if (!cm.isEmpty(that.params.options)) {
            that.params.options = that.callbacks.convert(that, that.params.options);
        }

        // Validate input constructor params
        that.params.constructorParams = cm.merge(that.validateConstructorParams(), that.params.constructorParams);

        // Validate help params
        that.params.helpParams = cm.merge(that.validateHelpParams(), that.params.helpParams);

        // Components
        that.components.form = that.params.form;

        // Ajax
        if (that.params.preload && !cm.isEmpty(that.params.ajax) && !cm.isEmpty(that.params.ajax.url)) {
            that.isAjax = true;
        }
    };

    classProto.validateParamsValue = function() {
        const that = this;
        that.params.value = that.validateParamsValueHelper(that.params.value);
        that.params.defaultValue = that.validateParamsValueHelper(that.params.defaultValue);
        that.params.value = !cm.isEmpty(that.params.value) ? that.params.value : that.params.defaultValue;
        that.params.dataValue = !cm.isEmpty(that.params.dataValue) ? that.params.dataValue : that.params.isValueOption ? that.params.value : null;
    };

    classProto.validateParamsValueHelper = function(value) {
        const that = this;
        if (that.params.isValueOption && !cm.isEmpty(value)) {
            if (cm.isObject(value)) {
                value.value = !cm.isEmpty(value.value) ? value.value : value.text;
                value.text = !cm.isEmpty(value.text) ? value.text : value.value;
            } else {
                value = {
                    'value': value,
                    'text': value
                };
            }
        }
        return value;
    };

    classProto.validateConstructorParams = function() {
        const that = this;
        var params = {};
        var options = [
            'id',
            'title',
            'name',
            'visibleName',
            'renderName',
            'defaultValue',
            'values',
            'options',
            'required',
            'renderRequiredMessage',
            'validate',
            'disabled',
            'readOnly',
            'checked',
            'minLength',
            'maxLength',
            'min',
            'max',
            'multiple',
            'autocomplete',
            'ajax'
        ];
        cm.forEach(options, function(item) {
            if (typeof that.params[item] !== 'undefined') {
                params[item] = that.params[item];
            }
        });

        params.field = that;
        params.fieldName = that.fieldName;
        params.value = !cm.isEmpty(that.params.dataValue) ? that.params.dataValue : that.params.value;
        params.placeholder = !that.params.showPlaceholderAbove ? that.params.placeholder : '';

        return params;
    };

    classProto.validateHelpParams = function() {
        const that = this;
        return {
            title: that.params.label,
            content: that.params.help,
            name: that.params.name,
            type: that.params.helpType,
            align: that.params.helpAlign,
        };
    };

    /******* VIEW - MODEL *******/

    classProto.renderView = function() {
        const that = this;
        that.triggerEvent('onRenderViewStart');
        
        // Render field structure
        if (that.params.renderStructureField) {
            that.renderFiled();
        }
        
        // Render custom structure
        if (that.params.renderStructureContent) {
            that.nodes.content = that.renderContent();
            that.nodes.contentContainer = that.nodes.content.container;
            that.nodes.contentInput = that.nodes.content.input;
        }
        
        // Append
        if (that.params.renderStructureField) {
            cm.insertFirst(that.nodes.contentContainer, that.nodes.value);
        } else if (that.params.renderStructureContent) {
            that.nodes.container = that.nodes.contentContainer;
        } else {
            that.nodes.contentContainer = that.nodes.container = that.params.node;
            that.nodes.contentInput = that.params.node;
        }
        
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
    };

    classProto.renderFiled = function() {
        const that = this;

        // Structure
        that.nodes.container = cm.node('dl', {classes: 'pt__field'},
            that.nodes.label = cm.node('dt'),
            that.nodes.value = cm.node('dd')
        );

        switch (that.params.messagePosition) {
            case 'label':
                that.nodes.messages = that.nodes.label;
                break;
            case 'content':
            case 'value':
                that.nodes.messages = that.nodes.value;
                break;
        }

        // Label
        that.renderFiledLabel();

        // Hints
        if (!cm.isEmpty(that.params.hint)) {
            that.renderHint(that.params.hint);
        }
    };

    classProto.renderFiledLabel = function() {
        const that = this;

        // Label
        if (!cm.isEmpty(that.params.label)) {
            that.nodes.labelText = cm.node('label');
            if (that.params.renderName) {
                that.nodes.labelText.setAttribute('for', that.fieldName)
            }
            if (cm.isNode(that.params.label)) {
                cm.appendChild(that.params.label, that.nodes.labelText);
            } else {
                that.nodes.labelText.innerHTML = that.params.label;
            }
            cm.appendChild(that.nodes.labelText, that.nodes.label);
        }

        // Required
        that.nodes.required = cm.node('span', {
            classes: 'required',
            title: that.msg('asterisk.title'),
            'aria-label': that.msg('asterisk.ariaLabel')
        }, that.msg('asterisk.char'));
        
        if (that.params.required && that.params.requiredAsterisk) {
            cm.appendChild(that.nodes.required, that.nodes.labelText || that.nodes.label);
        }
    };

    classProto.renderContent = function() {
        const that = this;
        
        // Structure
        var nodes = {
            input: that.params.node,
        };
        nodes.container = cm.node('div', {classes: 'pt__field__content'}, nodes.input);

        // Icon
        if (that.params.icon) {
            if (cm.isNode(that.params.icon)) {
                nodes.icon = that.params.icon;
            } else {
                nodes.icon = cm.node('div', {classes: that.params.icon});
            }
            cm.addEvent(nodes.icon, 'mousedown', that.iconEventHandler);
            cm.addEvent(nodes.icon, 'click', that.iconEventHandler);

            nodes.field = cm.node('div', {classes: 'pt__input'}, nodes.input, nodes.icon);
            cm.addClass(nodes.field, that.params.inputClasses)
            cm.appendChild(nodes.field, nodes.container);
        }

        // Placeholder
        if (that.params.showPlaceholderAbove && !cm.isEmpty(that.params.placeholder)) {
            nodes.placeholder = cm.node('label', {classes: 'placeholder'},
                nodes.placeholderLabel = cm.node('span', {innerHTML: that.params.placeholder})
            );
            if (that.params.renderName) {
                nodes.placeholder.setAttribute('for', that.fieldName);
            }
            if (!cm.isEmpty(that.params.label)) {
                nodes.placeholder.setAttribute('aria-hidden', 'true');
            }
            cm.appendChild(nodes.placeholder, nodes.container);
            cm.addClass(nodes.container, 'is-placeholder-above');
        }

        // Export
        return nodes;
    };

    classProto.renderOptions = function(options) {
        const that = this;
        switch (that.nodeTagName) {
            case 'select' :
                cm.forEach(options, function(item) {
                    item.disabled = !cm.isUndefined(item.disabled) ? item.disabled : false;
                    item.hidden = !cm.isUndefined(item.hidden) ? item.hidden : false;

                    const option = cm.node('option', {
                        value: item.value,
                        innerHTML: item.text
                    });
                    option.hidden = item.hidden;
                    option.disabled = item.disabled;

                    cm.appendChild(option, that.nodes.contentInput);
                });
                cm.setSelect(that.nodes.contentInput, that.params.value);
                break;
        }
    };

    classProto.setAttributes = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.setAttributes.apply(that, arguments);

        // Attributes
        if (that.params.renderStructureContent) {
            that.setInputAttributes();
        }

        // Classes
        if (that.params.adaptive) {
            cm.addClass(that.nodes.container, 'is-adaptive');
        }

        if (!that.params.visible) {
            that.hide(false);
        } else {
            that.show(false);
        }
    };

    classProto.setInputAttributes = function() {
        const that = this;

        if (!cm.isEmpty(that.fieldName)) {
            that.nodes.contentInput.setAttribute('id', that.fieldName);
        }
        if (!cm.isEmpty(that.params.name)) {
            that.nodes.contentInput.setAttribute('name', that.params.name);
        }

        if (!cm.isEmpty(that.params.value) && that.params.inputValueType !== 'unset') {
            let value;
            if (that.params.isValueOption) {
                value = that.params.value.value;
            } else if (cm.isObject(that.params.value) || cm.isArray(that.params.value)) {
                value = cm.stringifyJSON(that.params.value);
            } else {
                value = that.params.value;
            }
            switch (that.nodeTagName) {
                case 'select':
                    cm.setSelect(that.nodes.contentInput, value);
                    break;
                default:
                    that.nodes.contentInput.setAttribute('value', value);
                    break;
            }
        }

        if (!cm.isEmpty(that.params.dataValue) && that.params.inputValueType !== 'unset') {
            let dataValue;
            if (cm.isObject(that.params.dataValue) || cm.isArray(that.params.dataValue)) {
                dataValue = cm.stringifyJSON(that.params.dataValue);
            } else {
                dataValue = that.params.dataValue;
            }
            that.nodes.contentInput.setAttribute('data-value', dataValue);
        }

        if (!cm.isEmpty(that.params.placeholder) && !that.params.showPlaceholderAbove) {
            that.nodes.contentInput.setAttribute('placeholder', that.params.placeholder);
            if (cm.isEmpty(that.params.label) && cm.isEmpty(that.params.title)) {
                that.nodes.contentInput.setAttribute('aria-label', that.params.placeholder);
            }
        }

        if (!cm.isEmpty(that.params.autocomplete)) {
            that.nodes.contentInput.setAttribute('autocomplete', that.params.autocomplete);
        }
        if (!cm.isEmpty(that.params.title)) {
            that.nodes.contentInput.setAttribute('title', that.params.title);
        }
        if (that.params.disabled) {
            that.nodes.contentInput.setAttribute('disabled', 'disabled');
        }
        if (that.params.multiple) {
            that.nodes.contentInput.setAttribute('multiple', 'multiple');
        }
    };

    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Options
        if (that.params.renderStructureContent && that.params.inputValueType !== 'unset' && !cm.isEmpty(that.params.options)) {
            that.renderOptions(that.params.options);
        }

        // Help Bubble
        if (that.params.renderStructureField && !cm.isEmpty(that.params.help)) {
            cm.getConstructor(that.params.helpConstructor, function(classConstructor) {
                that.components.help = new classConstructor(
                    cm.merge(that.params.helpParams, {
                        container: that.nodes.label
                    })
                );
            });
        }
        
        // Controller component
        if (!that.isAjax || that.isPreloaded) {
            that.renderController();
        }
    };

    classProto.renderController = function() {
        const that = this;
        if (that.params.constructor) {
            cm.getConstructor(that.params.constructor, function(classConstructor) {
                that.components.controller = new classConstructor(
                    cm.merge(that.params.constructorParams, {
                        node: that.nodes.contentInput,
                        form: that.components.form,
                        formField: that,
                    })
                );
                that.renderControllerEvents();
                that.togglePlaceholder();
            });
        }
    };

    classProto.renderControllerEvents = function() {
        const that = this;
        that.components.controller.addEvent('onFocus', that.focusEventHandler);
        that.components.controller.addEvent('onBlur', that.blurEventHandler);
        that.components.controller.addEvent('onSelect', that.selectEventHandler);
        that.components.controller.addEvent('onInput', that.inputEventHandler);
        that.components.controller.addEvent('onChange', that.changeEventHandler);
        that.components.controller.addEvent('onReset', that.resetEventHandler);
    };

    classProto.togglePlaceholder = function() {
        const that = this;
        if (that.params.showPlaceholderAbove) {
            if (that.params.showPlaceholderAbove === 'always' || that.isFocus || !cm.isEmpty(that.getText())) {
                cm.addClass(that.nodes.content.placeholder, 'pull-top');
            } else {
                cm.removeClass(that.nodes.content.placeholder, 'pull-top');
            }
        }
    };

    /******* EVENTS *******/

    classProto.focusEvent = function(controller, data) {
        const that = this;
        that.isFocus = true;
        that.togglePlaceholder();
        that.triggerEvent('onFocus', data);
    };

    classProto.blurEvent = function(controller, data) {
        const that = this;
        that.isFocus = false;
        that.togglePlaceholder();
        that.triggerEvent('onBlur', data);
    };

    classProto.inputEvent = function(controller, data) {
        const that = this;
        that.triggerEvent('onInput', data);
    };

    classProto.selectEvent = function(controller, data) {
        const that = this;
        that.triggerEvent('onSelect', data);
    };

    classProto.changeEvent = function(controller, data) {
        const that = this;
        that.togglePlaceholder();
        that.triggerEvent('onChange', data);
    };

    classProto.resetEvent = function(controller, data) {
        const that = this;
        that.togglePlaceholder();
        that.triggerEvent('onReset', data);
    };

    classProto.iconEvent = function(e) {
        const that = this;
        if (e.type === 'mousedown') {
            that.wasFocus = that.isFocus;
        }
        if (e.type === 'click' && !that.wasFocus) {
            that.focus(true);
        }
    };

    /******* DATA *******/

    classProto.set = function(value, triggerEvents) {
        const that = this;
        that.components.controller && cm.isFunction(that.components.controller.set) && that.components.controller.set(value, triggerEvents);
        return that;
    };

    classProto.get = function(type) {
        const that = this;
        type = !cm.isUndefined(type) ? type : that.params.outputValueType;
        switch (type) {
            case 'raw':
                return that.getRaw();
            case 'text':
                return that.getText();
            case 'json':
                return that.getJSON();
            case 'option':
                return that.getValueOption();
            default:
                return that.components.controller && cm.isFunction(that.components.controller.get) ? that.components.controller.get() : null;
        }
    };

    classProto.getRaw = function() {
        const that = this;
        return that.components.controller && cm.isFunction(that.components.controller.getRaw) ? that.components.controller.getRaw() : that.get('auto');
    };

    classProto.getText = function() {
        const that = this;
        return that.components.controller && cm.isFunction(that.components.controller.getText) ? that.components.controller.getText() : that.get('auto');
    };

    classProto.getJSON = function() {
        const that = this;
        return that.components.controller && cm.isFunction(that.components.controller.getJSON) ? that.components.controller.getJSON() : that.get('auto');
    };

    classProto.getValueOption = function() {
        const that = this;
        return that.components.controller && cm.isFunction(that.components.controller.getValueOption) ? that.components.controller.getValueOption() : that.get('auto');
    };

    classProto.reset = function() {
        const that = this;
        that.components.controller && cm.isFunction(that.components.controller.reset) && that.components.controller.reset();
        return that;
    };

    classProto.validateValue = function(data) {
        const that = this;

        // Validate data config
        data = cm.merge({
            field: that,
            form: that.components.form,
            valid: true,
            message: null,
            value: that.get(that.params.validateValueType),
            required: false,
            silent: false,
            triggerEvents: true,
        }, data);

        data.required = that.params.required || data.required;

        if (cm.isEmpty(data.value)) {
            if (data.required) {
                data.valid = false;
                if (that.params.renderRequiredMessage) {
                    data.message = that.msg('required');
                }
                return data;
            } else {
                data.valid = true;
                return data;
            }
        }
        if (that.params.minLength && data.value.length < that.params.minLength) {
            data.valid = false;
            data.message = that.msg('too_short', {
                '%count%': that.params.minLength
            });
            return data;
        }
        if (that.params.maxLength && data.value.length > that.params.maxLength) {
            data.valid = false;
            data.message = that.msg('too_long', {
                '%count%': that.params.maxLength
            });
            return data;
        }
        if (!cm.isEmpty(that.params.constraints)) {
            var testData = cm.clone(data);
            var constraintsData = that.validateConstraints(testData);
            if (constraintsData) {
                return constraintsData;
            }
        }
        if (that.components.controller && cm.isFunction(that.components.controller.validator)) {
            return that.components.controller.validator(data);
        }
        return data;
    };

    classProto.validate = function(data) {
        const that = this;

        // Validate data config
        data = cm.merge({
            required: false,
            silent: false,
            triggerEvents: true,
        }, data);

        data.validate = that.params.validate;
        data.required = that.params.required || data.required;

        if (!data.required && !data.validate) {
            return true;
        }

        data = that.validateValue(data);
        if (data.valid || data.silent) {
            that.clearError();
        } else {
            that.renderError(data.message);
        }

        if (data.triggerEvents && !data.silent) {
            that.triggerEvent('onValidate', data);
        }

        return data.valid;
    };

    /*** CONSTRAINTS ***/

    classProto.addConstraint = function(constraint) {
        const that = this;
        if (cm.isFunction(constraint)) {
            that.params.constraints = cm.arrayAdd(that.params.constraints, constraint);
        }
        return that;
    };

    classProto.removeConstraint = function(constraint) {
        const that = this;
        if (cm.isFunction(constraint)) {
            that.params.constraints = cm.arrayRemove(that.params.constraints, constraint);
        }
        return that;
    };

    classProto.validateConstraints = function(data) {
        var that = this,
            constraintsTest,
            constraintsData;
        constraintsTest = that.params.constraints.some(function(item) {
            if (cm.isFunction(item)) {
                constraintsData = item(data);
                return !constraintsData.valid;
            }
            return false;
        });
        if (constraintsTest) {
            return constraintsData;
        }
        return false;
    };

    /******* MESSAGES *******/

    classProto.renderHint = function(message, params) {
        const that = this;
        params = cm.merge({
            className: null
        }, params);

        that.clearHint();

        // Structure
        that.nodes.hints = cm.node('ul', {classes: 'pt__field__hint'});
        if (cm.isArray(message)) {
            cm.forEach(message, function(messageItem) {
                that.renderHintMessage(messageItem, params);
            });
        } else {
            that.renderHintMessage(message, params);
        }

        // Append
        if (that.params.renderError && that.nodes.errors && cm.inDOM(that.nodes.errors)) {
            cm.insertBefore(that.nodes.hints, that.nodes.errors);
        } else {
            cm.appendChild(that.nodes.hints, that.nodes.messages);
        }

        return that;
    };

    classProto.toggleHintVisibility = function(value) {
        const that = this;
        cm.toggleClass(that.nodes.hints, 'is-hidden', !value);
    }

    classProto.renderHintMessage = function(message, params) {
        const that = this;
        const node = cm.node('li', {innerHTML: message, classes: params.className});
        cm.appendChild(node, that.nodes.hints);
    };

    classProto.clearHint = function() {
        const that = this;
        cm.remove(that.nodes.hints);
        return that;
    };

    classProto.renderError = function(message, params) {
        var that = this,
            messageNode;
        params = cm.merge({
            'className': 'error'
        }, params);

        that.clearError();
        if (!that.params.renderError) {
            return that;
        }

        cm.addClass(that.nodes.container, 'error');
        cm.addClass(that.nodes.contentContainer, 'error');
        if (that.params.renderErrorMessage && !cm.isEmpty(message)) {
            that.nodes.errors = cm.node('ul', {classes: 'pt__field__error pt__field__hint'},
                messageNode = cm.node('li', {innerHTML: message})
            );
            if (!cm.isEmpty(params.className)) {
                cm.addClass(messageNode, params.className);
            }
            cm.insertLast(that.nodes.errors, that.nodes.messages);
        }

        return that;
    };

    classProto.clearError = function() {
        const that = this;
        cm.removeClass(that.nodes.container, 'error');
        cm.removeClass(that.nodes.contentContainer, 'error');
        cm.remove(that.nodes.errors);
        return that;
    };

    /******* PUBLIC *******/

    classProto.show = function(triggerEvent) {
        const that = this;
        triggerEvent = cm.isUndefined(triggerEvent) ? true : triggerEvent;
        if (!cm.isBoolean(that.isVisible) || !that.isVisible) {
            that.isVisible = true;
            cm.removeClass(that.nodes.container, 'is-hidden');
            triggerEvent && that.triggerEvent('onShow', that.get());
        }
        return that;
    };

    classProto.hide = function(triggerEvent) {
        const that = this;
        triggerEvent = cm.isUndefined(triggerEvent) ? true : triggerEvent;
        if (!cm.isBoolean(that.isVisible) || that.isVisible) {
            that.isVisible = false;
            cm.addClass(that.nodes.container, 'is-hidden');
            triggerEvent && that.triggerEvent('onHide', that.get());
        }
        return that;
    };

    classProto.toggleVisibility = function(value, triggerEvent) {
        const that = this;
        if (value) {
            that.show(triggerEvent);
        } else {
            that.hide(triggerEvent);
        }
        return that;
    };

    classProto.enable = function() {
        const that = this;
        cm.removeClass(that.nodes.container, 'disabled');
        cm.removeClass(that.nodes.contentContainer, 'disabled');
        that.components.controller && cm.isFunction(that.components.controller.enable) && that.components.controller.enable();
        return that;
    };

    classProto.disable = function() {
        const that = this;
        cm.addClass(that.nodes.container, 'disabled');
        cm.addClass(that.nodes.contentContainer, 'disabled');
        that.components.controller && cm.isFunction(that.components.controller.disable) && that.components.controller.disable();
        return that;
    };

    classProto.focus = function(selection) {
        const that = this;
        that.components.controller && cm.isFunction(that.components.controller.focus) && that.components.controller.focus(selection);
        return that;
    };

    classProto.blur = function() {
        const that = this;
        that.components.controller && cm.isFunction(that.components.controller.blur) && that.components.controller.blur();
        return that;
    };

    classProto.setRequired = function() {
        const that = this;
        that.params.required = true;
        if (that.params.requiredAsterisk) {
            cm.appendChild(that.nodes.required, that.nodes.labelText || that.nodes.label);
        }
        return that;
    };

    classProto.unsetRequired = function() {
        const that = this;
        that.params.required = false;
        cm.remove(that.nodes.required);
        return that;
    };

    classProto.toggleRequired = function(value) {
        const that = this;
        if (value) {
            that.setRequired();
        } else {
            that.unsetRequired();
        }
        return that;
    };

    classProto.isRequired = function() {
        const that = this;
        return that.params.required;
    };

    classProto.getController = function() {
        const that = this;
        return that.components.controller;
    };

    classProto.getName = function() {
        const that = this;
        return that.params.name;
    };

    classProto.getContainer = function() {
        const that = this;
        return that.nodes.container;
    };

    classProto.getContent = function() {
        const that = this;
        return that.nodes.content;
    };

    /******* CALLBACKS *******/

    classProto.callbacks.prepare = function(that, config) {
        // Prepare
        config.url = cm.strReplace(config.url, {
            '%baseUrl%': cm._baseUrl
        });
        config.params = cm.objectReplace(config.params, {
            '%baseUrl%': cm._baseUrl
        });
        return config;
    };

    classProto.callbacks.request = function(that, config) {
        config = that.callbacks.prepare(that, config);

        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart': function() {
                    that.callbacks.start(that, config);
                },
                'onSuccess': function(response) {
                    that.callbacks.response(that, config, response);
                },
                'onError': function() {
                    that.callbacks.error(that, config);
                },
                'onAbort': function() {
                    that.callbacks.abort(that, config);
                },
                'onEnd': function(response) {
                    that.callbacks.end(that, config, response);
                }
            })
        );
    };

    classProto.callbacks.start = function(that, config) {
        that.isProcess = true;
        that.triggerEvent('onRequestStart');
    };

    classProto.callbacks.end = function(that, config) {
        that.isProcess = false;
        that.isPreloaded = true;
        that.renderController();
        that.triggerEvent('onRequestEnd');
    };

    classProto.callbacks.response = function(that, config, response) {
        if (!cm.isEmpty(response)) {
            response = that.callbacks.filter(that, config, response);
        }
        if (!cm.isEmpty(response)) {
            that.callbacks.success(that, that.callbacks.convert(that, response));
        } else {
            that.callbacks.error(that, config);
        }
    };

    /*** DATA ***/

    classProto.callbacks.filter = function(that, config, response) {
        var data = [],
            dataItem = cm.objectPath(that.params.responseKey, response);
        if (dataItem && !cm.isEmpty(dataItem)) {
            data = dataItem;
        }
        return data;
    };

    classProto.callbacks.convert = function(that, data) {
        return data.map(function(item) {
            return that.callbacks.convertItem(that, item);
        });
    };

    classProto.callbacks.convertItem = function(that, item) {
        if (cm.isEmpty(item)) {
            return null
        } else if (!cm.isObject(item)) {
            return {'text': item, 'value': item};
        } else {
            if (cm.isUndefined(item.value)) {
                item.value = item.text
            }
            return item;
        }
    };

    /*** EVENTS ***/

    classProto.callbacks.success = function(that, response) {
        that.params.options = cm.merge(that.params.options, response);
        that.params.constructorParams.options = !cm.isEmpty(that.params.options) ? that.params.options : that.params.constructorParams.options;
        that.renderOptions(response);
        that.triggerEvent('onRequestSuccess', response);
    };

    classProto.callbacks.error = function(that, config) {
        that.triggerEvent('onRequestError');
    };

    classProto.callbacks.abort = function(that, config) {
        that.triggerEvent('onRequestAbort');
    };
});
