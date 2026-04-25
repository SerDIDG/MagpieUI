cm.define('Com.ToggleBox', {
    extend: 'Com.AbstractController',
    events: [
        'onShowStart',
        'onShow',
        'onHideStart',
        'onHide'
    ],
    params: {
        controllerEvents: true,
        customEvents: true,
        renderStructure: false,
        embedStructureOnRender: false,
        embedStructure: 'replace',

        duration: 'cm._config.animDurationLong',
        remember: false,                                 // Remember the toggle state

        className: 'has-title-bg is-base is-hide',
        eventNode: 'title',                              // button | title
        toggleTitle: false,                              // Change title on toggle

        title: false,
        content: false,
        icon: ['default'],
    },
    strings: {
        show: 'Show',
        hide: 'Hide'
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.ToggleBox', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function() {
        const that = this;

        that.nodes = {
            container: cm.node('div'),
            button: cm.node('div'),
            target: cm.node('div'),
            title: cm.node('div')
        };

        that.targetHeight = 0;
        that.targetTransition = 0;
        that.isProcess = null;
        that.isCollapsed = null;

        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onValidateParams = function() {
        const that = this;
        if (that.params.renderStructure) {
            that.params.embedStructureOnRender = false;

            if (!that.params.title) {
                that.params.title = '';
                that.params.toggleTitle = true;
            }
        }
    }

    classProto.renderView = function() {
        const that = this;
        that.triggerEvent('onRenderViewStart');

        // Structure
        that.nodes.container = cm.node('dl', {classes: 'com__togglebox'},
            that.nodes.titleContainer = cm.node('dt',
                that.nodes.button = that.nodes.icon = cm.node('span', {classes: ['icon', 'animated', 'linked']}),
                that.nodes.title = cm.node('span', {classes: 'title'})
            ),
            that.nodes.target = cm.node('dd',
                that.nodes.content = cm.node('div', {classes: 'inner'})
            )
        );

        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
    };

    classProto.setAttributes = function() {
        const that = this;

        // Set attributes on the rendered view
        if (that.params.renderStructure) {
            that.setViewAttributes();
        }

        // Set events
        that.nodes.toggle = that.params.eventNode === 'title' && that.nodes.titleContainer ? that.nodes.titleContainer : that.nodes.button;
        cm.click.add(that.nodes.toggle, () => that.toggle());

        // Set accessibility
        that.nodes.container.setAttribute('role', 'group');
        that.nodes.toggle.setAttribute('tabindex', '0');
        that.nodes.toggle.setAttribute('role', 'button');
    };

    classProto.setViewAttributes = function() {
        const that = this;
        cm.addClass(that.nodes.container, that.params.className);
        if (that.params.eventNode === 'button') {
            cm.addClass(that.nodes.container, 'has-hover-icon');
        }
    };

    classProto.setViewContent = function() {
        const that = this;
        that.setIcon(that.params.icon);
        that.setTitle(that.params.title);

        if (that.params.content) {
            that.setContent(that.params.content);
        } else {
            that.setContent(that.params.node);
        }
    };

    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        if (that.params.renderStructure) {
            // Append structure before the content for cases where the toggle box wraps the content inside
            that.appendView();

            // Set title and content for the rendered view
            that.setViewContent();
        }

        // Check state
        that.isCollapsed = cm.hasClass(that.nodes.container, 'is-hide') || !cm.hasClass(that.nodes.container, 'is-show');

        // Check storage state
        if (that.params.remember) {
            const isCollapsed = that.storageRead('isCollapsed');
            that.isCollapsed = isCollapsed !== null ? isCollapsed : that.isCollapsed;
        }

        // Trigger collapse event
        that.toggle(!that.isCollapsed, true);
    };

    /******* HELPERS *******/

    classProto.beforeExpand = function() {
        const that = this;
        if (that.isProcess) return;
        that.isProcess = true;

        // Redraw inner content
        that.nodes.target.style.height = 'auto';
        that.nodes.target.style.display = 'block';

        // Trigger events
        cm.customEvent.trigger(that.nodes.target, 'redraw', {
            direction: 'child',
            self: false
        });

        // Prepare animation
        that.targetHeight = cm.getRealHeight(that.nodes.target, 'offset', 'current');
        that.nodes.target.style.overflow = 'hidden';
        that.nodes.target.style.height = 0;
        if (!that.nodes.target.style.opacity) {
            that.nodes.target.style.opacity = 0;
        }
    };

    classProto.afterExpand = function() {
        const that = this;

        that.nodes.target.style.overflow = 'visible';
        that.nodes.target.style.height = 'auto';
        that.nodes.target.style.opacity = 1;

        // Trigger events
        cm.customEvent.trigger(that.nodes.target, 'redraw', {
            direction: 'child',
            self: false
        });

        that.isProcess = false;
        that.triggerEvent('onShow');
    };

    classProto.beforeCollapse = function() {
        const that = this;
        if (that.isProcess) return;
        that.isProcess = true;

        that.nodes.target.style.overflow = 'hidden';
        if (!that.nodes.target.style.opacity) {
            that.nodes.target.style.opacity = 1;
        }

        that.targetHeight = cm.getRealHeight(that.nodes.target, 'offset', 'current');
        that.nodes.target.style.height = `${that.targetHeight}px`;
    };

    classProto.afterCollapse = function() {
        const that = this;

        that.nodes.target.style.display = 'none';
        that.nodes.target.style.height = 0;
        that.nodes.target.style.opacity = 0;

        that.isProcess = false;
        that.triggerEvent('onHide');
    };


    /******* PUBLIC *******/

    classProto.setTitle = function(stringOrNode) {
        const that = this;
        if (!that.nodes.title) return;

        // Reset
        cm.clearNode(that.nodes.title);
        if (cm.isString(stringOrNode) || cm.isNumber(stringOrNode)) {
            that.nodes.title.innerHTML = stringOrNode;
        } else {
            cm.appendNodes(stringOrNode, that.nodes.title);
        }

        that.params.title = stringOrNode;
        return that;
    };

    classProto.setContent = function(stringOrNode) {
        const that = this;
        const container = that.nodes.content || that.nodes.target;
        if (!container) return;

        // Reset
        cm.clearNode(container);
        if (cm.isString(stringOrNode) || cm.isNumber(stringOrNode)) {
            container.innerHTML = stringOrNode;
        } else {
            cm.appendNodes(stringOrNode, container);
        }

        that.params.conetnt = stringOrNode;
        return that;
    };

    classProto.setIcon = function(classesOrNode) {
        const that = this;
        if (!that.nodes.icon) return;

        // Reset
        cm.clearNode(that.nodes.icon);
        if (cm.isString(that.params.icon) || cm.isArray(that.params.icon)) {
            cm.removeClass(that.nodes.icon, that.params.icon);
        }

        if (cm.isFunction(classesOrNode)) {
            classesOrNode = classesOrNode(that);
        }
        if (cm.isString(classesOrNode) || cm.isArray(classesOrNode)) {
            cm.addClass(that.nodes.icon, classesOrNode);
        } else {
            cm.appendNodes(classesOrNode, that.nodes.icon);
        }

        that.params.icon = classesOrNode;
        return that;
    };

    classProto.toggle = function(value, isImmediately) {
        const that = this;
        value = cm.isBoolean(value) ? value : that.isCollapsed;

        if (value) {
            that.expand(isImmediately);
        } else {
            that.collapse(isImmediately);
        }
    };

    classProto.expand = function(isImmediately) {
        const that = this;
        if (!isImmediately && !that.isCollapsed) return;

        that.isCollapsed = false;
        that.triggerEvent('onShowStart');

        // Write storage
        if (that.params.remember) {
            that.storageWrite('isCollapsed', false);
        }

        // Set title
        if (that.params.toggleTitle) {
            that.setTitle(that.msg('hide'));
        }

        // Set accessibility
        that.nodes.toggle.setAttribute('aria-expanded', true);
        that.nodes.target.setAttribute('aria-hidden', false);

        // Set classes
        cm.addClass(that.nodes.toggle, 'active');
        cm.replaceClass(that.nodes.container, 'is-hide', 'is-show');

        // Animate
        if (isImmediately) {
            that.afterExpand();
        } else {
            that.beforeExpand();
            that.targetTransition?.reset?.();
            that.targetTransition = cm.transition(that.nodes.target, {
                properties: {
                    height: `${that.targetHeight}px`,
                    opacity: 1,
                },
                easing: 'ease-in-out',
                duration: that.params.duration,
                onStop: () => that.afterExpand(),
            });
        }
    };

    classProto.collapse = function(isImmediately) {
        const that = this;
        if (!isImmediately && that.isCollapsed) return;

        that.isCollapsed = true;
        that.triggerEvent('onHideStart');

        // Write storage
        if (that.params.remember) {
            that.storageWrite('isCollapsed', true);
        }

        // Set title
        if (that.params.toggleTitle) {
            that.setTitle(that.msg('show'));
        }

        // Set accessibility
        that.nodes.toggle.setAttribute('aria-expanded', false);
        that.nodes.target.setAttribute('aria-hidden', true);

        // Set classes
        cm.removeClass(that.nodes.toggle, 'active');
        cm.replaceClass(that.nodes.container, 'is-show', 'is-hide');

        // Animate
        if (isImmediately) {
            that.afterCollapse();
        } else {
            that.beforeCollapse();
            that.targetTransition?.reset?.();
            that.targetTransition = cm.transition(that.nodes.target, {
                properties: {
                    height: `0px`,
                    opacity: 0,
                },
                easing: 'ease-in-out',
                duration: that.params.duration,
                onStop: () => that.afterCollapse(),
            });
        }
    };
});