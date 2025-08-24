cm.define('Com.GalleryPopupContainer', {
    extend: 'Com.AbstractContainer',
    params: {
        constructor: 'Com.GalleryPopup',
        destructOnClose: false,
        data: {},
        constructorParams: {},
    },
},
function() {
    Com.AbstractContainer.apply(this, arguments);
});

cm.getConstructor('Com.GalleryPopupContainer', function(classConstructor, className, classProto, classInherit) {
    classProto.constructController = function(classConstructor) {
        var that = this;
        return new classConstructor(
            cm.merge(that.params.constructorParams, {
                data: !cm.isArray(that.params.data) ? [that.params.data] : that.params.data,
            })
        );
    };

    classProto.set = function(data) {
        var that = this;
        that.params.data = data;
        if (that.components.controller) {
            that.components.controller.clear();
            that.components.controller.add(data);
            that.components.controller.set(0);
        }
        return that;
    };
});
