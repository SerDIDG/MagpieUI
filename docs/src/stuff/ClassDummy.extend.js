cm.define('Com.ClassDummyChild', {
    'extend' : 'Com.ClassDummy',
    'params' : {
        'node' : cm.node('div'),
    }
},
function(params){
    var that = this;
    Com.ClassDummy.apply(that, arguments);
});

cm.getConstructor('Com.ClassDummyChild', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };
});