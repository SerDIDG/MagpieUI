cm.define('Com.MultipleInput', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSet',
        'onSelect',
        'onChange',
        'onClear',
        'onDisable',
        'onEnable',
        'onRenderContentStart',
        'onRenderContentProcess',
        'onRenderContentEnd',
        'onRenderInputViewStart',
        'onRenderInputViewProcess',
        'onRenderInputViewEnd',
        'onRenderItemViewStart',
        'onRenderItemViewProcess',
        'onRenderItemViewEnd',
        'onSetAttributes',
        'onItemAddStart',
        'onItemAddProcess',
        'onItemAddEnd',
        'onItemRemoveStart',
        'onItemRemoveProcess',
        'onItemRemoveEnd'
    ],
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-input',
        'inputConstructor' : 'Com.AbstractInput',
        'inputParams' : {},
        'value' : [],
        'defaultValue' : []
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    that.items = [];
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.MultipleInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(params){
        var that = this;
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

    classProto.addItem = function(item, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(!that.params['max'] || that.items.length < that.params['max']){
            that.triggerEvent('onItemAddStart', item);
            // Merge config
            item = cm.merge({
                'input' : null,
                'container' : null,
                'name' : that.params['name'],
                'value' : '',
                'constructor' : that.params['inputConstructor'],
                'nodes' : {}
            }, item);
            // Render views
            if(!item['input']){
                item['input'] = that.renderInputView(item);
            }
            item['container'] = that.renderItemView(item);
            cm.appendChild(item['container'], that.nodes['items']);
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
                // Trigger set events
                triggerEvents && that.triggerEvent('onSelect');
                triggerEvents && that.triggerEvent('onSet');
                triggerEvents && that.triggerEvent('onChange');
            });
            // Show items container
            cm.removeClass(that.nodes['items'], 'is-hidden');
            // Push
            that.items.push(item);
            that.triggerEvent('onItemAddEnd', item);
            return item;
        }
        return null;
    };

    classProto.removeItem = function(item, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.triggerEvent('onItemRemoveStart', item);
        that.items = cm.arrayRemove(that.items, item);
        that.triggerEvent('onItemRemoveProcess', item);
        item['controller'].destruct();
        cm.remove(item['container']);
        // Hide items container
        if(!that.items.length){
            cm.addClass(that.nodes['items'], 'is-hidden');
        }
        that.triggerEvent('onItemRemoveEnd', item);
        // Trigger set events
        triggerEvents && that.triggerEvent('onSelect');
        triggerEvents && that.triggerEvent('onSet');
        triggerEvents && that.triggerEvent('onChange');
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

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__multiple-input'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.nodes['holder'] = cm.node('div', {'class' : 'com__multiple-input__holder'},
                    that.nodes['items'] = cm.node('div', {'class' : 'com__multiple-input__items is-hidden'}),
                    that.nodes['content'] = that.renderContent()
                )
            )
        );
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        var node = cm.node('div', {'class' : 'com__multiple-input__content'});
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        return node;
    };

    classProto.renderInputView = function(item){
        var that = this;
        that.triggerEvent('onRenderInputViewStart');
        item['input'] = cm.node('input', {'type' : 'hidden'});
        that.triggerEvent('onRenderInputViewProcess');
        that.triggerEvent('onRenderInputViewEnd');
        return item['input'];
    };

    classProto.renderItemView = function(item){
        var that = this;
        that.triggerEvent('onRenderItemViewStart');
        item['nodes']['container'] = cm.node('div', {'class' : 'com__multiple-input__item'},
            item['nodes']['inner'] = cm.node('div', {'class' : 'inner'},
                item['nodes']['input'] = item['input']
            )
        );
        that.triggerEvent('onRenderItemViewProcess');
        that.triggerEvent('onRenderItemViewEnd');
        return item['nodes']['container'];
    };
});