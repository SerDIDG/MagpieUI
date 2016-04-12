cm.define('Com.ClassDummy', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Callbacks',
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
    that.components = {};
    that.construct(params);
});

cm.getConstructor('Com.ClassDummy', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.nodes['container'] = cm.node('div');
        // Append
        that.embedStructure(that.nodes['container']);
        return that;
    };
});