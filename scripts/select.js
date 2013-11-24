Com.Elements['Selects'] = {};

Com['GetSelect'] = function(id){
    return Com.Elements.Selects[id] || null;
};

Com['Select'] = function(o){
    var that = this,
        config = cm.merge({
            'container' : false,
            'select' : cm.Node('select'),
            'multiple' : false,
            'showTitleTag' : true,
            'title' : false,
            'menuMargin' : 3,
            'options' : [],
            'selected' : 0,
            'events' : {}
        }, o),
        dataAttributes = ['title', 'showTitleTag', 'multiple'],
        API = {
            'onSelect' : [],
            'onChange' : [],
            'onFocus' : [],
            'onBlur' : []
        },
        nodes = {
            'menu' : {}
        },
        components = {},
        options = {},
        optionsList = [],
        optionsLength,

        oldActive, active;

    var init = function(){
        // Convert events to API Events
        convertEvents(config['events']);
        // Merge data-attributes with config. Data-attributes have higher priority.
        processDataAttributes();
        // Render
        render();
        setMiscEvents();
        // Set selected option
        if(config['multiple']){
            active = [];
            if(config['selected'] && cm.isArray(config['selected'])){
                cm.forEach(config['selected'], function(item){
                    if(options[item]){
                        set(options[item], true);
                    }
                });
            }else{
                cm.forEach(config['select'].options, function(item){
                    item.selected && set(options[item.value]);
                });
            }
        }else{
            if(config['selected'] && options[config['selected']]){
                set(options[config['selected']]);
            }else if(config['select'].value){
                set(options[config['select'].value]);
            }else if(optionsLength){
                set(optionsList[0]);
            }
        }
    };

    var processDataAttributes = function(){
        var value;
        cm.forEach(dataAttributes, function(item){
            value = config['select'].getAttribute(['data', item].join('-'));
            if(item == 'title'){
                value = config['select'].getAttribute(item) || value;
            }else if(item == 'multiple'){
                value = config['select'].multiple;
            }else if(/^false|true$/.test(value)){
                value = value ? (value == 'true') : config[item];
            }else{
                value = value || config[item];
            }
            config[item] = value;
        });
    };

    var render = function(){
        var tabindex;
        /* *** RENDER STRUCTURE *** */
        if(config['multiple']){
            renderMultiple();
        }else{
            renderSingle();
        }
        /* *** ATTRIBUTES *** */
        // Set select width
        if(config['select'].offsetWidth && config['select'].offsetWidth != config['select'].parentNode.offsetWidth){
            nodes['container'].style.width = config['select'].offsetWidth + 'px';
        }
        // Add class name
        if(config['select'].className){
            cm.addClass(nodes['container'], config['select'].className);
        }
        // Title
        if(config['showTitleTag'] && config['title']){
            nodes['container'].title = config['title'];
        }
        // Tabindex
        if(tabindex = config['select'].getAttribute('tabindex')){
            nodes['container'].setAttribute('tabindex', tabindex);
        }
        // ID
        if(config['select'].id){
            nodes['container'].id = config['select'].id;
        }
        // Data
        Array.prototype.forEach.call(config['select'].attributes, function(item){
            if(/^data-/.test(item.name)){
                nodes['container'].setAttribute(item.name, item.value);
            }
        });
        // Set hidden input attributes
        if(config['select'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', config['select'].getAttribute('name'));
        }
        /* *** RENDER OPTIONS *** */
        cm.forEach(config['select'].options, function(item){
            renderOption(item.value, item.innerHTML);
        });
        cm.forEach(config['options'], function(item){
            renderOption(item.value, item.text);
        });
        /* *** INSERT INTO DOM *** */
        if(config['container']){
            config['container'].appendChild(nodes['container']);
        }else if(config['select'].parentNode){
            cm.insertBefore(nodes['container'], config['select']);
        }
        cm.remove(config['select']);
    };

    var renderSingle = function(){
        nodes['container'] = cm.Node('div', {'class' : 'cm-select'},
            nodes['hidden'] = cm.Node('select', {'data-select' : 'false', 'class' : 'display-none'}),
            nodes['input'] = cm.Node('div', {'class' : 'cm-select-input clear'},
                cm.Node('div', {'class' : 'cm-select-inner'},
                    nodes['arrow'] = cm.Node('div', {'class' : 'cm-select-arrow'}),
                    nodes['text'] = cm.Node('div', {'class' : 'cm-select-text'})
                )
            ),
            nodes['scroll'] = cm.Node('div', {'class' : 'cm-select-listing'},
                nodes['items'] = cm.Node('ul')
            )
        );
    };

    var renderMultiple = function(){
        nodes['container'] = cm.Node('div', {'class' : 'cm-multiselect'},
            nodes['hidden'] = cm.Node('select', {'data-select' : 'false', 'class' : 'display-none', 'multiple' : true}),
            nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                nodes['scroll'] = cm.Node('div', {'class' : 'cm-select-listing'},
                    nodes['items'] = cm.Node('ul')
                )
            )
        );
    };

    var renderOption = function(value, text){
        // Check for exists
        if(options[value]){
            removeOption(options[value]);
        }
        // Config
        var item = {
            'node' : nodes['items'].appendChild(cm.Node('li', {'innerHTML' : text})),
            'option' : nodes['hidden'].appendChild(cm.Node('option', {'value' : value, 'innerHTML' : text})),
            'selected' : false,
            'value' : value,
            'text' : text
        };
        // Label onlick event
        item['node'].onclick = function(){
            set(item, true);
            !config['multiple'] && components['menu'].hide(false);
        };
        // Push
        optionsList.push(options[value] = item);
        optionsLength = optionsList.length;
    };

    var removeOption = function(option){
        var value = option['value'] || option['text'];
        // Remove option from list and array
        cm.remove(option['node']);
        cm.remove(option['option']);
        optionsList = optionsList.filter(function(item){
            return option != item;
        });
        optionsLength = optionsList.length;
        delete options[option['value']];
        // Set new active option, if current active is nominated for remove
        if(config['multiple']){
            active = active.filter(function(item){
                return value != item;
            });
        }else{
            if(value === active){
                if(optionsLength){
                    set(optionsList[0], true);
                }else{
                    active = null;
                    cm.clearNode(nodes['text']);
                }
            }
        }
    };

    var setMiscEvents = function(){
        // Switch items on arrows press
        cm.addEvent(nodes['container'], 'keydown', function(e){
            e = cm.getEvent(e);
            if(optionsLength){
                var item = options[active],
                    index = optionsList.indexOf(item);
                if(e.keyCode == 38){
                    if(index - 1 >= 0){
                        set(optionsList[index - 1], true);
                    }else{
                        set(optionsList[optionsLength - 1], true);
                    }
                }else if(e.keyCode == 40){
                    if(index + 1 < optionsLength){
                        set(optionsList[index + 1], true);
                    }else{
                        set(optionsList[0], true);
                    }
                }
            }
        });
        cm.addEvent(nodes['container'], 'focus', function(){
            cm.addEvent(document.body, 'keydown', blockDocumentArrows)
        });
        cm.addEvent(nodes['container'], 'blur', function(){
            cm.removeEvent(document.body, 'keydown', blockDocumentArrows)
        });

        if(!config['multiple']){
            // Render tooltip
            components['menu'] = new Com.Tooltip({
                'className' : 'cm-select-tooltip',
                'width' : 'targetWidth',
                'top' : ['targetHeight', config['menuMargin']].join('+'),
                'content' : nodes['scroll'],
                'target' : nodes['input'],
                'targetEvent' : 'click',
                'hideOnReClick' : true,
                'events' : {
                    'onShow' : show,
                    'onHide' : hide
                }
            });
            nodes['menu'] = components['menu'].getNodes();
        }
    };

    var show = function(){
        if(!optionsLength){
            components['menu'].hide();
        }else{
            // Set classes
            cm.addClass(nodes['input'], 'hidden');
            cm.addClass(nodes['container'], 'active');
            // Scroll to active element
            if(active && options[active]){
                nodes['menu']['content'].scrollTop = options[active]['node'].offsetTop - nodes['menu']['content'].offsetTop;
            }
        }
        /* *** EXECUTE API EVENTS *** */
        executeEvent('onFocus');
    };

    var hide = function(){
        // Remove classes
        cm.removeClass(nodes['input'], 'hidden');
        cm.removeClass(nodes['container'], 'active');
        /* *** EXECUTE API EVENTS *** */
        executeEvent('onBlur');
    };

    var set = function(option, execute){
        if(option){
            if(config['multiple']){
                setMultiple(option);
            }else{
                setSingle(option);
            }
        }
        /* *** EXECUTE API EVENTS *** */
        if(execute){
            executeEvent('onSelect');
            executeEvent('onChange');
        }
    };

    var setMultiple = function(option){
        var value = option['value'] || option['text'];
        if(option['selected']){
            active = active.filter(function(item){
                return value != item;
            });
            option['option'].selected = false;
            option['selected'] = false;
            cm.removeClass(option['node'], 'active');
        }else{
            active.push(value);
            option['option'].selected = true;
            option['selected'] = true;
            cm.addClass(option['node'], 'active');
        }
    };

    var setSingle = function(option){
        oldActive = active;
        active = option['value'] || option['text'];
        optionsList.forEach(function(item){
            cm.removeClass(item['node'], 'active');
        });
        cm.clearNode(nodes['text']).appendChild(cm.Node('span', {'innerHTML' : option['text']}));
        option['option'].selected = true;
        cm.addClass(option['node'], 'active');
    };

    var executeEvent = function(event){
        var handler = function(){
            cm.forEach(API[event], function(item){
                item(that, active);
            });
        };

        switch(event){
            case 'onChange':
                if(config['multiple']){
                    handler();
                }else{
                    active != oldActive && handler();
                }
                break;

            default:
                handler();
                break;
        }
    };

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    var blockDocumentArrows = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 38 || e.keyCode == 40){
            cm.preventDefault(e);
        }
    };

    /* *** MAIN *** */

    that.get = function(){
        return active;
    };

    that.set = function(value){
        // Select option and execute events
        if(typeof value != 'undefined'){
            if(cm.isArray(value)){
                cm.forEach(value, function(item){
                    if(options[item]){
                        set(options[item]);
                    }
                });
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onSelect');
                executeEvent('onChange');
            }else if(options[value]){
                set(options[value], true);
            }
        }
        return that;
    };

    that.addEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event].push(handler);
        }
        return that;
    };

    that.removeEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event] = API[event].filter(function(item){
                return item != handler;
            });
        }
        return that;
    };

    that.addOption = function(value, text){
        renderOption(value, text);
        return that;
    };

    that.removeOption = function(value){
        if(value && options[value]){
            removeOption(options[value]);
        }
        return that;
    };

    that.addOptions = function(arr){
        cm.forEach(arr, function(item){
            renderOption(item.value, item.text);
        });
        return that;
    };

    that.removeOptionsAll = function(){
        cm.forEach(options, function(item){
            removeOption(item);
        });
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    that.addEvents = function(o){		// Deprecated
        o && convertEvents(o);
        return that;
    };

    init();
};

Com['SelectCollector'] = function(node){
    var selects, id, select;

    var init = function(node){
        if(!node){
            render(document.body);
        }else if(node.constructor == Array){
            cm.forEach(node, render);
        }else{
            render(node);
        }
    };

    var render = function(node){
        selects = cm.clone((node.nodeType == 1 && node.tagName.toLowerCase() == 'select') ? [node] : node.getElementsByTagName('select'));
        // Render datepickers
        cm.forEach(selects, function(item){
            if(!/^norender|false$/.test(item.getAttribute('data-select'))){
                select = new Com.Select({'select' : item});
                if(id = item.id){
                    Com.Elements.Selects[id] = select;
                }
            }
        });
    };

    init(node);
};