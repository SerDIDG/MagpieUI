cm.define('Com.Geolocation', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onComplete',
        'onRequest',
        'onSuccess',
        'onError'
    ],
    'params' : {
        'controllerEvents' : true,
        'renderStructure' : false,
        'embedStructureOnRender' : false,
        'autoRequest' : true,
        'apiKey' : '',
        'apiLink' : 'https://maps.googleapis.com/maps/api/js?key=%key%',
        'useGeocoder' : false,
        'geocodeConstructor' : 'Com.Geocoder',
        'geocoderParams' : {},
        'default' : {},
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

cm.getConstructor('Com.Geolocation', function(classConstructor, className, classProto, classInherit){
    classProto.onValidateParams = function(){
        var that = this;
        that.params['geocoderParams']['apiLink'] = that.params['apiLink'];
        that.params['geocoderParams']['apiKey'] = that.params['apiKey'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Init geocoder
        if(that.params['useGeocoder']){
            cm.getConstructor(that.params['geocodeConstructor'], function(classConstructor){
                that.components['geocoder'] = new classConstructor(that.params['geocoderParams']);
            });
        }
        // Get use location
        that.params['autoRequest'] && that.request();
        return that;
    };

    classProto.request = function(){
        var that = this,
            location;
        that.triggerEvent('onRequest');
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(function(data){
                location = {
                    'lat' : data.coords.latitude,
                    'lng' : data.coords.longitude
                };
                that.process(location, 'success');
            }, function(){
                that.process(that.params['default'], 'error');
            }, that.params['options']);
        }else{
            that.process(that.params['default'], 'error');
        }
    };

    classProto.process = function(location, status){
        var that = this;
        if(that.params['useGeocoder']){
            that.geocodeLocation(location);
        }else{
            that.triggerEvent('onComplete', location, null, status);
            if(status === 'success'){
                that.triggerEvent('onSuccess', location);
            }else{
                that.triggerEvent('onError', location);
            }
        }
    };

    classProto.geocodeLocation = function(location){
        var that = this;
        that.components['geocoder'].get({'location' : location}, function(data){
            that.triggerEvent('onComplete', location, data, 'success');
            that.triggerEvent('onSuccess', location, data);
        }, function(){
            that.triggerEvent('onComplete', location, null, 'error');
            that.triggerEvent('onError', location);
        });
    };
});