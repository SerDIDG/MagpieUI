cm.define('Com.TabsetHelper', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onTabShowStart',
        'onTabShow',
        'onTabHideStart',
        'onTabHide',
        'onLabelClick'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'active' : null
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container': cm.Node('div'),
        'labels' : [],
        'tabs' : []
    };

    that.current = false;
    that.previous = false;
    that.tabs = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
        // Set active tab
        if(that.params['active'] && that.tabs[that.params['active']]){
            set(that.params['active'], true);
        }
    };

    var render = function(){
        // Process tabs
        cm.forEach(that.nodes['tabs'], function(item){
            processTab(item);
        });
        cm.forEach(that.nodes['labels'], function(item){
            processLabel(item);
        });
    };

    var processTab = function(item, config){
        config = cm.merge(
            cm.merge({
                    'id' : ''
                }, that.getNodeDataConfig(item['container'])
            ),
            config
        );
        config['container'] = item['container'];
        renderTab(config);
    };

    var processLabel = function(item, config){
        config = cm.merge(
            cm.merge({
                    'id' : ''
                }, that.getNodeDataConfig(item['container'])
            ),
            config
        );
        config['container'] = item['container'];
        renderLabel(config);
    };

    var renderTab = function(item){
        var tab;
        item = cm.merge({
            'id' : '',
            'container' : cm.Node('li')
        }, item);

        if(!cm.isEmpty(item['id']) && !(tab = that.tabs[item['id']])){
            that.tabs[item['id']] = {
                'id' : item['id'],
                'tab' : item['container'],
                'config' : item
            };
        }
    };

    var renderLabel = function(item){
        var tab;
        item = cm.merge({
            'id' : '',
            'container' : cm.Node('li')
        }, item);

        if(!cm.isEmpty(item['id']) && (tab = that.tabs[item['id']])){
            tab['label'] = item['container'];
            tab['config'] = cm.merge(tab['config'], item);
            cm.addEvent(tab['label'], 'click', function(){
                that.triggerEvent('onLabelClick', tab);
                set(tab['id']);
            });
        }
    };

    var set = function(id, triggerEvents){
        if(that.current != id){
            // Hide previous tab
            unset(triggerEvents);
            // Show new tab
            that.current = id;
            triggerEvents && that.triggerEvent('onTabShowStart', that.tabs[that.current]);
            cm.addClass(that.tabs[that.current]['tab'], 'active');
            cm.addClass(that.tabs[that.current]['label'], 'active');
            triggerEvents && that.triggerEvent('onTabShow', that.tabs[that.current]);
        }
    };

    var unset = function(triggerEvents){
        if(that.current && that.tabs[that.current]){
            that.previous = that.current;
            triggerEvents && that.triggerEvent('onTabHideStart', that.tabs[that.current]);
            cm.removeClass(that.tabs[that.current]['tab'], 'active');
            cm.removeClass(that.tabs[that.current]['label'], 'active');
            triggerEvents && that.triggerEvent('onTabHide', that.tabs[that.current]);
            that.current = null;
        }
    };

    /* ******* MAIN ******* */

    that.set = function(id, triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        if(id && that.tabs[id]){
            set(id, triggerEvents);
        }
        return that;
    };

    that.unset = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        unset(triggerEvents);
        return that;
    };

    that.get = function(){
        return that.current;
    };

    that.addTab = function(tab, label, config){
        cm.isNode(tab) && processTab(tab, config);
        cm.isNode(label) && processLabel(label, config);
        return that;
    };

    that.addTabs = function(tabs, lables){
        tabs = cm.isArray(tabs) ? tabs : [];
        lables = cm.isArray(lables) ? lables : [];
        cm.forEach(tabs, function(item){
            processTab(item);
        });
        cm.forEach(lables, function(item){
            processLabel(item);
        });
        return that;
    };

    that.getTab = function(id){
        if(id && that.tabs[id]){
            return that.tabs[id];
        }
        return null;
    };

    init();
});