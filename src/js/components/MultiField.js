cm.define('Com.MultiField', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onItemAdd',
        'onItemAddEnd',
        'onItemRemove',
        'onItemRemoveEnd',
        'onItemShow',
        'onItemShowEnd',
        'onItemHide',
        'onItemHideEnd',
        'onItemProcess',
        'onItemProcessEnd',
        'onItemSort',
        'onItemIndexChange'
    ],
    'params' : {
        'renderStructure' : false,
        'embedStructure' : 'append',
        'embedStructureOnRender' : false,
        'mode' : 'create',                              // create - add /remove fields by provided template, edit - show / hide only pre-rendered fields
        'sortable' : true,                              // Use drag and drop to sort items
        'showControls' : true,
        'showList' : true,
        'renderItems' : 0,                              // Render count of fields by default
        'max' : 0,                                      // 0 - infinity
        'template' : null,                              // Html node or string with items template
        'templateAttributeReplace' : false,
        'templateAttribute' : 'name',                   // Replace specified items attribute by pattern, example: data-attribute-name="test[%index%]", available variables: %index%
        'duration' : 'cm._config.animDurationShort',
        'theme' : '',
        'icons' : {
            'drag' : 'icon drag linked',
            'add' : 'icon add linked',
            'remove' : 'icon remove linked'
        },
        'Com.Sortable' : {
            'process' : false
        }
    },
    'strings' : {
        'add' : 'Add',
        'remove' : 'Remove'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.MultiField', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        // Variables
        that.nodes = {
            'container' : cm.node('div'),
            'content' : cm.node('div'),
            'toolbar' : {
                'container' : cm.node('div'),
                'add' : cm.node('div'),
                'buttons' : []
            },
            'items' : []
        };
        that.components = {};
        that.items = [];
        that.buttons = [];
        that.isToolbarVisible = true;
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    /* *** SYSTEM *** */

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__multifield'});
        that.nodes['content'] = cm.node('div', {'class' : 'com__multifield__content'});
        // List
        if(that.params['showList']){
            cm.appendChild(that.nodes['content'], that.nodes['container']);
        }
        // Toolbar
        if(that.params['showControls']){
            that.nodes['toolbarContainer'] = that.renderToolbarView();
            cm.appendChild(that.nodes['toolbarContainer'], that.nodes['container']);
        }
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
    };

    classProto.renderToolbarView = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__multifield__toolbar'},
            nodes['content'] = cm.node('div', {'class' : 'com__multifield__item'},
                nodes['add'] = cm.node('div', {'class' : that.params['icons']['add'], 'title' : that.lang('add')})
            )
        );
        // Add button events
        if(that.params['mode'] === 'create'){
            cm.addEvent(nodes['add'], 'click', function(e){
                cm.preventDefault(e);
                that.renderItem();
            });
        }else{
            cm.remove(that.nodes['toolbar']['add']);
        }
        // Push
        that.nodes['toolbarView'] = nodes;
        return nodes['container'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
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
        // Process collected view
        if(!that.params['renderStructure']){
            that.processCollectedView();
        }
        // Render items
        if(that.params['mode'] === 'create'){
            var length = Math.max(that.params['renderItems'] - that.items.length, 0);
            cm.forEach(length, function(e){
                that.renderItem();
            });
        }
    };

    classProto.processCollectedView = function(){
        var that = this;
        // Toolbar
        that.nodes['toolbarContainer'] = that.nodes['toolbar']['container'];
        if(that.params['mode'] === 'create'){
            cm.addEvent(that.nodes['toolbar']['add'], 'click', function(e){
                cm.preventDefault(e);
                that.renderItem();
            });
        }else{
            cm.remove(that.nodes['toolbar']['add']);
            cm.forEach(that.nodes['toolbar']['buttons'], function(item){
                that.processButtons(item);
            });
        }
        // Process rendered items
        cm.forEach(that.nodes['items'], function(item){
            that.processItem(item);
        });
    };

    classProto.setAttributes = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.setAttributes.apply(that, arguments);
        // Set theme
        cm.addClass(that.nodes['container'], that.params['theme']);
    };

    /* *** TOOLBAR *** */

    classProto.processButtons = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'id' : null,
            'visible' : null
        }, item);
        // Data config
        item = cm.merge(item, that.getNodeDataConfig(item['container']));
        // Events
        cm.addEvent(item['container'], 'click', function(e){
            cm.preventDefault(e);
            var listItem = that.getItemById(item['id']);
            if(listItem && !listItem.visible){
                that.showItem(listItem);
            }
        });
        // Push
        that.buttons.push(item);
    };

    classProto.toggleToolbarVisibility = function(item){
        var that = this;
        if(that.params['showControls']){
            var buttonItem = that.getButtonById(item['id']);
            if(buttonItem && !item['visible']){
                that.showButton(buttonItem);
            }
            if(that.params['mode'] === 'create'){
                if(that.params['max'] > 0 && that.items.length === that.params['max']){
                    that.hideToolbar();
                }else{
                    that.showToolbar();
                }
            }else{
                if(that.isAllItemsVisible()){
                    that.hideToolbar();
                }else{
                    that.showToolbar();
                }
            }
            if(buttonItem && item['visible']){
                that.hideButton(buttonItem);
            }
        }
    };

    classProto.showButton = function(item){
        var that = this;
        item['visible'] = true;
        cm.removeClass(item['container'], 'is-hidden');
    };

    classProto.hideButton = function(item){
        var that = this;
        item['visible'] = false;
        cm.addClass(item['container'], 'is-hidden');
    };

    classProto.showToolbar = function(){
        var that = this;
        if(!that.isToolbarVisible){
            that.isToolbarVisible = true;
            // Prepare
            that.nodes['toolbarContainer'].style.overflow = 'hidden';

            // Animate
            cm.transition(that.nodes['toolbarContainer'], {
                'properties' : {
                    'height' : that.nodes['toolbarContainer'].scrollHeight + 'px',
                    'opacity' : 1
                },
                'duration' : that.params['duration'],
                'easing' : cm._config.motionSmooth,
                'clear' : true,
                'onStop' : function(){
                    that.nodes['toolbarContainer'].style.overflow = '';
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
                'properties' : {
                    'height' : '0px',
                    'opacity' : 0
                },
                'duration' : that.params['duration'],
                'easing' : cm._config.motionSmooth
            });
        }
        return that;
    };

    /* *** ITEMS *** */

    classProto.renderItem = function(item, params){
        var that = this;
        if(that.params['max'] === 0 || that.items.length < that.params['max']){
            // Config
            item = cm.merge({
                'id' : null,
                'showControls' : null,
                'sortable' : null,
                'visible' : null
            }, item);
            params = cm.merge({
                'triggerEvents' : true,
                'callback' : function(){}
            }, params);
            if(!cm.isBoolean(item['showControls'])){
                item['showControls'] = that.params['showControls'];
            }
            if(!cm.isBoolean(item['sortable'])){
                item['sortable'] = that.params['sortable'];
            }
            // Structure
            item['container'] = cm.node('div', {'class' : 'com__multifield__item', 'data-node' : 'items:[]:container'},
                item['content'] = item['field'] = cm.node('div', {'class' : 'field', 'data-node' : 'field'})
            );
            // Template
            that.renderItemTemplate(that.params['template'], item);
            // Controls
            if(that.params['showControls'] && item['showControls']){
                item['remove'] = cm.node('div', {'class' : that.params['icons']['remove'], 'title' : that.lang('remove'), 'data-node' : 'remove'});
                cm.appendChild(item['remove'], item['container']);
            }
            // Sortable
            if(that.params['sortable'] && item['sortable']){
                item['drag'] = cm.node('div', {'class' : that.params['icons']['drag'], 'data-node' : 'drag'});
                if(that.params['showControls']){
                    cm.insertFirst(item['drag'], item['container']);
                }else{
                    cm.appendChild(item['drag'], item['container']);
                }
            }
            // Embed
            cm.appendChild(item['container'], that.nodes['content']);
            // Process
            params['triggerEvents'] && that.triggerEvent('onItemAdd', item);
            that.processItem(item, {
                'triggerEvents' : params['triggerEvents'],
                'callback' : function(){
                    params['triggerEvents'] && that.triggerEvent('onItemAddEnd', item);
                    params['callback'](item);
                }
            });
        }
    };

    classProto.processItem = function(item, params){
        var that = this;
        // Config
        item = cm.merge({
            'id' : null,
            'fieldForEnable' : null,
            'showControls' : null,
            'sortable' : null,
            'visible' : null
        }, item);
        params = cm.merge({
            'triggerEvents' : true,
            'callback' : function(){}
        }, params);
        // Data config
        item = cm.merge(item, that.getNodeDataConfig(item['container']));
        // Validate
        if(!cm.isBoolean(item['showControls'])){
            item['showControls'] = that.params['showControls'];
        }
        if(!cm.isBoolean(item['sortable'])){
            item['sortable'] = that.params['sortable'];
        }
        if(!cm.isBoolean(item['visible'])){
            if(item['field-hidden-visible'] && !cm.isEmpty(item['field-hidden-visible'].value)){
                item.visible = item['field-hidden-visible'].value === '1';
            }else{
                item.visible = true;
            }
        }
        // Controls
        if(that.params['showControls'] && item['showControls']){
            cm.addEvent(item['remove'], 'click', function(e){
                cm.preventDefault(e);
                if(that.params['mode'] === 'create'){
                    that.deleteItem(item);
                }else{
                    that.hideItem(item);
                }
            });
        }else{
            cm.remove(item['remove']);
        }
        // Register sortable item
        if(that.params['sortable'] && item['sortable']){
            that.components['sortable'].addItem(item['container'], that.nodes['content']);
        }else{
            cm.remove(item['drag']);
        }
        // Push
        that.items.push(item);
        that.resetIndexes();
        // Toggle item visibility
        params['triggerEvents'] && that.triggerEvent('onItemProcess', item);
        if(item.visible){
            that.showItem(item, {
                'triggerEvents' : true,
                'callback' : function(){
                    params['triggerEvents'] && that.triggerEvent('onItemProcessEnd', item);
                    params['callback'](item);
                }
            });
        }else{
            that.hideItem(item, {
                'triggerEvents' : true,
                'callback' : function(){
                    params['triggerEvents'] && that.triggerEvent('onItemProcessEnd', item);
                    params['callback'](item);
                }
            });
        }
    };

    classProto.deleteItem = function(item, params){
        var that = this;
        params = cm.merge({
            'triggerEvents' : true,
            'callback' : function(){}
        }, params);
        // Remove sortable item
        if(that.params['sortable'] && item['sortable']){
            that.components['sortable'].removeItem(item['container']);
        }
        // Remove from array
        that.items.splice(that.items.indexOf(item), 1);
        that.resetIndexes();
        // Toggle item visibility
        params['triggerEvents'] && that.triggerEvent('onItemRemove', item);
        that.hideItem(item, {
            'triggerEvents' : params['triggerEvents'],
            'callback' : function(){
                cm.remove(item['container']);
                params['triggerEvents'] && that.triggerEvent('onItemRemoveEnd', item);
                params['callback'](item);
            }
        });
    };

    classProto.hideItem = function(item, params){
        var that = this;
        params = cm.merge({
            'triggerEvents' : true,
            'callback' : function(){}
        }, params);
        // Process
        item['visible'] = false;
        if(item['field-hidden-visible']){
            item['field-hidden-visible'].value = 0;
        }
        params['triggerEvents'] && that.triggerEvent('onItemHide', item);
        that.hideItemVisibility(item, {
            'triggerEvents' : params['triggerEvents'],
            'callback' : function(){
                params['triggerEvents'] && that.triggerEvent('onItemHideEnd', item);
                params['callback'](item);
            }
        });
        that.toggleToolbarVisibility(item);
    };

    classProto.hideItemVisibility = function(item, params){
        var that = this;
        params = cm.merge({
            'callback' : function(){},
            'triggerEvents' : true
        }, params);
        // Process
        item['container'].style.overflow = 'hidden';
        item['container'].style.height = item['container'].scrollHeight + 'px';
        cm.transition(item['container'], {
            'properties' : {
                'height' : '0px',
                'opacity' : 0
            },
            'duration' : that.params['duration'],
            'easing' : cm._config.motionSmooth,
            'onStop' : function(){
                params['callback'](item);
            }
        });
    };

    classProto.showItem = function(item, params){
        var that = this;
        params = cm.merge({
            'triggerEvents' : true,
            'callback' : function(){}
        }, params);
        // Process
        item['visible'] = true;
        if(item['field-hidden-visible']){
            item['field-hidden-visible'].value = 1;
        }
        params['triggerEvents'] && that.triggerEvent('onItemShow', item);
        that.showItemVisibility(item, {
            'triggerEvents' : params['triggerEvents'],
            'callback' : function(){
                params['triggerEvents'] && that.triggerEvent('onItemShowEnd', item);
                params['callback'](item);
            }
        });
        that.toggleToolbarVisibility(item);
    };

    classProto.showItemVisibility = function(item, params){
        var that = this;
        params = cm.merge({
            'triggerEvents' : true,
            'callback' : function(){}
        }, params);
        // Process
        item['container'].style.overflow = 'hidden';
        item['container'].style.height = '0px';
        cm.transition(item['container'], {
            'properties' : {
                'height' : item['container'].scrollHeight + 'px',
                'opacity' : 1
            },
            'duration' : that.params['duration'],
            'easing' : cm._config.motionSmooth,
            'clear' : true,
            'onStop' : function(){
                params['callback'](item);
            }
        });
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
            if(item['index'] !== index){
                // Set index
                item['previousIndex'] = item['index'];
                item['index'] = index;
                // Process data attributes
                if(that.params['templateAttributeReplace']){
                    cm.processDataAttributes(item['field'], that.params['templateAttribute'], {'%index%' : index});
                }
                // Hidden field
                if(item['field-hidden-index']){
                    item['field-hidden-index'].value = index;
                }
                // Trigger event
                that.triggerEvent('onItemIndexChange', item);
            }
        });
    };

    /* ******* TEMPLATE ******* */

    classProto.setTemplate = function(data){
        var that = this;
        that.params['template'] = data;
        return that;
    };

    classProto.renderItemTemplate = function(data, item){
        var that = this,
            nodes;
        if(!cm.isEmpty(data)){
            if(cm.isString(data)){
                nodes = cm.strToHTML(data);
            }else{
                nodes = cm.clone(data, true);
            }
            cm.appendNodes(nodes, item['field']);
        }
    };

    /* ******* PUBLIC ******* */

    classProto.clear = function(){
        var that = this;
        cm.forEach(that.items, function(item){
            that.deleteItem(item);
        });
        return that;
    };

    classProto.addItem = function(item, params){
        var that = this;
        that.renderItem(item, params);
        return that;
    };

    classProto.removeItem = function(item, params){
        var that = this;
        if(cm.isNumber(item) && that.items[item]){
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

    classProto.getItemById = function(id){
        var that = this;
        if(cm.isEmpty(id)){
            return;
        }
        return that.items.find(function(item){
            return item['id'] === id;
        });
    };

    classProto.getItems = function(){
        var that = this;
        return that.items;
    };

    classProto.getButtonById = function(id){
        var that = this;
        if(cm.isEmpty(id)){
            return;
        }
        return that.buttons.find(function(item){
            return item['id'] === id;
        });
    };

    classProto.getButtons = function(){
        var that = this;
        return that.buttons;
    };

    classProto.isAllItemsVisible = function(){
        var that = this;
        var items = that.items.filter(function(item){
            return item['visible'];
        });
        return that.items.length === items.length;
    };
});