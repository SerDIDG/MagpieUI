cm.define('Com.Geolocation', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onRequest',
        'onSuccess',
        'onError'
    ],
    'params' : {
        'controllerEvents' : true,
        'renderStructure' : false,
        'embedStructureOnRender' : false,
        'autoRequest' : true,
        'default' : {                       // New York
            'lat' : 40.7127837,
            'lng' : -74.0059413
        },
        'options' : {
            'enableHighAccuracy' : false,
            'maximumAge' : 30000,
            'timeout' : 27000
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.Geolocation', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Get use location
        that.params['autoRequest'] && that.request();
        return that;
    };

    classProto.request = function(){
        var that = this,
            position;
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(function(position){
                position = {
                    'lat' : position.coords.latitude,
                    'lng' : position.coords.longitude
                };
                that.triggerEvent('onRequest', position);
                that.triggerEvent('onSuccess', position);
            }, function(){
                that.triggerEvent('onRequest', that.params['defaultPosition']);
                that.triggerEvent('onError', that.params['defaultPosition']);
            }, that.params['options']);
        }else{
            that.triggerEvent('onRequest', that.params['defaultPosition']);
            that.triggerEvent('onError', that.params['defaultPosition']);
        }
    };
});