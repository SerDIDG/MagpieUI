cm.define('Com.CollapsibleLayout', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Storage'
    ],
    'events' : [
        'onRender',
        'onCollapseLeft',
        'onExpandLeft',
        'onCollapseRight',
        'onExpandRight'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'remember' : false
    }
},
function(params){
    var that = this;

    that.nodes = {
        'leftButton' : cm.Node('div'),
        'leftContainer' : cm.Node('div'),
        'rightButton': cm.Node('div'),
        'rightContainer' : cm.Node('div')
    };

    that.isLeftCollapsed = false;
    that.isRightCollapsed = false;

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
    };

    var render = function(){
        // Left Sidebar
        cm.addEvent(that.nodes['leftButton'], 'click', toggleLeft);
        // Right sidebar
        cm.addEvent(that.nodes['rightButton'], 'click', toggleRight);
        // Check toggle class
        that.isLeftCollapsed = cm.isClass(that.params['node'], 'is-sidebar-left-collapsed');
        that.isRightCollapsed = cm.isClass(that.params['node'], 'is-sidebar-right-collapsed');
        // Check storage
        if(that.params['remember']){
            that.isLeftCollapsed = that.storageRead('isLeftCollapsed');
            that.isRightCollapsed = that.storageRead('isRightCollapsed');
        }
        // Check sidebars visibility
        that.isLeftCollapsed = cm.getStyle(that.nodes['leftContainer'], 'display') == 'none'? true : that.isLeftCollapsed;
        that.isRightCollapsed = cm.getStyle(that.nodes['rightContainer'], 'display') == 'none'? true : that.isRightCollapsed;
        // Trigger events
        if(that.isLeftCollapsed){
            that.collapseLeft(true);
        }else{
            that.expandLeft(true);
        }
        if(that.isRightCollapsed){
            that.collapseRight(true);
        }else{
            that.expandRight(true);
        }
        that.triggerEvent('onRender');
    };

   var toggleRight = function(){
        if(that.isRightCollapsed){
            that.expandRight();
        }else{
            that.collapseRight();
        }
    };

    var toggleLeft = function(){
        if(that.isLeftCollapsed){
            that.expandLeft();
        }else{
            that.collapseLeft();
        }
    };

    /* ******* MAIN ******* */

    that.collapseLeft = function(isImmediately){
        that.isLeftCollapsed = true;
        isImmediately && cm.addClass(that.params['node'], 'is-immediately');
        cm.replaceClass(that.params['node'], 'is-sidebar-left-expanded', 'is-sidebar-left-collapsed', true);
        isImmediately && cm.removeClass(that.params['node'], 'is-immediately');
        // Write storage
        if(that.params['remember']){
            that.storageWrite('isLeftCollapsed', true);
        }
        that.triggerEvent('onCollapseLeft');
        return that;
    };

    that.expandLeft = function(isImmediately){
        that.isLeftCollapsed = false;
        isImmediately && cm.addClass(that.params['node'], 'is-immediately');
        cm.replaceClass(that.params['node'], 'is-sidebar-left-collapsed', 'is-sidebar-left-expanded', true);
        isImmediately && cm.removeClass(that.params['node'], 'is-immediately');
        // Write storage
        if(that.params['remember']){
            that.storageWrite('isLeftCollapsed', false);
        }
        that.triggerEvent('onExpandLeft');
        return that;
    };

    that.collapseRight = function(isImmediately){
        that.isRightCollapsed = true;
        isImmediately && cm.addClass(that.params['node'], 'is-immediately');
        cm.replaceClass(that.params['node'], 'is-sidebar-right-expanded', 'is-sidebar-right-collapsed', true);
        isImmediately && cm.removeClass(that.params['node'], 'is-immediately');
        // Write storage
        if(that.params['remember']){
            that.storageWrite('isRightCollapsed', true);
        }
        that.triggerEvent('onCollapseRight');
        return that;
    };

    that.expandRight = function(isImmediately){
        that.isRightCollapsed = false;
        isImmediately && cm.addClass(that.params['node'], 'is-immediately');
        cm.replaceClass(that.params['node'], 'is-sidebar-right-collapsed', 'is-sidebar-right-expanded', true);
        isImmediately && cm.removeClass(that.params['node'], 'is-immediately');
        // Write storage
        if(that.params['remember']){
            that.storageWrite('isRightCollapsed', false);
        }
        that.triggerEvent('onExpandRight');
        return that;
    };

    init();
});