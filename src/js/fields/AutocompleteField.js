cm.define('Com.AutocompleteField', {
    extend: 'Com.AbstractInput',
    events: [
        'onFocus',
        'onBlur',
    ],
    params: {
        controllerEvents: true,
        type: 'text',

        icon: ['icon', 'linked', 'svg__search'],
        iconTitle: null,
        iconEvents: true,
        iconInsertMethod: 'appendChild',

        autocomplete: {
            constructor: 'Com.Autocomplete',
            constructorParams: {
                minLength: 1,
                direction: 'start',
                showListOnFocus: true,
            }
        }
    }
},
function() {
    Com.AbstractInput.apply(this, arguments);
});

cm.getConstructor('Com.AutocompleteField', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function() {
        const that = this;

        // Variables
        that.isFocus = false;
        that.wasFocus = false;
        that.options = [];

        // Bind context
        that.iconEventHanlder = that.iconEvent.bind(that);

        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.validateParams = function() {
        const that = this;
        classInherit.prototype.validateParams.apply(that, arguments);

        // Collect Options
        const options = that.params.node.options;
        cm.forEach(options, node => {
            that.options.push({
                value: node.value,
                text: node.innerHTML
            });
        });
    };

    classProto.validateParamsValue = function() {
        const that = this;
        if (cm.isNode(that.params.node)) {
            const value = cm.getSelectValue(that.params.node);
            that.params.value = !cm.isEmpty(value) ? value : that.params.value;
        }
        that.params.value = !cm.isEmpty(that.params.value) ? that.params.value : that.params.defaultValue;
    };

    classProto.onEnable = function() {
        const that = this;
        that.components.autocomplete.enable();
    };

    classProto.onDisable = function() {
        const that = this;
        that.components.autocomplete.disable();
    };

    /******* VIEW MODEL *******/

    classProto.renderContent = function() {
        const that = this;
        const nodes = {};
        that.nodes.content = nodes;
        that.triggerEvent('onRenderContentStart');

        // Structure
        nodes.container = cm.node('div', {classes: 'pt__input'},
            nodes.inner = cm.node('div', {classes: 'inner'},
                nodes.input = cm.node('input', {type: that.params.type})
            )
        );

        // Icon
        if (that.params.icon) {
            cm.addClass(nodes.container, 'has-icon');
            nodes.icon = that.renderIcon({
                icon: that.params.icon,
                title: that.params.iconTitle,
            });
            cm[that.params.iconInsertMethod](nodes.icon, nodes.inner);
        }

        // Attributes
        if (!cm.isEmpty(that.params.placeholder)) {
            nodes.input.placeholder = that.params.placeholder;
        }

        // Events
        that.triggerEvent('onRenderContentProcess');
        that.renderContentEvents();
        that.triggerEvent('onRenderContentEnd');

        // Push
        return nodes.container;
    };

    classProto.renderContentEvents = function() {
        const that = this;
        if (that.params.iconEvents) {
            cm.addEvent(that.nodes.content.icon, 'mousedown', that.iconEventHanlder);
            cm.addEvent(that.nodes.content.icon, 'click', that.iconEventHanlder);
        }
    };

    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init Autocomplete
        cm.getConstructor(that.params.autocomplete.constructor, classConstructor => {
            that.components.autocomplete = new classConstructor(
                cm.merge(that.params.autocomplete.constructorParams, {
                    node: that.nodes.content.input,
                    options: that.options,
                    value: that.params.value,
                    callbacks: that.renderAutocompleteCallbacks(),
                    events: that.renderAutocompleteEvents()
                })
            );
        })
    };

    /*** ICON ***/

    classProto.renderIcon = function(params) {
        const that = this;
        params = cm.merge({
            icon: null,
            title: null,
        }, params);

        const node = cm.isNode(params.icon) ? params.icon : that.renderIconView(params);
        if (!cm.isEmpty(params.title)) {
            node.title = params.title;
        }
        return node;
    };

    classProto.renderIconView = function(params) {
        const that = this;
        return cm.node('div', {classes: params.icon});
    };

    classProto.getIcon = function() {
        const that = this;
        return that.nodes.content.icon;
    };

    /******* AUTOCOMPLETE *******/

    classProto.renderAutocompleteCallbacks = function() {
        const that = this;
        return {};
    };

    classProto.renderAutocompleteEvents = function() {
        const that = this;
        return {
            onChange: (autocomplete, value) => that.set(value, true),
            onFocus: that.focusEvent.bind(that),
            onBlur: that.blurEvent.bind(that),
        };
    };

    /******* EVENTS *******/

    classProto.iconEvent = function(e){
        const that = this;
        if (e.type === 'mousedown') {
            that.wasFocus = that.isFocus;
        }
        if (e.type === 'click' && !that.wasFocus) {
            that.focus(true);
        }
    };

    classProto.focusEvent = function(controller, data){
        const that = this;
        that.isFocus = true;
        that.triggerEvent('onFocus', data);
    };

    classProto.blurEvent = function(controller, data){
        const that = this;
        that.isFocus = false;
        that.triggerEvent('onBlur', data);
    };

    /******* DATA *******/

    classProto.setData = function() {
        const that = this;
        const item = that.getOption(that.value);
        that.nodes.content.input.value = item
            ? !cm.isEmpty(item.text) ? item.text : item.value
            : that.value;
        return that;
    };

    classProto.getOption = function(value) {
        const that = this;
        return that.options.find(option => option.value === value);
    };

    /******* PUBLIC *******/
    classProto.focus = function(selection) {
        const that = this;
        that.components.autocomplete.focus(selection);
        return that;
    };

    classProto.blur = function() {
        const that = this;
        that.components.autocomplete.blur();
        return that;
    };
});

Com.FormFields.add('autocomplete-field', {
    node: cm.node('select'),
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.AutocompleteField'
});
