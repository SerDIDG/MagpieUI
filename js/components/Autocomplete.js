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
        'target' : null,                                    // HTML node
        'container' : 'document.body',
        'minLength' : 3,
        'delay' : 300,
        'data' : [],                                        // Example: [{'value' : 'foo', 'text' : 'Bar'}].
        'url' : null,                                       // Request URL.
        'urlParams' : {

        },
        'Com.Tooltip' : {
            'hideOnOut' : true,
            'targetEvent' : 'none',
            'className' : 'com__autocomplete-tooltip',
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

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        //that.modules.Callback.process(that.params['input']);
        that.getDataConfig(that.params['input']);
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
        e = cm.getEvent(e);

        switch(e.keyCode){
            // Enter and Tab keys of keyboard
            case 9:
            case 13:
                that.hide();
                break;
        }
    };

    var requestHelper = function(){
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
        item['nodes'] = {};
        // Render Structure of List Item
        item['nodes']['container'] = cm.Node('li',
            item['nodes']['link'] = cm.Node('a', {'innerHTML' : item['text']})
        );
        // Register item
        that.callbacks.registerItem(that, item['nodes']['container'], item, i);
        // Embed List Item to List
        cm.appendChild(item['nodes']['container'], container);
    };

    that.callbacks.registerItem = function(that, node, item, i, execute){
        cm.addEvent(node, 'click', function(){
            that.set(item, execute);
            that.hide();
        });
    };

    that.callbacks.setTooltip = function(that, container){
        that.components['tooltip'].setContent(container);
    };

    /* ******* MAIN ******* */

    that.set = function(item, execute){
        execute = typeof execute == 'undefined'? true : execute;
        that.params['input'].value = item['text'];
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