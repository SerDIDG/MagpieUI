cm.define('Com.ClassDummyChild', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'node' : cm.node('div')
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.ClassDummyChild', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.render = function(){
        var that = this;
        // Call parent method - render
        _inherit.prototype.render.apply(that, arguments);
        return that;
    };
});