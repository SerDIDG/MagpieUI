cm.define('Com.InputTrigger', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onChange',
        'onInput',
        'onClick'
    ],
    'params' : {
        'renderStructure' : false,
        'embedStructureOnRender' : false,
        'controllerEvents' : true,
        'type' : 'radio',
        'triggerDefault' : false
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.InputTrigger', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.onConstructStart = function(){
        var that = this;
        that.inputs = [];
        // Bind context to methods
        that.changeHandler = that.change.bind(that);
        that.inputHandler = that.input.bind(that);
        that.clickHandler = that.click.bind(that);
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Find inputs
        that.inputs = cm.getByAttr('type', that.params['type'], that.params['node']);
        // Process
        cm.forEach(that.inputs, function(node){
            cm.addEvent(node, 'input', that.inputHandler);
            cm.addEvent(node, 'change', that.changeHandler);
            cm.addEvent(node, 'click', that.clickHandler);
            // Default
            if(that.params['triggerDefault']){
                cm.triggerEvent(node, 'change');
            }
        });
    };

    classProto.change = function(e){
        var that = this,
            node = cm.getEventTarget(e),
            value = node.value,
            isCheckable = /radio|checkbox/.test(node.type),
            isChecked = !isCheckable || (isCheckable && node.checked);
        if(isChecked){
            that.triggerEvent('onChange', node, value);
        }
        return that;
    };

    classProto.input = function(e){
        var that = this,
            node = cm.getEventTarget(e),
            value = node.value;
        that.triggerEvent('onInput', node, value);
        return that;
    };

    classProto.click = function(e){
        var that = this,
            node = cm.getEventTarget(e),
            value = node.value;
        that.triggerEvent('onClick', node, value);
        return that;
    };
});