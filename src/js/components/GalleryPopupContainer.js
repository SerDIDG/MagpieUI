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

    classProto.validateParams = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.validateParams.apply(that, arguments);
        // Set Data
        that.params['params']['data'] = that.params['data'];
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.validateParams.apply(that, arguments);
        return that;
    };

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