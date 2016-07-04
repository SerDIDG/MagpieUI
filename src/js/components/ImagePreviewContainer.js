cm.define('Com.ImagePreviewContainer', {
    'extend' : 'Com.AbstractContainer',
    'params' : {
        'constructor' : 'Com.GalleryPopup',
        'params' : {
            'showCounter' : false,
            'showTitle' : true
        }
    }
},
function(params){
    var that = this;
    that.item = {};
    // Call parent class construct
    Com.AbstractContainer.apply(that, arguments);
});


cm.getConstructor('Com.ImagePreviewContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.renderControllerProcessHandler = that.renderControllerProcess.bind(that);
        // Add events
        that.addEvent('onRenderControllerProcess', that.renderControllerProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(item){
        var that = this;
        that.clear();
        that.setData(item);
        that.setController();
        return that;
    };

    classProto.clear = function(){
        var that = this;
        that.components['controller'] && that.components['controller'].clear();
        return that;
    };

    classProto.renderControllerProcess = function(){
        var that = this;
        that.setController();
        return that;
    };

    classProto.setData = function(item){
        var that = this;
        that.item = {
            'src' : item['url'],
            'mime' : item['type'],
            'title' : item['name']
        };
        return that;
    };

    classProto.setController = function(){
        var that = this;
        that.components['controller'] && that.components['controller'].add(that.item);
        return that;
    };
});