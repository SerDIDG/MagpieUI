Com.Elements['Selects'] = {};

Com['GetSelect'] = function(id){
    return Com.Elements.Selects[id] || null;
};

cm.define('Com.Select', {
    'modules' : [
        'Params',
        'Events',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'events' : [
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
        'onBlur'
    ],
    'params' : {
        'select' : null,                        // Deprecated, use 'node' parameter instead.
        'node' : null,                          // Html select node to decorate.
        'container' : null,                     // Component container that is required in case content is rendered without available select.
        'name' : '',
        'embedStructure' : 'replace',
        'customEvents' : true,
        'renderInBody' : true,                  // Render dropdowns in document.body, else they will be rendered in component container.
        'multiple' : false,                     // Render multiple select.
        'placeholder' : '',
        'showTitleTag' : true,                  // Copy title from available select node to component container. Will be shown on hover.
        'title' : false,                        // Title text. Will be shown on hover.
        'options' : [],                         // Listing of options, for rendering through java-script. Example: [{'value' : 'foo', 'text' : 'Bar'}].
        'selected' : 0,                         // Deprecated, use 'value' parameter instead.
        'setInitialValue' : true,
        'value' : null,                         // Option value / array of option values.
        'defaultValue' : null,
        'disabled' : false,
        'id' : '',
        'className' : '',
        'inputClassName' : '',
        'tabindex' : 0,
        'icons' : {
            'arrow' : 'icon default linked'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'className' : 'com__select__tooltip',
            'width' : 'targetWidth',
            'top' : cm._config.tooltipDown
        }
    }
},
function(params){
    var that = this,
        nodes = {
            'menu' : {}
        },
        components = {},
        options = {},
        optionsList = [],
        optionsLength = 0,
        groups = [],

        oldActive,
        active;

    that.disabled = false;
    that.isDestructed = null;

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        that.destructHandler = that.destruct.bind(that);
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        setMiscEvents();
        setEvents();
        // Set selected option
        if(that.params['multiple']){
            active = [];
            if(!cm.isEmpty(that.params['value']) && cm.isArray(that.params['value'])){
                cm.forEach(that.params['value'], function(item){
                    if(options[item]){
                        set(options[item], true);
                    }
                });
            }
        }else{
            if(!cm.isEmpty(that.params['value']) && options[that.params['value']]){
                set(options[that.params['value']]);
            }else if(that.params['setInitialValue'] && optionsLength){
                set(optionsList[0]);
            }
        }
        // Final events
        that.addToStack(nodes['container']);
        that.triggerEvent('onRender', active);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['select'])){
            that.params['node'] = that.params['select'];
        }
    };

    var validateParams = function(){
        that.triggerEvent('onValidateParamsStart');
        if(cm.isNode(that.params['node'])){
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['multiple'] = that.params['node'].multiple;
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['node'].readOnly || that.params['disabled'];
            that.params['className'] = that.params['node'].className || that.params['className'];
            that.params['tabindex'] = that.params['node'].getAttribute('tabindex') || that.params['tabindex'];
            that.params['id'] = that.params['node'].id || that.params['id'];
        }
        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        validateParamsValue();
        that.disabled = that.params['disabled'];
        that.triggerEvent('onValidateParamsEnd');
    };

    var validateParamsValue = function(){
        var dataValue,
            value;
        if(cm.isNode(that.params['node'])){
            dataValue = that.params['node'].getAttribute('data-value');
            // First try to take original value, than real time js value
            value = cm.getSelectValue(that.params['node']);
            // Parse JSON
            if(!cm.isEmpty(dataValue)){
                value = cm.parseJSON(dataValue);
            }
            that.params['value'] = !cm.isEmpty(value) ?  value : that.params['value'];
        }
        that.params['value'] = !cm.isEmpty(that.params['value']) ? that.params['value'] : that.params['defaultValue'];
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        if(that.params['multiple']){
            renderMultiple();
        }else{
            renderSingle();
        }
        /* *** ATTRIBUTES *** */
        // Add class name
        cm.addClass(nodes['container'], that.params['className']);
        // Title
        if(that.params['showTitleTag'] && that.params['title']){
            nodes['container'].title = that.params['title'];
        }
        // Tabindex
        if(that.params['tabindex']){
            nodes['container'].setAttribute('tabindex', that.params['tabindex']);
        }
        // ID
        if(that.params['id']){
            nodes['container'].id = that.params['id'];
        }
        // Data attributes
        if(cm.isNode(that.params['node'])){
            cm.forEach(that.params['node'].attributes, function(item){
                if(/^data-(?!node|element)/.test(item.name)){
                    nodes['hidden'].setAttribute(item.name, item.value);
                    nodes['container'].setAttribute(item.name, item.value);
                }
            });
        }
        // Set hidden input attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Placeholder
        if(!cm.isEmpty(that.params['placeholder'])){
            nodes['items'].appendChild(
                nodes['placeholder'] = cm.node('li',
                    cm.node('div', {'class' : 'text disabled'}, that.params['placeholder'])
                )
            );
        }
        /* *** RENDER OPTIONS *** */
        if(cm.isNode(that.params['node'])){
            collectSelectOptions();
        }
        cm.forEach(that.params['options'], function(item){
            renderOption(item);
        });
        /* *** INSERT INTO DOM *** */
        that.embedStructure(nodes['container']);
    };

    var renderSingle = function(){
        nodes['container'] = cm.node('div', {'class' : 'com__select'},
            nodes['hidden'] = cm.node('select', {'class' : 'display-none'}),
            nodes['target'] = cm.node('div', {'class' : 'pt__input'},
                nodes['text'] = cm.node('input', {'type' : 'text', 'readOnly' : 'true'}),
                nodes['arrow'] = cm.node('div', {'class' : that.params['icons']['arrow']})
            ),
            nodes['scroll'] = cm.node('div', {'class' : 'pt__listing-items'},
                nodes['items'] = cm.node('ul')
            )
        );
        cm.addClass(nodes['target'], that.params['inputClassName']);
    };

    var renderMultiple = function(){
        nodes['container'] = cm.node('div', {'class' : 'com__select-multi'},
            nodes['hidden'] = cm.node('select', {'class' : 'display-none', 'multiple' : true}),
            nodes['inner'] = cm.node('div', {'class' : 'inner'},
                nodes['scroll'] = cm.node('div', {'class' : 'pt__listing-items'},
                    nodes['items'] = cm.node('ul')
                )
            )
        );
    };

    var setMiscEvents = function(){
        if(!that.params['multiple']){
            // Switch items on arrows press
            cm.addEvent(nodes['container'], 'keydown', function(e){
                if(optionsLength){
                    var item = options[active],
                        index = optionsList.indexOf(item),
                        option;

                    switch(e.keyCode){
                        case 38:
                            cm.preventDefault(e);
                            if(index - 1 >= 0){
                                option = optionsList[index - 1];
                            }else{
                                option = optionsList[optionsLength - 1];
                            }
                            break;

                        case 40:
                            cm.preventDefault(e);
                            if(index + 1 < optionsLength){
                                option = optionsList[index + 1];
                            }else{
                                option = optionsList[0];
                            }
                            break;

                        case 13:
                            components['menu'].hide();
                            break;
                    }

                    if(option){
                        set(option, true);
                        scrollToItem(option);
                    }
                }
            });
            cm.addEvent(nodes['container'], 'focus', function(){
                cm.addEvent(window, 'keydown', blockDocumentArrows);
            });
            cm.addEvent(nodes['container'], 'blur', function(){
                cm.removeEvent(window, 'keydown', blockDocumentArrows);
            });
            // Render tooltip
            components['menu'] = new Com.Tooltip(
                cm.merge(that.params['Com.Tooltip'], {
                    'container' : that.params['renderInBody']? document.body : nodes['container'],
                    'content' : nodes['scroll'],
                    'target' : nodes['target'],
                    'disabled' : !optionsLength,
                    'events' : {
                        'onShowStart' : show,
                        'onHideStart' : hide
                    }
                })
            );
            nodes['menu'] = components['menu'].getNodes();
        }
        // Enable / Disable
        if(that.disabled){
            that.disable();
        }else{
            that.enable();
        }
    };

    var setEvents = function(){
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(nodes['container'], 'destruct', that.destructHandler);
        }
    };

    var unsetEvents = function(){
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.remove(nodes['container'], 'destruct', that.destructHandler);
        }
    };

    /* *** COLLECTORS *** */

    var collectSelectGroupOption = function(node){
        return {
            'value' : node.value,
            'text' : node.innerHTML,
            'classes' : [node.className],
            'style': node.style.cssText,
            'hidden' : node.hidden,
            'disabled' : node.disabled
        };
    };

    var collectSelectOptions = function(){
        var nodes = that.params['node'].childNodes,
            nodeTagName,
            options;
        cm.forEach(nodes, function(node){
            if(cm.isElementNode(node)){
                nodeTagName = node.tagName.toLowerCase();
                if(nodeTagName === 'optgroup'){
                    options = collectSelectGroupOptions(node);
                    renderGroup(node.label, options);
                }else if(nodeTagName === 'option'){
                    renderOption(
                        collectSelectGroupOption(node)
                    );
                }
            }
        });
    };

    var collectSelectGroupOptions = function(node){
        var optionNodes = node.querySelectorAll('option'),
            options = [];
        cm.forEach(optionNodes, function(optionNode){
            options.push(
                collectSelectGroupOption(optionNode)
            );
        });
        return options;
    };

    /* *** GROUPS *** */

    var renderGroup = function(name, options){
        // Config
        var item = {
            'name' : name,
            'options' : options
        };

        // Structure
        item['optgroup'] = cm.node('optgroup', {'label' : item['name']});
        item['container'] = cm.node('li', {'class' : 'group'},
            item['items'] = cm.node('ul', {'class' : 'pt__listing-items'})
        );
        if(!cm.isEmpty(item['name'])){
            cm.insertFirst(
                cm.node('div', {'class' : 'title', 'innerHTML' : item['name']}),
                item['container']
            );
        }

        // Render options
        cm.forEach(item['options'], function(optionItem){
            renderOption(optionItem, item);
        });

        // Append
        nodes['items'].appendChild(item['container']);
        nodes['hidden'].appendChild(item['optgroup']);

        // Push
        groups.push(item);
        return item;
    };

    var getGroup = function(name){
        return groups.find(function(item){
            return item.name === name;
        });
    };

    /* *** OPTIONS *** */

    var renderOption = function(item, groupItem){
        // Config
        item = cm.merge({
            'group' : null,         // Group name
            'groupItem': null,      // Group item
            'hidden' : false,
            'select' : false,       // Choose option after adding
            'selected' : false,     // For select with multiple options to choose
            'disabled' : false,
            'value' : '',
            'text' : '',
            'classes': [],
            'style': null
        }, item);

        // Validate
        if(!cm.isEmpty(item['className'])){
            if(cm.isArray(item['classes'])){
                item['classes'].push(item['className']);
            }else{
                item['classes'] = [item['classes'], item['className']];
            }
        }

        // Check is option with the same value exists and delete it
        if(options[item['value']]){
            removeOption(options[item['value']]);
        }

        // Get group item and link it to option's config
        if(!cm.isUndefined(groupItem)){
            item['groupItem'] = groupItem;
            item['group'] = groupItem['name'];
        }else if(!cm.isEmpty(item['group'])){
            item['groupItem'] = getGroup(item['group']);
            if(!item['groupItem']){
                item['groupItem'] = renderGroup(item['group']);
            }
        }

        // Structure
        item['node'] = cm.node('li', {'classes' : item['classes'], 'style' : item['style']},
            cm.node('a', {'innerHTML' : item['text'], 'title' : item['text']})
        );
        item['option'] = cm.node('option', {'value' : item['value'], 'innerHTML' : item['text']});

        // Hidden / Disabled attributes
        item['hidden'] && cm.addClass(item['node'], 'hidden');
        item['disabled'] && cm.addClass(item['node'], 'disabled');

        // Append
        if(item['groupItem']){
            item['groupItem']['items'].appendChild(item['node']);
            item['groupItem']['optgroup'].appendChild(item['option']);
        }else{
            nodes['items'].appendChild(item['node']);
            nodes['hidden'].appendChild(item['option']);
        }

        // Label click event
        cm.addEvent(item['node'], 'click', function(){
            if(!item['disabled'] && !that.disabled){
                set(item, true);
            }
            if(!that.params['multiple']){
                components['menu'].hide(false);
            }
        });

        // Push
        optionsList.push(options[item['value']] = item);
        optionsLength = optionsList.length;

        // Select
        if(item['select']){
            set(item, false);
        }

        return item;
    };

    var editOption = function(option, text){
        var value = !cm.isUndefined(option['value'])? option['value'] : option['text'];
        option['text'] = text;
        option['node'].innerHTML = text;
        option['option'].innerHTML = text;

        if(!that.params['multiple'] && value === active){
            nodes['text'].value = cm.decode(text);
        }
    };

    var removeOption = function(option){
        var value = !cm.isUndefined(option['value'])? option['value'] : option['text'];
        // Remove option from list and array
        cm.remove(option['node']);
        cm.remove(option['option']);
        optionsList = optionsList.filter(function(item){
            return option != item;
        });
        optionsLength = optionsList.length;
        delete options[option['value']];
        // Set new active option, if current active is nominated for remove
        if(that.params['multiple']){
            if(cm.isArray(active)){
                active = active.filter(function(item){
                    return value != item;
                });
            }
        }else{
            if(value === active){
                if(optionsLength){
                    set(optionsList[0], true);
                }else{
                    active = null;
                    nodes['text'].value = '';
                }
            }
        }
    };

    /* *** SETTERS *** */

    var set = function(option, execute){
        if(option){
            if(that.params['multiple']){
                setMultiple(option);
            }else{
                setSingle(option);
            }
        }
        if(execute){
            that.triggerEvent('onSelect', active);
            onChange();
        }
    };

    var setMultiple = function(option){
        var value = !cm.isUndefined(option['value'])? option['value'] : option['text'];
        if(option['selected']){
            deselectMultiple(option);
        }else{
            active.push(value);
            setOption(option);
        }
    };

    var setSingle = function(option){
        oldActive = active;
        active = !cm.isUndefined(option['value'])? option['value'] : option['text'];
        optionsList.forEach(function(item){
            cm.removeClass(item['node'], 'active');
        });
        if(option['group']){
            nodes['text'].value = [cm.decode(option['group']), cm.decode(option['text'])].join(' > ');
        }else{
            nodes['text'].value = cm.decode(option['text']);
        }
        nodes['hidden'].value = active;
        setOption(option);
    };

    var setOption = function(option){
        option['option'].selected = true;
        option['selected'] = true;
        cm.addClass(option['node'], 'active');
    };

    var deselectMultiple = function(option){
        var value = !cm.isUndefined(option['value'])? option['value'] : option['text'];
        // Filter selected
        active = active.filter(function(item){
            return value != item;
        });
        // Deselect option
        option['option'].selected = false;
        option['selected'] = false;
        cm.removeClass(option['node'], 'active');
    };

    var onChange = function(){
        if(cm.stringifyJSON(active) !== cm.stringifyJSON(oldActive)){
            that.triggerEvent('onChange', active);
        }
    };

    /* *** DROPDOWN *** */

    var show = function(){
        if(!optionsLength){
            components['menu'].hide();
        }else{
            // Set classes
            cm.addClass(nodes['container'], 'active');
            nodes['text'].focus();
            // Scroll to active element
            if(active && options[active]){
                scrollToItem(options[active]);
            }
        }
        that.triggerEvent('onFocus', active);
    };

    var hide = function(){
        nodes['text'].blur();
        cm.removeClass(nodes['container'], 'active');
        that.triggerEvent('onBlur', active);
    };

    var scrollToItem = function(option){
        nodes['menu']['content'].scrollTop = option['node'].offsetTop - nodes['menu']['content'].offsetTop;
    };

    /* *** HELPERS *** */

    var blockDocumentArrows = function(e){
        e = cm.getEvent(e);
        if(e.keyCode === 38 || e.keyCode === 40){
            cm.preventDefault(e);
        }
    };

    /* ******* MAIN ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.get = function(){
        return active;
    };

    that.getText = function(){
        var option = options[active];
        if(option){
            return option['text'];
        }
        return null;
    };

    that.set = function(value, triggerEvents){
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
        // Select option and execute events
        if(!cm.isUndefined(value)){
            if(cm.isArray(value)){
                cm.forEach(value, function(item){
                    if(options[item]){
                        set(options[item], false);
                    }
                });
                if(triggerEvents){
                    that.triggerEvent('onSelect', active);
                    that.triggerEvent('onChange', active);
                }
            }else if(options[value]){
                set(options[value], triggerEvents);
            }
        }
        return that;
    };

    that.reset = function(triggerEvents){
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
        if(that.params['multiple']){
            that.deselectAll(triggerEvents);
        }else{
            if(optionsLength){
                set(optionsList[0], triggerEvents);
            }
        }
        that.triggerEvent('onReset', active);
    };

    that.selectAll = function(triggerEvents){
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
        if(that.params['multiple']){
            cm.forEach(options, deselectMultiple);
            cm.forEach(options, setMultiple);
            if(triggerEvents){
                that.triggerEvent('onSelect', active);
                onChange();
            }
        }
        return that;
    };

    that.deselectAll = function(triggerEvents){
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
        if(that.params['multiple']){
            cm.forEach(options, deselectMultiple);
            if(triggerEvents){
                that.triggerEvent('onSelect', active);
                onChange();
            }
        }
        return that;
    };

    that.addOption = function(value, text){
        if(cm.isObject(arguments[0])){
            renderOption(arguments[0]);
        }else{
            renderOption({
                'value' : value,
                'text' : text
            });
        }
        // Enable / Disable Menu
        if(!that.params['multiple'] && !that.disabled && optionsLength){
            components['menu'].enable();
        }
        return that;
    };

    that.addOptions = function(arr){
        cm.forEach(arr, function(item){
            renderOption(item);
        });
        return that;
    };

    that.editOption = function(value, text){
        if(!cm.isUndefined(value) && options[value]){
            editOption(options[value], text);
        }
        return that;
    };

    that.removeOption = function(value){
        if(!cm.isUndefined(value) && options[value]){
            removeOption(options[value]);
        }
        // Enable / Disable Menu
        if(!that.params['multiple'] && !optionsList){
            components['menu'].disable();
        }
        return that;
    };

    that.removeOptions = that.removeOptionsAll = function(){
        cm.forEach(options, function(item){
            removeOption(item);
        });
        return that;
    };

    that.getOption = function(value){
        if(!cm.isUndefined(value) && options[value]){
            return options[value];
        }
        return null;
    };

    that.getSelectedOption = function(){
        return that.getOption(active);
    };

    that.getOptions = that.getOptionsAll = that.getAllOptions = function(){
        var result = [];
        cm.forEach(optionsList, function(item){
            result.push({
                'text' : item['text'],
                'value' : item['value']
            });
        });
        return result;
    };

    that.hideOption = function(value){
        var option;
        if(!cm.isUndefined(value) && options[value]){
            option = options[value];
            option['hidden'] = true;
            cm.addClass(option['node'], 'hidden');
        }
    };

    that.showOption = function(value){
        var option;
        if(!cm.isUndefined(value) && options[value]){
            option = options[value];
            option['hidden'] = false;
            cm.removeClass(option['node'], 'hidden');
        }
    };

    that.disable = function(){
        that.disabled = true;
        cm.addClass(nodes['container'], 'disabled');
        cm.addClass(nodes['scroll'], 'disabled');
        cm.addClass(nodes['target'], 'disabled');
        if(!that.params['multiple']){
            nodes['text'].disabled = true;
            components['menu'].disable();
        }
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        cm.removeClass(nodes['container'], 'disabled');
        cm.removeClass(nodes['scroll'], 'disabled');
        cm.removeClass(nodes['target'], 'disabled');
        if(!that.params['multiple']){
            nodes['text'].disabled = false;
            if(optionsLength){
                components['menu'].enable();
            }
        }
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('select', {
    'node' : cm.node('select'),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Select'
});
