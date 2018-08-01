cm.define('Com.GalleryPopupContainer', {
    'extend' : 'Com.AbstractContainer',
    'params' : {
        'constructor' : 'Com.GalleryPopup',
        'data' : {},
        'params' : {}
    }
},
function(params){
    var that = this;
    that.buttons = {};
    // Call parent class construct
    Com.AbstractContainer.apply(that, arguments);
});

cm.getConstructor('Com.GalleryPopupContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.constructController = function(classObject){
        var that = this;
        return new classObject(
            cm.merge(that.params['params'], {
                'data' : [that.params['data']]
            })
        );
    };

    classProto.set = function(data){
        var that = this;
        that.params['data'] = data;
        if(that.components['controller']){
            that.components['controller'].clear();
            that.components['controller'].add(data);
            that.components['controller'].set(0);
        }
        return that;
    };
});