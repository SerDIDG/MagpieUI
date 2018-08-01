cm.define('Com.Geocoder', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onLoad'
    ],
    'params' : {
        'controllerEvents' : true,
        'renderStructure' : false,
        'embedStructureOnRender' : false,
        'apiKey' : '',
        'apiLink' : 'https://maps.googleapis.com/maps/api/js?key=%key%'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.Geocoder', function(classConstructor, className, classProto, classInherit){
    classProto.onConstructStart = function(){
        var that = this;
        // Binds
        that.loadScriptEndHanlder = that.loadScriptEnd.bind(that);
    };

    classProto.onValidateParams = function(){
        var that = this;
        that.apiLink = cm.strReplace(that.params['apiLink'], {'%key%' : that.params['apiKey']});
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Load Google Maps Script
        cm.loadScript({
            'path' : 'google.maps',
            'src' : that.apiLink,
            'callback' : that.loadScriptEndHanlder
        });
    };

    classProto.loadScriptEnd = function(handler){
        var that = this;
        that.components['geocoder'] = new handler.Geocoder();
        that.triggerEvent('onLoad');
    };

    classProto.get = function(data, error, success){
        var that = this,
            args = arguments;
        if(that.components['geocoder']){
            that.process.apply(that, args);
        }else{
            cm.loadScript({
                'path' : 'google.maps',
                'src' : that.apiLink,
                'callback' : function(){
                    that.process.apply(that, args);
                }
            });
        }
    };

    classProto.process = function(data, success, error){
        var that = this;
        that.components['geocoder'].geocode(data, function(results, status) {
            if(status === 'OK'){
                cm.isFunction(success) && success(results, status);
            }else{
                cm.isFunction(error) && error(status);
            }
        });
    };
});