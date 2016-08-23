cm.define('Com.ToggleBox', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onShowStart',
        'onShow',
        'onHideStart',
        'onHide'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'renderStructure' : false,
        'embedStructure' : 'replace',
        'duration' : 500,
        'remember' : false,                                 // Remember toggle state
        'toggleTitle' : false,                              // Change title on toggle
        'container' : false,
        'title' : false,
        'content' : false,
        'className' : 'has-title-bg is-base is-hide',
        'eventNode' : 'title',                              // button | title
        'langs' : {
            'show' : 'Show',
            'hide' : 'Hide'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'button': cm.Node('div'),
        'target': cm.Node('div'),
        'title': cm.Node('div')
    };
    that.animations = {};

    that.isCollapsed = false;
    that.isProcess = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(that.params['renderStructure']){
            if(!that.params['title']){
                that.params['title'] = '';
                that.params['toggleTitle'] = true;
            }
        }
    };

    var render = function(){
        var storageCollapsed;
        // Render Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.Node('dl', {'class' : 'com__togglebox'},
                that.nodes['titleContainer'] = cm.Node('dt',
                    that.nodes['button'] = cm.Node('span', {'class' : 'icon default linked'}),
                    that.nodes['title'] = cm.Node('span', {'class' : 'title'}, that.params['title'])
                ),
                that.nodes['target'] = cm.Node('dd',
                    that.nodes['content'] = cm.Node('div', {'class' : 'inner'})
                )
            );
            cm.addClass(that.nodes['container'], that.params['className']);
            // Embed
            that.embedStructure(that.nodes['container']);
            // Embed content
            if(that.params['content']){
                that.nodes['content'].appendChild(that.params['content']);
            }else{
                that.nodes['content'].appendChild(that.params['node']);
            }
            // Set events
            if(that.params['eventNode'] == 'button'){
                cm.addClass(that.nodes['container'], 'has-hover-icon');
                cm.addEvent(that.nodes['button'], 'click', that.toggle);
            }else{
                cm.addEvent(that.nodes['titleContainer'], 'click', that.toggle);
            }
        }else{
            cm.addEvent(that.nodes['button'], 'click', that.toggle);
        }
        // Animation
        that.animations['target'] = new cm.Animation(that.nodes['target']);
        // Check toggle class
        that.isCollapsed = cm.isClass(that.nodes['container'], 'is-hide') || !cm.isClass(that.nodes['container'], 'is-show');
        // Check storage
        if(that.params['remember']){
            storageCollapsed = that.storageRead('isCollapsed');
            that.isCollapsed = storageCollapsed !== null ? storageCollapsed : that.isCollapsed;
        }
        // Trigger collapse event
        if(that.isCollapsed){
            that.collapse(true);
        }else{
            that.expand(true);
        }
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

    /* ******* PUBLIC ******* */

    that.setTitle = function(node){
        cm.clearNode(that.nodes['title']);
        if(cm.isString(node) || cm.isNumber(node)){
            cm.appendChild(cm.textNode(node), that.nodes['title']);
        }else{
            cm.appendNodes(node, that.nodes['title']);
        }
        return that;
    };

    that.setContent = function(node){
        var parent = that.nodes['content'] || that.nodes['target'];
        cm.clearNode(parent);
        if(cm.isString(node) || cm.isNumber(node)){
            cm.appendChild(cm.textNode(node), parent);
        }else{
            cm.appendNodes(node, parent);
        }
        return that;
    };

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
            cm.replaceClass(that.nodes['container'], 'is-hide', 'is-show');
            // Set title
            if(that.params['toggleTitle']){
                that.nodes['title'].innerHTML = that.lang('hide');
            }
            // Animate
            if(isImmediately){
                expandEnd();
            }else{
                that.nodes['target'].style.overflow = 'hidden';
                if(!that.nodes['target'].style.opacity){
                    that.nodes['target'].style.opacity = 0;
                }
                that.animations['target'].go({
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
            cm.replaceClass(that.nodes['container'], 'is-show', 'is-hide');
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
                that.animations['target'].go({
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