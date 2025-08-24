cm.define('Com.Geolocation', {
    extend: 'Com.AbstractController',
    events: [
        'onComplete',
        'onRequest',
        'onSuccess',
        'onError',
    ],
    params: {
        controllerEvents: true,
        renderStructure: false,
        embedStructureOnRender: false,

        useDefault: true,
        default: {},
        autoRequest: true,

        apiKey: '',
        apiLink: 'https://maps.googleapis.com/maps/api/js?key=%key%',

        geocoder: {
            enable: false,
            constructor: 'Com.Geocoder',
            constructorParams: {},
        },

        options: {
            enableHighAccuracy: false,
            maximumAge: 30000,
            timeout: 27000,
        },
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.Geolocation', function(classConstructor, className, classProto, classInherit) {
    classProto.onValidateParams = function() {
        var that = this;
        that.params.geocoder.constructorParams.apiLink = that.params.apiLink;
        that.params.geocoder.constructorParams.apiKey = that.params.apiKey;
    };

    classProto.renderViewModel = function() {
        var that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init geocoder
        if (that.params.geocoder.enable) {
            cm.getConstructor(that.params.geocoder.constructor, function(classConstructor) {
                that.components.geocoder = new classConstructor(that.params.geocoder.constructorParams);
            });
        }

        // Get user location
        if (that.params.autoRequest) {
            that.request();
        }
    };

    classProto.request = function() {
        var that = this;

        that.triggerEvent('onRequest');

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(data) {
                    var location = {
                        lat: data.coords.latitude,
                        lng: data.coords.longitude,
                    };
                    that.process(location, 'success');
                },
                function() {
                    that.process(that.params.default, 'error');
                },
                that.params.options
            );
        } else {
            that.process(that.params.default, 'error');
        }
    };

    classProto.process = function(location, status) {
        var that = this;

        // Request location data from the geocoder
        if (
            that.params.geocoder.enable &&
            (that.params.useDefault || status === 'success')
        ) {
            that.requestGeocoder(location);
            return;
        }

        that.triggerEvent('onComplete', location, null, status);
        if (status === 'success') {
            that.triggerEvent('onSuccess', location);
        } else {
            that.triggerEvent('onError', location);
        }
    };

    classProto.requestGeocoder = function(location) {
        var that = this;
        var options = {
            location: location,
        };
        that.components.geocoder.get(
            options,
            function(data) {
                that.triggerEvent('onComplete', location, data, 'success');
                that.triggerEvent('onSuccess', location, data);
            },
            function() {
                that.triggerEvent('onComplete', location, null, 'error');
                that.triggerEvent('onError', location);
            }
        );
    };
});
