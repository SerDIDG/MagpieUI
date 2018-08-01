cm.define('Com.FieldContent', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'controllerEvents' : true,
        'renderHiddenContent' : false,
        'setHiddenInput' : false
    }
},
function(params){
    var that = this;
    // Call parent class construct in current context
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.FieldContent', function(classConstructor, className, classProto, classInherit){
    classProto.setData = function(){
        var that = this,
            node = that.value;
        cm.clearNode(that.nodes['content']['container']);
        if(!cm.isNode(node)){
            node = cm.node('div', {'innerHTML' : node});
        }
        cm.appendChild(node, that.nodes['content']['container']);
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('content', {
    'node' : cm.node('div'),
    'value' : '',
    'defaultValue' : '',
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.FieldContent'
});
