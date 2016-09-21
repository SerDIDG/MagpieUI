cm.define('Com.Router', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'renderStructure' : false,
        'renderOnConstruct' : false
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.Router', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        return that;
    };

    /* *** PUBLIC *** */
});