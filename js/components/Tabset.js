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
        'onTabShow',
        'onTabHide'
    ],
    'params' : {
        'node' : cm.Node('div'),        // tabs contained node
        'container' : false,
        'toggleOnHashChange' : true,
        'renderOnInit' : true,
        'active' : null,
        'className' : '',
        'tabsPosition' : 'top',         // top | bottom
        'showTabs' : true,
        'tabs' : [],
        'icons' : {
            'menu' : 'icon default linked'
        }
    }
},
function(params){
    var that = this,
        hashInterval;
    
    that.nodes = {
        'tabs' : []
    };
    that.tabs = {};
    that.tabsListing = [];
    that.active = null;
    
    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node'], that.params['nodesDataMarker'], false);
        that.getDataConfig(that.params['node']);
        // Render tabset view
        renderView();
        // Render active tab
        that.params['renderOnInit'] && render();
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
            that.nodes['content'] = cm.Node('div', {'class' : 'com__tabset__content clear'},
                that.nodes['contentUL'] = cm.Node('ul')
            )
        );
        that.nodes['header'] = cm.Node('div', {'class' : 'com__tabset__head clear'},
            cm.Node('div', {'class' : 'com__tabset__head-tabs'},
                that.nodes['headerUL'] = cm.Node('ul')
            ),
            that.nodes['header-title'] = cm.Node('div', {'class' : 'com__tabset__head-title'}),
            cm.Node('div', {'class' : 'com__tabset__head-menu pt__menu'},
                cm.Node('div', {'class' : that.params['icons']['menu']}),
                that.nodes['headerMenuUL'] = cm.Node('ul', {'class' : 'pt__menu-dropdown'})
            )
        );
        // Show tabs
        if(!that.params['showTabs']){
            that.nodes['header'].style.display = 'none';
        }
        // Tabs position
        if(that.params['tabsPosition'] == 'bottom'){
            cm.addClass(that.nodes['container'], 'is-tabs-bottom');
            cm.insertAfter(that.nodes['header'], that.nodes['content']);
        }else{
            cm.addClass(that.nodes['container'], 'is-tabs-top');
            cm.insertBefore(that.nodes['header'], that.nodes['content']);
        }
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
            'onShow' : function(that, tab){},
            'onHide' : function(that, tab){}
        }, item);
        // Structure
        item['tab'] = renderTabLink(item);
        item['menu'] = renderTabLink(item);
        // Remove active tab class if exists
        cm.removeClass(item['content'], 'active');
        // Hide content
        item['content'].style.display = 'none';
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
        // Hide previous active tab
        if(that.active && that.tabs[that.active]){
            // onHide event
            that.tabs[that.active]['isHide'] = true;
            that.tabs[that.active]['onHide'](that, that.tabs[that.active]);
            that.triggerEvent('onTabHide', that.tabs[that.active]);
            // Hide
            cm.removeClass(that.tabs[that.active]['tab']['container'], 'active');
            cm.removeClass(that.tabs[that.active]['menu']['container'], 'active');
            that.tabs[that.active]['content'].style.display = 'none';
        }
        // Show current tab
        that.active = id;
        // Show
        cm.addClass(that.tabs[that.active]['tab']['container'], 'active');
        cm.addClass(that.tabs[that.active]['menu']['container'], 'active');
        that.tabs[that.active]['content'].style.display = 'block';
        that.nodes['header-title'].innerHTML = that.tabs[that.active]['title'];
        // onShow event
        that.tabs[that.active]['isHide'] = false;
        that.tabs[that.active]['onShow'](that, that.tabs[that.active]);
        that.triggerEvent('onTabShow', that.tabs[that.active]);
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
        hashInterval && clearInterval(hashInterval);
        cm.remove(that.nodes['container']);
        return that;
    };

    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
    
});