cm.define('Com.MultiField', {
    'modules' : [
        'Params',
        'Events',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Stack',
        'Langs'
    ],
    'events' : [
        'onRender',
        'onItemAdd',
        'onItemRemove',
        'onItemProcess',
        'onItemSort',
        'onItemIndexChange'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : null,
        'name' : '',
        'renderStructure' : false,
        'embedStructure' : 'append',
        'renderItems' : 0,
        'maxItems' : 0,                         // 0 - infinity
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
    var that = this,
        toolbarHeight = 0,
        toolbarVisible = true;

    that.nodes = {
        'container' : cm.node('div'),
        'content' : cm.node('ul'),
        'toolbar' : cm.node('li'),
        'add' : cm.node('div'),
        'items' : []
    };
    that.components = {};
    that.items = [];

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        // Check sortable
        if(that.params['sortable']){
            cm.getConstructor('Com.Sortable', function(classConstructor){
                that.components['sortable'] = new classConstructor(that.params['Com.Sortable']);
            });
            // WTF?
            if(!that.components['sortable']){
                that.params['sortable'] = false;
            }
        }
    };

    var render = function(){
        // Render Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.node('div', {'class' : 'com__multifield'},
                that.nodes['content'] = cm.node('div', {'class' : 'com__multifield__content'}),
                that.nodes['toolbar'] = cm.node('div', {'class' : 'com__multifield__toolbar'},
                    cm.node('div', {'class' : 'com__multifield__item'},
                        that.nodes['add'] = cm.node('div', {'class' : that.params['icons']['add'], 'title' : that.lang('add')})
                    )
                )
            );
            // Append
            that.embedStructure(that.nodes['container']);
        }
        // Add CSS Class
        cm.addClass(that.nodes['container'], that.params['theme']);
        // Add button events
        cm.addEvent(that.nodes['add'], 'click', function(e){
            cm.preventDefault(e);
            renderItem();
        });
        // Init Sortable
        if(that.params['sortable']){
            that.components['sortable'].addEvent('onSort', function(my, data){
                var item = that.items.find(function(item){
                    return item['container'] === data['node']
                });
                if(item){
                    sortItem(item, data['index']);
                }
            });
            that.components['sortable'].addGroup(that.nodes['content']);
        }
        // Process rendered items
        cm.forEach(that.nodes['items'], processItem);
        // Render items
        cm.forEach(Math.max(that.params['renderItems'] - that.items.length, 0), renderItem);
    };

    var renderItem = function(){
        var nodes;
        if(that.params['maxItems'] == 0 || that.items.length < that.params['maxItems']){
            var item = {
                'isVisible' : false
            };
            // Structure
            item['container'] = cm.node('div', {'class' : 'com__multifield__item', 'data-node' : 'items:[]:container'},
                item['field'] = cm.node('div', {'class' : 'field', 'data-node' : 'field'}),
                item['remove'] = cm.node('div', {'class' : that.params['icons']['remove'], 'title' : that.lang('remove'), 'data-node' : 'remove'})
            );
            // Template
            if(cm.isNode(that.params['template'])){
                cm.appendChild(that.params['template'], item['field']);
            }else{
                nodes = cm.strToHTML(that.params['template']);
                if(!cm.isEmpty(nodes)){
                    if(cm.isNode(nodes)){
                        cm.appendChild(nodes, item['field']);
                    }else{
                        while(nodes.length){
                            if(cm.isNode(nodes[0])){
                                cm.appendChild(nodes[0], item['field']);
                            }else{
                                cm.remove(nodes[0]);
                            }
                        }
                    }
                }
            }
            // Sortable
            if(that.params['sortable']){
                item['drag'] = cm.node('div', {'class' : that.params['icons']['drag'], 'data-node' : 'drag'});
                cm.insertFirst(item['drag'], item['container']);
            }
            // Embed
            that.nodes['content'].appendChild(item['container']);
            // Process
            processItem(item);
            // Trigger event
            that.triggerEvent('onItemAdd', item);
        }
    };

    var processItem = function(item){
        // Register sortable item
        if(that.params['sortable']){
            that.components['sortable'].addItem(item['container'], that.nodes['content']);
        }else{
            cm.remove(item['drag']);
        }
        // Events
        cm.addEvent(item['remove'], 'click', function(e){
            cm.preventDefault(e);
            removeItem(item);
        });
        // Push
        that.items.push(item);
        resetIndexes();
        // Animate
        toggleItemVisibility(item);
        // Toggle toolbar visibility
        toggleToolbarVisibility();
        // Trigger event
        that.triggerEvent('onItemProcess', item);
    };

    var removeItem = function(item){
        // Remove sortable item
        if(that.params['sortable']){
            that.components['sortable'].removeItem(item['container']);
        }
        // Remove from array
        that.items.splice(that.items.indexOf(item), 1);
        resetIndexes();
        // Animate
        toggleItemVisibility(item, function(){
            // Remove from DOM
            cm.remove(item['container']);
        });
        // Toggle toolbar visibility
        toggleToolbarVisibility();
        // Trigger event
        that.triggerEvent('onItemRemove', item);
    };

    var sortItem = function(item, index){
        // Resort items in array
        that.items.splice(that.items.indexOf(item), 1);
        that.items.splice(index, 0, item);
        resetIndexes();
        // Trigger event
        that.triggerEvent('onItemSort', item);
    };

    var resetIndexes = function(){
        cm.forEach(that.items, function(item, index){
            if(item['index'] != index){
                // Set index
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

    var itemInArray = function(item){
        return !!that.items.find(function(find){
            return find === item;
        });
    };

    var toggleToolbarVisibility = function(){
        if(!toolbarHeight){
            toolbarHeight = that.nodes['toolbar'].offsetHeight;
        }
        if(that.params['maxItems'] > 0 && that.items.length == that.params['maxItems']){
            if(toolbarVisible){
                toolbarVisible = false;
                that.nodes['toolbar'].style.overflow = 'hidden';
                cm.transition(that.nodes['toolbar'], {
                    'properties' : {'height' : '0px', 'opacity' : 0},
                    'duration' : that.params['duration'],
                    'easing' : 'ease-in-out'
                });
            }
        }else{
            if(!toolbarVisible){
                toolbarVisible = true;
                that.nodes['toolbar'].style.overflow = 'hidden';
                cm.transition(that.nodes['toolbar'], {
                    'properties' : {'height' : [toolbarHeight, 'px'].join(''), 'opacity' : 1},
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

    var toggleItemVisibility = function(item, callback){
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

    that.addItem = function(){
        renderItem();
        return that;
    };

    that.removeItem = function(item){
        if(typeof item == 'number' && that.items[item]){
            removeItem(that.items[item]);
        }else if(itemInArray(item)){
            removeItem(item);
        }
        return that;
    };

    that.getItem = function(index){
        if(that.items[index]){
            return that.items[index];
        }
        return null;
    };

    that.getItems = function(){
        return that.items;
    };

    init();
});