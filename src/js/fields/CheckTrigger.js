cm.define('Com.CheckTrigger', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'renderStructure' : false,
        'embedStructureOnRender' : false,
        'controllerEvents' : true,
        'checked' : false,
        'unchecked' : false
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.CheckTrigger', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.onConstructStart = function(){
        var that = this;
        that.checked = false;
        that.checkedA = [];
        that.uncheckedA = [];
        // Bind context to methods
        that.toggleHandler = that.toggle.bind(that);
    };

    classProto.onValidateParams = function(){
        var that = this;
        that.checked = that.params['node'].checked;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Add check event
        cm.addEvent(that.params['node'], 'change', that.toggleHandler);
        // Find components
        if(cm.isObject(that.params['checked'])){
            that.find(that.params['checked'], that.checkedA);
        }else if(cm.isString(that.params['checked'])){
            that.find({'type' : 'input', 'name' : that.params['checked']}, that.checkedA);
        }
        if(cm.isObject(that.params['unchecked'])){
            that.find(that.params['unchecked'], that.uncheckedA);
        }else if(cm.isString(that.params['unchecked'])){
            that.find({'type' : 'input', 'name' : that.params['unchecked']}, that.uncheckedA);
        }
    };

    classProto.find = function(o, parent){
        var that = this;
        o = cm.merge({
            'type' : 'controller',  // controller | input
            'className' : null,
            'classObject' : null,
            'name' : null,
            'container' : null,
            'node' : null,
            'method' : 'disable'
        }, o);
        // Find by type
        switch(o['type']){
            case 'controller':
                new cm.Finder(o['className'], o['name'], o['container'], function(classObject){
                    var item = cm.merge(o, {
                        'classObject' : classObject
                    });
                    parent.push(item);
                    that.toggle();
                });
                break;
            case 'input':
                var nodes = cm.getByName(o['name'], o['container']);
                cm.forEach(nodes, function(node){
                    var item = cm.merge(o, {
                        'node' : node
                    });
                    parent.push(item);
                    that.toggle();
                });
                break;
        }
    };

    classProto.toggle = function(){
        var that = this;
        that.checked = that.params['node'].checked;
        if(that.checked){
            that.enableTrigger(that.checkedA);
            that.disableTrigger(that.uncheckedA);
        }else{
            that.disableTrigger(that.checkedA);
            that.enableTrigger(that.uncheckedA);
        }
        return that;
    };

    classProto.enableTrigger = function(o){
        var that = this;
        cm.forEach(o, function(item){
            switch(item['type']){
                case 'controller':
                    item['classObject'] && cm.isFunction(item['classObject'].enable) && item['classObject'].enable();
                    break;
                case 'input':
                    if(cm.isNode(item['node'])){
                        item['node'].disabled = false;
                        item['node'].focus();
                    }
                    break;
            }
        });
        return that;
    };

    classProto.disableTrigger = function(o){
        var that = this;
        cm.forEach(o, function(item){
            switch(item['type']){
                case 'controller':
                    item['classObject'] && cm.isFunction(item['classObject'].disable) && item['classObject'].disable();
                    break;
                case 'input':
                    if(cm.isNode(item['node'])){
                        item['node'].disabled = true;
                        item['node'].blur();
                    }
                    break;
            }
        });
        return that;
    };
});