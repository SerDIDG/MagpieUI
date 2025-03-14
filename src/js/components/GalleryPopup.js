cm.define('Com.GalleryPopup', {
    extend: 'Com.AbstractController',
    events: [
        'onOpen',
        'onOpenEnd',
        'onClose',
        'onChange',
        'onPrev',
        'onNext',
        'onLoad',
    ],
    params: {
        controllerEvents: true,
        renderStructure: true,
        embedStructure: 'append',
        embedStructureOnRender: false,
        removeOnDestruct: false,

        size: 'fullscreen',                   // fullscreen | auto
        aspectRatio: 'auto',                  // auto | 1x1 | 4x3 | 3x2 | 16x10 | 16x9 | 2x1 | 21x9 | 35x10 | 3x4 | 2x3 | 10x16 | 9x16 | 1x2
        theme: 'theme-black',

        data: [],
        active: null,
        showCounter: true,
        showTitle: true,
        showZoom: true,
        autoPlay: false,
        navigation: {},
        openOnSelfClick: false,

        placeholderConstructor: 'Com.Dialog',
        placeholderParams: {
            width: 700,
            scroll: false,
            autoOpen: false,
            titleOverflow: true,
            closeOnBackground: true,
            className: 'com__gallery-popup'
        },

        galleryConstructor: 'Com.Gallery',
        galleryParams: {
            showCaption: false
        },

        overlayParams: {},
        galleryItemParams: {},
    }
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.GalleryPopup', function(classConstructor, className, classProto, classInherit){
    classProto.onConstructStart = function(){
        var that = this;

        // Variables
        that.views = {};
        that.currentItem = null;

        // Bind context
        that.openHandler = that.open.bind(that);
        that.closeHandler = that.close.bind(that);
        that.nextHandler = that.next.bind(that);
        that.prevHandler = that.prev.bind(that);
        that.keyPressEventHandler = that.keyPressEvent.bind(that);
    };

    classProto.onConstructEnd = function(){
        var that = this;
        that.addToStack(that.params.node);
    };

    classProto.onValidateParams = function(){
        var that = this;
        that.params.galleryParams.zoom = that.params.showZoom;
        that.params.galleryParams.autoplay = that.params.autoPlay;
        that.params.galleryParams.navigation = that.params.navigation;
        that.params.galleryParams.overlayParams = that.params.overlayParams;
        that.params.galleryParams.itemParams = that.params.galleryItemParams;
        that.params.placeholderParams.theme = that.params.theme;
        that.params.placeholderParams.size = that.params.size;
    };

    classProto.onDestruct = function(){
        var that = this;
        that.components.dialog && cm.isFunction(that.components.dialog.destruct) && that.components.dialog.destruct();
        that.components.gallery && cm.isFunction(that.components.gallery.destruct) && that.components.gallery.destruct();
    };

    classProto.renderView = function(){
        var that = this;

        // Structure
        that.nodes.container = cm.node('div', {classes: 'com__gallery-preview'},
            that.nodes.inner = cm.node('div', {classes: 'inner'})
        );

        // Set aspect ratio
        if (that.params.aspectRatio !== 'auto') {
            cm.addClass(that.nodes.container, ['cm__aspect', that.params.aspectRatio].join('-'));
        }
    };

    classProto.renderViewModel = function(){
        var that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Dialog
        cm.getConstructor(that.params.placeholderConstructor, function(classConstructor){
            that.components.dialog = new classConstructor(
                cm.merge(that.params.placeholderParams, {
                    content: that.nodes.container,
                    events: {
                        onOpen: function(){
                            cm.addEvent(window, 'keydown', that.keyPressEventHandler);
                            that.triggerEvent('onOpen');
                        },
                        onClose: function(){
                            that.components.gallery.stop();
                            cm.removeEvent(window, 'keydown', that.keyPressEventHandler);
                            that.triggerEvent('onClose');
                        }
                    }
                })
            );
        });

        // Gallery
        cm.getConstructor(that.params.galleryConstructor, function(classConstructor) {
            that.components.gallery = new classConstructor(
                cm.merge(that.params.galleryParams, {
                    node: that.params.node,
                    container: that.nodes.inner,
                    data: that.params.data,
                    active: that.params.active,
                    events: {
                        onChange: function(gallery, data) {
                            that.changeEvent(data.current, data.previous);
                        },
                        onSet: function() {
                            that.components.dialog.open();
                        },
                        onPrev: function(gallery, data) {
                            that.triggerEvent('onPrev', data);
                        },
                        onNext: function(gallery, data) {
                            that.triggerEvent('onNext', data);
                        },
                        onItemLoad: function(gallery, data) {
                            that.loadEvent(data);
                        },
                    }
                })
            );
        });

        if (that.params.openOnSelfClick) {
            cm.click.add(that.params.node, that.openHandler);
        }
    };

    /******* EVENTS *******/

    classProto.changeEvent = function(galleryItem){
        var that = this;
        that.currentItem = galleryItem;
        that.views.info = that.renderInfoView(that.currentItem);
        that.triggerEvent('onChange', that.currentItem);
    };

    classProto.loadEvent = function(galleryItem) {
        var that = this;
        that.triggerEvent('onLoad', galleryItem);
    };

    classProto.keyPressEvent = function(event){
        var that = this;
        cm.handleKey(event, 'ArrowLeft', function(){
            that.components.dialog.isFocus && that.prev();
        });
        cm.handleKey(event, 'ArrowRight', function(){
            that.components.dialog.isFocus && that.next();
        });
    };

    /******* INFO VIEW *******/

    classProto.renderInfoView = function(galleryItem) {
        var that = this;
        var item = {
            data: galleryItem,
            nodes: {},
        };

        // Structure
        item.nodes.container = cm.node('div', {classes: 'com__gallery-popup__title'});

        if(that.params.showCounter){
            item.counter = [(item.data.index + 1), that.components.gallery.getCount()].join('/');
            item.nodes.counter = cm.node('span', {classes: 'counter'}, item.counter);
            cm.appendChild(item.nodes.counter, item.nodes.container);
        }

        if(that.params.showTitle){
            item.nodes.title = cm.node('span', {classes: 'title'}, item.data.title);
            if(that.params.showCounter){
                item.nodes.sepaartor = cm.node('span', {classes: 'separator'});
                cm.appendChild(item.nodes.sepaartor, item.nodes.container);
            }
            cm.appendChild(item.nodes.title, item.nodes.container);
        }

        // Append
        if(that.params.showCounter || that.params.showTitle){
            that.components.dialog.setTitle(item.nodes.container);
        }

        return item;
    };

    /******* PUBLIC *******/

    classProto.open = function(){
        var that = this;
        that.set(that.params.active || 0);
        return that;
    };

    classProto.close = function(){
        var that = this;
        that.components.dialog.close();
        return that;
    };

    classProto.set = function(i){
        var that = this;
        that.components.gallery.set(i);
        return that;
    };

    classProto.next = function(){
        var that = this;
        that.components.gallery.next();
        return that;
    };

    classProto.prev = function(){
        var that = this;
        that.components.gallery.prev();
        return that;
    };

    classProto.add = function(item){
        var that = this;
        that.components.gallery.add(item);
        return that;
    };

    classProto.getIndex = function() {
        const that = this;
        return that.components.gallery.getIndex();
    };

    classProto.getLength = function() {
        const that = this;
        return that.components.gallery.getLength();
    };

    classProto.setCount = function(count) {
        const that = this;
        that.components.gallery.setCount(count);
        return that;
    };

    classProto.getCount = function() {
        const that = this;
        return that.components.gallery.getCount();
    };

    classProto.toggleLoader = function(value) {
        var that = this;
        that.components.gallery.toggleLoader(value);
        return that;
    };

    classProto.collect = function(node, params){
        var that = this;
        that.components.gallery.collect(node, params);
        return that;
    };

    classProto.collectItem = function(item){
        var that = this;
        that.components.gallery.collectItem(item);
        return that;
    };

    classProto.clear = function(){
        var that = this;
        that.components.gallery.clear();
        return that;
    };

    classProto.getGallery = function() {
        var that = this;
        return that.components.gallery;
    };

});
