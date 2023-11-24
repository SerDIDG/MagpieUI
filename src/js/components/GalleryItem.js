cm.define('Com.GalleryItem', {
    extend: 'Com.AbstractController',
    events: [
        'onClick',
        'onLoad',
        'onError',
        'onAbort'
    ],
    params: {
        renderStructure: true,
        embedStructureOnRender: false,
        controllerEvents: true,
        removeOnDestruct: false,

        index: null,
        type: null,        // image | iframe
        src: null,
        srcset: [],
        sizes: [],
        title: null,
        info: null,
        mime: null,
        link: null,

        types: {
            image: null,
        },
        showCaption: false,
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.GalleryItem', function(classConstructor, className, classProto, classInherit) {
    classProto.onConstructStart = function() {
        var that = this;
        that.hasLoaded = false;
        that.hasProcess = false;

        // Binds
        that.loadSuccessEventHanlder = that.loadSuccessEvent.bind(that);
        that.loadErrorEventHanlder = that.loadErrorEvent.bind(that);
    };

    classProto.onValidateParams = function() {
        var that = this;

        // Srcsets
        if (!cm.isEmpty(that.params.sizes)) {
            that.params.size = that.params.sizes
                .map(item => item.join(' '))
                .join(', ');
        }

        if (!cm.isEmpty(that.params.srcset)) {
            that.params.srcset = that.params.srcset
                .map(item => item.join(' '))
                .join(', ');
        }

        // Get url
        try{
            that.params.url = new URL(that.params.src);
        }catch(e){
        }

        // Check type
        that.typeRegexp = new RegExp('\\.(' + that.params.types.image + ')$', 'gi');
        if(
            (that.params.src && that.typeRegexp.test(that.params.src)) ||
            (that.params.url && that.typeRegexp.test(that.params.url.pathname)) ||
            (that.params.src && /^data:image/gi.test(that.params.src)) ||
            (that.params.mime && /^image/gi.test(that.params.mime)) ||
            that.params.type === 'image'
        ){
            that.params.type = 'image';
        }else{
            that.params.type = 'iframe';
        }
    };

    classProto.renderView = function() {
        var that = this;

        // Link node
        if (cm.isNode(that.params.link)) {
            that.nodes.link = that.params.link;
        } else {
            that.nodes.link = cm.node('a');
        }

        // Structure
        that.nodes.container = cm.node('div', {'classes': ['pt__image', 'is-centered']},
            that.nodes.inner = cm.node('div', {'classes': 'inner'})
        );

        // Render by type
        if (that.params.type === 'image') {
            that.nodes.content = cm.node('img', {'classes': 'descr', 'alt': that.params.title, 'title': that.params.title});
        } else {
            that.nodes.content = cm.node('iframe', {'classes': 'descr', 'allowfullscreen': true});
        }
        cm.appendChild(that.nodes.content, that.nodes.inner);

        // Caption
        if (that.params.showCaption && that.params.type === 'image' && !cm.isEmpty(that.params.title)) {
            that.nodes.caption = cm.node('div', {'classes': 'title'},
                cm.node('div', {'classes': 'inner'}, that.params.title)
            );
            cm.appendChild(that.nodes.caption, that.nodes.inner);
        }
    };

    classProto.renderViewModel = function(){
        var that = this;
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Set image on thumb click
        cm.addEvent(that.nodes.link, 'click', that.linkClickEvent.bind(that), true, true);

        // Init animation
        that.components.animation = new cm.Animation(that.nodes.container);
    };

    /******* EVENTS *******/

    classProto.linkClickEvent = function(e) {
        var that = this;
        cm.preventDefault(e);
        that.triggerEvent('onClick');
    };

    classProto.loadSuccessEvent = function() {
        var that = this;
        if (!that.hasProcess) {
            return that;
        }

        that.hasProcess = false;
        that.hasLoaded = true;
        that.triggerEvent('onLoad');
    };

    classProto.loadErrorEvent = function() {
        var that = this;
        if (!that.hasProcess) {
            return that;
        }

        that.hasProcess = false;
        that.hasLoaded = false;
        that.triggerEvent('onError');
    };

    /******* PUBLIC *******/

    classProto.load = function() {
        var that = this;
        if (that.hasProcess) {
            return that;
        }

        that.hasProcess = true;
        if (that.hasLoaded && that.params.types === 'image') {
            that.loadSuccessEvent();
        } else {
            cm.addEvent(that.nodes.content, 'load', that.loadSuccessEventHanlder);
            cm.addEvent(that.nodes.content, 'error', that.loadErrorEventHanlder);
            if (!cm.isEmpty(that.params.sizes)) {
                that.nodes.content.sizes = that.params.sizes;
            }
            if (!cm.isEmpty(that.params.srcset)) {
                that.nodes.content.srcset = that.params.srcset;
            }
            that.nodes.content.src = that.params.src;
        }
        return that;
    };

    classProto.abort = function() {
        var that = this;
        if (!that.hasProcess) {
            return that;
        }

        that.hasProcess = false;
        cm.removeEvent(that.nodes.content, 'load', that.loadSuccessEventHanlder);
        cm.removeEvent(that.nodes.content, 'error', that.loadErrorEventHanlder);
        that.triggerEvent('onAbort');
        return that;
    };

    classProto.remove = function() {
        var that = this;
        cm.remove(that.nodes.container);
        return that;
    };

    classProto.appendTo = function(container, insertMethod) {
        var that = this;
        insertMethod = !cm.isUndefined(insertMethod) ? insertMethod : 'insertLast';
        if (cm.isNode(container)) {
            cm[insertMethod](that.nodes.container, container);
        }
        return that;
    };

    classProto.isLoaded = function() {
        var that = this;
        return that.hasLoaded;
    };

    classProto.getContainer = function() {
        var that = this;
        return that.nodes.container;
    };

    classProto.getAnimation = function() {
        var that = this;
        return that.components.animation
    };

    classProto.setZIndex = function(value) {
        var that = this;
        that.nodes.container.style.zIndex = value;
        return that;
    };

    classProto.setOpacity = function(value) {
        var that = this;
        that.nodes.container.style.opacity = value;
        return that;
    };
});
