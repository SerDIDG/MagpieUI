cm.define('Com.Autocomplete', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage',
        'Callbacks'
    ],
    'require' : [
        'Com.Tooltip'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'input' : cm.Node('input', {'type' : 'text'}),      // HTML input node
        'target' : false,                                   // HTML node
        'container' : 'document.body',
        'minLength' : 3,
        'delay' : 300,
        'data' : [],                                        // Example: [{'value' : 'foo', 'text' : 'Bar'}].
        'url' : false,                                      // Request URL.
        'urlParams' : {

        },
        'Com.Tooltip' : {
            'hideOnOut' : true,
            'targetEvent' : 'none',
            'className' : 'com__ac-tooltip',
            'width' : 'targetWidth',
            'top' : 'targetHeight + 3'
        }
    }
},
function(params){
    var that = this,
        requestDelay;

    that.isAjax = false;
    that.components = {};
    that.registeredItems = [];
    that.selectedItemIndex = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['input']);
        that.callbacksProcess();
        validateParams();
        render();
    };

    var validateParams = function(){
        if(!that.params['target']){
            that.params['target'] = that.params['input'];
        }
        that.isAjax = !cm.isEmpty(that.params['url']);
    };

    var render = function(){
        // Init tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['container'],
                'target' : that.params['target']
            })
        );
        // Add events
        cm.addEvent(that.params['input'], 'input', requestHelper);
        cm.addEvent(that.params['input'], 'keydown', inputHelper);
        that.triggerEvent('onRender');
    };

    var inputHelper = function(e){
        var listLength, listIndex;
        e = cm.getEvent(e);

        switch(e.keyCode){
            // Enter and Tab keys of keyboard
            case 9:
            case 13:
                set(that.selectedItemIndex);
                that.hide();
                break;
            // Arrow Up
            case 38:
                listLength = that.registeredItems.length;
                if(listLength){
                    if(that.selectedItemIndex == null){
                        that.selectedItemIndex = listLength - 1;
                    }else if(that.selectedItemIndex - 1 >= 0){
                        listIndex = that.selectedItemIndex - 1;
                    }else{
                        listIndex = listLength - 1;
                    }
                    setListItem(listIndex);
                }
                break;
            // Arrow Down
            case 40:
                listLength = that.registeredItems.length;
                if(listLength){
                    if(that.selectedItemIndex == null){
                        listIndex = 0;
                    }else if(that.selectedItemIndex + 1 < listLength){
                        listIndex = that.selectedItemIndex + 1;
                    }else{
                        listIndex = 0;
                    }
                    setListItem(listIndex);
                }
                break;
        }
    };

    var requestHelper = function(){
        // Clear tooltip ajax/static delay and filtered items list
        that.selectedItemIndex = null;
        that.registeredItems = [];
        requestDelay && clearTimeout(requestDelay);

        var request = that.params['input'].value;
        if(request.length >= that.params['minLength']){
            requestDelay = setTimeout(function(){
                that.callbacks.response(that, that.params['data']);
            }, that.params['delay']);
        }else{
            that.hide();
        }
    };

    var setListItem = function(index){
        var previousItem = that.registeredItems[that.selectedItemIndex],
            item = that.registeredItems[index];
        if(previousItem){
            cm.removeClass(previousItem['node'], 'active');
        }
        if(item){
            cm.addClass(item['node'], 'active');
            that.components['tooltip'].scrollToNode(item['node']);
        }
        that.selectedItemIndex = index;
    };

    var set = function(index){
        var item = that.registeredItems[index];
        if(item){
            that.setRegistered(item, true);
        }
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.response = function(that, items){
        var request = that.params['input'].value,
            filteredItems;
        // Filter Items
        if(that.isAjax){
            filteredItems = items;
        }else{
            filteredItems = [];
            cm.forEach(items, function(item){
                if(item['text'].toLowerCase().indexOf(request.toLowerCase()) > -1){
                    filteredItems.push(item);
                }
            });
        }
        // Render Items
        that.callbacks.render(that, filteredItems);
    };

    that.callbacks.render = function(that, items){
        if(items.length){
            // Render List Nodes
            that.callbacks.renderList(that, items);
            // Show menu
            that.show();
        }else{
            that.hide();
        }
    };

    that.callbacks.renderList = function(that, items){
        var nodes = {};
        // Render structure
        nodes['container'] = cm.Node('div', {'class' : 'cm-items-list'},
            nodes['items'] = cm.Node('ul')
        );
        // Render List Items
        cm.forEach(items, function(item, i){
            that.callbacks.renderItem(that, nodes['items'], item, i);
        });
        // Embed nodes to Tooltip
        that.callbacks.setTooltip(that, nodes['container']);
    };

    that.callbacks.renderItem = function(that, container, item, i){
        var nodes = {};
        // Render Structure of List Item
        nodes['container'] = cm.Node('li',
            cm.Node('a', {'innerHTML' : item['text']})
        );
        // Register item
        that.callbacks.registerItem(that, nodes['container'], item, i);
        // Embed List Item to List
        cm.appendChild(nodes['container'], container);
    };

    that.callbacks.registerItem = function(that, node, item, i){
        var regItem = {
            'data' : item,
            'node' : node,
            'i' : i
        };
        cm.addEvent(regItem['node'], 'click', function(){
            that.setRegistered(regItem);
            that.hide();
        });
        that.registeredItems.push(regItem);
    };

    that.callbacks.setTooltip = function(that, container){
        that.components['tooltip'].setContent(container);
    };

    /* ******* MAIN ******* */

    that.set = function(item, execute){
        execute = typeof execute == 'undefined'? true : execute;
        that.params['input'].value = item['text'];
    };

    that.setRegistered = function(item, execute){
        execute = typeof execute == 'undefined'? true : execute;
        that.params['input'].value = item['data']['text'];
    };

    that.show = function(){
        that.components['tooltip'].show();
        return that;
    };

    that.hide = function(){
        that.components['tooltip'].hide();
        return that;
    };

    init();
});