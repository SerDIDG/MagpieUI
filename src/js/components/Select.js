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
        'onRender',
        'onSelect',
        'onChange',
        'onReset',
        'onFocus',
        'onBlur'
    ],
    'params' : {
        'select' : null,                        // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('select'),             // Html select node to decorate.
        'container' : null,                    // Component container that is required in case content is rendered without available select.
        'name' : '',
        'embedStructure' : 'replace',
        'renderInBody' : true,                  // Render dropdowns in document.body, else they will be rendrered in component container.
        'multiple' : false,                     // Render multiple select.
        'placeholder' : '',
        'showTitleTag' : true,                  // Copy title from available select node to component container. Will be shown on hover.
        'title' : false,                        // Title text. Will be shown on hover.
        'options' : [],                         // Listing of options, for rendering through java-script. Example: [{'value' : 'foo', 'text' : 'Bar'}].
        'selected' : 0,                         // Option value / array of option values.
        'disabled' : false,
        'icons' : {
            'arrow' : 'icon default linked'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'className' : 'com__select__tooltip',
            'width' : 'targetWidth',
            'top' : 'cm._config.tooltipTop'
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
        optionsLength,
        groups = [],

        oldActive,
        active;

    that.disabled = false;

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setMiscEvents();
        // Set selected option
        if(that.params['multiple']){
            active = [];
            if(that.params['selected'] && cm.isArray(that.params['selected'])){
                cm.forEach(that.params['selected'], function(item){
                    if(options[item]){
                        set(options[item], true);
                    }
                });
            }else{
                cm.forEach(that.params['node'].options, function(item){
                    item.selected && set(options[item.value]);
                });
            }
        }else{
            if(that.params['selected'] && options[that.params['selected']]){
                set(options[that.params['selected']]);
            }else if(options[that.params['node'].value]){
                set(options[that.params['node'].value]);
            }else if(optionsLength){
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
        if(cm.isNode(that.params['node'])){
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['multiple'] = that.params['node'].multiple;
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['disabled'];
        }
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        var tabindex;
        /* *** RENDER STRUCTURE *** */
        if(that.params['multiple']){
            renderMultiple();
        }else{
            renderSingle();
        }
        /* *** ATTRIBUTES *** */
        // Add class name
        if(that.params['node'].className){
            cm.addClass(nodes['container'], that.params['node'].className);
        }
        // Title
        if(that.params['showTitleTag'] && that.params['title']){
            nodes['container'].title = that.params['title'];
        }
        // Tabindex
        if(tabindex = that.params['node'].getAttribute('tabindex')){
            nodes['container'].setAttribute('tabindex', tabindex);
        }
        // ID
        if(that.params['node'].id){
            nodes['container'].id = that.params['node'].id;
        }
        // Data
        cm.forEach(that.params['node'].attributes, function(item){
            if(/^data-/.test(item.name) && item.name != 'data-element'){
                nodes['container'].setAttribute(item.name, item.value);
            }
        });
        // Set hidden input attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Placeholder
        if(!cm.isEmpty(that.params['placeholder'])){
            nodes['items'].appendChild(
                nodes['placeholder'] = cm.Node('li', {'class' : 'title'}, that.params['placeholder'])
            );
        }
        /* *** RENDER OPTIONS *** */
        collectSelectOptions();
        cm.forEach(that.params['options'], function(item){
            renderOption(item);
        });
        /* *** INSERT INTO DOM *** */
        that.embedStructure(nodes['container']);
    };

    var renderSingle = function(){
        nodes['container'] = cm.Node('div', {'class' : 'com__select'},
            nodes['hidden'] = cm.Node('select', {'class' : 'display-none'}),
            nodes['target'] = cm.Node('div', {'class' : 'form-field has-icon-right'},
                nodes['arrow'] = cm.Node('div', {'class' : that.params['icons']['arrow']}),
                nodes['text'] = cm.Node('input', {'type' : 'text', 'readOnly' : 'true'})
            ),
            nodes['scroll'] = cm.Node('div', {'class' : 'pt__listing-items'},
                nodes['items'] = cm.Node('ul')
            )
        );
    };

    var renderMultiple = function(){
        nodes['container'] = cm.Node('div', {'class' : 'com__select-multi'},
            nodes['hidden'] = cm.Node('select', {'class' : 'display-none', 'multiple' : true}),
            nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                nodes['scroll'] = cm.Node('div', {'class' : 'pt__listing-items'},
                    nodes['items'] = cm.Node('ul')
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

    /* *** COLLECTORS *** */

    var collectSelectOptions = function(){
        var myChildes = that.params['node'].childNodes,
            myOptionsNodes,
            myOptions;
        cm.forEach(myChildes, function(myChild){
            if(cm.isElementNode(myChild)){
                if(myChild.tagName.toLowerCase() == 'optgroup'){
                    myOptionsNodes = myChild.querySelectorAll('option');
                    myOptions = [];
                    cm.forEach(myOptionsNodes, function(optionNode){
                        myOptions.push({
                            'value' : optionNode.value,
                            'text' : optionNode.innerHTML,
                            'className' : optionNode.className
                        });
                    });
                    renderGroup(myChild.getAttribute('label'), myOptions);
                }else if(myChild.tagName.toLowerCase() == 'option'){
                    renderOption({
                        'value' : myChild.value,
                        'text' : myChild.innerHTML,
                        'className' : myChild.className
                    });
                }
            }
        });
    };

    /* *** GROUPS *** */

    var renderGroup = function(myName, myOptions){
        // Config
        var item = {
            'name' : myName,
            'options' : myOptions
        };
        // Structure
        item['optgroup'] = cm.Node('optgroup', {'label' : myName});
        item['container'] = cm.Node('li', {'class' : 'group'},
            item['items'] = cm.Node('ul', {'class' : 'pt__listing-items'})
        );
        if(!cm.isEmpty(myName)){
            cm.insertFirst(
                cm.Node('div', {'class' : 'title', 'innerHTML' : myName}),
                item['container']
            );
        }
        // Render options
        cm.forEach(myOptions, function(myOption){
            renderOption(myOption, item);
        });
        // Append
        nodes['items'].appendChild(item['container']);
        nodes['hidden'].appendChild(item['optgroup']);
        // Push to groups array
        groups.push(item);
    };

    /* *** OPTIONS *** */

    var renderOption = function(item, group){
        // Check for exists
        if(options[item['value']]){
            removeOption(options[item['value']]);
        }
        // Config
        item = cm.merge({
            'selected' : false,
            'value' : '',
            'text' : '',
            'className' : '',
            'group': group
        }, item);
        // Structure
        item['node'] = cm.Node('li', {'class' : item['className']},
            cm.Node('a', {'innerHTML' : item['text']})
        );
        item['option'] = cm.Node('option', {'value' : item['value'], 'innerHTML' : item['text']});
        // Label onlick event
        cm.addEvent(item['node'], 'click', function(){
            if(!that.disabled){
                set(item, true);
            }
            !that.params['multiple'] && components['menu'].hide(false);
        });
        // Append
        if(group){
            group['items'].appendChild(item['node']);
            group['optgroup'].appendChild(item['option']);
        }else{
            nodes['items'].appendChild(item['node']);
            nodes['hidden'].appendChild(item['option']);
        }
        // Push
        optionsList.push(options[item['value']] = item);
        optionsLength = optionsList.length;
    };

    var editOption = function(option, text){
        var value = typeof option['value'] != 'undefined'? option['value'] : option['text'];
        option['text'] = text;
        option['node'].innerHTML = text;
        option['option'].innerHTML = text;

        if(!that.params['multiple'] && value === active){
            nodes['text'].value = cm.decode(text);
        }
    };

    var removeOption = function(option){
        var value = typeof option['value'] != 'undefined'? option['value'] : option['text'];
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
            active = active.filter(function(item){
                return value != item;
            });
        }else{
            if(value === active){
                if(optionsLength){
                    set(optionsList[0], true);
                }else{
                    active = null;
                    nodes['text'].value = ''
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
        var value = typeof option['value'] != 'undefined'? option['value'] : option['text'];

        if(option['selected']){
            deselectMultiple(option);
        }else{
            active.push(value);
            option['option'].selected = true;
            option['selected'] = true;
            cm.addClass(option['node'], 'active');
        }
    };

    var setSingle = function(option){
        oldActive = active;
        active = typeof option['value'] != 'undefined'? option['value'] : option['text'];
        optionsList.forEach(function(item){
            cm.removeClass(item['node'], 'active');
        });
        if(option['group']){
            nodes['text'].value = [cm.decode(option['group']['name']), cm.decode(option['text'])].join(' > ');
        }else{
            nodes['text'].value = cm.decode(option['text']);
        }
        option['option'].selected = true;
        nodes['hidden'].value = active;
        cm.addClass(option['node'], 'active');
    };

    var deselectMultiple = function(option){
        var value = typeof option['value'] != 'undefined'? option['value'] : option['text'];

        active = active.filter(function(item){
            return value != item;
        });
        option['option'].selected = false;
        option['selected'] = false;
        cm.removeClass(option['node'], 'active');
    };

    var onChange = function(){
        if(that.params['multiple'] || active != oldActive){
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
        if(e.keyCode == 38 || e.keyCode == 40){
            cm.preventDefault(e);
        }
    };

    /* ******* MAIN ******* */

    that.get = function(){
        return active;
    };

    that.set = function(value, triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        // Select option and execute events
        if(typeof value != 'undefined'){
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
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(that.params['multiple']){
            that.deselectAll(triggerEvents);
        }else{
            if(optionsLength){
                set(optionsList[0], triggerEvents);
            }
        }
    };

    that.selectAll = function(triggerEvents){
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
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
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
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
        if(cm.isArray(arguments[0])){
            renderOption(arguments[0]);
        }else{
            renderOption({
                'value' : value,
                'text' : text
            });
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
        if(typeof value != 'undefined' && options[value]){
            editOption(options[value], text);
        }
        return that;
    };

    that.removeOption = function(value){
        if(typeof value != 'undefined' && options[value]){
            removeOption(options[value]);
        }
        return that;
    };

    that.removeOptionsAll = function(){
        cm.forEach(options, function(item){
            removeOption(item);
        });
        return that;
    };

    that.getOption = function(value){
        if(typeof value != 'undefined' && options[value]){
            return options[value];
        }
        return null;
    };

    that.getOptions = function(arr){
        var optionsArr = [];
        cm.forEach(arr, function(item){
            if(options[item]){
                optionsArr.push(options[item]);
            }
        });
        return optionsArr;
    };

    that.getOptionsAll = that.getAllOptions = function(){
        var result = [];
        cm.forEach(optionsList, function(item){
            result.push({
                'text' : item['text'],
                'value' : item['value']
            });
        });
        return result;
    };

    that.disable = function(){
        that.disabled = true;
        cm.addClass(nodes['container'], 'disabled');
        cm.addClass(nodes['scroll'], 'disabled');
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
        if(!that.params['multiple']){
            nodes['text'].disabled = false;
            components['menu'].enable();
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
    'component' : 'Com.Select',
    'callbacks' : {
        'component' : function(that, params){
            return new that.params['constructor'](
                cm.merge(params, {
                    'select' : params['node']
                })
            );
        }
    }
});