// ToDo: Deprecated elements stack
Com.Elements.Selects = {};

Com.GetSelect = id => {
    return Com.Elements.Selects[id] || null;
};

cm.define('Com.Select', {
    modules: [
        'Params',
        'Events',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    events: [
        'onValidateParams',
        'onValidateParamsStart',
        'onValidateParamsProcess',
        'onValidateParamsEnd',
        'onRender',
        'onRenderStart',
        'onSelect',
        'onChange',
        'onReset',
        'onFocus',
        'onBlur',
        'onIconClick',
    ],
    params: {
        select: null,                        // Deprecated, use 'node' parameter instead.
        node: null,                          // Html select node to decorate.
        container: null,                     // Component container that is required in case content is rendered without available select.
        name: '',
        embedStructure: 'replace',
        customEvents: true,
        renderInBody: true,                  // Render dropdowns in document.body, else they will be rendered in component container.
        renderHiddenContent: true,
        multiple: false,                     // Render multiple select.
        placeholder: '',
        showPlaceholderAbove: false,
        showTitleTag: true,                  // Copy title from available select node to component container. Will be shown on hover.
        title: false,                        // Title text. Will be shown on hover.
        options: [],                         // Listing of options, for rendering through java-script. Example: [{'value' : 'foo', 'text' : 'Bar'}].
        selected: 0,                         // Deprecated, use 'value' parameter instead.
        max: 0,                               // Maximum selected options, 0 - for unlimited
        setInitialValue: true,
        setPlaceholderText: true,            // Set text of the placeholder option as selected
        value: null,                         // Option value / array of option values.
        defaultValue: null,
        disabled: false,
        id: null,
        className: [],
        inputClassName: [],
        tabindex: null,
        icons: {
            arrow: 'icon default linked'
        },
        tooltip: {
            limitWidth: true,
            constructor: 'Com.Tooltip',
            constructorParams: {
                targetEvent: 'none',
                hideOnOut: true,
                hold: true,
                scroll: false,
                className: 'com__select__tooltip',
                width: 'targetWidth',
                minWidth: 'targetWidth',
                top: cm._config.tooltipDown,
                ariaRole: 'listbox',
            },
        },
    }
},
function(params) {
    var that = this,
        nodes = {
            menu: {}
        },
        components = {},
        options = {},
        optionsList = [],
        optionsLength = 0,
        groups = [],

        oldActive,
        active;

    that.disabled = false;
    that.isOpen = false;
    that.isFocus = false;
    that.wasFocus = false;
    that.clickTarget = null;
    that.isDestructed = null;

    /* *** CLASS FUNCTIONS *** */

    var init = function() {
        that.destructHandler = that.destruct.bind(that);
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params.events);
        that.getDataConfig(that.params.node);
        validateParams();
        that.addToStack(that.params.node);
        that.triggerEvent('onRenderStart');
        render();
        setMiscEvents();
        setEvents();
        
        // Set selected option
        if (that.params.multiple) {
            if (!cm.isEmpty(that.params.value) && cm.isArray(that.params.value)) {
                cm.forEach(that.params.value, item => {
                    if (options[item]) {
                        set(options[item], true);
                    }
                });
            }
        } else {
            if (!cm.isEmpty(that.params.value) && options[that.params.value]) {
                set(options[that.params.value]);
            } else if (that.params.setInitialValue && optionsLength) {
                set(optionsList[0]);
            }
        }
        
        // Final events
        that.addToStack(nodes.container);
        that.triggerEvent('onRender', active);
    };

    var preValidateParams = function() {
        if (cm.isNode(that.params.select)) {
            that.params.node = that.params.select;
        }
    };

    var validateParams = function() {
        that.triggerEvent('onValidateParamsStart');
        
        // Validate CSS classes
        if (cm.isEmpty(that.params.className)) {
            that.params.className = [];
        } else if (cm.isString(that.params.className)) {
            that.params.className = [that.params.className];
        }
        
        // ToDo: Deprecated legacy parameter
        if (cm.isObject(that.params['Com.Tooltip'])) {
            that.params.tooltip.constructorParams = cm.merge(that.params.tooltip.constructorParams, that.params['Com.Tooltip']);
        }
        if (!that.params.tooltip.limitWidth) {
            that.params.tooltip.constructorParams.width = 'auto';
        }
        
        if (cm.isNode(that.params.node)) {
            that.params.placeholder = that.params.node.getAttribute('placeholder') || that.params.placeholder;
            that.params.multiple = that.params.node.multiple;
            that.params.title = that.params.node.getAttribute('title') || that.params.title;
            that.params.name = that.params.node.getAttribute('name') || that.params.name;
            that.params.disabled = that.params.node.disabled || that.params.node.readOnly || that.params.disabled;
            that.params.tabindex = that.params.node.getAttribute('tabindex') || that.params.tabindex;
            that.params.id = that.params.node.id || that.params.id;

            // Merge CSS classes
            const classList = Array.from(that.params.node.classList);
            that.params.className = cm.merge(that.params.className, classList);
        }
        if (that.params.multiple) {
            active = [];
        }
        
        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        validateParamsValue();
        that.disabled = that.params.disabled;
        that.triggerEvent('onValidateParamsEnd');
    };

    var validateParamsValue = function() {
        if (cm.isNode(that.params.node)) {
            const dataValue = that.params.node.getAttribute('data-value');

            // First try to take original value, then real time js value
            let value = cm.getSelectValue(that.params.node);

            // Parse JSON
            if (!cm.isEmpty(dataValue)) {
                value = cm.parseJSON(dataValue);
            }
            that.params.value = !cm.isEmpty(value) ? value : that.params.value;
        }
        that.params.value = !cm.isEmpty(that.params.value) ? that.params.value : that.params.defaultValue;
    };

    var render = function() {
        /* *** RENDER STRUCTURE *** */
        if (that.params.multiple) {
            renderMultiple();
        } else {
            renderSingle();
        }
        
        /* *** ATTRIBUTES *** */
        
        // Add class name
        cm.addClass(nodes.container, that.params.className);
        
        // Title
        if (!cm.isEmpty(that.params.title)) {
            if (that.params.showTitleTag) {
                nodes.container.title = that.params.title;
            } else {
                nodes.container.setAttribute('aria-label', that.params.title);
            }
        }
        
        // Tabindex
        if (cm.isNumber(that.params.tabindex)) {
            nodes.container.setAttribute('tabindex', that.params.tabindex);
        }
        
        // ID
        if (!cm.isEmpty(that.params.id)) {
            nodes.container.id = that.params.id;
        }
        
        // Data attributes
        if (cm.isNode(that.params.node)) {
            cm.forEach(that.params.node.attributes, item => {
                if (/^data-(?!node|element)/.test(item.name)) {
                    nodes.hidden.setAttribute(item.name, item.value);
                    nodes.container.setAttribute(item.name, item.value);
                }
            });
        }
        
        // Set hidden input attributes
        if (that.params.name) {
            nodes.hidden.setAttribute('name', that.params.name);
        }
        
        // Prevent repopulating values on browser back action
        nodes.hidden.setAttribute('autocomplete', 'off');
        
        // Placeholder
        if (!cm.isEmpty(that.params.placeholder)) {
            nodes.placeholder = cm.node('li',
                cm.node('div', {classes: 'text disabled'},
                    cm.node('span', {classes: 'label'}, that.params.placeholder)
                )
            );
            if (that.params.showPlaceholderAbove) {
                cm.addClass(nodes.items, 'has-placeholder-sticky')
                cm.addClass(nodes.placeholder, ['sticky', 'placeholder-sticky']);
            }
            cm.appendChild(nodes.placeholder, nodes.holder);
        }
        
        /* *** RENDER OPTIONS *** */
        if (cm.isNode(that.params.node)) {
            collectSelectOptions();
        }
        cm.forEach(that.params.options, item => renderOption(item));
        
        /* *** INSERT INTO DOM *** */
        that.embedStructure(nodes.container);
    };

    var renderSingle = function() {
        // Structure
        nodes.container = cm.node('div', {classes: 'com__select'},
            nodes.target = cm.node('div', {classes: 'pt__input'},
                nodes.text = cm.node('input', {type: 'text', readOnly: 'true'}),
                nodes.arrow = cm.node('div', {
                    class: that.params.icons.arrow,
                    role: 'combobox',
                    'aria-haspopup': 'true',
                    'aria-controls': 'listbox',
                    'aria-expanded': 'false'
                }),
            ),
            nodes.items = cm.node('div', {classes: 'pt__listing-items'},
                nodes.holder = cm.node('ul', {role: 'listbox'})
            )
        );

        // Attributes
        cm.addClass(nodes.target, that.params.inputClassName);
        if (!cm.isEmpty(that.params.id)) {
            nodes.text.setAttribute('aria-describedby', that.params.id);
        }

        // Hidden select
        nodes.hidden = cm.node('select', {classes: 'display-none'});
        if (that.params.renderHiddenContent) {
            cm.insertFirst(nodes.hidden, nodes.container);
        }
    };

    var renderMultiple = function() {
        // Structure
        nodes.container = cm.node('div', {classes: 'com__select-multi'},
            nodes.inner = cm.node('div', {classes: 'inner'},
                nodes.items = cm.node('div', {classes: 'pt__listing-items'},
                    nodes.holder = cm.node('ul', {role: 'listbox'})
                )
            )
        );

        // Hidden select
        nodes.hidden = cm.node('select', {classes: 'display-none', multiple: true});
        if (that.params.renderHiddenContent) {
            cm.insertFirst(nodes.hidden, nodes.container);
        }
    };

    var setMiscEvents = function() {
        if (!that.params.multiple) {
            cm.addEvent(nodes.arrow, 'mousedown', afterClick);
            cm.addEvent(nodes.arrow, 'click', afterClick);
            cm.addEvent(nodes.text, 'keydown', afterKeypress);
            cm.addEvent(nodes.text, 'focus', afterFocus);
            cm.addEvent(nodes.text, 'blur', afterBlur);

            // Render tooltip
            cm.getConstructor(that.params.tooltip.constructor, classConstructor => {
                components.menu = new classConstructor(
                    cm.merge(that.params.tooltip.constructorParams, {
                        container: that.params.renderInBody ? document.body : nodes.container,
                        content: nodes.items,
                        target: nodes.target,
                        holdTarget: nodes.container,
                        disabled: !optionsLength,
                        events: {
                            onShowStart: afterShow.bind(that),
                            onHideStart: afterHide.bind(that),
                        }
                    })
                );
            });
        }

        // Enable / Disable
        if (that.disabled) {
            that.disable();
        } else {
            that.enable();
        }
    };

    var setEvents = function() {
        // Add custom event
        if (that.params.customEvents) {
            cm.customEvent.add(nodes.container, 'destruct', that.destructHandler);
        }
    };

    var unsetEvents = function() {
        // Add custom event
        if (that.params.customEvents) {
            cm.customEvent.remove(nodes.container, 'destruct', that.destructHandler);
        }
    };

    /******* EVENTS *******/

    var afterClick = function(e) {
        if (e.type === 'mousedown') {
            that.wasFocus = that.isFocus;
        }
        if (e.type === 'click') {
            if (that.wasFocus) {
                that.toggleMenu(false);
            } else {
                that.focus();
            }
            that.triggerEvent('onIconClick');
        }
    };

    var afterFocus = function() {
        if (optionsLength) {
            cm.addClass(nodes.container, 'active');
            that.toggleMenu(true);

            // Scroll to an active element
            if (active && options[active]) {
                scrollToItem(options[active]);
            }
        }

        that.isFocus = true;
        that.triggerEvent('onFocus', active);
    };

    var afterBlur = function() {
        if (!that.isOwnNode(that.clickTarget)) {
            that.toggleMenu(false);
        }

        that.isFocus = false;
        that.clickTarget = null;
        cm.removeClass(nodes.container, 'active');
        that.triggerEvent('onBlur', active);
    };

    var afterShow = function() {
        that.isOpen = true;
        nodes.arrow.setAttribute('aria-expanded', 'true');
        cm.addEvent(document, 'keydown', blockDocumentArrows);
        cm.addEvent(document, 'mousedown', afterBodyClick);
    };

    var afterHide = function() {
        that.isOpen = false;
        nodes.arrow.setAttribute('aria-expanded', 'false');
        cm.removeEvent(document, 'keydown', blockDocumentArrows);
        cm.removeEvent(document, 'mousedown', afterBodyClick);
    };

    var afterKeypress = function(event) {
        // Get visible items; exit if none
        const items = optionsList.filter(item => !item.disabled);
        if (!items.length) return;

        // Key actions map
        const actions = {
            ArrowUp: (index) => findPreviousIndex(index),
            ArrowDown: (index) => findNextIndex(index),
            Home: () => findFirstIndex(),
            End: () => findLastIndex(),
        };

        // Execute action if key exists
        if (actions[event.code]) {
            event.preventDefault();
            const currentIndex = optionsList.indexOf(options[active]);
            const index = actions[event.code](currentIndex);
            const option = optionsList[index];
            if (option) {
                set(option, true);
                scrollToItem(option);
            }
        }

        // Hide tooltip
        if (['Enter', 'Space'].includes(event.code)) {
            event.preventDefault();
            that.toggleMenu(false);
        }
    };

    var afterBodyClick = function(e) {
        that.clickTarget = cm.getEventTarget(e);
        if (!that.isOwnNode(that.clickTarget)) {
            that.toggleMenu(false);
        }
    };

    /******* NAVIGATION *******/

    var findFirstIndex = function() {
        return optionsList.findIndex(item => !item.disabled);
    };

    var findLastIndex = function() {
        return optionsList.findLastIndex(item => !item.disabled);
    };

    var findPreviousIndex = function(index) {
        if (!cm.isNumber(index)) {
            return that.findLastIndex();
        }

        let previousIndex = (index - 1 + optionsLength) % optionsLength;
        while (optionsList[previousIndex].disabled) {
            previousIndex = (previousIndex - 1 + optionsLength) % optionsLength;
        }
        return previousIndex;
    };

    var findNextIndex = function(index) {
        if (!cm.isNumber(index)) {
            return that.findFirstIndex();
        }

        let nextIndex = (index + 1) % optionsLength;
        while (optionsList[nextIndex].disabled) {
            nextIndex = (nextIndex + 1) % optionsLength;
        }
        return nextIndex;
    };

    /******* COLLECTORS *******/

    var collectSelectGroupOption = function(node) {
        return {
            value: node.value,
            text: node.innerHTML,
            classes: [node.className],
            style: node.style.cssText,
            hidden: node.hidden,
            disabled: node.disabled
        };
    };

    var collectSelectOptions = function() {
        var nodes = that.params.node.childNodes,
            nodeTagName,
            options;
        cm.forEach(nodes, function(node) {
            if (cm.isElementNode(node)) {
                nodeTagName = node.tagName.toLowerCase();
                if (nodeTagName === 'optgroup') {
                    options = collectSelectGroupOptions(node);
                    renderGroup(node.label, options);
                } else if (nodeTagName === 'option') {
                    renderOption(
                        collectSelectGroupOption(node)
                    );
                }
            }
        });
    };

    var collectSelectGroupOptions = function(node) {
        var optionNodes = node.querySelectorAll('option'),
            options = [];
        cm.forEach(optionNodes, function(optionNode) {
            options.push(
                collectSelectGroupOption(optionNode)
            );
        });
        return options;
    };

    /* *** GROUPS *** */

    var renderGroup = function(name, options) {
        // Config
        var item = {
            name: name,
            options: options
        };

        // Structure
        item.optgroup = cm.node('optgroup', {label: item.name});
        item.container = cm.node('li', {classes: 'group', role: 'option'},
            item.items = cm.node('ul', {classes: 'pt__listing-items', role: 'group'})
        );

        if (!cm.isEmpty(item.name)) {
            cm.addClass(item.container, 'group-sticky');
            cm.insertFirst(
                cm.node('div', {classes: 'title', innerHTML: item.name}),
                item.container
            );
        }

        // Render options
        cm.forEach(item.options, optionItem => renderOption(optionItem, item));

        // Append
        nodes.holder.appendChild(item.container);
        nodes.hidden.appendChild(item.optgroup);

        // Push
        groups.push(item);
        return item;
    };

    var getGroup = function(name) {
        return groups.find(item => item.name === name);
    };

    /* *** OPTIONS *** */

    var renderOption = function(item, groupItem) {
        // Config
        item = cm.merge({
            group: null,         // Group name
            groupItem: null,      // Group item
            hidden: false,
            select: false,       // Choose option after adding
            selected: false,     // For select with multiple options to choose
            disabled: false,
            placeholder: false,
            value: '',
            text: '',
            textNode: null,
            classes: [],
            style: null,
            renderCheckbox: false,
        }, item);

        // Validate
        item.placeholder = cm.isEmpty(item.value) ? true : item.placeholder;
        if (!cm.isEmpty(item.className)) {
            if (cm.isArray(item.classes)) {
                item.classes.push(item.className);
            } else {
                item.classes = [item.classes, item.className];
            }
        }

        // Check is option with the same value exists and delete it
        if (options[item.value]) {
            removeOption(options[item.value]);
        }

        // Get group item and link it to option's config
        if (!cm.isUndefined(groupItem)) {
            item.groupItem = groupItem;
            item.group = groupItem.name;
        } else if (!cm.isEmpty(item.group)) {
            item.groupItem = getGroup(item.group);
            if (!item.groupItem) {
                item.groupItem = renderGroup(item.group);
            }
        }

        // Structure
        item.option = cm.node('option', {value: item.value, innerHTML: item.text});
        item.node = cm.node('li', {
                classes: item.classes,
                style: item.style,
                role: 'option',
                'aria-selected': 'false'
            },
            item.link = cm.node('a', {title: cm.cutHTML(item.text)})
        );

        // Label
        if (cm.isNode(item.textNode)) {
            cm.appendChild(item.textNode, item.link);
        } else {
            item.link.innerHTML = item.text;
        }

        // Checkbox
        if (item.renderCheckbox) {
            item.checkbox = cm.node('input', {
                classes: 'checkbox',
                type: that.params.multiple ? 'checkbox' : 'radio',
                'aria-hidden': true
            });
            cm.insertFirst(item.checkbox, item.link);
        }

        // States styles
        item.hidden && cm.addClass(item.node, 'hidden');
        item.disabled && cm.addClass(item.node, 'disabled');
        item.placeholder && cm.addClass(item.node, 'placeholder');

        // Append
        if (item.groupItem) {
            item.groupItem.items.appendChild(item.node);
            item.groupItem.optgroup.appendChild(item.option);
        } else {
            nodes.holder.appendChild(item.node);
            nodes.hidden.appendChild(item.option);
        }

        // Label click event
        cm.click.add(item.link, () => {
            if (!item.disabled && !that.disabled) {
                set(item, true);
            }
            if (!that.params.multiple) {
                that.toggleMenu(false);
            }
        });

        // Push
        options[item.value] = item;
        optionsList.push(item);
        optionsLength = optionsList.length;

        // Select
        if (item.select) {
            set(item, false);
        }

        return item;
    };

    var editOption = function(option, text) {
        const value = !cm.isUndefined(option.value) ? option.value : option.text;
        option.text = text;
        option.node.innerHTML = text;
        option.option.innerHTML = text;

        if (!that.params.multiple && value === active) {
            nodes.text.value = cm.decode(text);
        }
    };

    var removeOption = function(option, params) {
        // Validate params
        params = cm.merge({
            setDefault: true,
        }, params);

        // Validate value
        const value = !cm.isUndefined(option.value) ? option.value : option.text;

        // Remove option from list and array
        cm.remove(option.node);
        cm.remove(option.option);
        optionsList = optionsList.filter(item => option !== item);
        optionsLength = optionsList.length;
        delete options[option.value];

        // Set new active option
        if (that.params.multiple) {
            if (cm.isArray(active)) {
                active = active.filter(item => value !== item);
            }
        } else {
            if (value === active) {
                if (params.setDefault && optionsLength) {
                    set(optionsList[0], true);
                } else {
                    active = null;
                    nodes.text.value = '';
                }
            }
        }
    };

    /* *** SETTERS *** */

    var set = function(option, execute) {
        if (option) {
            if (that.params.multiple) {
                setMultiple(option);
            } else {
                setSingle(option);
            }
        }
        if (execute) {
            that.triggerEvent('onSelect', active);
            onChange();
        }
    };

    var setMultiple = function(option) {
        const value = !cm.isUndefined(option.value) ? option.value : option.text;
        if (option.selected) {
            deselectMultiple(option);
        } else if (
            !that.params.max ||
            (that.params.max > 0 && active.length < that.params.max)
        ) {
            active.push(value);
            setOption(option);
        }
    };

    var setSingle = function(option) {
        oldActive = active;
        active = !cm.isUndefined(option.value) ? option.value : option.text;
        optionsList.forEach(unsetOption);
        if (!option.placeholder || that.params.setPlaceholderText) {
            if (option.group) {
                nodes.text.value = [cm.decode(option.group), cm.decode(option.text)].join(' › ');
            } else {
                nodes.text.value = cm.decode(option.text);
            }
        } else {
            nodes.text.value = '';
        }
        nodes.hidden.value = active;
        setOption(option);
    };

    var unsetOption = function(option) {
        option.option.selected = false;
        option.selected = false;
        if (option.checkbox) {
            option.checkbox.checked = false;
        }
        option.node.setAttribute('aria-selected', 'false');
        cm.removeClass(option.node, 'active');
    };

    var setOption = function(option) {
        option.option.selected = true;
        option.selected = true;
        if (option.checkbox) {
            option.checkbox.checked = true;
        }
        option.node.setAttribute('aria-selected', 'true');
        cm.addClass(option.node, 'active');
    };

    var deselectMultiple = function(option) {
        var value = !cm.isUndefined(option.value) ? option.value : option.text;
        // Filter selected
        active = active.filter(function(item) {
            return value != item;
        });
        // Deselect option
        unsetOption(option);
    };

    var onChange = function() {
        if (cm.stringifyJSON(active) !== cm.stringifyJSON(oldActive)) {
            that.triggerEvent('onChange', active);
        }
    };

    /* *** DROPDOWN *** */

    var scrollToItem = function(option) {
        if (!components.menu || that.params.multiple) return;
        nodes.holder.scrollTop = option.node.offsetTop - nodes.holder.offsetTop;
    };

    var toggleMenuState = function() {
        if (!components.menu || that.params.multiple) {
            return;
        }
        if (!that.disabled && optionsLength > 0) {
            components.menu.enable();
        } else {
            components.menu.disable();
        }
    };

    /* *** HELPERS *** */

    var blockDocumentArrows = function(e) {
        e = cm.getEvent(e);
        if (e.keyCode === 38 || e.keyCode === 40) {
            cm.preventDefault(e);
        }
    };

    /* ******* MAIN ******* */

    that.destruct = function() {
        var that = this;
        if (!that.isDestructed) {
            that.isDestructed = true;
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.get = function() {
        return active;
    };

    that.getText = function() {
        var strings = [];
        if (cm.isArray(active)) {
            cm.forEach(active, value => {
                if (options[value]) {
                    strings.push(options[value].text);
                }
            });
        } else {
            if (options[active]) {
                strings.push(options[active].text);
            }
        }
        return strings.join(', ') || null;
    };

    that.set = function(value, triggerEvents) {
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        // Select option and execute events
        if (!cm.isUndefined(value)) {
            if (cm.isArray(value)) {
                cm.forEach(value, item => {
                    if (options[item]) {
                        set(options[item], false);
                    }
                });
                if (triggerEvents) {
                    that.triggerEvent('onSelect', active);
                    that.triggerEvent('onChange', active);
                }
            } else if (options[value]) {
                set(options[value], triggerEvents);
            }
        }
        return that;
    };

    that.reset = function(triggerEvents) {
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        if (that.params.multiple) {
            that.deselectAll(triggerEvents);
        } else {
            if (optionsLength) {
                set(optionsList[0], triggerEvents);
            }
        }
        that.triggerEvent('onReset', active);
    };

    that.selectAll = function(triggerEvents) {
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        if (that.params.multiple) {
            cm.forEach(options, deselectMultiple);
            cm.forEach(options, setMultiple);
            if (triggerEvents) {
                that.triggerEvent('onSelect', active);
                onChange();
            }
        }
        return that;
    };

    that.deselectAll = function(triggerEvents) {
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        if (that.params.multiple) {
            cm.forEach(options, deselectMultiple);
            if (triggerEvents) {
                that.triggerEvent('onSelect', active);
                onChange();
            }
        }
        return that;
    };

    that.addOption = function(value, text) {
        if (cm.isObject(arguments[0])) {
            renderOption(arguments[0]);
        } else {
            renderOption({
                value: value,
                text: text
            });
        }
        toggleMenuState();
        return that;
    };

    that.addOptions = function(arr) {
        cm.forEach(arr, item => {
            renderOption(item);
        });
        toggleMenuState();
        return that;
    };

    that.editOption = function(value, text) {
        if (!cm.isUndefined(value) && options[value]) {
            editOption(options[value], text);
        }
        return that;
    };

    that.removeOption = function(value) {
        if (!cm.isUndefined(value) && options[value]) {
            removeOption(options[value]);
            toggleMenuState();
        }
        return that;
    };

    that.removeOptions = that.removeOptionsAll = function() {
        cm.forEach(options, item => {
            removeOption(item, {setDefault: false});
        });
        toggleMenuState();
        return that;
    };

    that.getOption = function(value) {
        const option = options[value];
        if (!option) return;
        return option;
    };

    that.getSelectedOption = that.getValueOption = function() {
        if (cm.isArray(active)) {
            const values = [];
            cm.forEach(active, value => {
                const option = that.getOption(value);
                if (option) {
                    values.push(option);
                }
            });
            return values;
        } else {
            return that.getOption(active);
        }
    };

    that.getOptions = that.getOptionsAll = that.getAllOptions = function() {
        const results = [];
        cm.forEach(optionsList, item => {
            results.push({
                text: item.text,
                value: item.value
            });
        });
        return results;
    };

    that.hideOption = function(value) {
        const option = that.getOption(value);
        if (!option) return;
        option.hidden = true;
        cm.addClass(option.node, 'hidden');
    };

    that.showOption = function(value) {
        const option = that.getOption(value);
        if (!option) return;
        option.hidden = false;
        cm.removeClass(option.node, 'hidden');
    };

    that.toggleOptionVisibility = function(value, state) {
        const option = that.getOption(value);
        if (!option) return;
        if (state) {
            that.showOption(value);
        } else {
            that.hideOption(value);
        }
    };

    that.disableOption = function(value) {
        const option = that.getOption(value);
        if (!option) return;
        option.disabled = true;
        cm.addClass(option.node, 'disabled');
    };

    that.enableOption = function(value) {
        const option = that.getOption(value);
        if (!option) return;
        option.disabled = false;
        cm.removeClass(option.node, 'disabled');
    };

    that.focus = function() {
        if (!that.params.multiple) {
            nodes.text.focus();
        }
        return that;
    };

    that.blur = function() {
        if (!that.params.multiple) {
            nodes.text.blur();
        }
        return that;
    };

    that.disable = function() {
        that.disabled = true;
        cm.addClass(nodes.container, 'disabled');
        cm.addClass(nodes.items, 'disabled');
        cm.addClass(nodes.target, 'disabled');
        if (!that.params.multiple) {
            nodes.text.disabled = true;
            components.menu && components.menu.disable();
        }
        return that;
    };

    that.enable = function() {
        that.disabled = false;
        cm.removeClass(nodes.container, 'disabled');
        cm.removeClass(nodes.items, 'disabled');
        cm.removeClass(nodes.target, 'disabled');
        if (!that.params.multiple) {
            nodes.text.disabled = false;
            if (optionsLength > 0) {
                components.menu && components.menu.enable();
            }
        }
        return that;
    };

    that.toggleVisibility = function(state) {
        cm.toggleClass(nodes.container, 'is-hidden', !state);
        return that;
    };

    that.toggleMenu = function(state, immediately) {
        if (that.disabled || !components.menu) {
            return that;
        }
        if (state) {
            components.menu.show(immediately);
        } else {
            components.menu.hide(immediately);
        }
        return that;
    };

    that.getNodes = function(key) {
        return nodes[key] || nodes;
    };

    that.getContainer = function() {
        return nodes.container;
    };

    that.isOwnNode = function(node) {
        return cm.isParent(nodes.container, node, true) || components.menu.isOwnNode(node);
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('select', {
    node: cm.node('select'),
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.Select'
});
