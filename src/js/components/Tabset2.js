cm.define('Com.Tabset2', {
    'extend' : 'Com.TabsetHelper',
    'params' : {
        'controllerEvents' : true,
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'embedStructure' : 'replace',
        'removeOnDestruct' : true,
        'toggleOnHashChange' : true,                                // URL hash change handler
        'targetEvent' : 'click',                                    // click | hover | none
        'documentNode' : window,

        /* ITEMS */

        'items' : [],
        'active' : null,
        'setInitialTab' : true,                                     // Set possible initial tab even if "active" is not defined
        'setInitialTabImmediately' : true,                          // Set initial tab without animation
        'processTabs' : false,

        /* TABS */

        'showMenu' : true,
        'renderTabView' : true,
        'tabsHolderTagName': 'ul',
        'tabsAlign' : 'left',                                       // left | center | right | justify
        'tabsPosition' : 'top',                                     // top | right | bottom | left
        'tabsFlexible' : false,
        'tabsWidth' : 256,                                          // Only for tabsPosition left or right
        'showTabs' : true,
        'showTabsTitle' : true,                                     // Show title tooltip
        'setTabsHash' : false,

        /* CONTENT */

        'showContent' : true,
        'switchManually' : false,                                   // Change tab manually, not implemented yet
        'animateSwitch' : true,
        'animateHeight' : true,
        'animateDuration' : 300,
        'calculateMaxHeight' : false,                               // ToDo: implement

        /* AJAX */

        'showLoader' : true,
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : true,                                      // If true, html will append automatically
        'cache' : false,                                            // Cache ajax tab content
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %tab%, %callback% for JSONP.
            'params' : ''                                           // Params object. %tab%, %baseUrl%, %callback% for JSONP.
        },

        /* STYLES */

        'adaptive' : true,
        'className' : '',
        'icons' : {
            'menu' : 'icon default linked'
        },

        /* CONSTRUCTORS */

        'overlayConstructor' : 'Com.Overlay',
        'overlayParams' : {
            'position' : 'absolute',
            'lazy' : true,
            'autoOpen' : false,
            'removeOnClose' : true
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.TabsetHelper.apply(that, arguments);
});

cm.getConstructor('Com.Tabset2', function(classConstructor, className, classProto, classInherit){
    classProto.onConstructStart = function(){
        var that = this;
        that.isMenuShown = false;
        that.toggleMenuHandler = that.toggleMenu.bind(that);
        that.windowClickHandler = that.windowClick.bind(that);
    };

    classProto.onGetLESSVariablesProcess = function(){
        var that = this;
        that.params['animateDuration'] = cm.getTransitionDurationFromLESS('ComTabset-Duration', that.params['animateDuration']);
        that.params['tabsWidth'] = cm.getLESSVariable('ComTabset-Column-Width', that.params['tabsWidth'], true);
    };

    classProto.onValidateParams = function(){
        var that = this;
        // Get tabs from nodes
        if(cm.isNode(that.params['node'])){
            that.collectTabs();
        }
    };

    classProto.onSetEvents = function(){
        var that = this;
        // Call parent method
        classInherit.prototype.onSetEvents.apply(that, arguments);
        cm.addEvent(that.params['documentNode'], 'click', that.windowClickHandler);
    };

    classProto.onUnsetEvents = function(){
        var that = this;
        // Call parent method
        classInherit.prototype.onUnsetEvents.apply(that, arguments);
        cm.removeEvent(that.params['documentNode'], 'click', that.windowClickHandler);
    };

    classProto.renderView = function(){
        var that = this;
        // Structure
        that.triggerEvent('onRenderViewStart');
        that.renderViewStructure();
        that.triggerEvent('onRenderViewProcess');
        // Adaptive
        if(that.params['adaptive']){
            cm.addClass(that.nodes['container'], 'is-adaptive');
        }
        // Set Tabs Width
        if(/left|right/.test(that.params['tabsPosition'])){
            that.nodes['headerTabs'].style.width = that.params['tabsWidth'];
            that.nodes['content'].style.width = ['calc(100% - ', that.params['tabsWidth'], ')'].join('');
        }
        // Tabs positions
        cm.addClass(that.nodes['container'], ['is-tabs', that.params['tabsPosition']].join('-'));
        if(/top|bottom/.test(that.params['tabsPosition'])){
            cm.addClass(that.nodes['container'], ['is-tabs-pull', that.params['tabsAlign']].join('-'));
        }
        if(that.params['tabsFlexible']){
            cm.addClass(that.nodes['container'], 'is-tabs-flexible');
        }
        // Animate
        if(that.params['animateSwitch']){
            cm.addClass(that.nodes['content'], 'is-animated');
        }
        // Embed Content
        if(that.params['showContent']){
            cm.appendChild(that.nodes['content'], that.nodes['inner']);
        }
        // Embed Tabs
        if(that.params['showTabs']){
            if(that.params['showContent']){
                if(that.params['showMenu']){
                    cm.insertBefore(that.nodes['headerTitle'], that.nodes['content']);
                }
                if(/bottom|right/.test(that.params['tabsPosition'])){
                    cm.insertAfter(that.nodes['headerTabs'], that.nodes['content']);
                }else{
                    cm.insertBefore(that.nodes['headerTabs'], that.nodes['content']);
                }
            }else{
                if(that.params['showMenu']) {
                    cm.appendChild(that.nodes['headerTitle'], that.nodes['inner']);
                }
                cm.appendChild(that.nodes['headerTabs'], that.nodes['inner']);
            }
        }
        that.triggerEvent('onRenderViewEnd');
    };

    classProto.renderViewStructure = function() {
        var that = this;
        that.nodes['container'] = that.nodes['inner'] = cm.node('div', {'class' : 'com__tabset'});
        that.nodes['content'] = cm.node('div', {'class' : 'com__tabset__content'},
            that.nodes['contentUL'] = cm.node('ul', {'class' : 'inner'})
        );
        that.nodes['headerTitle'] = cm.node('div', {'class' : 'com__tabset__head-title'},
            that.nodes['headerTitleText'] = cm.node('div', {'class' : 'com__tabset__head-text'}),
            that.nodes['headerMenu'] = cm.node('div', {'class' : 'com__tabset__head-menu pt__menu is-manual is-hide'},
                that.nodes['headerMenuButton'] = cm.node('div', {'class' : that.params['icons']['menu']}),
                that.nodes['headerMenuUL'] = cm.node('ul', {'class' : 'pt__menu-dropdown', 'role' : 'tablist'})
            )
        );
        that.nodes['headerTabs'] = cm.node('div', {'class' : 'com__tabset__head-tabs'},
            that.nodes['headerUL'] = cm.node(that.params['tabsHolderTagName'], {'class' : 'inner', 'role' : 'tablist'})
        );
    };

    classProto.renderViewModel = function(){
        var that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Add menu actions
        cm.addEvent(that.nodes['headerMenuButton'], 'click', that.toggleMenuHandler);
    };

    /******* TABS *******/

    classProto.collectTabs = function(){
        var that = this;
        cm.forEach(that.nodes['tabs'], function(item){
            if(cm.isNode(item['container'])){
                cm.removeClass(item['content'], 'active');
                that.params['items'].push(
                    cm.merge({'content' : item['container']}, that.getNodeDataConfig(item['container']))
                )
            }
        });
    };

    classProto.renderTabView = function(item){
        var that = this;

        // Render structure
        item['label'] = that.renderTabLink(item, 'label');
        item['menu'] = that.renderTabLink(item, 'menu');
        item['tab'] = that.renderTabContent(item);

        // Set attributes
        that.setTabLinkAttributes(item, item['label']);
        that.setTabLinkAttributes(item, item['menu']);
        that.setTabContentAttributes(item, item['tab']);

        // Append
        cm.appendChild(item['label']['container'], that.nodes['headerUL']);
        cm.appendChild(item['menu']['container'], that.nodes['headerMenuUL']);
        cm.appendChild(item['tab']['container'], that.nodes['contentUL']);
    };

    classProto.renderTabContent = function(item){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('li',
            nodes['inner'] = cm.node('div', item['content'])
        );
        return nodes;
    };

    classProto.setTabContentAttributes = function(item, nodes) {
        nodes.container.setAttribute('id', item.tabName);
        nodes.container.setAttribute('role', 'tabpanel');
        nodes.container.setAttribute('tabindex', '0');
        nodes.container.setAttribute('aria-labelledby', item.labelName);
        nodes.container.setAttribute('hidden', false);
    };

    classProto.renderTabLink = function(item, type){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('li',
            nodes['link'] = cm.node('a',
                nodes['title'] = cm.node('div', {'class' : 'title'})
            )
        );
        // Title
        if(cm.isNode(item['title'])){
            item['title'] = cm.clone(item['title'], true);
            cm.appendChild(item['title'], nodes['title']);
        }else{
            nodes['title'].innerHTML = item['title'];
        }
        // Image
        if(type === 'label'){
            if(cm.isNode(item['image'])){
                nodes['image'] = item['image'];
            }else if(!cm.isEmpty(item['image'])){
                nodes['image'] = cm.node('div', {'class' : 'image'},
                    cm.node('img', {'src' : item['image'], 'alt' : ''})
                );
            }
            if(nodes['image']){
                cm.insertFirst(nodes['image'], nodes['link']);
            }
        }
        return nodes;
    };

    classProto.setTabLinkAttributes = function(item, nodes) {
        var that = this;

        nodes.container.setAttribute('id', item.labelName);
        nodes.container.setAttribute('role', 'tab');
        nodes.container.setAttribute('tabindex', '0');
        nodes.container.setAttribute('aria-controls', item.tabName);
        nodes.container.setAttribute('aria-selected', 'false');

        if (that.params.showTabsTitle) {
            nodes.container.title = cm.cutHTML(item.title);
        }

        if (nodes.link) {
            nodes.link.setAttribute('role', 'presentation');
            nodes.link.setAttribute('tabindex', '-1');
            if (that.params.setTabsHash) {
                var url = new URL(window.location);
                url.hash = item.id;
                nodes.link.href = url.href;
                nodes.link.setAttribute('data-prevent-default', 'true');
            }
        }
    };

    /*** MENU ***/

    classProto.toggleMenu = function(){
        var that = this;
        if(that.isMenuShown){
            that.hideMenu();
        }else{
            that.showMenu();
        }
    };

    classProto.showMenu = function(){
        var that = this;
        if(!that.isMenuShown){
            that.isMenuShown = true;
            cm.replaceClass(that.nodes['headerMenu'], 'is-hide', 'is-show');
        }
    };

    classProto.hideMenu = function(){
        var that = this;
        if(that.isMenuShown){
            that.isMenuShown = false;
            cm.replaceClass(that.nodes['headerMenu'], 'is-show', 'is-hide');
        }
    }

    /*** TOGGLE ***/

    classProto.onLabelTarget = function(that, item){
        that.hideMenu();
    };

    classProto.onTabChangeStart = function(that, item){
        var previous = that.current;
        var previousItem = that.items[previous];

        // Clear animate interval
        clearTimeout(item['switchInt']);

        // Unset previous tab
        if(previousItem){
            if(that.params['animateSwitch']){
                that.nodes['contentUL'].style.overflow = 'hidden';
                if(that.params['animateHeight']) {
                    that.nodes['contentUL'].style.height = previousItem['tab']['container'].offsetHeight + 'px';
                }
            }
            previousItem['menu']['container'].setAttribute('aria-selected', 'false');
            previousItem['label']['container'].setAttribute('aria-selected', 'false');
        }

        // Set current tab
        that.nodes['headerTitleText'].innerHTML = item['title'];
        item['menu']['container'].setAttribute('aria-selected', 'true');
        item['label']['container'].setAttribute('aria-selected', 'true');
        item['tab']['container'].hidden = false;
        item['tab']['container'].style.display = 'block';
    };

    classProto.onTabShowEnd = function(that, item){
        var previous = that.previous;
        var previousItem = that.items[previous];

        if(previousItem && previousItem.id !== item.id){
            if(that.params['animateSwitch']){
                if(that.params['animateHeight']){
                    that.nodes['contentUL'].style.height = item['tab']['container'].offsetHeight + 'px';
                }
                previousItem['switchInt'] = setTimeout(function(){
                    previousItem['tab']['container'].hidden = true;
                    previousItem['tab']['container'].style.display = 'none';
                    that.nodes['contentUL'].style.overflow = '';
                    that.nodes['contentUL'].style.height = '';
                }, that.params['animateDuration']);
            }else{
                previousItem['tab']['container'].hidden = true;
                previousItem['tab']['container'].style.display = 'none';
            }
        }
    };

    /*** SERVICE ***/

    classProto.windowClick = function(e){
        var that = this,
            target = cm.getEventTarget(e);
        if(!cm.isParent(that.nodes['headerMenu'], target, true)){
            that.hideMenu();
        }
    };

    /******* PUBLIC *******/

    classProto.reset = function(){
        var that = this;
        that.setInitialTab();
        return that;
    };
});
