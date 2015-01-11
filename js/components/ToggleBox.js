cm.define('Com.ToggleBox', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Storage'
    ],
    'events' : [
        'onRender',
        'onShowStart',
        'onShow',
        'onHideStart',
        'onHide'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'duration' : 500,
        'toggleTitle' : false,          // Change title on toggle
        'remember' : false,             // Remember toggle state
        'langs' : {
            'show' : 'Show',
            'hide' : 'Hide'
        }
    }
},
function(params){
    var that = this,
        anim;

    that.nodes = {
        'button': cm.Node('div'),
        'target': cm.Node('div'),
        'title': cm.Node('div')
    };

    that.isCollapsed = false;
    that.isProcess = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
    };

    var render = function(){
        anim = new cm.Animation(that.nodes['target']);
        cm.addEvent(that.nodes['button'], 'click', that.toggle);
        // Check toggle class
        that.isCollapsed = cm.isClass(that.params['node'], 'is-hide') || !cm.isClass(that.params['node'], 'is-show');
        // Check storage
        if(that.params['remember']){
            that.isCollapsed = that.storageRead('isCollapsed');
        }
        // Trigger events
        if(that.isCollapsed){
            that.collapse(true);
        }else{
            that.expand(true);
        }
        that.triggerEvent('onRender', {});
    };

    var expandEnd = function(){
        that.isProcess = false;
        that.nodes['target'].style.opacity = 1;
        that.nodes['target'].style.height = 'auto';
        that.nodes['target'].style.overflow = 'visible';
        that.triggerEvent('onShow');
    };

    var collapseEnd = function(){
        that.isProcess = false;
        that.nodes['target'].style.opacity = 0;
        that.nodes['target'].style.height = 0;
        that.triggerEvent('onHide');
    };

    /* ******* MAIN ******* */

    that.toggle = function(){
        if(that.isCollapsed){
            that.expand();
        }else{
            that.collapse();
        }
    };

    that.expand = function(isImmediately){
        if(isImmediately || that.isCollapsed){
            that.isCollapsed = false;
            that.isProcess = 'show';
            that.triggerEvent('onShowStart');
            // Write storage
            if(that.params['remember']){
                that.storageWrite('isCollapsed', false);
            }
            cm.replaceClass(that.params['node'], 'is-hide', 'is-show');
            // Set title
            if(that.params['toggleTitle']){
                that.nodes['title'].innerHTML = that.lang('hide');
            }
            // Animate
            if(isImmediately){
                expandEnd();
            }
            else{
                that.nodes['target'].style.overflow = 'hidden';
                if(!that.nodes['target'].style.opacity){
                    that.nodes['target'].style.opacity = 0;
                }
                anim.go({
                    'style' : {
                        'height' : [cm.getRealHeight(that.nodes['target'], 'offset', 'current'), 'px'].join(''),
                        'opacity' : 1
                    },
                    'anim' : 'smooth',
                    'duration' : that.params['duration'],
                    'onStop' : expandEnd
                });
            }
        }
    };

    that.collapse = function(isImmediately){
        if(isImmediately || !that.isHide){
            that.isCollapsed = true;
            that.isProcess = 'hide';
            that.triggerEvent('onHideStart');
            // Write storage
            if(that.params['remember']){
                that.storageWrite('isCollapsed', true);
            }
            cm.replaceClass(that.params['node'], 'is-show', 'is-hide');
            // Set title
            if(that.params['toggleTitle']){
                that.nodes['title'].innerHTML = that.lang('show');
            }
            // Animate
            that.nodes['target'].style.overflow = 'hidden';
            if(!that.nodes['target'].style.opacity){
                that.nodes['target'].style.opacity = 1;
            }
            if(isImmediately){
                collapseEnd();
            }else{
                anim.go({
                    'style' : {
                        'height' : '0px',
                        'opacity' : 0
                    },
                    'anim' : 'smooth',
                    'duration' : that.params['duration'],
                    'onStop' : collapseEnd
                });
            }
        }
    };

    init();
});