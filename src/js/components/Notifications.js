cm.define('Com.Notifications', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onAdd',
        'onRemove'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append',
        'langs' : {
            'close' : 'Close'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.items = [];
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    /* ******* PUBLIC ******* */

    init();
});

cm.getConstructor('Com.Notifications', function(classConstructor, className, classProto){
    classProto.validateParams = function(){
        var that = this;
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.renderView();
        // Append
        that.embedStructure(that.nodes['container']);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.nodes['container'] = cm.node('div', {'class' : 'com__notifications'},
            that.nodes['list'] = cm.node('ul')
        );
        return that;
    };

    classProto.clear = function(){
        var that = this;
        while(that.items.length){
            that.remove(that.items[0]);
        }
        return that;
    };

    classProto.add = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'label' : '',
            'type' : 'warning',           // success | warning | danger
            'nodes' : {}
        }, item);
        // Structure
        item['nodes']['container'] = cm.node('li', {'class' : item['type']},
            item['nodes']['close'] = cm.node('div', {'class' : 'close'}, that.lang('close')),
            item['nodes']['descr'] = cm.node('div', {'class' : 'descr'})
        );
        // Label
        if(cm.isNode(item['label'])){
            cm.appendChild(item['label'], item['nodes']['descr']);
        }else{
            item['nodes']['descr'].innerHTML = item['label'];
        }
        // Events
        cm.addEvent(item['nodes']['close'], 'click', function(){
            that.remove(item);
        });
        // Embed
        cm.appendChild(item['nodes']['container'], that.nodes['list']);
        // Push
        that.items.push(item);
        that.triggerEvent('onAdd', item);
        return that;
    };

    classProto.remove = function(item){
        var that = this;
        cm.remove(item['nodes']['container']);
        cm.arrayRemove(that.items, item);
        that.triggerEvent('onRemove', item);
        return that;
    };

    classProto.getLength = function(){
        var that = this;
        return that.items.length;
    };
});