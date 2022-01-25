/* ******* COMPONENTS: TABSET ******* */

cm.define('Com.Tabset2', {
    'extend' : 'Com.TabsetHelper',
    'params' : {
        'controllerEvents' : true,
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'embedStructure' : 'replace',
        'renderTabView' : true,
        //'renderOnInit' : true,
        'removeOnDestruct' : true,
        'toggleOnHashChange' : true,                                // URL hash change handler
        'targetEvent' : 'click',                                    // click | hover | none
        'documentNode' : window,

        /* TABS */

        'items' : [],
        'active' : null,
        'setInitialTab' : true,                                     // Set possible initial tab even if "active" is not defined
        'setInitialTabImmediately' : true,                          // Set initial tab without animation
        'tabsAlign' : 'left',                                       // left | center | right | justify
        'tabsPosition' : 'top',                                     // top | right | bottom | left
        'tabsFlexible' : false,
        'tabsWidth' : 256,                                          // Only for tabsPosition left or right
        'showTabs' : true,
        'showTabsTitle' : true,                                     // Show title tooltip
        'showContent' : true,
        'switchManually' : false,                                   // Change tab manually, not implemented yet
        'animateSwitch' : true,
        'animateDuration' : 300,
        'calculateMaxHeight' : false,

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
        that.nodes['container'] = that.nodes['inner'] = cm.node('div', {'class' : 'com__tabset'});
        that.nodes['content'] = cm.node('div', {'class' : 'com__tabset__content'},
            that.nodes['contentUL'] = cm.node('ul')
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
                cm.insertBefore(that.nodes['headerTitle'], that.nodes['content']);
                if(/bottom|right/.test(that.params['tabsPosition'])){
                    cm.insertAfter(that.nodes['headerTabs'], that.nodes['content']);
                }else{
                    cm.insertBefore(that.nodes['headerTabs'], that.nodes['content']);
                }
            }else{
                cm.appendChild(that.nodes['headerTitle'], that.nodes['inner']);
                cm.appendChild(that.nodes['headerTabs'], that.nodes['inner']);
            }
        }
        that.triggerEvent('onRenderViewEnd');
    };

    classProto.renderViewModel = function(){
        var that = this;
        cm.addEvent(that.nodes['headerMenuButton'], 'click', that.toggleMenuHandler);
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
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
        // Embed
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

    classProto.renderTabLink = function(item, type){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('li',
            nodes['link'] = cm.node('a',
                nodes['title'] = cm.node('div', {'class' : 'title'}, item['title'])
            )
        );
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
            if(that.params['showTabsTitle']){
                nodes['link'].setAttribute('title', item['title']);
            }
        }
        return nodes;
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

    classProto.onTabShowProcess = function(that, item){
        clearTimeout(item['switchInt']);
        that.nodes['headerTitleText'].innerHTML = item['title'];
        item['tab']['container'].style.display = 'block';
    };

    classProto.onTabShowEnd = function(that, item){
        var previous = that.previous;
        var previousItem = that.items[previous];
        if(previous && previous !== item){
            if(that.params['animateSwitch']){
                previousItem['switchInt'] = setTimeout(function(){
                    previousItem['tab']['container'].style.display = 'none';
                }, that.params['animateDuration']);
            }else{
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
