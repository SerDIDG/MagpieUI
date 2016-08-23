cm.define('Com.MultiField', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onItemAdd',
        'onItemRemove',
        'onItemProcess',
        'onItemSort',
        'onItemIndexChange'
    ],
    'params' : {
        'renderStructure' : false,
        'embedStructure' : 'append',
        'embedStructureOnRender' : false,
        'renderItems' : 0,
        'max' : 0,                         // 0 - infinity
        'template' : null,                      // Html node or string with items template
        'templateAttributeReplace' : false,
        'templateAttribute' : 'name',           // Replace specified items attribute by pattern, example: data-attribute-name="test[%index%]", available variables: %index%
        'sortable' : true,                      // Use drag and drop to sort items
        'duration' : 'cm._config.animDurationShort',
        'theme' : '',
        'langs' : {
            'add' : 'Add',
            'remove' : 'Remove'
        },
        'icons' : {
            'drag' : 'icon drag linked',
            'add' : 'icon add linked',
            'remove' : 'icon remove linked'
        },
        'Com.Sortable' : {
            'process' : false
        }
    }
}, function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.MultiField', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Variables
        that.nodes = {
            'container' : cm.node('div'),
            'content' : cm.node('ul'),
            'toolbar' : cm.node('li'),
            'add' : cm.node('div'),
            'items' : []
        };
        that.components = {};
        that.items = [];
        that.toolbarHeight = 0;
        that.isToolbarVisible = true;
        // Bind context to methods
        // Add events
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    /* *** SYSTEM *** */

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__multifield'},
            that.nodes['content'] = cm.node('div', {'class' : 'com__multifield__content'}),
            that.nodes['toolbar'] = cm.node('div', {'class' : 'com__multifield__toolbar'},
                cm.node('div', {'class' : 'com__multifield__item'},
                    that.nodes['add'] = cm.node('div', {'class' : that.params['icons']['add'], 'title' : that.lang('add')})
                )
            )
        );
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Add button events
        cm.addEvent(that.nodes['add'], 'click', function(e){
            cm.preventDefault(e);
            that.renderItem();
        });
        // Init Sortable
        if(that.params['sortable']){
            cm.getConstructor('Com.Sortable', function(classConstructor, className){
                that.components['sortable'] = new classConstructor(that.params[className]);
                that.components['sortable'].addEvent('onSort', function(my, data){
                    var item = that.items.find(function(item){
                        return item['container'] === data['node'];
                    });
                    if(item){
                        that.sortItem(item, data['index']);
                    }
                });
                that.components['sortable'].addGroup(that.nodes['content']);
            });
        }
        // Process rendered items
        cm.forEach(that.nodes['items'], function(item){
            that.processItem(item);
        });
        // Render items
        cm.forEach(Math.max(that.params['renderItems'] - that.items.length, 0), function(){
            that.renderItem();
        });
        return that;
    };

    classProto.setAttributes = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.setAttributes.apply(that, arguments);
        // Set theme
        cm.addClass(that.nodes['container'], that.params['theme']);
        return that;
    };

    /* *** ITEMS *** */

    classProto.renderItem = function(item, params){
        var that = this,
            nodes;
        if(that.params['max'] == 0 || that.items.length < that.params['max']){
            // Config
            item = cm.merge({
                'isVisible' : false
            }, item);
            params = cm.merge({
                'callback' : function(){},
                'triggerEvents' : true
            }, params);
            // Structure
            item['container'] = cm.node('div', {'class' : 'com__multifield__item', 'data-node' : 'items:[]:container'},
                item['content'] = item['field'] = cm.node('div', {'class' : 'field', 'data-node' : 'field'}),
                item['remove'] = cm.node('div', {'class' : that.params['icons']['remove'], 'title' : that.lang('remove'), 'data-node' : 'remove'})
            );
            // Template
            if(!cm.isEmpty(that.params['template'])){
                if(cm.isString(that.params['template'])){
                    nodes = cm.strToHTML(that.params['template']);
                }else{
                    nodes = cm.clone(that.params['template'], true);
                }
                cm.appendNodes(nodes, item['field']);
            }
            // Sortable
            if(that.params['sortable']){
                item['drag'] = cm.node('div', {'class' : that.params['icons']['drag'], 'data-node' : 'drag'});
                cm.insertFirst(item['drag'], item['container']);
            }
            // Embed
            cm.appendChild(item['container'], that.nodes['content']);
            // Process
            that.processItem(item);
            // Callback
            params['callback'](item);
            // Trigger event
            params['triggerEvents'] && that.triggerEvent('onItemAdd', item);
        }
    };

    classProto.processItem = function(item){
        var that = this;
        // Register sortable item
        if(that.params['sortable']){
            that.components['sortable'].addItem(item['container'], that.nodes['content']);
        }else{
            cm.remove(item['drag']);
        }
        // Events
        cm.addEvent(item['remove'], 'click', function(e){
            cm.preventDefault(e);
            that.deleteItem(item);
        });
        // Push
        that.items.push(item);
        that.resetIndexes();
        // Animate
        that.toggleItemVisibility(item);
        // Toggle toolbar visibility
        that.toggleToolbarVisibility();
        // Trigger event
        that.triggerEvent('onItemProcess', item);
    };

    classProto.deleteItem = function(item, params){
        var that = this;
        params = cm.merge({
            'callback' : function(){},
            'triggerEvents' : true
        }, params);
        // Remove sortable item
        if(that.params['sortable']){
            that.components['sortable'].removeItem(item['container']);
        }
        // Remove from array
        that.items.splice(that.items.indexOf(item), 1);
        that.resetIndexes();
        // Animate
        that.toggleItemVisibility(item, function(){
            // Remove from DOM
            cm.remove(item['container']);
        });
        // Toggle toolbar visibility
        that.toggleToolbarVisibility();
        // Callback
        params['callback'](item);
        // Trigger event
        params['triggerEvents'] && that.triggerEvent('onItemRemove', item);
    };

    classProto.sortItem = function(item, index){
        var that = this;
        // Resort items in array
        that.items.splice(that.items.indexOf(item), 1);
        that.items.splice(index, 0, item);
        that.resetIndexes();
        // Trigger event
        that.triggerEvent('onItemSort', item);
    };

    classProto.resetIndexes = function(){
        var that = this;
        cm.forEach(that.items, function(item, index){
            if(item['index'] != index){
                // Set index
                item['previousIndex'] = item['index'];
                item['index'] = index;
                // Process data attributes
                if(that.params['templateAttributeReplace']){
                    cm.processDataAttributes(item['field'], that.params['templateAttribute'], {'%index%' : index});
                }
                // Trigger event
                that.triggerEvent('onItemIndexChange', item);
            }
        });
    };

    /* *** VISIBILITY *** */

    classProto.toggleToolbarVisibility = function(){
        var that = this;
        if(!that.toolbarHeight){
            that.toolbarHeight = that.nodes['toolbar'].offsetHeight;
        }
        if(that.params['max'] > 0 && that.items.length == that.params['max']){
            if(that.isToolbarVisible){
                that.isToolbarVisible = false;
                that.nodes['toolbar'].style.overflow = 'hidden';
                cm.transition(that.nodes['toolbar'], {
                    'properties' : {'height' : '0px', 'opacity' : 0},
                    'duration' : that.params['duration'],
                    'easing' : 'ease-in-out'
                });
            }
        }else{
            if(!that.isToolbarVisible){
                that.isToolbarVisible = true;
                that.nodes['toolbar'].style.overflow = 'hidden';
                cm.transition(that.nodes['toolbar'], {
                    'properties' : {'height' : [that.toolbarHeight, 'px'].join(''), 'opacity' : 1},
                    'duration' : that.params['duration'],
                    'easing' : 'ease-in-out',
                    'clear' : true,
                    'onStop' : function(){
                        that.nodes['toolbar'].style.overflow = '';
                    }
                });
            }
        }
    };

    classProto.toggleItemVisibility = function(item, callback){
        var that = this;
        callback = typeof callback == 'function' ? callback : function(){};
        if(!item['height']){
            item['height'] = item['container'].offsetHeight;
        }
        if(typeof item['isVisible'] == 'undefined'){
            item['isVisible'] = true;
        }else if(item['isVisible']){
            item['isVisible'] = false;
            item['container'].style.overflow = 'hidden';
            cm.transition(item['container'], {
                'properties' : {'height' : '0px', 'opacity' : 0},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'onStop' : callback
            });
        }else{
            item['isVisible'] = true;
            item['container'].style.overflow = 'hidden';
            item['container'].style.height = '0px';
            item['container'].style.opacity = 0;
            cm.transition(item['container'], {
                'properties' : {'height' : [item['height'], 'px'].join(''), 'opacity' : 1},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'clear' : true,
                'onStop' : function(){
                    item['container'].style.overflow = '';
                    callback();
                }
            });
        }
    };

    /* ******* PUBLIC ******* */

    classProto.addItem = function(item, params){
        var that = this;
        that.renderItem(item, params);
        return that;
    };

    classProto.removeItem = function(item, params){
        var that = this;
        if(typeof item == 'number' && that.items[item]){
            that.deleteItem(that.items[item], params);
        }else if(cm.inArray(that.items, item)){
            that.deleteItem(item, params);
        }
        return that;
    };

    classProto.getItem = function(index){
        var that = this;
        if(that.items[index]){
            return that.items[index];
        }
        return null;
    };

    classProto.getItems = function(){
        var that = this;
        return that.items;
    };
});