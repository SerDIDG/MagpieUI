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
        'onRender'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append'
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
        cm.forEach(that.items, function(item){
            that.remove(item);
        });
        return that;
    };

    classProto.add = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'label' : '',
            'nodes' : {}
        }, item);
        // Structure
        // Push
        that.items.push(item);
        return that;
    };

    classProto.remove = function(item){
        var that = this;
        return that;
    };
});