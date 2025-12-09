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
            video: cm._config.fileTypes.video,
            embed: cm._config.fileTypes.embed,
        },
    },
},
function() {
    Com.AbstractContainer.apply(this, arguments);
});

cm.getConstructor('Com.ImagePreviewContainer', function(classConstructor, className, classProto, classInherit) {
    classProto.onRenderControllerProcess = function() {
        const that = this;
        that.setController();
        return that;
    };

    classProto.set = function(item) {
        const that = this;
        that.clear();
        that.setData(item);
        that.setController();
        return that;
    };

    classProto.clear = function() {
        const that = this;
        that.components.controller?.clear();
        return that;
    };

    classProto.setData = function(item) {
        const that = this;
        that.item = {
            type: item.type || 'image',
            src: item.url,
            mime: item.mime || item.type,
            title: item.name,
        };
        if (!cm.isEmpty(that.item.mime)) {
            if (that.params.types.video.test(that.item.mime)) {
                that.item.type = 'video';
            }
            if (that.params.types.embed.test(that.item.mime)) {
                that.item.type = 'iframe';
            }
        }
        return that;
    };

    classProto.setController = function() {
        const that = this;
        that.components.controller?.add(that.item);
        return that;
    };
});
