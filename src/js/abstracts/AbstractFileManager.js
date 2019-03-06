cm.define('Com.AbstractFileManager', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSelect',
        'onComplete',
        'onGet',
        'onRenderHolderStart',
        'onRenderHolderProcess',
        'onRenderHolderEnd',
        'onRenderContentStart',
        'onRenderContentProcess',
        'onRenderContentEnd'
    ],
    'params' : {
        'embedStructure' : 'replace',
        'controllerEvents' : true,
        'max' : 0,                                                        // 0 - infinity
        'lazy' : false,
        'fullSize' : false,
        'showStats' : true,
        'statsConstructor' : 'Com.FileStats',
        'statsParams' : {
            'embedStructure' : 'append',
            'toggleBox' : false,
            'inline' : true
        }
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    that.items = [];
    that.isMultiple = false;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractFileManager', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.completeHandler = that.complete.bind(that);
        // Add events
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.validateParams = function(){
        var that = this;
        that.isMultiple = !that.params['max'] || that.params['max'] > 1;
        return that;
    };

    classProto.get = function(){
        var that = this;
        that.triggerEvent('onGet', that.items);
        return that;
    };

    classProto.load = function(){
        var that = this;
        if(!that.isLoaded){
            that.renderController();
        }
        return that;
    };

    classProto.complete = function(){
        var that = this;
        that.triggerEvent('onComplete', that.items);
        return that
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-manager'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.renderHolder(),
                that.renderContent()
            )
        );
        // Events
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderHolder = function(){
        var that = this,
            nodes = {};
        that.triggerEvent('onRenderHolderStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__file-manager__holder'},
            nodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        // Events
        that.triggerEvent('onRenderHolderProcess');
        that.nodes['holder'] = nodes;
        that.triggerEvent('onRenderHolderEnd');
        return nodes['container'];
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__file-manager__content'});
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentEnd');
        return nodes['container'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        if(that.params['showStats']){
            cm.getConstructor(that.params['statsConstructor'], function(classObject){
                that.components['stats'] = new classObject(
                    cm.merge(that.params['statsParams'], {
                        'container' : that.nodes['content']['container']
                    })
                );
            });
        }else{
            cm.remove(that.nodes['content']['container']);
        }
        if(!that.params['lazy']){
            that.renderController();
        }
        return that;
    };

    classProto.renderController = function(){
        var that = this;
        return that;
    };

    classProto.setAttributes = function(){
        var that = this;
        // Call parent method
        classInherit.prototype.setAttributes.apply(that, arguments);
        // Attributes
        that.params['fullSize'] && cm.addClass(that.nodes['container'], 'is-fullsize');
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.processFiles = function(data){
        var that = this,
            files = [],
            max;
        if(cm.isArray(data)){
            files = data.map(function(file){
                return that.convertFile(file);
            });
        }else if(cm.isObject(data)){
            files.push(that.convertFile(data));
        }
        if(!that.params['max']){
            that.items = files;
        }else if(files.length){
            max = Math.min(that.params['max'], files.length);
            that.items = files.slice(0, max);
        }else{
            that.items = [];
        }
        that.triggerEvent('onSelect', that.items);
        return that;
    };

    classProto.convertFile = function(data){
        return data;
    };
});