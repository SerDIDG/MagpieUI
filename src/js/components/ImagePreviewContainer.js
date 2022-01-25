cm.define('Com.ImagePreviewContainer', {
    extend: 'Com.AbstractContainer',
    params: {
        constructor: 'Com.GalleryPopup',
        params: {
            showCounter: false,
            showTitle: true,
        },
        placeholder: false,
        types: {
            video: /video\/(mp4|webm|ogg|avi)/,
            embed: /application\/pdf/,
        },
    },
},
function() {
    var that = this;
    that.item = {};
    Com.AbstractContainer.apply(that, arguments);
});

cm.getConstructor('Com.ImagePreviewContainer', function(classConstructor, className, classProto, classInherit) {
    classProto.onRenderControllerProcess = function() {
        var that = this;
        that.setController();
        return that;
    };

    classProto.set = function(item) {
        var that = this;
        that.clear();
        that.setData(item);
        that.setController();
        return that;
    };

    classProto.clear = function() {
        var that = this;
        that.components.controller && that.components.controller.clear();
        return that;
    };

    classProto.setData = function(item) {
        var that = this;
        that.item = {
            type: 'image',
            src: item.url,
            mime: item.mime || item.type,
            title: item.name,
        };
        if (
            !cm.isEmpty(that.item.mime) &&
            (that.params.types.embed.test(that.item.mime) || that.params.types.video.test(that.item.mime))
        ) {
            that.item.type = 'iframe';
        }
        return that;
    };

    classProto.setController = function() {
        var that = this;
        that.components.controller && that.components.controller.add(that.item);
        return that;
    };
});
