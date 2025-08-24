cm.define('Com.BoxTools', {
    extend: 'Com.AbstractInput',
    params: {
        controllerEvents: true,
        className: 'com__box-tools',
        maxlength: 5,
        units: 'px',
        allowNegative: false,
        allowFloat: false,
        inputs: [
            {
                name: 'top',
                icon: 'icon svg__indent-top small linked',
                iconPosition: 'insideRight'
            },
            {
                name: 'right',
                icon: 'icon svg__indent-right small linked',
                iconPosition: 'insideRight'
            },
            {
                name: 'bottom',
                icon: 'icon svg__indent-bottom small linked',
                iconPosition: 'insideRight'
            },
            {
                name: 'left',
                icon: 'icon svg__indent-left small linked',
                iconPosition: 'insideRight'
            },
        ],
    },
    strings: {
        link: 'Link',
        unlink: 'Unlink'
    },
},
function() {
    Com.AbstractInput.apply(this, arguments);
});

cm.getConstructor('Com.BoxTools', function(classConstructor, className, classProto, classInherit) {
    classProto.onConstructStart = function() {
        const that = this;

        // Variables
        that.inputs = [];
        that.rawValue = null;
        that.isInputsLinked = null;
        that.lastInput = null;
    };

    classProto.onEnable = function() {
        const that = this;
        cm.forEach(that.inputs, item => {
            item.input.disabled = false;
            cm.removeClass(item.nodes.inner, 'disabled');
        });
    };

    classProto.onDisable = function() {
        const that = this;
        cm.forEach(that.inputs, item => {
            item.input.disabled = true;
            cm.addClass(item.nodes.inner, 'disabled');
        });
    };

    classProto.renderContent = function() {
        const that = this;
        const nodes = {};

        that.nodes.content = nodes;
        that.triggerEvent('onRenderContentStart');

        // Structure
        nodes.container = cm.node('div', {classes: 'com__box-tools__content'},
            cm.node('div', {classes: 'b-line'},
                that.renderInput(that.params.inputs[0], 0)
            ),
            cm.node('div', {classes: 'b-line'},
                that.renderInput(that.params.inputs[3], 3),
                that.renderLinkButton(),
                that.renderInput(that.params.inputs[1], 1)
            ),
            cm.node('div', {classes: 'b-line'},
                that.renderInput(that.params.inputs[2], 2)
            )
        );

        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');

        // Export
        return nodes.container;
    };

    classProto.renderLinkButton = function() {
        const that = this;
        const content = that.nodes.content;

        content.linkContainer = cm.node('div', {classes: 'b-link-container'},
            content.link = cm.node('div', {classes: 'b-link', title: that.msg('link'), role: 'button', tabindex: 0, 'aria-pressed': 'false'},
                cm.node('div', {classes: 'icon'})
            )
        );
        cm.click.add(content.link, () => that.linkInputs(true));

        return content.linkContainer;
    };

    classProto.renderInput = function(item, i) {
        const that = this;

        // Validate
        item = cm.merge({
            i: i,
            icon: 'small',
            iconPosition: 'leftInside',
            name: '',
            nodes: {}
        }, item);

        // Structure
        item.nodes = that.renderInputContainer(item);
        item.input = item.nodes.input;

        // Attributes
        if (that.params.maxlength) {
            item.input.setAttribute('maxlength', that.params.maxlength);
        }

        // Events
        cm.click.add(item.nodes.icon, event => {
            cm.preventDefault(event);
            item.input.setSelectionRange(0, item.input.value.length);
            item.input.focus();
        });
        cm.addEvent(item.input, 'focus', () => {
            that.lastInput = item;
        });
        cm.addEvent(item.input, 'blur', () => that.setValues());

        // Keypress events
        cm.addEvent(item.input, 'keypress', event => {
            if (event.code !== 'Enter') return;
            cm.preventDefault(event);
            that.setValues();
            item.input.blur();
        });

        // Input validator
        const validatorParams = {
            allowNegative: that.params.allowNegative,
            allowFloat: that.params.allowFloat
        };
        cm.allowOnlyNumbersInputEvent(item.input, (event, value) => that.inputOnInputEvent(event, value, item), validatorParams);

        // Push
        that.inputs.push(item);
        return item.nodes.container;
    };

    classProto.inputOnInputEvent = function(e, value, item) {
        const that = this;
        if (that.isInputsLinked) {
            that.tempRawValue = [value, value, value, value];
            that.setInputs();
        } else {
            that.tempRawValue[item.i] = value;
        }
        that.selectAction(cm.arrayToCSSValues(that.tempRawValue, that.params.units), true);
        return that;
    };

    classProto.renderInputContainer = function(item) {
        const that = this;

        // Structure
        const nodes = {};
        nodes.container = cm.node('div', {classes: 'b-container'},
            nodes.inner = cm.node('div', {classes: 'pt__input'},
                nodes.input = cm.node('input', {type: 'text'})
            )
        );

        // Title
        if (!cm.isEmpty(item.title)) {
            nodes.inner.setAttribute('title', item.title);
        }

        // Icon
        nodes.icon = cm.node('div', {classes: item.icon});
        switch (item.iconPosition) {
            case 'insideLeft':
                cm.addClass(nodes.inner, 'is-less-indent');
                cm.insertFirst(nodes.icon, nodes.inner);
                break;
            case 'insideRight':
                cm.addClass(nodes.inner, 'is-less-indent');
                cm.insertLast(nodes.icon, nodes.inner);
                break;
            case 'outsideLeft':
                cm.addClass(nodes.inner, 'is-icon-outside');
                cm.insertFirst(nodes.icon, nodes.inner);
                break;
            case 'outsideRight':
                cm.addClass(nodes.inner, 'is-icon-outside');
                cm.insertLast(nodes.icon, nodes.inner);
                break;
        }

        return nodes;
    };

    classProto.setInputs = function() {
        const that = this;
        cm.forEach(that.inputs, function(item) {
            item.input.value = that.tempRawValue[item.i];
        });
        return that;
    };

    classProto.setValues = function(triggerEvents) {
        const that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.set(cm.arrayToCSSValues(that.tempRawValue, that.params.units), triggerEvents);
        return that;
    };

    classProto.linkInputs = function(setValues) {
        const that = this;
        const content = that.nodes.content;
        if (that.disabled) return;
        
        if (!that.isInputsLinked) {
            that.isInputsLinked = true;
            content.link.title = that.msg('unlink');
            content.link.setAttribute('aria-pressed', 'true');
            cm.addClass(content.link, 'active');
            
            if (setValues) {
                const value = that.lastInput
                    ? that.lastInput.input.value
                    : that.inputs.reduce((acc, item) => Math.max(acc, parseFloat(item.input.value)), 0);
                that.set(value);
            }
        } else {
            that.isInputsLinked = false;
            content.link.title = that.msg('link');
            content.link.setAttribute('aria-pressed', 'false');
            cm.removeClass(content.link, 'active');
        }
    };

    /*** DATA ***/

    classProto.setData = function() {
        const that = this;

        // Set initially linked state
        if (!cm.isBoolean(that.isInputsLinked)) {
            const isValuesEqual = that.tempRawValue.every(value => value === that.tempRawValue[0]);
            if (isValuesEqual && that.tempRawValue[0] > 0) {
                that.linkInputs(false);
            }
        }

        that.setInputs();
        return that;
    };

    classProto.validateValue = function(value) {
        const that = this;
        return cm.arrayToCSSValues(cm.CSSValuesToArray(value), that.params.units);
    };

    classProto.saveRawValue = function(value) {
        const that = this;
        that.tempRawValue = cm.CSSValuesToArray(value);
    };
});