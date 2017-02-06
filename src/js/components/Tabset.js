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
        'node' : cm.Node('div'),        // Tabs contained node
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'toggleOnHashChange' : true,
        'renderOnInit' : true,
        'active' : null,
        'className' : '',
        'tabsPosition' : 'top',         // top | right | bottom | left
        'tabsFlexible' : false,
        'tabsWidth' : 256,              // Only for tabsPosition left or right
        'showTabs' : true,
        'showTabsTitle' : true,         // Show title tooltip
        'switchManually' : false,       // Change tab manually, not implemented yet
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
    that.isProcess = false;
    
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
        if(typeof that.params['tabsWidth'] == 'number'){
            that.params['tabsWidth'] = [that.params['tabsWidth'], 'px'].join('');
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
            if(id = getValidID(id, true)){
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
        if(that.params['animateSwitch']){
            cm.addClass(that.nodes['content'], 'is-animated');
        }
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
        Part.Menu && Part.Menu();
        cm.addEvent(window, 'resize', resizeHandler);
        that.addToStack(that.nodes['container']);
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
        item['container'] = cm.Node('li',
            item['a'] = cm.Node('a',
                cm.node('div', {'class' : 'title'}, tab['title'])
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
        if(that.params['toggleOnHashChange']){
            cm.addEvent(item['a'], 'click', function(e){
                e = cm.getEvent(e);
                cm.preventDefault(e);
                if(that.active != tab['id']){
                    window.location.href = [window.location.href.split('#')[0], tab['id']].join('#');
                }
            });
        }else{
            cm.addEvent(item['a'], 'click', function(e){
                e = cm.getEvent(e);
                cm.preventDefault(e);
                set(tab['id']);
            });
        }
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
        that.tabsListing = that.tabsListing.filter(function(tab){
            return item['id'] != tab['id'];
        });
        delete that.tabs[item['id']];
    };

    var set = function(id){
        var item, previous;
        if(!that.isProcess && id != that.active){
            that.isProcess = true;
            // Hide Previous Tab
            if(that.active && that.tabs[that.active]){
                that.previous = that.active;
                previous = that.tabs[that.previous];
                previous['isHide'] = true;
                // Hide Start Event
                previous['onHideStart'](that, previous);
                that.triggerEvent('onTabHideStart', previous);
                // Controller
                if(previous['controllerObject']){
                    previous['controllerObject'].suspend();
                }
                // Hide
                cm.removeClass(previous['tab']['container'], 'active');
                cm.removeClass(previous['menu']['container'], 'active');
                cm.removeClass(previous['content'], 'active');
                // Hide End Event
                previous['onHide'](that, previous);
                that.triggerEvent('onTabHide', previous);
            }
            // Show New Tab
            that.active = id;
            item = that.tabs[that.active];
            item['isHide'] = false;
            // Show Start Event
            item['onShowStart'](that, item);
            that.triggerEvent('onTabShowStart', item);
            // Controller
            if(item['constructor']){
                if(item['controller']){
                    item['controller'].refresh && item['controller'].refresh();
                }else{
                    cm.getConstructor(item['constructor'], function(classConstructor){
                        item['controller'] = new classConstructor(
                            cm.merge(item['controllerParams'], {
                                'container' : item['content']
                            })
                        );
                    });
                }
            }
            // Show
            item['content'].style.display = 'block';
            cm.addClass(item['tab']['container'], 'active');
            cm.addClass(item['menu']['container'], 'active');
            cm.addClass(item['content'], 'active', true);
            that.nodes['headerTitleText'].innerHTML = item['title'];
            // Animate
            if(!that.params['switchManually']){
                if(that.previous && that.params['animateSwitch'] && !that.params['calculateMaxHeight']){
                    animateSwitch();
                }else{
                    if(that.params['calculateMaxHeight']){
                        calculateMaxHeight();
                    }
                    if(that.previous){
                        that.tabs[that.previous]['content'].style.display = 'none';
                    }
                    switchTab();
                }
            }
        }
    };

    var switchTab = function(){
        // Show End Event
        that.tabs[that.active]['onShow'](that, that.tabs[that.active]);
        that.triggerEvent('onTabShow', that.tabs[that.active]);
        that.isProcess = false;
        // Trigger custom event
        cm.customEvent.trigger(that.tabs[that.active]['content'], 'redraw', {
            'type' : 'child',
            'self' : false
        });
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
            switchTab();
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
        if(id = getValidID(id, false)){
            set(id);
        }
    };

    var getValidID = function(id, getDefault){
        getDefault = getDefault || !that.active;
        if(cm.isEmpty(that.tabsListing) || cm.isEmpty(that.tabs)){
            return null;
        }
        return (id && that.tabs[id])? id : (getDefault) ? that.tabsListing[0]['id'] : null;
    };

    var calculateMaxHeight = function(){
        var height = 0;
        cm.forEach(that.tabs, function(item){
            height = Math.max(height, cm.getRealHeight(item['content'], 'offsetRelative'));
        });
        if(height != that.nodes['contentUL'].offsetHeight){
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
    
    /* ******* MAIN ******* */

    that.render = function(){
        render();
        return that;
    };
    
    that.destruct = function(){
        that.remove();
        that.removeFromStack();
    };

    that.set = function(id){
        if(id && that.tabs[id]){
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

    that.get = function(id){
        if(id && that.tabs[id]){
            return that.tabs[id];
        }
        return null;
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

/* ******* COMPONENTS: TABSET: MODULE TAB CONTROLLER ******* */

Mod['TabController'] = {
    '_config' : {
        'extend' : true,
        'predefine' : false,
        'require' : ['Extend']
    },
    '_construct' : function(){
        var that = this;
        that._isConstructed = false;
        that._isDestructed = false;
        that._isPaused = false;
    },
    'construct' : function(){
        var that = this;
        that._isConstructed = true;
        that._isDestructed = false;
        that._isPaused = false;
        return that;
    },
    'destruct' : function(){
        var that = this;
        if(that._isConstructed && !that._isDestructed){
            that._isConstructed = false;
            that._isDestructed = true;
            cm.customEvent.trigger(that.params['node'], 'destruct', {
                'type' : 'child',
                'self' : false
            });
            that.removeFromStack && that.removeFromStack();
            cm.remove(that.params['node']);
        }
        return that;
    },
    'refresh' : function(){
        var that = this;
        that._isPaused = false;
        return that;
    },
    'pause' : function(){
        var that = this;
        if(!that._isPaused){
            that._isPaused = true;
        }
        return that;
    }
};