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

                targetEvent: 'click',
                preventClickEvent: true,
                hideOnReClick: true,
                hideOnOut: true,
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
        that.nodes = {
            holder: cm.node('div'),
            button: cm.node('div'),
            target: cm.node('div'),
        };
        that.items = [];
        that.currentIndex = null;
        that.previousIndex = null;

        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.setAttributes = function(){
        const that = this;

        // Call parent method
        classInherit.prototype.setAttributes.apply(that, arguments);

        // Set additional CSS classes
        cm.forEach(that.params.modifiers, modifier => {
            cm.addClass(that.nodes.container, `com__menu--${modifier}`);
        });
    };

    /******* VIEW *******/

    classProto.renderView = function() {
        const that = this;

        // Structure
        that.nodes.container = cm.node('div', {classes: 'com__menu', title: that.msg('label')},
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

    /******* TOOLTIP *******/

    classProto.renderTooltip = function() {
        const that = this;

        // Render tooltip controller
        cm.getConstructor(that.params.tooltip.constructor, classConstructor => {
            that.components.tooltip = new classConstructor(
                cm.merge(that.params.tooltip.constructorParams, {
                    target: that.nodes.container || that.nodes.button,
                    content: that.nodes.target,
                    events: {
                        onShowStart: () => that.afterShow(),
                        onHideStart: () => that.afterHide(),
                    },
                })
            );
        });

        // Set accessible attributes
        that.nodes.button.setAttribute('role', 'button');
        that.nodes.button.setAttribute('tabindex', '0');
        that.nodes.button.setAttribute('aria-haspopup', 'true');
        that.nodes.button.setAttribute('aria-controls', 'menu');
        that.nodes.button.setAttribute('aria-expanded', 'false');

        // Add arrow navigation listeners
        cm.addEvent(that.nodes.button, 'focus', that.afterFocus.bind(that));
        cm.addEvent(that.nodes.button, 'blur', that.afterBlur.bind(that));
        cm.addEvent(that.nodes.button, 'keydown', that.afterKeyPress.bind(that));
    };

    classProto.afterFocus = function() {
        const that = this;
        cm.addClass(that.nodes.button, 'highlight');
        cm.addClass(that.nodes.icon, 'highlight');
    };

    classProto.afterBlur = function() {
        const that = this;
        cm.removeClass(that.nodes.button, 'highlight');
        cm.removeClass(that.nodes.icon, 'highlight');
        if (!that.components.tooltip.isOwnEventTarget()) {
            that.hide();
        }
    };

    classProto.afterShow = function() {
        const that = this;
        cm.addClass(that.nodes.button, 'active');
        cm.addClass(that.nodes.icon, 'active');
        that.nodes.button.setAttribute('aria-expanded', 'true');
        that.nodes.button.focus();

        // Select the first available option if it was a keyboard event
        const event = that.components.tooltip.getLastTargetEvent();
        if (event?.type === 'keypress') {
            that.selectItem(that.findFirstIndex());
        }

        that.triggerEvent('onShow');
    };

    classProto.afterHide = function() {
        const that = this;
        cm.removeClass(that.nodes.button, 'active');
        cm.removeClass(that.nodes.icon, 'active');
        that.nodes.button.setAttribute('aria-expanded', 'false');
        that.nodes.button.focus();
        that.unselectItem(that.currentIndex);
        that.triggerEvent('onHide');
    };

    classProto.afterKeyPress = function(event) {
        const that = this;
        if (!that.components.tooltip.isShow) return;

        // Get visible items; exit if none
        const items = that.items.filter(item => !item.params.hidden);
        if (!items.length) return;

        // Key actions map
        const actions = {
            ArrowUp: () => that.selectItem(that.findPreviousIndex(that.currentIndex)),
            ArrowDown: () => that.selectItem(that.findNextIndex(that.currentIndex)),
            Home: () => that.selectItem(that.findFirstIndex()),
            End: () => that.selectItem(that.findLastIndex()),
            Space: () => that.triggerItemAction(that.currentIndex),
            Enter: () => that.triggerItemAction(that.currentIndex),
        };

        // Execute action if key exists
        if (actions[event.code]) {
            event.preventDefault();
            actions[event.code]();
        }
    };

    /******* NAVIGATION *******/

    classProto.findFirstIndex = function() {
        const that = this;
        return that.items.findIndex(item => !item.params.hidden);
    };

    classProto.findLastIndex = function() {
        const that = this;
        return that.items.findLastIndex(item => !item.params.hidden);
    };

    classProto.findPreviousIndex = function(index) {
        const that = this;
        if (!cm.isNumber(index)) {
            return that.findLastIndex();
        }

        let previousIndex = (index - 1 + that.items.length) % that.items.length;
        while (that.getItem(previousIndex).params.hidden) {
            previousIndex = (previousIndex - 1 + that.items.length) % that.items.length;
        }
        return previousIndex;
    };

    classProto.findNextIndex = function(index) {
        const that = this;
        if (!cm.isNumber(index)) {
            return that.findFirstIndex();
        }

        let nextIndex = (index + 1) % that.items.length;
        while (that.getItem(nextIndex).params.hidden) {
            nextIndex = (nextIndex + 1) % that.items.length;
        }
        return nextIndex;
    };

    /******* ITEMS *******/

    classProto.reArrangeItems = function() {
        const that = this;
        cm.forEach(that.items, item => {
            if (item.params.hidden) {
                cm.remove(item.nodes.container);
            } else {
                cm.appendChild(item.nodes.container, that.nodes.holder);
            }
        });
    };

    classProto.renderItems = function(items){
        const that = this;
        cm.forEach(items, item => that.renderItem(item));
    };

    classProto.renderItem = function(params){
        const that = this;

        // Validate default params
        const defaultParams = cm.merge({
            name: '',
            label: '',
            icon: null,
            access: true,
            status: null, // success | warning | danger
            hidden: false,
            classes: [],
            attr: {},
            preventDefault: true,
            constructor: false,
            constructorParams: {},
            callback: null,
            callbackParams: {},
            afterRender: null,
        }, that.params.item);

        // Validate item
        const item = {
            nodes: {},
            params: cm.merge(defaultParams, params)
        };

        // Check access
        if (!item.params.access) return;

        // Validate params
        item.params.attr.classes = cm.merge(item.params.classes, item.params.attr.classes);

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

        // Add navigation listeners
        if (that.params.tooltip.enable) {
            cm.addEvent(item.nodes.link, 'mouseenter', () => that.selectItem(item));
            cm.addEvent(item.nodes.link, 'mouseleave', () => that.unselectItem(item));
        }

        // Action
        if (item.params.constructor) {
            that.renderItemController(item);
        } else {
            that.renderItemAction(item);
        }

        // After render callback
        if (cm.isFunction(item.params.afterRender)) {
            item.params.afterRender(item);
        }

        // Append
        if (item.params.hidden) {
            cm.addClass(item.nodes.container, 'is-hidden');
        } else {
            cm.appendChild(item.nodes.container, that.nodes.holder);
        }
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

    classProto.triggerItemAction = function(item) {
        const that = this;
        item = that.getItem(item);
        if (!item) return;

        cm.triggerEvent(item.nodes.link, 'click');
    };

    classProto.selectItem = function(item) {
        const that = this;
        item = that.getItem(item);
        if (!item) return;

        // Unselect previous
        that.unselectItem(that.currentIndex);

        // Select current
        that.currentIndex = cm.arrayIndex(that.items, item);
        cm.addClass(item.nodes.link, 'highlight');
    };

    classProto.unselectItem = function(item) {
        const that = this;
        item = that.getItem(item);
        if (!item) return;

        if (cm.arrayIndex(that.items, item) === that.currentIndex) {
            that.previousIndex = that.currentIndex;
            that.currentIndex = null;
        }
        cm.removeClass(item.nodes.link, 'highlight');
    };

    classProto.toggleItemVisibility = function(item, value) {
        const that = this;
        item = that.getItem(item);
        if (!item) return;

        item.params.hidden = !value;
        cm.toggleClass(item.nodes.container, 'is-hidden', !value);
        that.reArrangeItems();
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

    classProto.getItem = function(query) {
        const that = this;
        if (cm.isNumber(query)) {
            return that.items[query];
        }
        if (cm.isString(query)) {
            return that.items.find(entry => entry.params.name === query);
        }
        if (cm.isObject(query)) {
            return query;
        }
        return null;
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