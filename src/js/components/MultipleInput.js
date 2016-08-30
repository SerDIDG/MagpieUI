cm.define('Com.MultipleInput', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSet',
        'onSelect',
        'onChange',
        'onClear',
        'onDisable',
        'onEnable',
        'onSetAttributes',
        'onItemAddStart',
        'onItemAddProcess',
        'onItemAddEnd',
        'onItemRemoveStart',
        'onItemRemoveProcess',
        'onItemRemoveEnd',
        'onItemSortStart',
        'onItemSortProcess',
        'onItemSortEnd'
    ],
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-input',
        'value' : [],
        'defaultValue' : [],
        'max' : 0,
        'sortable' : false,
        'showControls' : true,
        'showToolbar' : false,
        'focusInput' : false,
        'duration' : 'cm._config.animDurationShort',
        'inputConstructor' : 'Com.AbstractInput',
        'inputParams' : {},
        'multiFieldConstructor' : 'Com.MultiField',
        'multiFieldParams' : {
            'embedStructure' : 'first',
            'renderStructure' : true,
            'embedStructureOnRender' : true,
            'template' : false,
            'templateAttributeReplace' : false
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.MultipleInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(params){
        var that = this;
        // Variables
        that.nodes = {};
        that.components = {};
        that.items = [];
        that.isToolbarVisible = true;
        // Bind context to methods
        that.setHandler = that.set.bind(that);
        that.getHandler = that.get.bind(that);
        that.clearHandler = that.clear.bind(that);
        that.enableHandler = that.enable.bind(that);
        that.disableHandler = that.disable.bind(that);
        that.addItemHandler = that.addItem.bind(that);
        that.removeItemHandler = that.removeItem.bind(that);
        that.constructProcessHandler = that.constructProcess.bind(that);
        // Add events
        that.addEvent('onConstructProcess', that.constructProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.constructProcess = function(){
        var that = this;
        // Render inputs provided in DOM
        cm.forEach(that.nodes['inputs'], function(item){
            that.addItem({'input' : item['input']}, false);
        });
        // Render inputs provided in parameters
        if(cm.isArray(that.params['value'])){
            cm.forEach(that.params['value'], function(item){
                that.addItem({'value' : item}, false);
            });
        }
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.validateParams.apply(that, arguments);
        // Configure MultiField
        that.params['multiFieldParams']['max'] = that.params['max'];
        that.params['multiFieldParams']['sortable'] = that.params['sortable'];
        that.params['multiFieldParams']['showControls'] = that.params['showControls'];
        return that;
    };

    /* *** SYSTEM *** */

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__multiple-input'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.nodes['holder'] = cm.node('div', {'class' : 'com__multiple-input__holder'})
            )
        );
        if(that.params['showToolbar']){
            that.nodes['toolbarContainer'] = that.renderToolbarView();
            cm.appendChild(that.nodes['toolbarContainer'], that.nodes['holder']);
        }
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderToolbarView = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__multiple-input__toolbar'});
        // Push
        that.nodes['toolbar'] = nodes;
        return nodes['container'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init Multi Field
        that.renderMultiField();
        return that;
    };

    classProto.renderMultiField = function(){
        var that = this;
        cm.getConstructor(that.params['multiFieldConstructor'], function(classObject){
            that.components['multiField'] = new classObject(
                cm.merge(that.params['multiFieldParams'], {
                    'container' : that.nodes['holder']
                })
            );
            that.renderMultiFieldEvents();
        });
        return that;
    };

    classProto.renderMultiFieldEvents = function(){
        var that = this;
        that.components['multiField'].addEvent('onItemAdd', function(my, field){
            that.addItemProcess({}, field, true);
        });
        that.components['multiField'].addEvent('onItemRemove', function(my, field){
            var index = field['index'];
            var item = that.items[index];
            that.removeItemProcess(item, field, true);
        });
        that.components['multiField'].addEvent('onItemSort', function(my, field){
            var previousIndex = field['previousIndex'];
            var item = that.items[previousIndex];
            that.sortItemProcess(item, field, true);
        });
        return that;
    };

    classProto.renderInputView = function(item){
        var that = this;
        item['input'] = cm.node('input', {'type' : 'text'});
        return item['input'];
    };

    /* *** ITEMS *** */

    classProto.addItem = function(item, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(!that.params['max'] || that.items.length < that.params['max']){
            // Render Fields
            that.components['multiField'].addItem({}, {
                'triggerEvents' : false,
                'callback' : function(field){
                    that.addItemProcess(item, field, triggerEvents);
                }
            });
        }
        return null;
    };

    classProto.addItemProcess = function(item, field, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        // Merge config
        item = cm.merge({
            'input' : null,
            'container' : null,
            'name' : that.params['name'],
            'value' : '',
            'constructor' : that.params['inputConstructor'],
            'nodes' : {}
        }, item);
        item['field'] = field;
        item['container'] = item['field']['content'];
        // Push
        that.items.push(item);
        // Start
        that.triggerEvent('onItemAddStart', item);
        // Render views
        if(!item['input']){
            item['input'] = that.renderInputView(item);
        }
        cm.appendChild(item['input'], item['container']);
        // Process
        cm.getConstructor(item['constructor'], function(classConstructor){
            item['controller'] = new classConstructor(
                cm.merge(that.params['inputParams'], {
                    'node' : item['input'],
                    'name' : item['name'],
                    'value' : item['value']
                })
            );
            that.triggerEvent('onItemAddProcess', item);
            that.params['focusInput'] && item['controller'].focus && item['controller'].focus();
            // Trigger set events
            triggerEvents && that.triggerEvent('onSelect');
            triggerEvents && that.triggerEvent('onSet');
            triggerEvents && that.triggerEvent('onChange');
        });
        // Toggle toolbar visibility
        that.toggleToolbarVisibility();
        // Complete event
        that.triggerEvent('onItemAddEnd', item);
        return item;
    };

    classProto.removeItem = function(item, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        // Remove Field
        that.components['multiField'].removeItem(item['field'], {
            'triggerEvents' : false,
            'callback' : function(field){
                that.removeItemProcess(item, field, triggerEvents);
            }
        });
        return that;
    };

    classProto.removeItemProcess = function(item, field, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.triggerEvent('onItemRemoveStart', item);
        that.items = cm.arrayRemove(that.items, item);
        that.triggerEvent('onItemRemoveProcess', item);
        item['controller'] && item['controller'].destruct();
        that.triggerEvent('onItemRemoveEnd', item);
        // Toggle toolbar visibility
        that.toggleToolbarVisibility();
        // Trigger set events
        triggerEvents && that.triggerEvent('onSelect');
        triggerEvents && that.triggerEvent('onSet');
        triggerEvents && that.triggerEvent('onChange');
        return that;
    };

    classProto.sortItemProcess = function(item, field){
        var that = this,
            index = field['index'];
        that.triggerEvent('onItemSortStart', item);
        that.triggerEvent('onItemSortProcess', item);
        // Resort items in array
        that.items.splice(that.items.indexOf(item), 1);
        that.items.splice(index, 0, item);
        // Trigger event
        that.triggerEvent('onItemSortEnd', item);
    };

    /* *** TOOLBAR *** */

    classProto.toggleToolbarVisibility = function(){
        var that = this;
        if(that.params['showToolbar']){
            if(that.params['max'] > 0 && that.items.length == that.params['max']){
                that.hideToolbar();
            }else{
                that.showToolbar();
            }
        }
        return that;
    };

    classProto.showToolbar = function(){
        var that = this,
            height = 0;
        if(!that.isToolbarVisible){
            that.isToolbarVisible = true;
            // Prepare
            that.nodes['toolbarContainer'].style.height = '';
            height = that.nodes['toolbarContainer'].offsetHeight;
            that.nodes['toolbarContainer'].style.height = '0px';
            that.nodes['toolbarContainer'].style.overflow = 'hidden';
            // Animate
            cm.transition(that.nodes['toolbarContainer'], {
                'properties' : {'height' : height + 'px', 'opacity' : 1},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'clear' : true,
                'onStop' : function(){
                    that.nodes['toolbarContainer'].style.overflow = '';
                    that.nodes['toolbarContainer'].style.height = '';
                }
            });
        }
        return that;
    };

    classProto.hideToolbar = function(){
        var that = this;
        if(that.isToolbarVisible){
            that.isToolbarVisible = false;
            // Prepare
            that.nodes['toolbarContainer'].style.overflow = 'hidden';
            // Animate
            cm.transition(that.nodes['toolbarContainer'], {
                'properties' : {'height' : '0px', 'opacity' : 0},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out'
            });
        }
        return that;
    };

    /* *** PUBLIC *** */

    classProto.set = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        cm.forEach(that.items, function(item){
            that.removeItem(item, false);
        });
        cm.forEach(value, function(item){
            that.addItem({'value' : item}, false);
        });
        // Trigger set events
        triggerEvents && that.triggerEvent('onSelect');
        triggerEvents && that.triggerEvent('onSet');
        triggerEvents && that.triggerEvent('onChange');
        return that;
    };

    classProto.get = function(){
        var that = this,
            data = [],
            value;
        cm.forEach(that.items, function(item){
            value = (item['controller'] && item['controller'].get) ? item['controller'].get() : null;
            value && data.push(value);
        });
        return data;
    };

    classProto.clear = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        triggerEvents && that.triggerEvent('onClear');
        that.set(that.params['defaultValue'], triggerEvents);
        return that;
    };

    classProto.enable = function(){
        var that = this;
        if(!that.disabled){
            that.disabled = false;
            cm.removeClass(that.nodes['container'], 'disabled');
            cm.removeClass(that.nodes['content'], 'disabled');
            that.triggerEvent('onEnable');
        }
        return that;
    };

    classProto.disable = function(){
        var that = this;
        if(that.disabled){
            that.disabled = true;
            cm.addClass(that.nodes['container'], 'disabled');
            cm.addClass(that.nodes['content'], 'disabled');
            that.triggerEvent('onDisable');
        }
        return that;
    };
});