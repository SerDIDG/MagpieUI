cm.define('Com.MultipleInputChild', {
    'extend' : 'Com.MultipleInput',
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-input-child',
        'inputConstructor' : 'Com.AbstractInput'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.MultipleInput.apply(that, arguments);
});

cm.getConstructor('Com.MultipleInputChild', function(classConstructor, className, classProto, classInherit){
    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        return that;
    };
});
