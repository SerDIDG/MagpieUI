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
        'onChange',
        'onItemLoad',
        'onItemSet'
    ],
    'params' : {
        'container' : cm.Node('div'),
        'node' : cm.Node('div'),
        'data' : [],
        'duration' : 500,
        'showCaption' : true,
        'showArrowTitles' : false,
        'autoplay' : true,
        'zoom' : true,
        'types' : {
            'image' : 'jpg|png|gif|jpeg|bmp|tga|svg|webp|tiff'
        },
        'icons' : {
            'prev' : 'icon default prev',
            'next' : 'icon default next',
            'zoom' : 'icon cm-i default zoom'
        },
        'Com.Zoom' : {
            'autoOpen' : false,
            'removeOnClose' : true,
            'documentScroll' : true
        }
    }
},
function(params){
    var that = this,
        items = [],
        anim = {};

    that.components = {};

    that.current = null;
    that.previous = null;
    that.isProcess = false;

    that.nodes = {
        'items' : []
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node'], that.params['nodesDataMarker'], false);
        that.getDataConfig(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        // Collect items
        cm.forEach(that.nodes['items'], that.collectItem);
        // Process config items
        cm.forEach(that.params['data'], processItem);
        afterRender();
        that.triggerEvent('onRender');
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__gallery'},
            that.nodes['holder'] = cm.Node('div', {'class' : 'holder'}),
            that.nodes['bar'] = cm.Node('div', {'class' : 'com__gallery-controls is-full'},
                cm.Node('div', {'class' : 'inner'},
                    that.nodes['prev'] = cm.Node('div', {'class' : 'bar-arrow prev'},
                        cm.Node('div', {'class' : that.params['icons']['prev']})
                    ),
                    that.nodes['next'] = cm.Node('div', {'class' : 'bar-arrow next'},
                        cm.Node('div', {'class' : that.params['icons']['next']})
                    ),
                    that.nodes['zoom'] = cm.Node('div', {'class' : 'bar-zoom'},
                        cm.Node('div', {'class' : that.params['icons']['zoom']})
                    )
                )
            ),
            that.nodes['loader'] = cm.Node('div', {'class' : 'loader'},
                cm.Node('div', {'class' : 'bg'}),
                cm.Node('div', {'class' : 'icon small loader centered'})
            )
        );
        // Arrow titles
        if(that.params['showArrowTitles']){
            that.nodes['next'].setAttribute('title', that.lang('Next'));
            that.nodes['prev'].setAttribute('title', that.lang('Previous'));
        }
        // Zoom
        if(that.params['zoom']){
            cm.getConstructor('Com.Zoom', function(classConstructor){
                that.components['zoom'] = new classConstructor(that.params['Com.Zoom']);
                cm.addEvent(that.nodes['zoom'], 'click', zoom);
            });
        }else{
            cm.remove(that.nodes['zoom']);
        }
        // Set events
        cm.addEvent(that.nodes['next'], 'click', next);
        cm.addEvent(that.nodes['prev'], 'click', prev);
        // Init animation
        anim['loader'] = new cm.Animation(that.nodes['loader']);
        // Embed
        that.params['container'].appendChild(that.nodes['container']);
    };

    var afterRender = function(){
        if(items.length < 2){
            that.nodes['next'].style.display = 'none';
            that.nodes['prev'].style.display = 'none';
        }else{
            that.nodes['next'].style.display = '';
            that.nodes['prev'].style.display = '';
        }
    };

    var processItem = function(item){
        item = cm.merge({
            'index' : items.length,
            'isLoad' : false,
            'type' : null,        // image | iframe
            'nodes' : {},
            'src' : '',
            'title' : '',
            'mime' : ''
        }, item);
        // Check type
        try{
            item['_url'] = new URL(item['src']);
        }catch(e){
        }
        item['_regexp'] = new RegExp('\\.(' + that.params['types']['image'] + ')$', 'gi');
        if(
            item['_regexp'].test(item['src'])
            || (item['_url'] && item['_regexp'].test(item['_url'].pathname))
            || /^data:image/gi.test(item['src'])
            || /^image/gi.test(item['mime'])
            || item['type'] === 'image'
        ){
            item['type'] = 'image';
        }else{
            item['type'] = 'iframe';
        }
        // Structure
        if(!item['link']){
            item['link'] = cm.node('a');
        }
        item['nodes']['container'] = cm.Node('div', {'class' : 'pt__image is-centered'},
            item['nodes']['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        // Render by type
        if(item['type'] === 'image'){
            item['nodes']['inner'].appendChild(
                item['nodes']['content'] = cm.Node('img', {'class' : 'descr', 'alt' : item['title'], 'title' : item['title']})
            );
        }else{
            item['nodes']['inner'].appendChild(
                item['nodes']['content'] = cm.Node('iframe', {'class' : 'descr', 'allowfullscreen' : true})
            );
        }
        // Caption
        if(that.params['showCaption'] && !cm.isEmpty(item['title'] && item['type'] === 'image')){
            item['nodes']['inner'].appendChild(
                cm.Node('div', {'class' : 'title'},
                    cm.Node('div', {'class' : 'inner'}, item['title'])
                )
            );
        }
        // Init animation
        item['anim'] = new cm.Animation(item['nodes']['container']);
        // Set image on thumb click
        cm.addEvent(item['link'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            set(item['index']);
        }, true, true);
        // Push item to array
        items.push(item);
    };

    var set = function(i){
        var item, itemOld;
        if(!that.isProcess){
            that.isProcess = true;
            // Get item
            item = items[i];
            itemOld = items[that.current];
            // API onSet
            that.triggerEvent('onSet', {
                'current' : item,
                'previous' : itemOld
            });
            // If current active item not equal new item - process with new item, else redraw window alignment and dimensions
            if(i !== that.current){
                // API onSet
                that.triggerEvent('onChange', {
                    'current' : item,
                    'previous' : itemOld
                });
                // Check type
                if(item['type'] === 'image'){
                    setItemImage(i, item, itemOld);
                }else{
                    setItemIframe(i, item, itemOld);
                }
            }else{
                that.isProcess = false;
            }
        }
    };

    var setItemImage = function(i, item, itemOld){
        cm.replaceClass(that.nodes['bar'], 'is-partial', 'is-full');
        if(!item['isLoad']){
            setLoader(i, item, itemOld);
        }else{
            setItem(i, item, itemOld);
        }
    };

    var setItemIframe = function(i, item, itemOld){
        cm.replaceClass(that.nodes['bar'], 'is-full', 'is-partial');
        that.nodes['holder'].appendChild(item['nodes']['container']);
        setLoader(i, item, itemOld);
    };

    var setLoader = function(i, item, itemOld){
        that.nodes['loader'].style.display = 'block';
        anim['loader'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : that.params['duration']});
        // Add image load event and src
        cm.addEvent(item['nodes']['content'], 'load', function(){
            item['isLoad'] = true;
            // Hide loader
            removeLoader();
            // Set and show item
            setItem(i, item, itemOld);
        });
        cm.addEvent(item['nodes']['content'], 'error', function(){
            item['isLoad'] = false;
            // Hide loader
            removeLoader();
            // Set and show item
            setItem(i, item, itemOld);
        });
        item['nodes']['content'].src = item['src'];
    };

    var removeLoader = function(){
        anim['loader'].go({'style' : {'opacity' : 0}, 'anim' : 'smooth', 'duration' : that.params['duration'], 'onStop' : function(){
            that.nodes['loader'].style.display = 'none';
        }});
    };

    var setItem = function(i, item, itemOld){
        // Set new active
        that.previous = that.current;
        that.current = i;
        // API onImageSetStart
        that.triggerEvent('onItemLoad', item);
        // Embed item content
        if(itemOld){
            itemOld['nodes']['container'].style.zIndex = 1;
            item['nodes']['container'].style.zIndex = 2;
        }
        if(item['type'] === 'image'){
            that.nodes['holder'].appendChild(item['nodes']['container']);
        }
        // Animate Slide
        item['anim'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : that.params['duration'], 'onStop' : function(){
            // Remove old item
            if(itemOld){
                cm.setOpacity(itemOld['nodes']['container'], 0);
                cm.remove(itemOld['nodes']['container']);
            }
            // API onImageSet event
            that.triggerEvent('onItemSet', item);
            that.isProcess = false;
        }});
    };

    var next = function(){
        set((that.current === items.length - 1)? 0 : that.current + 1);
    };

    var prev = function(){
        set((that.current === 0)? items.length - 1 : that.current - 1);
    };

    var zoom = function(){
        that.components['zoom']
            .set(items[that.current]['src'])
            .open();
    };

    /* ******* MAIN ******* */

    that.set = function(i){
        if(!isNaN(i) && items[i]){
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
        return items.length;
    };

    that.stop = function(){
        that.isProcess = false;
        return that;
    };

    that.clear = function(){
        if(!cm.isEmpty(that.current) && items[that.current]){
            cm.remove(items[that.current]['nodes']['container']);
        }
        that.current = null;
        that.previous = null;
        items = [];
        return that;
    };

    that.add = function(item){
        item = cm.merge({
            'link' : cm.node('a'),
            'src' : '',
            'title' : ''
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
