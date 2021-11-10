cm.define('Com.GalleryPopup', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onOpen',
        'onOpenEnd',
        'onClose',
        'onChange'
    ],
    'params' : {
        'controllerEvents' : true,
        'renderStructure' : true,
        'embedStructure' : 'append',
        'embedStructureOnRender' : false,
        'removeOnDestruct' : false,
        'size' : 'fullscreen',                   // fullscreen | auto
        'aspectRatio' : 'auto',                  // auto | 1x1 | 4x3 | 3x2 | 16x10 | 16x9 | 2x1 | 21x9 | 35x10 | 3x4 | 2x3 | 10x16 | 9x16 | 1x2
        'theme' : 'theme-black',
        'showCounter' : true,
        'showTitle' : true,
        'showInfo' : false,
        'showZoom' : true,
        'autoPlay' : false,
        'openOnSelfClick' : false,
        'data' : [],

        'placeholderConstructor' : 'Com.Dialog',
        'placeholderParams' : {
            'width' : '700',
            'scroll' : false,
            'autoOpen' : false,
            'titleOverflow' : true,
            'closeOnBackground' : true,
            'className' : 'com__gallery-popup'
        },

        'galleryConstructor' : 'Com.Gallery',
        'galleryParams' : {
            'showCaption' : false
        }
    }
},
function(){
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.GalleryPopup', function(classConstructor, className, classProto, classInherit){
    classProto.onConstructStart = function(){
        var that = this;
        // Bind context
        that.openHandler = that.open.bind(that);
        that.closeHandler = that.close.bind(that);
        that.nextHandler = that.next.bind(that);
        that.prevHandler = that.prev.bind(that);
        that.keyPressEventHandler = that.keyPressEvent.bind(that);
        that.changeEventHandler = that.changeEvent.bind(that);
    };

    classProto.onConstructEnd = function(){
        var that = this;
        that.addToStack(that.params['node']);
    };

    classProto.onValidateParams = function(){
        var that = this;
        that.params['galleryParams']['zoom'] = that.params['showZoom'];
        that.params['galleryParams']['autoplay'] = that.params['autoPlay'];
        that.params['placeholderParams']['theme'] = that.params['theme'];
        that.params['placeholderParams']['size'] = that.params['size'];
        if(that.params['size'] === 'fullscreen'){
            that.params['placeholderParams']['documentScroll'] = false;
        }
    };

    classProto.onDestruct = function(){
        var that = this;
        that.components['dialog'] && cm.isFunction(that.components['dialog'].destruct) && that.components['dialog'].destruct();
        that.components['gallery'] && cm.isFunction(that.components['gallery'].destruct) && that.components['gallery'].destruct();
    };

    classProto.renderView = function(){
        var that = this;
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__gallery-preview'},
            that.nodes['galleryContainer'] = cm.node('div', {'class' : 'inner'})
        );
        // Set aspect ration
        if(that.params['aspectRatio'] !== 'auto'){
            cm.addClass(that.nodes['container'], ['cm__aspect', that.params['aspectRatio']].join('-'));
        }
    };

    classProto.renderViewModel = function(){
        var that = this;
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Dialog
        cm.getConstructor(that.params.placeholderConstructor, function(classConstructor){
            that.components['dialog'] = new classConstructor(
                cm.merge(that.params.placeholderParams, {
                    'content' : that.nodes.container,
                    'events' : {
                        'onOpen' : function(){
                            cm.addEvent(window, 'keydown', that.keyPressEventHandler);
                            that.triggerEvent('onOpen');
                        },
                        'onClose' : function(){
                            that.components.gallery.stop();
                            cm.removeEvent(window, 'keydown', that.keyPressEventHandler);
                            that.triggerEvent('onClose');
                        }
                    }
                })
            );
        });

        // Gallery
        cm.getConstructor(that.params.galleryConstructor, function(classConstructor){
            that.components.gallery = new classConstructor(
                cm.merge(that.params.galleryParams, {
                    'node' : that.params.node,
                    'container' : that.nodes.galleryContainer,
                    'data' : that.params.data,
                    'events' : {
                        'onChange' : that.changeEventHandler,
                        'onSet' : that.components.dialog.open.bind(that.components.dialog)
                    }
                })
            );
        });

        if(that.params.openOnSelfClick){
            cm.addEvent(that.params.node, 'click', that.openHandler);
        }
    };

    classProto.changeEvent = function(gallery, data){
        var that = this,
            item = {
                data: data.current,
                nodes: {}
            };

        // Structure
        item.nodes.container = cm.node('div', {classes: 'com__gallery-popup__title'},
            item.nodes.top = cm.node('div', {classes: 'com__gallery-popup__title-line'}),
            item.nodes.bottom = cm.node('div', {classes: 'com__gallery-popup__title-line'})
        );

        if(that.params.showCounter){
            item.counter = [(item.data.index + 1), that.components.gallery.getCount()].join('/');
            item.nodes.counter = cm.node('span', {classes: 'counter'}, item.counter);
            cm.appendChild(item.nodes.counter, item.nodes.top);
        }

        if(that.params.showTitle){
            item.nodes.title = cm.node('span', {classes: 'title'}, item.data.title);

            if(that.params.showCounter){
                item.nodes.sepaartor = cm.node('span', {classes: 'separator'});
                cm.appendChild(item.nodes.sepaartor, item.nodes.top);
            }

            cm.appendChild(item.nodes.title, item.nodes.top);
        }

        if(that.params.showInfo && !cm.isEmpty(item.data.info)){
            item.nodes.info = cm.node('div', {classes: 'info'}, item.data.info);
            cm.appendChild(item.nodes.info, item.nodes.bottom);
        }

        if(that.params.showCounter || that.params.showTitle || that.params.showInfo){
            that.components.dialog.setTitle(item.nodes.container);
        }

        that.triggerEvent('onChange', item);
    };

    classProto.keyPressEvent = function(e){
        var that = this;
        cm.handleKey(e, 'left', function(){
            that.components['dialog'].isFocus && that.prev();
        });
        cm.handleKey(e, 'right', function(){
            that.components['dialog'].isFocus && that.next();
        });
    };

    /******* PUBLIC *******/

    classProto.open = function(){
        var that = this;
        that.set(0);
        return that;
    };

    classProto.close = function(){
        var that = this;
        that.components['dialog'].close();
        return that;
    };

    classProto.set = function(i){
        var that = this;
        that.components['gallery'].set(i);
        return that;
    };

    classProto.next = function(){
        var that = this;
        that.components['gallery'].next();
        return that;
    };

    classProto.prev = function(){
        var that = this;
        that.components['gallery'].prev();
        return that;
    };

    classProto.add = function(item){
        var that = this;
        that.components['gallery'].add(item);
        return that;
    };

    classProto.collect = function(node){
        var that = this;
        that.components['gallery'].collect(node);
        return that;
    };

    classProto.collectItem = function(node){
        var that = this;
        that.components['gallery'].collectItem(node);
        return that;
    };

    classProto.clear = function(){
        var that = this;
        that.components['gallery'].clear();
        return that;
    };
});
