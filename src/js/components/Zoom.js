cm.define('Com.Zoom', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onOpenStart',
        'onOpen',
        'onClose',
        'onCloseStart'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : 'document.body',
        'name' : '',
        'src' :'',
        'duration' : 'cm._config.animDuration',
        'autoOpen' : true,
        'removeOnClose' : true,
        'documentScroll' : false
    }
},
function(params){
    var that = this,
        imageRect,
        innerRect,
        widthRatio,
        heightRatio;

    that.isOpen = false;
    that.isLoad = false;
    that.nodes = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.params['autoOpen'] && that.open();
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__zoom'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        cm.addEvent(that.nodes['container'], 'click', that.close);
    };

    var renderImage = function(){
        that.nodes['image'] = cm.node('img');
        cm.addEvent(that.nodes['image'], 'load', function(){
            that.isLoad = true;
            // Get image properties
            calculateHelper();
            calculateAction();
        });
        that.nodes['image'].src = that.params['src'];
        // Append
        that.nodes['inner'].appendChild(that.nodes['image']);
    };

    var calculateHelper = function(){
        imageRect = cm.getRect(that.nodes['image']);
        innerRect = cm.getRect(that.nodes['inner']);
        widthRatio = (imageRect['width'] - innerRect['width']) / innerRect['width'];
        heightRatio = (imageRect['height'] - innerRect['height']) / innerRect['height'];
    };

    var calculateAction = function(){
        if(that.isLoad){
            var setX = -cm._clientPosition['left'] * widthRatio,
                setY = -cm._clientPosition['top'] * heightRatio;
            cm.setCSSTranslate(that.nodes['image'], [setX, 'px'].join(''), [setY, 'px'].join(''));
        }
    };

    var clickAction = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 27){
            // ESC key
            that.close();
        }
    };

    var resizeAction = function(){
        calculateHelper();
        calculateAction();
    };

    var moveAction = function(){
        calculateAction();
    };

    var appendEvents = function(){
        cm.addEvent(window, 'mousemove', moveAction);
        cm.addEvent(window, 'resize', resizeAction);
        cm.addEvent(window, 'keydown', clickAction);
    };

    var removeEvents = function(){
        cm.removeEvent(window, 'mousemove', moveAction);
        cm.removeEvent(window, 'resize', resizeAction);
        cm.removeEvent(window, 'keydown', clickAction);
    };

    /* ******* PUBLIC ******* */

    that.set = function(src){
        that.isLoad = false;
        that.params['src'] = src;
        return that;
    };

    that.open = function(){
        if(!that.isOpen){
            that.isOpen = true;
            appendEvents();
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.addClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Append
            that.nodes['container'].style.display = 'block';
            if(!cm.inDOM(that.nodes['container'])){
                that.params['container'].appendChild(that.nodes['container']);
            }
            renderImage();
            // Animate
            cm.transition(that.nodes['container'], {
                'properties' : {'opacity' : 1},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'onStop' : function(){
                    // Event
                    that.triggerEvent('onOpen');
                }
            });
            // Event
            that.triggerEvent('onOpenStart');
        }
        return that;
    };

    that.close = function(){
        if(that.isOpen){
            that.isOpen = false;
            removeEvents();
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.removeClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Animate
            cm.transition(that.nodes['container'], {
                'properties' : {'opacity' : 0},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'onStop' : function(){
                    // Remove Window
                    that.nodes['container'].style.display = 'none';
                    that.params['removeOnClose'] && cm.remove(that.nodes['container']);
                    cm.remove(that.nodes['image']);
                    // Event
                    that.triggerEvent('onClose');
                }
            });
            // Event
            that.triggerEvent('onCloseStart');
        }
        return that;
    };

    init();
});
