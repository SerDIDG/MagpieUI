/* ******* COMPONENTS: TABSET ******* */

Com.Elements['Tabset'] = {};

Com['GetTabset'] = function(id){
    return Com.Elements.Tabset[id] || null;
};

cm.define('Com.Tabset', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRender',
        'onTabShowStart',
        'onTabShow',
        'onTabHideStart',
        'onTabHide'
    ],
    'params' : {
        'node' : cm.node('div'),                // Tabs contained node
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'toggleOnHashChange' : true,
        'renderOnInit' : true,
        'removeOnDestruct' : true,
        'customEvents' : true,
        'setInitialTab' : true,                 // Set possible initial tab even if "active" is not defined
        'setInitialTabImmediately' : true,      // Set initial tab without animation
        'unsetOnReClick' : false,
        'active' : null,
        'className' : '',
        'adaptive' : true,
        'tabsAlign' : 'left',                   // left | center | right | justify
        'tabsPosition' : 'top',                 // top | right | bottom | left
        'tabsFlexible' : false,
        'tabsWidth' : 256,                      // Only for tabsPosition left or right
        'showTabs' : true,
        'showTabsTitle' : true,                 // Show title tooltip
        'animateSwitch' : true,
        'calculateMaxHeight' : false,
        'animateDuration' : 'cm._config.animDuration',
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
    that.isInitial = null;
    that.isProcess = false;
    that.isDestructed = false;
    that.isMenuShown = false;

    var init = function(){
        getLESSVariables();
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

    var getLESSVariables = function(){
        that.params['animateDuration'] = cm.getTransitionDurationFromLESS('ComTabset-Duration', that.params['animateDuration']);
        that.params['tabsWidth'] = cm.getLESSVariable('ComTabset-Column-Width', that.params['tabsWidth'], true);
    };

    var validateParams = function(){
        if(!cm.inArray(['top', 'right', 'bottom', 'left'], that.params['tabsPosition'])){
            that.params['tabsPosition'] = 'top';
        }
        if(!cm.inArray(['left', 'center', 'right', 'justify'], that.params['tabsAlign'])){
            that.params['tabsAlign'] = 'left';
        }
        if(cm.isNumber(that.params['tabsWidth'])){
            that.params['tabsWidth'] = [that.params['tabsWidth'], 'px'].join('');
        }
    };

    var render = function(){
        // Init hash change handler
        that.params['toggleOnHashChange'] && cm.addEvent(window, 'hashchange', hashHandler);
        // Set initial tab
        setInitial();
    };

    var renderView = function(){
        /* *** STRUCTURE *** */
        that.nodes['container'] = cm.node('div', {'class' : 'com__tabset'},
            that.nodes['content'] = cm.node('div', {'class' : 'com__tabset__content'},
                that.nodes['contentUL'] = cm.node('ul')
            )
        );
        that.nodes['headerTitle'] = cm.node('div', {'class' : 'com__tabset__head-title'},
            that.nodes['headerTitleText'] = cm.node('div', {'class' : 'com__tabset__head-text'}),
            that.nodes['headerMenu'] = cm.node('div', {'class' : 'com__tabset__head-menu pt__menu is-manual is-hide'},
                that.nodes['headerMenuButton'] = cm.node('div', {'class' : that.params['icons']['menu']}),
                that.nodes['headerMenuUL'] = cm.node('ul', {'class' : 'pt__menu-dropdown'})
            )
        );
        that.nodes['headerTabs'] = cm.node('div', {'class' : 'com__tabset__head-tabs'},
            that.nodes['headerUL'] = cm.node('ul')
        );
        if(that.params['adaptive']){
            cm.addClass(that.nodes['container'], 'is-adaptive');
        }
        if(that.params['animateSwitch']){
            cm.addClass(that.nodes['content'], 'is-animated');
        }
        cm.addEvent(that.nodes['headerMenuButton'], 'click', toggleHeaderMenu);
        // Set Tabs Width
        if(/left|right/.test(that.params['tabsPosition'])){
            that.nodes['headerTabs'].style.width = that.params['tabsWidth'];
            that.nodes['content'].style.width = ['calc(100% - ', that.params['tabsWidth'], ')'].join('');
        }
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
        if(/top|bottom/.test(that.params['tabsPosition'])){
            cm.addClass(that.nodes['container'], ['is-tabs-pull', that.params['tabsAlign']].join('-'));
        }
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
        that.embedStructure(that.nodes['container']);
        /* *** EVENTS *** */
        cm.addEvent(window, 'resize', resizeHandler);
        cm.addEvent(window, 'click', clickHandler);
        that.addToStack(that.nodes['container']);
        if(that.params['customEvents']){
            cm.customEvent.add(that.nodes['container'], 'destruct', that.destruct);
        }
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
            'content' : cm.node('li'),
            'image' : null,
            'isHide' : true,
            'constructor' : false,
            'constructorParams' : {},
            'onShowStart' : function(that, tab){},
            'onShow' : function(that, tab){},
            'onHideStart' : function(that, tab){},
            'onHide' : function(that, tab){}
        }, item);
        if(!cm.isEmpty(item['image']) && !cm.isNode(item['image'])){
            item['image'] = cm.strReplace(item['image'], {
                '%baseUrl%' : cm._baseUrl
            });
        }
        // Structure
        item['tab'] = renderTabLink(item, true);
        item['menu'] = renderTabLink(item, false);
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

    var renderTabLink = function(tab, image){
        var item = {};
        // Structure
        item['container'] = cm.node('li',
            item['a'] = cm.node('a',
                item['title'] = cm.node('div', {'class' : 'title'}, tab['title'])
            )
        );
        // Image
        if(image){
            if(cm.isNode(tab['image'])){
                item['image'] = tab['image'];
            }else if(!cm.isEmpty(tab['image'])){
                item['image'] = cm.node('div', {'class' : 'image'},
                    cm.node('img', {'src' : tab['image'], 'alt' : ''})
                );
            }
            if(item['image']){
                cm.insertFirst(item['image'], item['a']);
            }
            if(that.params['showTabsTitle']){
                item['a'].setAttribute('title', tab['title']);
            }
        }
        // Add click event
        cm.addEvent(item['a'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            if(that.params['unsetOnReClick'] && that.active === tab['id']){
                that.unset();
            }else{
                if(that.params['toggleOnHashChange']){
                    window.location.hash = tab['id'];
                }else{
                    set(tab['id']);
                }
            }
            hideHeaderMenu();
        });
        return item;
    };

    var removeTab = function(item){
        // Set new active tab, if current active is nominated for remove
        if(item['id'] === that.active && that.tabsListing[0]){
            set(that.tabsListing[0]);
        }
        // Remove tab from list and array
        cm.remove(item['tab']['container']);
        cm.remove(item['menu']['container']);
        cm.remove(item['content']);
        that.tabsListing = cm.arrayRemove(that.tabsListing, item);
        delete that.tabs[item['id']];
    };

    var setInitial = function(){
        var id;
        // Set default active tab
        if(that.params['setInitialTab']){
            id = getInitialID();
        }else{
            id = that.params['active']
        }
        if(isValidID(id)){
            set(id);
        }
    };

    var set = function(id){
        var item = that.tabs[id];
        if(item && id !== that.active && !that.isProcess){
            that.isProcess = true;
            // Hide Previous Tab
            unsetTab(that.active);
            that.previous = that.active;
            that.active = id;
            // Initial tab
            if(!cm.isBoolean(that.isInitial)){
                that.isInitial = !that.previous && that.params['setInitialTabImmediately'] && that.params['setInitialTab'];
            }else{
                that.isInitial = false;
            }
            // Show New Tab
            item['isHide'] = false;
            item['onShowStart'](that, item);
            that.triggerEvent('onTabShowStart', item);
            // Controller
            if(item['constructor']){
                if(item['controller']){
                    item['controller'].refresh && item['controller'].refresh();
                }else{
                    cm.getConstructor(item['constructor'], function(classConstructor){
                        item['controller'] = new classConstructor(
                            cm.merge(item['constructorParams'], {
                                'container' : item['content']
                            })
                        );
                    });
                }
            }
            // Show
            switchTabHandler(item);
        }
    };

    var switchTabHandler = function(item){
        // Show active tab
        item['content'].style.display = 'block';
        cm.addClass(item['tab']['container'], 'active');
        cm.addClass(item['menu']['container'], 'active');
        cm.addClass(item['content'], 'active', true);
        that.nodes['headerTitleText'].innerHTML = item['title'];
        // Animate
        if(!that.isInitial && that.params['animateSwitch'] && !that.params['calculateMaxHeight']){
            animateSwitch();
        }else{
            if(that.params['calculateMaxHeight']){
                calculateMaxHeight();
            }
            if(that.previous){
                that.tabs[that.previous]['content'].style.display = 'none';
            }
            showActiveTab();
        }
    };

    var unsetTab = function(id){
        var item = that.tabs[id];
        if(item){
            // Hide Start Event
            item['onHideStart'](that, item);
            that.triggerEvent('onTabHideStart', item);
            item['isHide'] = true;
            // Hide
            cm.removeClass(item['tab']['container'], 'active');
            cm.removeClass(item['menu']['container'], 'active');
            cm.removeClass(item['content'], 'active');
            // Hide End Event
            item['onHide'](that, item);
            that.triggerEvent('onTabHide', item);
        }
    };

    var showActiveTab = function(){
        var item = that.tabs[that.active];
        // Show End Event
        if(item){
            item['onShow'](that, item);
            that.triggerEvent('onTabShow', item);
            that.isProcess = false;
            // Trigger custom event
            cm.customEvent.trigger(item['content'], 'redraw', {
                'direction' : 'child',
                'self' : false
            });
        }else{
            that.isProcess = false;
        }
    };

    var toggleHeaderMenu = function(){
        if(that.isMenuShown){
            hideHeaderMenu();
        }else{
            showHeaderMenu();
        }
    };

    var showHeaderMenu = function(){
        that.isMenuShown = true;
        cm.replaceClass(that.nodes['headerMenu'], 'is-hide', 'is-show');
    };

    var hideHeaderMenu = function(){
        that.isMenuShown = false;
        cm.replaceClass(that.nodes['headerMenu'], 'is-show', 'is-hide');
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
            if(that.previous){
                that.tabs[that.previous]['content'].style.display = 'none';
            }
            that.nodes['contentUL'].style.overflow = 'visible';
            that.nodes['contentUL'].style.height = 'auto';
            showActiveTab();
        }});
    };

    var hashHandler = function(){
        var id = window.location.hash.slice(1);
        if(isValidID(id)){
            set(id);
        }
    };

    var getInitialID = function(){
        var id;
        if(cm.isEmpty(that.tabsListing) || cm.isEmpty(that.tabs)){
            return null;
        }
        // Get tab from hash is exists
        if(that.params['toggleOnHashChange']){
            id = window.location.hash.slice(1);
            if(isValidID(id)){
                return id;
            }
        }
        // Get tab from parameters if exists
        id = that.params['active'];
        if(isValidID(id)){
            return id;
        }
        // Get first tab in list
        return that.tabsListing[0]['id'];
    };

    var getTabByID = function(id){
        if(id && that.tabs[id]){
            return that.tabs[id];
        }
    };

    var isValidID = function(id){
        return !!getTabByID(id);
    };

    var calculateMaxHeight = function(){
        var height = 0;
        cm.forEach(that.tabs, function(item){
            height = Math.max(height, cm.getRealHeight(item['content'], 'offsetRelative'));
        });
        if(height !== that.nodes['contentUL'].offsetHeight){
            that.nodes['contentUL'].style.minHeight = [height, 'px'].join('');
            cm.forEach(that.tabs, function(item){
                item['content'].style.minHeight = [height, 'px'].join('');
            });
        }
    };

    var resizeHandler = function(){
        // Recalculate slider height
        if(that.params['calculateMaxHeight']){
            calculateMaxHeight();
        }
    };

    var clickHandler = function(e){
        var target = cm.getEventTarget(e);
        if(!cm.isParent(that.nodes['headerMenu'], target, true)){
            hideHeaderMenu();
        }
    };

    /* ******* MAIN ******* */

    that.render = function(){
        render();
        return that;
    };

    that.reset = function(){
        setInitial();
        return that;
    };

    that.destruct = function(){
        if(!that.isDestructed){
            that.isDestructed = true;
            cm.customEvent.trigger(that.nodes['container'], 'destruct', {
                'direction' : 'child',
                'self' : false
            });
            if(that.params['customEvents']){
                cm.customEvent.remove(that.nodes['container'], 'destruct', that.destruct);
            }
            that.params['removeOnDestruct'] && that.remove();
            that.removeFromStack();
        }
        return that;
    };

    that.set = function(id){
        if(isValidID(id)){
            set(id);
        }
        return that;
    };

    that.setByIndex = function(index){
        var item;
        if(item = that.tabsListing[index]){
            set(item['id']);
        }
        return that;
    };

    that.unset = function(){
        that.previous = that.active;
        that.active = null;
        unsetTab(that.previous);
        animateSwitch();
        // Reset
        that.previous = null;
        that.active = null;
        if(that.params['toggleOnHashChange']){
            window.location.hash = '';
        }
        return that;
    };

    that.reset = function(){
        setInitial();
        return that;
    };

    that.get = function(id){
        return getTabByID(id);
    };

    that.getTabs = function(){
        return that.tabs;
    };

    that.getActiveTab = function(){
        return that.tabs[that.active];
    };

    that.addTab = function(item){
        if(item && item['id']){
            renderTab(item);
        }
        return that;
    };

    that.addTabs = function(o){
        if(cm.isArray(o) || cm.isObject(o)){
            cm.forEach(o, that.addTab);
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
        cm.removeEvent(window, 'click', clickHandler);
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
