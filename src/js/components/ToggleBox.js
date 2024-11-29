cm.define('Com.ToggleBox', {
    modules: [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Stack'
    ],
    events: [
        'onRender',
        'onShowStart',
        'onShow',
        'onHideStart',
        'onHide'
    ],
    params: {
        node: cm.node('div'),
        name: '',
        renderStructure: false,
        embedStructure: 'replace',
        duration: 'cm._config.animDurationLong',
        remember: false,                                 // Remember toggle state
        toggleTitle: false,                              // Change title on toggle
        container: false,
        title: false,
        content: false,
        className: 'has-title-bg is-base is-hide',
        eventNode: 'title'                               // button | title
    },
    strings: {
        show: 'Show',
        hide: 'Hide'
    }
},
function(params) {
    var that = this;

    that.nodes = {
        container: cm.node('div'),
        button: cm.node('div'),
        target: cm.node('div'),
        title: cm.node('div')
    };
    that.animations = {};

    that.isCollapsed = false;
    that.isProcess = false;

    var init = function() {
        that.setParams(params);
        that.convertEvents(that.params.events);
        that.getDataNodes(that.params.node);
        that.getDataConfig(that.params.node);
        validateParams();
        render();
        that.addToStack(that.nodes.container);
        that.triggerEvent('onRender');
    };

    var validateParams = function() {
        if (that.params.renderStructure) {
            if (!that.params.title) {
                that.params.title = '';
                that.params.toggleTitle = true;
            }
        }
    };

    var render = function() {
        // Render Structure
        if (that.params.renderStructure) {
            that.nodes.container = cm.node('dl', {classes: 'com__togglebox'},
                that.nodes.titleContainer = cm.node('dt',
                    that.nodes.button = cm.node('span', {classes: 'icon default linked'}),
                    that.nodes.title = cm.node('span', {classes: 'title'})
                ),
                that.nodes.target = cm.node('dd',
                    that.nodes.content = cm.node('div', {classes: 'inner'})
                )
            );

            // Classes
            if (that.params.eventNode === 'button') {
                cm.addClass(that.nodes.container, 'has-hover-icon');
            }
            cm.addClass(that.nodes.container, that.params.className);

            // Append title
            that.setTitle(that.params.title);

            // Append content
            if (that.params.content) {
                that.setContent(that.params.content);
            } else {
                that.setContent(that.params.node);
            }

            // Append
            that.embedStructure(that.nodes.container);
        }

        // Set events
        that.nodes.toggle = (that.params.eventNode === 'title' && that.nodes.titleContainer) ? that.nodes.titleContainer : that.nodes.button;
        cm.click.add(that.nodes.toggle, that.toggle);

        // Set accessibility
        that.nodes.container.setAttribute('role', 'group');
        that.nodes.toggle.setAttribute('tabindex', '0');
        that.nodes.toggle.setAttribute('role', 'button');

        // Check state
        that.isCollapsed = cm.isClass(that.nodes.container, 'is-hide') || !cm.isClass(that.nodes.container, 'is-show');

        // Check storage state
        if (that.params.remember) {
            var storageCollapsed = that.storageRead('isCollapsed');
            that.isCollapsed = storageCollapsed !== null ? storageCollapsed : that.isCollapsed;
        }

        // Animation
        that.animations.target = new cm.Animation(that.nodes.target);

        // Trigger collapse event
        if (that.isCollapsed) {
            that.collapse(true);
        } else {
            that.expand(true);
        }
    };

    var expandEnd = function() {
        that.isProcess = false;
        that.nodes.target.style.opacity = 1;
        that.nodes.target.style.height = 'auto';
        that.nodes.target.style.overflow = 'visible';
        // Trigger events
        cm.customEvent.trigger(that.nodes.target, 'redraw', {
            direction: 'child',
            self: false
        });
        that.triggerEvent('onShow');
    };

    var collapseEnd = function() {
        that.isProcess = false;
        that.nodes.target.style.opacity = 0;
        that.nodes.target.style.height = 0;
        that.nodes.target.style.display = 'none';
        that.triggerEvent('onHide');
    };

    /* ******* PUBLIC ******* */

    that.setTitle = function(node) {
        cm.clearNode(that.nodes.title);
        if (cm.isString(node) || cm.isNumber(node)) {
            that.nodes.title.innerHTML = node;
        } else {
            cm.appendNodes(node, that.nodes.title);
        }
        return that;
    };

    that.setContent = function(node) {
        var parent = that.nodes.content || that.nodes.target;
        cm.clearNode(parent);
        if (cm.isString(node) || cm.isNumber(node)) {
            parent.innerHTML = node;
        } else {
            cm.appendNodes(node, parent);
        }
        return that;
    };

    that.toggle = function() {
        if (that.isCollapsed) {
            that.expand();
        } else {
            that.collapse();
        }
    };

    that.expand = function(isImmediately) {
        if (!isImmediately && (!that.isCollapsed || that.isProcess)) {
            return;
        }

        that.isCollapsed = false;
        that.isProcess = 'show';
        that.triggerEvent('onShowStart');

        // Write storage
        if (that.params.remember) {
            that.storageWrite('isCollapsed', false);
        }

        // Set title
        if (that.params.toggleTitle) {
            that.setTitle(that.lang('hide'));
        }

        // Set accessibility
        that.nodes.toggle.setAttribute('aria-expanded', true);
        that.nodes.target.setAttribute('aria-hidden', false);

        // Set classes
        cm.replaceClass(that.nodes.container, 'is-hide', 'is-show');

        // Animate
        if (isImmediately) {
            expandEnd();
        } else {
            // Redraw inner content
            that.nodes.target.style.height = 'auto';
            that.nodes.target.style.display = 'block';

            // Trigger events
            cm.customEvent.trigger(that.nodes.target, 'redraw', {
                direction: 'child',
                self: false
            });

            // Prepare animation
            that.nodes.target.style.height = 0;
            that.nodes.target.style.overflow = 'hidden';
            if (!that.nodes.target.style.opacity) {
                that.nodes.target.style.opacity = 0;
            }
            that.animations.target.go({
                style: {
                    height: [cm.getRealHeight(that.nodes.target, 'offset', 'current'), 'px'].join(''),
                    opacity: 1
                },
                anim: 'smooth',
                duration: that.params.duration,
                onStop: expandEnd
            });
        }
    };

    that.collapse = function(isImmediately) {
        if (!isImmediately && (that.isCollapsed || that.isProcess)) {
            return;
        }

        that.isCollapsed = true;
        that.isProcess = 'hide';
        that.triggerEvent('onHideStart');

        // Write storage
        if (that.params.remember) {
            that.storageWrite('isCollapsed', true);
        }

        // Set title
        if (that.params.toggleTitle) {
            that.setTitle(that.lang('show'));
        }

        // Set accessibility
        that.nodes.toggle.setAttribute('aria-expanded', false);
        that.nodes.target.setAttribute('aria-hidden', true);

        // Set classes
        cm.replaceClass(that.nodes.container, 'is-show', 'is-hide');

        // Animate
        that.nodes.target.style.overflow = 'hidden';
        if (!that.nodes.target.style.opacity) {
            that.nodes.target.style.opacity = 1;
        }
        if (isImmediately) {
            collapseEnd();
        } else {
            that.animations.target.go({
                style: {
                    height: '0px',
                    opacity: 0
                },
                anim: 'smooth',
                duration: that.params.duration,
                onStop: collapseEnd
            });
        }
    };

    init();
});
