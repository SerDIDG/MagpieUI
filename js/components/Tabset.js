Com.Elements['Tabset'] = {};

Com['GetTabset'] = function(id){
    return Com.Elements.Tabset[id] || null;
};

cm.define('Com.Tabset', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes'
    ],
    'events' : [
        'onRender',
        'onTabShowStart',
        'onTabShow',
        'onTabHideStart',
        'onTabHide'
    ],
    'params' : {
        'node' : cm.Node('div'),        // tabs contained node
        'container' : false,
        'toggleOnHashChange' : true,
        'renderOnInit' : true,
        'active' : null,
        'className' : '',
        'tabsPosition' : 'top',         // top | right | bottom | left
        'tabsFlexible' : false,
        'showTabs' : true,
        'switchManually' : false,
        'animateSwitch' : true,
        'animateDuration' : 300,
        'calculateMaxHeight' : false,
        'tabs' : [],
        'icons' : {
            'menu' : 'icon default linked'
        }
    }
},
function(params){
    var that = this,
        hashInterval,
        resizeInterval;
    
    that.nodes = {
        'tabs' : []
    };
    that.anim = {};
    that.tabs = {};
    that.tabsListing = [];
    that.active = false;
    that.previous = false;
    
    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node'], that.params['nodesDataMarker'], false);
        that.getDataConfig(that.params['node']);
        validateParams();
        // Render tabset view
        renderView();
        // Render active tab
        that.params['renderOnInit'] && render();
    };

    var validateParams = function(){
        if(!cm.inArray(['top', 'right', 'bottom', 'left'], that.params['tabsPosition'])){
            that.params['tabsPosition'] = 'top';
        }
    };

    var render = function(){
        var id = that.params['active'];
        if(that.params['toggleOnHashChange']){
            // Init hash change handler
            initHashChange();
            // Set first active tab
            if(id && that.tabs[id]){
                set(id);
            }else{
                hashHandler();
            }
        }else{
            if(id = getValidID(id)){
                set(id);
            }
        }
    };

    var renderView = function(){
        /* *** STRUCTURE *** */
        that.nodes['container'] = cm.Node('div', {'class' : 'com__tabset'},
            that.nodes['content'] = cm.Node('div', {'class' : 'com__tabset__content'},
                that.nodes['contentUL'] = cm.Node('ul')
            )
        );
        that.nodes['headerTitle'] = cm.Node('div', {'class' : 'com__tabset__head-title'},
            that.nodes['headerTitleText'] = cm.Node('div', {'class' : 'com__tabset__head-text'}),
            cm.Node('div', {'class' : 'com__tabset__head-menu pt__menu'},
                cm.Node('div', {'class' : that.params['icons']['menu']}),
                that.nodes['headerMenuUL'] = cm.Node('ul', {'class' : 'pt__menu-dropdown'})
            )
        );
        that.nodes['headerTabs'] = cm.Node('div', {'class' : 'com__tabset__head-tabs'},
            that.nodes['headerUL'] = cm.Node('ul')
        );
        // Embed Tabs
        if(that.params['showTabs']){
            cm.insertBefore(that.nodes['headerTitle'], that.nodes['content']);
            if(/bottom|right/.test(that.params['tabsPosition'])){
                cm.insertAfter(that.nodes['headerTabs'], that.nodes['content']);
            }else{
                cm.insertBefore(that.nodes['headerTabs'], that.nodes['content']);
            }
        }
        // Init Animation
        that.anim['contentUL'] = new cm.Animation(that.nodes['contentUL']);
        /* *** RENDER TABS *** */
        cm.forEach(that.nodes['tabs'], function(item){
            renderTab(
                cm.merge({'content' : item['container']}, that.getNodeDataConfig(item['container']))
            );
        });
        cm.forEach(that.params['tabs'], function(item){
            renderTab(item);
        });
        /* *** ATTRIBUTES *** */
        // CSS
        cm.addClass(that.nodes['container'], ['is-tabs', that.params['tabsPosition']].join('-'));
        if(that.params['tabsFlexible']){
            cm.addClass(that.nodes['container'], 'is-tabs-flexible');
        }
        if(!cm.isEmpty(that.params['className'])){
            cm.addClass(that.nodes['container'], that.params['className']);
        }
        // ID
        if(that.params['node'].id){
            that.nodes['container'].id = that.params['node'].id;
        }
        /* *** INSERT INTO DOM *** */
        if(that.params['container']){
            that.params['container'].appendChild(that.nodes['container']);
        }else if(that.params['node'].parentNode){
            cm.insertBefore(that.nodes['container'], that.params['node']);
        }
        cm.remove(that.params['node']);
        /* *** EVENTS *** */
        Part.Menu();
        cm.addEvent(window, 'resize', resizeHandler);
        that.triggerEvent('onRender');
    };

    var renderTab = function(item){
        // Check for exists
        if(that.tabs[item['id']]){
            removeTab(that.tabs[item['id']]);
        }
        // Config
        item = cm.merge({
            'id' : '',
            'title' : '',
            'content' : cm.Node('li'),
            'isHide' : true,
            'onShowStart' : function(that, tab){},
            'onShow' : function(that, tab){},
            'onHideStart' : function(that, tab){},
            'onHide' : function(that, tab){}
        }, item);
        // Structure
        item['tab'] = renderTabLink(item);
        item['menu'] = renderTabLink(item);
        // Remove active tab class if exists
        cm.removeClass(item['content'], 'active');
        // Append tab
        that.nodes['headerUL'].appendChild(item['tab']['container']);
        that.nodes['headerMenuUL'].appendChild(item['menu']['container']);
        that.nodes['contentUL'].appendChild(item['content']);
        // Push
        that.tabsListing.push(item);
        that.tabs[item['id']] = item;
    };

    var renderTabLink = function(tab){
        var item = {};
        // Structure
        item['container'] = cm.Node('li',
            item['a'] = cm.Node('a', tab['title'])
        );
        // Add click event
        if(that.params['toggleOnHashChange']){
            item['a'].setAttribute('href', [window.location.href.split('#')[0], tab['id']].join('#'));
        }else{
            item['a'].onclick = function(e){
                cm.getEvent(e);
                cm.preventDefault(e);
                set(tab['id']);
            };
        }
        return item;
    };

    var removeTab = function(item){
        // Set new active tab, if current active is nominated for remove
        if(item['id'] === that.active){
            set(that.tabsListing[0]);
        }
        // Remove tab from list and array
        cm.remove(item['tab']['container']);
        cm.remove(item['menu']['container']);
        cm.remove(item['content']);
        that.tabsListing = that.tabsListing.filter(function(tab){
            return item['id'] != tab['id'];
        });
        delete that.tabs[item['id']];
    };

    var set = function(id){
        // Hide Previous Tab
        if(that.active && that.tabs[that.active]){
            that.previous = that.active;
            that.tabs[that.active]['isHide'] = true;
            // Hide Start Event
            that.tabs[that.active]['onHideStart'](that, that.tabs[that.active]);
            that.triggerEvent('onTabHideStart', that.tabs[that.active]);
            // Hide
            cm.removeClass(that.tabs[that.active]['tab']['container'], 'active');
            cm.removeClass(that.tabs[that.active]['menu']['container'], 'active');
            cm.removeClass(that.tabs[that.active]['content'], 'active');
            // Hide End Event
            that.tabs[that.active]['onHide'](that, that.tabs[that.active]);
            that.triggerEvent('onTabHide', that.tabs[that.active]);
        }
        // Show New Tab
        that.active = id;
        that.tabs[that.active]['isHide'] = false;
        // Show Start Event
        that.tabs[that.active]['onShow'](that, that.tabs[that.active]);
        that.triggerEvent('onTabShow', that.tabs[that.active]);
        // Show
        cm.addClass(that.tabs[that.active]['tab']['container'], 'active');
        cm.addClass(that.tabs[that.active]['menu']['container'], 'active');
        cm.addClass(that.tabs[that.active]['content'], 'active');
        that.nodes['headerTitleText'].innerHTML = that.tabs[that.active]['title'];
        // Animate
        if(!that.params['switchManually']){
            if(that.previous && that.params['animateSwitch'] && !that.params['calculateMaxHeight']){
                animateSwitch();
            }else{
                if(that.params['calculateMaxHeight']){
                    calculateMaxHeight();
                }
                // Show End Event
                that.tabs[that.active]['onShow'](that, that.tabs[that.active]);
                that.triggerEvent('onTabShow', that.tabs[that.active]);
            }
        }
    };

    /* *** HELPERS *** */

    var animateSwitch = function(){
        var previousHeight = 0,
            currentHeight = 0;
        // Get height
        if(that.previous){
            previousHeight = cm.getRealHeight(that.tabs[that.previous]['content'], 'offsetRelative');
        }
        if(that.active){
            currentHeight = cm.getRealHeight(that.tabs[that.active]['content'], 'offsetRelative');
        }
        // Animate
        that.nodes['contentUL'].style.overflow = 'hidden';
        that.nodes['contentUL'].style.height = [previousHeight, 'px'].join('');
        that.anim['contentUL'].go({'style' : {'height' : [currentHeight, 'px'].join('')}, 'duration' : that.params['animateDuration'], 'anim' : 'smooth', 'onStop' : function(){
            that.nodes['contentUL'].style.overflow = 'visible';
            that.nodes['contentUL'].style.height = 'auto';
            // Show End Event
            that.tabs[that.active]['onShow'](that, that.tabs[that.active]);
            that.triggerEvent('onTabShow', that.tabs[that.active]);
        }});
    };

    var initHashChange = function(){
        var hash;
        if("onhashchange" in window && !cm.is('IE7')){
            cm.addEvent(window, 'hashchange', hashHandler);
        }else{
            hash = window.location.hash;
            hashInterval = setInterval(function(){
                if(hash != window.location.hash){
                    hash = window.location.hash;
                    hashHandler();
                }
            }, 25);
        }
    };

    var hashHandler = function(){
        var id = window.location.hash.replace('#', '');
        if(id = getValidID(id)){
            set(id);
        }
    };

    var getValidID = function(id){
        if(cm.isEmpty(that.tabsListing) || cm.isEmpty(that.tabs)){
            return null;
        }
        return id && that.tabs[id]? id : that.tabsListing[0]['id'];
    };

    var calculateMaxHeight = function(){
        var height = 0;
        cm.forEach(that.tabs, function(item){
            height = Math.max(height, cm.getRealHeight(item['content'], 'offsetRelative'));
        });
        if(height != that.nodes['contentUL'].offsetHeight){
            that.nodes['contentUL'].style.height = [height, 'px'].join('');
        }
    };

    var resizeHandler = function(){
        // Recalculate slider height
        if(that.params['calculateMaxHeight']){
            calculateMaxHeight();
        }
    };
    
    /* ******* MAIN ******* */

    that.render = function(){
        render();
        return that;
    };

    that.set = function(id){
        if(id && that.tabs[id]){
            set(id);
        }
        return that;
    };

    that.get = function(id){
        if(id && that.tabs[id]){
            return that.tabs[id];
        }
        return null;
    };

    that.addTab = function(item){
        if(item && item['id']){
            renderTab(item);
        }
        return that;
    };

    that.removeTab = function(id){
        if(id && that.tabs[id]){
            removeTab(that.tabs[id]);
        }
        return that;
    };

    that.setEvents = function(o){
        if(o){
            that.tabs = cm.merge(that.tabs, o);
        }
        return that;
    };

    that.remove = function(){
        cm.removeEvent(window, 'hashchange', hashHandler);
        cm.removeEvent(window, 'resize', resizeHandler);
        hashInterval && clearInterval(hashInterval);
        resizeInterval && clearInterval(resizeInterval);
        cm.remove(that.nodes['container']);
        return that;
    };

    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});