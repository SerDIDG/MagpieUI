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
                        'height' : [cm.getRealHeight(that.nodes['target']), 'px'].join(''),
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

/*
Com['ToggleBoxAccordion'] = function(node){
	var boxes = [],
        toggleboxes,
        togglebox;

    var init = function(node){
        if(!node){
            render(document.body);
        }else if(node.constructor == Array){
            cm.forEach(node, render);
        }else{
            render(node);
        }
    };
	
	var render = function(node){
        toggleboxes = cm.clone((node.getAttribute('data-togglebox') == 'true') ? [node] : cm.getByAttr('data-togglebox', 'true', node));
        cm.forEach(toggleboxes, function(item){
            var langShow = item.getAttribute('data-togglebox-show'),
                langHide = item.getAttribute('data-togglebox-hide');
            // Init togglebox and push to array
            togglebox = new Com.ToggleBox({
                'button' : item.getElementsByTagName('dt')[0],
                'block' : item.getElementsByTagName('dd')[0],
                'titleNode' : cm.getByAttr('data-togglebox-titlenode', 'true', item)[0],
                'useLangs' : langShow && langHide,
                'langs' : {
                    'showTitle' : langShow,
                    'hideTitle' : langHide
                },
                'events' : {
                    'onShowStart' : hide
                }
            });
            boxes.push(togglebox);
        });
	};
	
	var hide = function(me){
		cm.forEach(boxes, function(item){
			if(me !== item){
				item.hide();
			}
		});
	};
	
	init(node);
};
*/

Com['ToggleBoxGridlist'] = function(o){
    var config = cm.merge({
            'node' : cm.Node('div'),
            'useLangs' : false,
            'langs' : {
                'showTitle' : 'Show',
                'hideTitle' : 'Hide'
            }
        }, o),
        buttons = [],
        boxes = {};

    var init = function(){
        // Get buttons
        buttons = cm.getByAttr('data-togglebox-button', 'true', config['node']);
        // Get blocks
        for(var i = 0, l = buttons.length; i < l; i++){
            renderItem(buttons[i]);
        }
    };

    var renderItem = function(button){
        var id = button.getAttribute('data-gridlist-for'),
            blocks = cm.getByAttr('data-gridlist-id', id, config['node']),
            subs = cm.getByAttr('data-gridlist-parent-id', id, config['node']);
        // Add event
        cm.addEvent(button, 'click', function(){
            if(boxes[id]['isHide']){
                show(id);
            }else{
                hide(id);
            }
        });
        // Collect
        boxes[id] = {
            'id' : id,
            'item' : cm.getByAttr('data-gridlist-item', id, config['node'])[0],
            'button' : button,
            'blocks' : blocks,
            'subs' : subs,
            'isHide' : cm.isClass(blocks[0], 'display-none')
        };
    };

    var show = function(id){
        boxes[id]['isHide'] = false;
        for(var i = 0, l = boxes[id]['blocks'].length; i < l; i++){
            cm.removeClass(boxes[id]['blocks'][i], 'display-none');
            cm.addClass(boxes[id]['blocks'][i], 'is-show');
        }
        cm.addClass(boxes[id]['item'], 'is-show');
        if(config['useLangs']){
            boxes[id]['button'].innerHTML = config['langs']['hideTitle'];
        }
    };

    var hide = function(id){
        boxes[id]['isHide'] = true;
        if(boxes[id]['subs']){
            cm.forEach(boxes[id]['subs'], function(item){
                var subId = item.getAttribute('data-gridlist-id');
                if(subId != id){
                    hide(subId);
                }
            });
        }
        cm.forEach(boxes[id]['blocks'], function(item){
            cm.addClass(item, 'display-none');
            cm.removeClass(item, 'is-show');
        });
        cm.removeClass(boxes[id]['item'], 'is-show');
        if(config['useLangs']){
            boxes[id]['button'].innerHTML = config['langs']['showTitle'];
        }
    };

    init();
};


