cm.define('Com.Gallery', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onSet',
        'onRequest',
        'onChange',
        'onItemLoad',
        'onItemSet'
    ],
    'params' : {
        'container' : cm.node('div'),
        'node' : cm.node('div'),
        'data' : [],
        'duration' : 500,
        'showCaption' : true,
        'showArrowTitles' : false,
        'autoplay' : true,
        'navigation': {
            'count': 0,
            'request': false,
            'cycle': true,
        },
        'types' : {
            'image' : 'jpg|png|gif|jpeg|bmp|tga|svg|webp|tiff'
        },
        'icons' : {
            'prev' : 'icon default prev',
            'next' : 'icon default next',
            'zoom' : 'icon cm-i default zoom'
        },

        'itemConstructor' : 'Com.GalleryItem',
        'itemParams' : {},

        'zoom' : true,
        'zoomConstructor' : 'Com.Zoom',
        'zoomParams' : {
            'autoOpen' : false,
            'removeOnClose' : true,
            'documentScroll' : true
        }
    }
},
function(params){
    var that = this,
        anim = {};

    that.components = {};

    that.currentItem = null;
    that.previousItem = null;
    that.temporaryItem = null;
    that.isProcess = false;
    that.items = [];

    that.nodes = {
        'items' : []
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node'], that.params['nodesDataMarker'], false);
        that.getDataConfig(that.params['node']);
        validateParams();
        that.triggerEvent('onRenderStart');
        render();
        // Collect items
        cm.forEach(that.nodes['items'], that.collectItem);
        // Process config items
        cm.forEach(that.params['data'], processItem);
        afterRender();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(that.params.navigation.request){
            that.params.navigation.cycle = false;
        }
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__gallery'},
            that.nodes['holder'] = cm.node('div', {'class' : 'holder'}),
            that.nodes['bar'] = cm.node('div', {'class' : 'com__gallery-controls is-full'},
                cm.node('div', {'class' : 'inner'},
                    that.nodes['prev'] = cm.node('div', {'class' : 'bar-arrow prev'},
                        cm.node('div', {'class' : that.params['icons']['prev']})
                    ),
                    that.nodes['next'] = cm.node('div', {'class' : 'bar-arrow next'},
                        cm.node('div', {'class' : that.params['icons']['next']})
                    ),
                    that.nodes['zoom'] = cm.node('div', {'class' : 'bar-zoom'},
                        cm.node('div', {'class' : that.params['icons']['zoom']})
                    )
                )
            ),
            that.nodes['loader'] = cm.node('div', {'class' : 'loader'},
                cm.node('div', {'class' : 'bg'}),
                cm.node('div', {'class' : 'icon small loader centered'})
            )
        );
        // Arrow titles
        if(that.params['showArrowTitles']){
            that.nodes['next'].setAttribute('title', that.lang('Next'));
            that.nodes['prev'].setAttribute('title', that.lang('Previous'));
        }
        // Zoom
        if(that.params['zoom']){
            cm.getConstructor(that.params.zoomConstructor, function(classConstructor){
                that.components['zoom'] = new classConstructor(that.params.zoomParams);
                cm.addEvent(that.nodes['zoom'], 'click', zoom);
            });
        }else{
            cm.remove(that.nodes['zoom']);
        }
        // Set events
        cm.click.add(that.nodes['next'], next);
        cm.click.add(that.nodes['prev'], prev);
        // Init animation
        anim['loader'] = new cm.Animation(that.nodes['loader']);
        // Embed
        that.params['container'].appendChild(that.nodes['container']);
    };

    var afterRender = function(){
        if(that.getCount() > 1){
            that.nodes['next'].style.display = '';
            that.nodes['prev'].style.display = '';
        }else{
            that.nodes['next'].style.display = 'none';
            that.nodes['prev'].style.display = 'none';
        }
    };

    var processItem = function(params){
        params = cm.merge(that.params.itemParams, params);

        cm.getConstructor(that.params.itemConstructor, function(classConstructor){
            var item = new classConstructor(
                cm.merge(params, {
                    index: that.items.length,
                    types: that.params.types,
                    showCaption: that.params.showCaption,
                    events: {
                        onClick: function(item){
                            set(item.getParams('index'));
                        },
                        onLoad: function(item){
                            setItem(item);
                        },
                        onError: function(item){
                            setItem(item);
                        }
                    },
                })
            );
            that.items.push(item);
        });
    };

    var set = function(i){
        if (!that.isProcess) {
            that.isProcess = true;

            // Set temporary item
            var previous = that.currentItem;
            var current = that.items[i];
            that.temporaryItem = current;

            // API onSet
            that.triggerEvent('onSet', {
                'current' : current.getParams(),
                'previous' : previous ? previous.getParams() : null
            });

            if (current !== previous) {
                // API onSet
                that.triggerEvent('onChange', {
                    'current' : current.getParams(),
                    'previous' : previous ? previous.getParams() : null
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
        }
    };

    var setArrows = function(){
        var index = that.currentItem.getParams('index');

        if(!that.params.navigation.cycle && that.getCount() > 1){
            that.nodes['prev'].style.display = index === 0 ? 'none' : '';
            that.nodes['next'].style.display = index === that.getCount() - 1 ? 'none' : '';
        }
    };

    var setItemImage = function(item){
        cm.replaceClass(that.nodes.bar, 'is-partial', 'is-full');
        if(item.isLoaded()){
            setItem(item);
        }else{
            setLoader(item);
        }
    };

    var setItemIframe = function(item){
        cm.replaceClass(that.nodes.bar, 'is-full', 'is-partial');
        item.appendTo(that.nodes.holder);
        setLoader(item);
    };

    var setLoader = function(item){
        that.nodes.loader.style.display = 'block';
        anim.loader.go({style: {opacity: 1}, anim: 'smooth', duration: that.params.duration});
        if (item) {
            item.load();
        }
    };

    var removeLoader = function(item){
        anim.loader.go({style: {opacity: 0}, anim: 'smooth', duration: that.params.duration, onStop: function(){
            that.nodes.loader.style.display = 'none';
        }});
        if (item) {
            item.abort();
        }
    };

    var setItem = function(item){
        that.temporaryItem = null;
        that.previousItem = that.currentItem;
        that.currentItem = item;

        that.triggerEvent('onItemLoad', that.currentItem.getParams());

        // Embed item content
        if(that.previousItem){
            that.previousItem.setZIndex(1);
            that.currentItem.setZIndex(2);
        }
        if(that.currentItem.getParams('type') === 'image'){
            that.currentItem.appendTo(that.nodes.holder);
        }

        // Toggle arrows visibility
        setArrows();

        // Remove loader
        removeLoader();

        // Animate item
        that.currentItem
            .getAnimation()
            .go({style: {opacity: 1}, anim: 'smooth', duration: that.params.duration, onStop: function(){
                if(!that.isProcess){
                    return;
                }
                // Remove old item
                if(that.previousItem){
                    that.previousItem.setOpacity(0);
                    that.previousItem.remove();
                }

                that.triggerEvent('onItemSet', that.currentItem.getParams());
                that.isProcess = false;
            }});
    };

    var next = function(){
        var index = that.currentItem.getParams('index');

        if (
            that.params.navigation.request &&
            index === that.items.length - 1 && that.params.navigation.count > that.items.length
        ) {
            setLoader();
            that.triggerEvent('onRequest', {callback: that.next.bind(that)});
        } else if (that.params.navigation.cycle) {
            set(index === that.items.length - 1 ? 0 : index + 1);
        } else if (index < that.items.length - 1) {
            set(index + 1);
        }
    };

    var prev = function(){
        var index = that.currentItem.getParams('index');

        if (that.params.navigation.cycle) {
            set(index === 0 ? that.items.length - 1 : index - 1);
        } else if (index > 0) {
            set(index - 1);
        }
    };

    var zoom = function(){
        that.components['zoom']
            .set(that.currentItem.getParams('src'))
            .open();
    };

    /* ******* MAIN ******* */

    that.set = function(i){
        if(cm.isNumber(i) && that.items[i]){
            set(i);
        }
        return that;
    };

    that.next = function(){
        next();
        return that;
    };

    that.prev = function(){
        prev();
        return that;
    };

    that.getCount = function(){
        return Math.max(that.items.length, that.params.navigation.count);
    };

    that.stop = function(){
        that.isProcess = false;
        if(that.temporaryItem){
            that.temporaryItem.destruct();
            that.temporaryItem.remove();
        }
        removeLoader(that.temporaryItem);
        return that;
    };

    that.clear = function(){
        that.stop();
        if(that.currentItem){
            that.currentItem.destruct();
            that.currentItem.remove();
        }
        that.currentItem = null;
        that.previousItem = null;
        that.temporaryItem = null;
        that.items = [];
        return that;
    };

    that.add = function(item){
        item = cm.merge({
            'link' : cm.node('a'),
            'src' : '',
            'title' : '',
            'data' : {},
        }, item);
        processItem(item);
        return that;
    };

    that.collect = function(node){
        var nodes;
        if(cm.isNode(node)){
            nodes = cm.getNodes(node);
            // Collect items
            if(!cm.isEmpty(nodes['items'])){
                cm.forEach(nodes['items'], that.collectItem);
                afterRender();
            }
        }
        return that;
    };

    that.collectItem = function(item){
        if(!item['link']){
            item['link'] = cm.node('a');
        }
        item = cm.merge({
            'src' : item['link'].getAttribute('href') || '',
            'title' : item['link'].getAttribute('title') || ''
        }, item);
        if(item['container']){
            item = cm.merge(that.getNodeDataConfig(item['container']), item);
        }
        processItem(item);
        return that;
    };

    init();
});
