cm.define('Com.Check', {
    extend: 'Com.AbstractInput',
    params: {
        controllerEvents: true,
        type: 'checkbox',
        inline: false,
        multiple: false,
        values: {
            checked: null,
            unchecked: null,
        },
    },
    strings: {
        'required': 'This field is required.'
    }
},
function() {
    Com.AbstractInput.apply(this, arguments);
});

cm.getConstructor('Com.Check', function(classConstructor, className, classProto, classInherit) {
    classProto.onConstructStart = function() {
        var that = this;

        // Variables
        that.inputs = [];
        that.hidden = [];

        // Bind context to methods
        that.setValueHandler = that.setValue.bind(that);
    };

    classProto.onValidateParamsProcess = function() {
        var that = this;

        if (!cm.isEmpty(that.params.options)) {
            that.params.multiple = that.params.type === 'checkbox';

            // Convert option values
            cm.forEach(that.params.options, function(item) {
                if (!cm.isEmpty(item.value) && (item.checked || item.selected)) {
                    if (cm.isEmpty(that.params.value)) {
                        that.params.value = [];
                    } else if (cm.isString(that.params.value) || cm.isNumber(that.params.value)) {
                        that.params.value = [that.params.value];
                    }
                    cm.arrayAdd(that.params.value, item.value);
                }
            });
        } else {
            that.params.type = 'checkbox';
            that.params.multiple = false;

            if (cm.isEmpty(that.params.values)) {
                that.params.values = {
                    checked: null,
                    unchecked: null,
                };
            }

            // Checked parameter behavior override
            if (cm.isEmpty(that.params.value) && (that.params.checked)) {
                that.params.value = true;
            }

            // Convert value parameters
            if (!cm.isEmpty(that.params.value) && cm.isEmpty(that.params.values.checked)) {
                that.params.values.checked = that.params.value;
            }

            if (cm.isEmpty(that.params.values.checked)) {
                that.params.values.checked = true;
            }

            if (cm.isEmpty(that.params.values.unchecked)) {
                that.params.values.unchecked = false;
            }
        }
    };

    classProto.onEnable = function() {
        var that = this;
        cm.forEach(that.inputs, function(item) {
            item.input.disabled = false;
        });
    };

    classProto.onDisable = function() {
        var that = this;
        cm.forEach(that.inputs, function(item) {
            item.input.disabled = true;
        });
    };

    /*** VIEW MODEL ***/

    classProto.renderHiddenContent = function() {
        var that = this,
            nodes = {},
            inputContainer;
        that.nodes.hiddenContent = nodes;

        // Structure
        nodes.container = cm.node('div', {classes: 'display-none'});

        // Render inputs
        if (!cm.isEmpty(that.params.options)) {
            cm.forEach(that.params.options, function(option) {
                inputContainer = that.renderHiddenInput(option);
                cm.appendChild(inputContainer, nodes.container);
            });
        } else {
            inputContainer = that.renderHiddenInput({
                'value': that.params.value,
                'values': that.params.values,
            });
            cm.appendChild(inputContainer, nodes.container);
        }

        // Export
        return nodes.container;
    };

    classProto.renderHiddenInput = function(item) {
        var that = this;

        item = cm.merge({
            nodes: {},
            value: null,
            values: {
                checked: null,
                unchecked: null,
            },
        }, item);

        // Validate
        if (cm.isEmpty(item.values.checked)) {
            item.values.checked = !cm.isEmpty(item.value) ? item.value : true;
        }
        if (cm.isEmpty(item.values.unchecked)) {
            item.values.unchecked = false;
        }

        // Structure
        item.nodes.container = item.nodes.input = cm.node('input', {'type': that.params.type});
        item.input = item.nodes.input;

        // Attributes
        if (!cm.isEmpty(that.params.name)) {
            item.input.setAttribute('name', that.params.name);
        }

        // Push
        that.hidden.push(item);
        return item.nodes.container;
    };

    classProto.renderContent = function() {
        var that = this,
            nodes = {},
            inputContainer;
        that.nodes.content = nodes;
        that.triggerEvent('onRenderContentStart');

        // Structure
        nodes.container = cm.node('div', {classes: 'pt__check-line'});
        if (that.params.inline) {
            cm.addClass(nodes.container, 'is-line');
        } else {
            cm.addClass(nodes.container, 'is-box');
        }

        // Render inputs
        that.triggerEvent('onRenderContentProcess');
        if (!cm.isEmpty(that.params.options)) {
            cm.forEach(that.params.options, function(option) {
                inputContainer = that.renderInput(option);
                cm.appendChild(inputContainer, nodes.container);
            });
        } else {
            inputContainer = that.renderInput({
                'text': that.params.placeholder,
                'value': that.params.value,
                'values': that.params.values,
            });
            cm.appendChild(inputContainer, nodes.container);
        }
        that.triggerEvent('onRenderContentEnd');

        // Push
        return nodes.container;
    };

    classProto.renderInput = function(item) {
        var that = this,
            nodes = {};
        item = cm.merge({
            nodes: {},
            text: '',
            value: null,
            values: {
                checked: null,
                unchecked: null,
            },
        }, item);

        // Validate
        if (cm.isEmpty(item.values.checked)) {
            item.values.checked = !cm.isEmpty(item.value) ? item.value : true;
        }
        if (cm.isEmpty(item.values.unchecked)) {
            item.values.unchecked = false;
        }

        // Structure
        item.nodes.container = cm.node('label',
            item.nodes.input = cm.node('input', {'type': that.params.type}),
            item.nodes.label = cm.node('span', {
                classes: 'label',
                innerHTML: item.text,
            })
        );
        item.input = item.nodes.input;

        // Events
        cm.addEvent(item.nodes.input, 'click', function(e) {
            that.setValue(item, true);
        });

        // Push
        that.inputs.push(item);
        return item.nodes.container;
    };

    /*** DATA VALUE ***/

    classProto.setHiddenAttributes = function() {
        var that = this;
    };

    classProto.validateValue = function(value) {
        var that = this;
        if (cm.isEmpty(that.params.options)) {
            if (cm.isEmpty(value)) {
                return that.params.values.unchecked;
            } else if (cm.isBoolean(value)) {
                return value ? that.params.values.checked : that.params.values.unchecked;
            } else {
                return value;
            }
        }
        return value;
    };

    classProto.setValue = function(item, triggerEvents) {
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;

        // Get value
        var value = null;
        if (!cm.isEmpty(that.params.options)) {
            if (that.params.multiple) {
                value = [];
                cm.forEach(that.inputs, function(item) {
                    if (item.input.checked && item.values.checked) {
                        value.push(item.values.checked);
                    } else if(item.values.unchecked) {
                        value.push(item.values.unchecked);
                    }
                });
            } else {
                value = item.values.checked;
            }
        } else {
            value = item.input.checked ? item.values.checked : item.values.unchecked;
        }

        that.set(value, triggerEvents);
        return that;
    };

    classProto.saveHiddenValue = function(value) {
        var that = this;
        if (!cm.isEmpty(that.params.options)) {
            cm.forEach(that.hidden, function(item) {
                that.setInputItemValue(item, value);
            });
        } else {
            that.setInputItemValue(that.hidden[0], value);
        }
    };

    classProto.setData = function(value) {
        var that = this;
        if (!cm.isEmpty(that.params.options)) {
            cm.forEach(that.inputs, function(item) {
                that.setInputItemValue(item, value);
            });
        } else {
            that.setInputItemValue(that.inputs[0], value);
        }
    };

    classProto.setInputItemValue = function(item, value) {
        var that = this;

        if (!cm.isEmpty(that.params.options)) {
            if (that.params.multiple) {
                item.input.checked = cm.inArray(value, item.values.checked);
            } else {
                item.input.checked = value === item.values.checked;
            }
        } else {
            item.input.checked = that.testInputValue(value, that.params.values.checked, that.params.values.unchecked);
        }

        item.input.value = value;
    };

    classProto.testInputValue = function(value, checkedValue, uncheckedValue) {
        // TODO: Test all variants
        // FIXME: Remove checks for zero, etc
        return (
            (!cm.isEmpty(checkedValue) && value === checkedValue) ||
            !(cm.isEmpty(value) || value === 0 || value === '0' || value === false || value === uncheckedValue)
        );
    };

    /*** VALIDATOR ***/

    classProto.validator = function(data) {
        var that = this;
        if (data.required && cm.isEmpty(that.params.options)) {
            data.valid = data.value === that.params.values.checked;
            if (!data.valid) {
                data.message = that.msg('required');
            }
        }
        return data;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('checkbox', {
    node: cm.node('div', {classes: 'pt__check-line'}),
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.Check',
    constructorParams: {
        type: 'checkbox',
    },
});

Com.FormFields.add('radio', {
    node: cm.node('div', {classes: 'pt__check-line'}),
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.Check',
    constructorParams: {
        type: 'radio',
        inline: true,
    },
});

Com.FormFields.add('check', {
    node: cm.node('div', {classes: 'pt__check-line'}),
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.Check',
    constructorParams: {
        type: 'checkbox',
        inline: true,
    },
});
