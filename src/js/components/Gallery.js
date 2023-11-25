cm.define('Com.Gallery', {
    'modules': [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes'
    ],
    'events': [
        'onRenderStart',
        'onRender',
        'onSet',
        'onChange',
        'onPrev',
        'onNext',
        'onItemLoad',
        'onItemSet'
    ],
    'params': {
        'container': cm.node('div'),
        'node': cm.node('div'),
        'data': [],
        'active': null,
        'duration': 500,
        'showCaption': true,
        'autoplay': true,
        'navigation': {
            'enable': true,
            'count': 0,
            'cycle': true,
            'showTitles': false,
        },
        'types': {
            'image': 'jpg|png|gif|jpeg|bmp|tga|svg|webp|tiff'
        },
        'icons': {
            'prev': 'icon default prev',
            'next': 'icon default next',
            'zoom': 'icon cm-i default zoom'
        },

        'itemConstructor': 'Com.GalleryItem',
        'itemParams': {},

        'zoom': true,
        'zoomConstructor': 'Com.Zoom',
        'zoomParams': {
            'autoOpen': false,
            'removeOnClose': true,
            'documentScroll': true
        },

        'overlay': true,
        'overlayConstructor': 'Com.Overlay',
        'overlayParams': {
            'theme': 'gallery',
            'position': 'absolute',
            'showSpinner': true,
            'showContent': true,
            'autoOpen': false,
            'removeOnClose': true,
            'lazy': true
        },
    },
    'strings': {
        'next': 'Next',
        'prev': 'Previous',
        'zoom': 'Zoom',
    },
},
function(params){
    var that = this;

    that.components = {};

    that.currentItem = null;
    that.previousItem = null;
    that.temporaryItem = null;
    that.isProcess = false;
    that.items = [];

    that.nodes = {
        items: []
    };

    var init = function() {
        that.setParams(params);
        that.convertEvents(that.params.events);
        that.getDataNodes(that.params.node, that.params.nodesDataMarker, false);
        that.getDataConfig(that.params.node);
        that.triggerEvent('onRenderStart');
        render();
        // Collect items
        cm.forEach(that.nodes.items, that.collectItem);
        // Process config items
        cm.forEach(that.params.data, processItem);
        that.set(that.params.active);
        that.triggerEvent('onRender');
    };

    var render = function() {
        // Structure
        that.nodes.container = cm.node('div', {classes: 'com__gallery'},
            that.nodes.holder = cm.node('div', {classes: 'holder'}),
            that.nodes.bar = cm.node('div', {classes: ['com__gallery-controls', 'is-full']},
                cm.node('div', {classes: 'inner'},
                    that.nodes.prev = cm.node('div', {classes: ['bar-arrow', 'prev', 'is-hidden'], role: 'button', tabindex: 0, 'aria-label': that.msg('prev'), 'aria-hidden': 'true'},
                        cm.node('div', {classes: that.params.icons.prev})
                    ),
                    that.nodes.next = cm.node('div', {classes: ['bar-arrow', 'next', 'is-hidden'], role: 'button', tabindex: 0, 'aria-label': that.msg('next'), 'aria-hidden': 'true'},
                        cm.node('div', {classes: that.params.icons.next})
                    ),
                    that.nodes.zoom = cm.node('div', {classes: ['bar-zoom', 'is-hidden'], role: 'button', tabindex: 0, 'aria-label': that.msg('zoom'), 'aria-hidden': 'true'},
                        cm.node('div', {classes: that.params.icons.zoom})
                    )
                )
            )
        );

        // Arrow titles
        if (that.params.navigation.showTitles) {
            that.nodes.prev.title = that.msg('prev');
            that.nodes.next.title = that.msg('next');
            that.nodes.zoom.title = that.msg('zoom');
        }

        // Arrow click events
        cm.click.add(that.nodes.prev, that.prev);
        cm.click.add(that.nodes.next, that.next);

        // Zoom
        if (that.params.zoom) {
            cm.getConstructor(that.params.zoomConstructor, function(classConstructor) {
                that.components.zoom = new classConstructor(that.params.zoomParams);
                cm.click.add(that.nodes.zoom, zoom);
                cm.removeClass(that.nodes.zoom, 'is-hidden');
                that.nodes.zoom.setAttribute('aria-hidden', 'false');
            });
        }

        // Overlay
        if (that.params.overlay) {
            cm.getConstructor(that.params.overlayConstructor, function(classConstructor) {
                that.components.overlay = new classConstructor(
                    cm.merge(that.params.overlayParams, {
                        container: that.nodes.container,
                    })
                );
            });
        }

        // Append
        that.params.container.appendChild(that.nodes.container);
    };

    var processItem = function(params) {
        params = cm.merge(that.params.itemParams, params);
        params.index = cm.isNumber(params.index) ? params.index : that.items.length;

        cm.getConstructor(that.params.itemConstructor, function(classConstructor) {
            that.items[params.index] = new classConstructor(
                cm.merge(params, {
                    types: that.params.types,
                    showCaption: that.params.showCaption,
                    events: {
                        onClick: function(item) {
                            set(item.getParams('index'));
                        },
                        onLoad: function(item) {
                            setItem(item);
                        },
                        onError: function(item) {
                            setItem(item);
                        }
                    },
                })
            );
        });
    };

    var set = function(i) {
        if (that.isProcess) {
            return;
        }
        that.isProcess = true;

        // Set temporary item
        var previous = that.currentItem;
        var current = that.items[i];
        that.temporaryItem = current;

        // API onSet
        that.triggerEvent('onSet', {
            current: current.getParams(),
            previous: previous ? previous.getParams() : null
        });

        if (current !== previous) {
            // API onSet
            that.triggerEvent('onChange', {
                current: current.getParams(),
                previous: previous ? previous.getParams() : null
            });
            // Set by type
            if (current.getParams('type') === 'image') {
                setItemImage(current);
            } else {
                setItemIframe(current);
            }
        } else {
            that.isProcess = false;
            current.appendTo(that.nodes.holder);
        }
    };

    var setItemImage = function(item) {
        cm.replaceClass(that.nodes.bar, 'is-partial', 'is-full');
        if (item.isLoaded()) {
            setItem(item);
        } else {
            that.setLoader(item);
        }
    };

    var setItemIframe = function(item) {
        cm.replaceClass(that.nodes.bar, 'is-full', 'is-partial');
        item.appendTo(that.nodes.holder);
        that.setLoader(item);
    };

    var setItem = function(item) {
        that.temporaryItem = null;
        that.previousItem = that.currentItem;
        that.currentItem = item;

        that.triggerEvent('onItemLoad', that.currentItem.getParams());

        // Embed item content
        if (that.previousItem) {
            that.previousItem.setZIndex(1);
            that.currentItem.setZIndex(2);
        }
        if (that.currentItem.getParams('type') === 'image') {
            that.currentItem.appendTo(that.nodes.holder);
        }

        // Toggle arrows visibility
        that.setArrows();

        // Remove loader
        that.removeLoader();

        // Animate item
        that.currentItem
            .getAnimation()
            .go({
                style: {opacity: 1}, anim: 'smooth', duration: that.params.duration, onStop: function() {
                    if (!that.isProcess) {
                        return;
                    }
                    
                    // Remove old item
                    if (that.previousItem) {
                        that.previousItem.setOpacity(0);
                        that.previousItem.remove();
                    }

                    that.triggerEvent('onItemSet', that.currentItem.getParams());
                    that.isProcess = false;
                }
            });
    };

    var zoom = function() {
        that.components.zoom
            .set(that.currentItem.getParams('src'))
            .open();
    };

    /* ******* MAIN ******* */

    that.set = function(i) {
        if (cm.isNumber(i) && that.items[i]) {
            set(i);
        }
        return that;
    };

    that.next = function() {
        if (that.isProcess) {
            return that;
        }

        // API - onNext
        var index = that.currentItem.getParams('index');
        that.triggerEvent('onNext', {
            current: that.currentItem.getParams(),
            index: index,
        });

        if (!that.params.navigation.enable) {
            return that;
        }

        if (that.params.navigation.cycle) {
            set(index === that.items.length - 1 ? 0 : index + 1);
        } else if (index < that.items.length - 1) {
            set(index + 1);
        }
        return that;
    };

    that.prev = function() {
        if (that.isProcess) {
            return that;
        }

        // API - onPrev
        var index = that.currentItem.getParams('index');
        that.triggerEvent('onPrev', {
            current: that.currentItem.getParams(),
            index: index,
        });

        if (!that.params.navigation.enable) {
            return that;
        }

        if (that.params.navigation.cycle) {
            set(index === 0 ? that.items.length - 1 : index - 1);
        } else if (index > 0) {
            set(index - 1);
        }
        return that;
    };

    that.getIndex = function() {
        return that.currentItem.getParams('index');
    };

    that.getLength = function() {
        return that.items.length;
    };

    that.setCount = function(count) {
        that.params.navigation.count = count;
        that.setArrows();
        return that;
    };

    that.getCount = function() {
        return Math.max(that.getLength(), that.params.navigation.count);
    };

    that.setArrows = function() {
        var index = that.currentItem.getParams('index');
        var count = that.getCount();
        var showPrev = that.params.navigation.cycle || count < 2 ? count > 1 : index > 0;
        var showNext = that.params.navigation.cycle || count < 2 ? count > 1 : index < count - 1;
        cm.toggleClass(that.nodes.prev, 'is-hidden', !showPrev);
        cm.toggleClass(that.nodes.next, 'is-hidden', !showNext);
        that.nodes.prev.setAttribute('aria-hidden', !showPrev);
        that.nodes.next.setAttribute('aria-hidden', !showNext);
        return that;
    };
    
    that.setLoader = function(item) {
        if (that.params.overlay) {
            that.components.overlay.open();
        }
        if (item) {
            item.load();
        }
        return that;
    };

    that.removeLoader = function(item) {
        if (that.params.overlay) {
            that.components.overlay.close();
        }
        if (item) {
            item.abort();
        }
        return that;
    };

    that.toggleLoader = function(value) {
        if (value) {
            that.setLoader();
        } else {
            that.removeLoader();
        }
        return that;
    }

    that.stop = function() {
        that.isProcess = false;
        if (that.temporaryItem) {
            that.temporaryItem.destruct();
            that.temporaryItem.remove();
        }
        that.removeLoader(that.temporaryItem);
        return that;
    };

    that.clear = function() {
        that.stop();
        if (that.currentItem) {
            that.currentItem.destruct();
            that.currentItem.remove();
        }
        that.currentItem = null;
        that.previousItem = null;
        that.temporaryItem = null;
        that.items = [];
        return that;
    };

    that.add = function(item) {
        item = cm.merge({
            index: null,
            page: null,
            link: cm.node('a'),
            src: '',
            title: '',
            data: {},
        }, item);
        processItem(item);
        return that;
    };

    that.collect = function(node, params) {
        if (!cm.isNode(node)) {
            return that;
        }

        // Validate params
        params = cm.merge({
            fromIndex: that.items.length,
            fromPage: 0,
        }, params);

        // Collect items
        var nodes = cm.getNodes(node);
        if (!cm.isEmpty(nodes.items)) {
            cm.forEach(nodes.items, function(item, i) {
                item.index = params.fromIndex + i;
                item.page = params.fromPage;
                that.collectItem(item);
            });
        }
        return that;
    };

    that.collectItem = function(item) {
        // Validate item
        if (cm.isNode(item.container)) {
            item = cm.merge(that.getNodeDataConfig(item.container), item);
        }
        if (cm.isEmpty(item.link)) {
            item.link = cm.node('a');
        }
        if (cm.isEmpty(item.src)) {
            item.src = item.link.getAttribute('href') || '';
        }
        if (cm.isEmpty(item.title)) {
            item.title = item.link.getAttribute('title') || '';
        }

        // Process
        if (!that.hasItemCollected(item)) {
            processItem(item);
        }
        return that;
    };

    that.hasItemCollected = function(item) {
        return that.items.some(function(savedItem) {
            return savedItem.getParams('link') === item.link;
        });
    };

    init();
});
