cm.define('Com.Menu', {
    extend: 'Com.AbstractController',
    events: [
        'onShow',
        'onHide',
    ],
    params: {
        controllerEvents: true,
        renderStructure: false,
        embedStructureOnRender: false,
        embedStructure: 'append',
        modifiers: ['link'],
        items: [],

        item: {
            preventDefault: true,
        },

        icon: {
            icon: 'cm-i__chevron-down',
            classes: ['cm-i', 'xx-small'],
        },

        tooltip: {
            enable: true,
            constructor: 'Com.Tooltip',
            constructorParams: {
                className: 'com__menu-tooltip',
                targetEvent: 'click',
                hideOnReClick: true,
                theme: null,
                hold: true,
                delay: 0,
                ariaRole: 'menu',

                top: 'targetHeight',
                left: 0,
                adaptiveFrom: null,
                adaptiveTop: null,
                adaptiveLeft: null,
                minWidth: 'targetWidth',
            },
        },
    },
    strings: {
        label: 'Actions',
    },
},
function(params) {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.Menu', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function() {
        const that = this;

        // Variables
        that.items = [];
        that.nodes = {
            holder: cm.node('div'),
            button: cm.node('div'),
            target: cm.node('div'),
        };

        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.setAttributes = function(){
        const that = this;

        // Call parent method
        classInherit.prototype.setAttributes.apply(that, arguments);

        // Set accessible attributes
        if (that.params.tooltip.enable) {
            that.nodes.button.setAttribute('role', 'button');
            that.nodes.button.setAttribute('tabindex', '0');
            that.nodes.button.setAttribute('aria-haspopup', 'true');
            that.nodes.button.setAttribute('aria-controls', 'menu');
        }

        // Set additional CSS classes
        cm.forEach(that.params.modifiers, modifier => {
            cm.addClass(that.nodes.container, `com__menu--${modifier}`);
        });
    };

    /******* VIEW *******/

    classProto.renderView = function() {
        const that = this;

        // Structure
        that.nodes.container = cm.node('a', {classes: 'com__menu', title: that.msg('label')},
            cm.node('div', {classes: 'label'}, that.msg('label')),
            that.nodes.icon = that.renderIconView(),
            that.nodes.target = cm.node('div', {classes: ['pt__menu', 'pt__menu--tooltip']},
                that.nodes.holder = cm.node('ul', {classes: 'pt__menu-dropdown'})
            )
        );

        // Set action button
        that.nodes.button = that.nodes.container;
    };

    classProto.renderIconView = function() {
        const that = this;
        const classes = cm.extend(that.params.icon.classes, [that.params.icon.icon]);
        return cm.node('div', {classes: classes});
    };

    classProto.renderTooltip = function() {
        const that = this;
        cm.getConstructor(that.params.tooltip.constructor, classConstructor => {
            that.components.tooltip = new classConstructor(
                cm.merge(that.params.tooltip.constructorParams, {
                    target: that.nodes.container || that.nodes.button,
                    content: that.nodes.target,
                    events: {
                        onShowStart: () => {
                            cm.addClass(that.nodes.button, 'active');
                            that.components.tooltip.focus();
                            that.triggerEvent('onShow');
                        },
                        onHideStart: () => {
                            cm.removeClass(that.nodes.button, 'active');
                            that.nodes.button.focus();
                            that.triggerEvent('onHide');
                        },
                    },
                })
            );
        });
    };

    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Render items
        that.renderItems(that.params.items);

        // Render tooltip
        if (that.params.tooltip.enable) {
            that.renderTooltip();
        }
    };

    /******* ITEMS *******/

    classProto.renderItems = function(items){
        const that = this;
        cm.forEach(items, item => that.renderItem(item));
    }

    classProto.renderItem = function(params){
        const that = this;

        // Validate default params
        const defaultParams = cm.merge({
            name: '',
            label: '',
            icon: null,
            access: true,
            status: null, // success | warning | danger
            classes: [],
            attr: {},
            preventDefault: true,
            constructor: false,
            constructorParams: {},
            callback: null,
            callbackParams: {},
        }, that.params.item);

        // Validate item
        const item = {
            nodes: {},
            params: cm.merge(defaultParams, params)
        };

        // Validate params
        item.params.attr.classes = cm.merge(item.params.classes, item.params.attr.classes);

        // Check access
        if (!item.params.access) {
            return;
        }

        // Structure
        item.nodes.container = cm.node('li',
            item.nodes.link = cm.node('a', item.params.attr, item.params.label)
        );

        // Render icon
        if (cm.isNode(item.params.icon)) {
            item.nodes.icon = item.params.icon.cloneNode(true);
            cm.insertFirst(item.nodes.icon, item.nodes.link);
            cm.addClass(item.nodes.container, 'has-icon');
        }

        // Status
        if (!cm.isEmpty(item.params.status)) {
            cm.addClass(item.nodes.container, item.params.status);
        }

        // Set role action attributes if callback or controller provided
        if (item.params.constructor || cm.isFunction(item.params.callback)) {
            item.nodes.link.setAttribute('role', 'button');
            item.nodes.link.setAttribute('tabindex', 0);
        }

        // Action
        if (item.params.constructor) {
            that.renderItemController(item);
        } else {
            that.renderItemAction(item);
        }

        // Append
        cm.appendChild(item.nodes.container, that.nodes.holder);
        that.items.push(item);
    };

    classProto.renderItemController = function(item) {
        const that = this;
        cm.getConstructor(item.params.constructor, classConstructor => {
            const params = cm.merge(item.params.constructorParams, {
                node: item.nodes.link,
                actionItem: item,
                events: {
                    onRenderControllerEnd: () => that.hide(false),
                },
            });
            item.controller = new classConstructor(params);
        });
    };

    classProto.renderItemAction = function(item) {
        const that = this;
        cm.click.add(item.nodes.link, event => {
            if (item.params.preventDefault) {
                cm.preventDefault(event);
            }
            if (cm.isFunction(item.params.callback)) {
                const params = cm.merge(item.params.callbackParams, {
                    node: item.nodes.link,
                    actionItem: item,
                });
                item.params.callback(event, params);
            }
            that.hide(false);
        });
    };

    /******** PUBLIC ********/

    classProto.show = function() {
        const that = this;
        that.components.tooltip?.show();
        return that;
    };

    classProto.hide = function() {
        const that = this;
        that.components.tooltip?.hide();
        return that;
    };

    classProto.addItem = function(item) {
        const that = this;
        that.renderItem(item);
        return that;
    };

    classProto.getItems = function() {
        const that = this;
        return that.items;
    };

    classProto.getNodes = function(key) {
        const that = this;
        return that.nodes[key] || that.nodes;
    };
});