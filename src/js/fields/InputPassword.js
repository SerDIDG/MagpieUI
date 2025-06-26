cm.define('Com.InputPassword', {
    extend: 'Com.Input',
    params: {
        iconVisible: null,
        iconHidden: null,
    },
    strings: {
        iconVisible: 'Hide password',
        iconHidden: 'Show password',
    },
},
function() {
    Com.Input.apply(this, arguments);
});

cm.getConstructor('Com.InputPassword', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function() {
        const that = this;

        // Variables
        that.isPasswordVisible = null;

        // Bind context to methods
        that.iconToggleEventHanlder = that.iconToggleEvent.bind(that);

        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.renderContentView = function() {
        const that = this;

        // Render parent structure
        const nodes = classInherit.prototype.renderContentView.apply(that, arguments);

        // Lock / unlock icons
        if (that.params.iconVisible) {
            cm.addClass(nodes.container, 'has-icon');
            nodes.iconVisible = that.renderIcon({
                icon: that.params.iconVisible,
                title: that.msg('iconVisible'),
            });
        }
        if (that.params.iconHidden) {
            cm.addClass(nodes.container, 'has-icon');
            nodes.iconHidden = that.renderIcon({
                icon: that.params.iconHidden,
                title: that.msg('iconHidden'),
            });
        }

        // Append
        return nodes;
    };

    classProto.renderContentEvents = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderContentEvents.apply(that, arguments);

        // Add events for the lock / unlock icons
        if (that.params.iconEvents) {
            cm.addEvent(that.nodes.content.iconVisible, 'mousedown', that.iconEventHanlder);
            cm.addEvent(that.nodes.content.iconVisible, 'click', that.iconToggleEventHanlder);
            cm.addEvent(that.nodes.content.iconHidden, 'mousedown', that.iconEventHanlder);
            cm.addEvent(that.nodes.content.iconHidden, 'click', that.iconToggleEventHanlder);
        }
    };

    classProto.renderContentAttributes = function() {
        const that = this;

        // Call default icon event
        classInherit.prototype.renderContentAttributes.apply(that, arguments);

        // Set initial lock / unlock state
        that.iconToggleActin();
    };

    /*** EVENTS ***/

    classProto.iconToggleEvent = function(e) {
        const that = this;
        cm.preventDefault(e);

        // Switch input type
        if (e.type === 'click') {
            that.iconToggleActin();
        }

        // Call default icon event
        that.iconEvent.apply(that, arguments);
    };

    classProto.iconToggleActin = function() {
        const that = this;
        const content = that.nodes.content;
        if (!content) return;

        that.isPasswordVisible = cm.isBoolean(that.isPasswordVisible) ? !that.isPasswordVisible : false;
        content.input.setAttribute('type', that.isPasswordVisible ? 'text' : 'password');

        if (content.iconVisible) {
            if (that.isPasswordVisible) {
                cm[that.params.iconInsertMethod](content.iconVisible, content.inner);
            } else {
                cm.remove(content.iconVisible);
            }
        }

        if (content.iconHidden) {
            if (that.isPasswordVisible) {
                cm.remove(content.iconHidden);
            } else {
                cm[that.params.iconInsertMethod](content.iconHidden, content.inner);
            }
        }
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('password', {
    'node': cm.node('input', {'type': 'password'}),
    'value': '',
    'defaultValue': '',
    'fieldConstructor': 'Com.AbstractFormField',
    'constructor': 'Com.InputPassword',
    'constructorParams': {
        'type': 'password'
    }
});