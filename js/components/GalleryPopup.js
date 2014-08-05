cm.define('Com.GalleryPopup', {
    'modules' : [
        'Params',
        'DataConfig',
        'Events'
    ],
    'events' : [
        'onOpen',
        'onClose',
        'onChange'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'duration' : 300,
        'size' : 'fullscreen',                   // fullscreen | auto
        'aspectRatio' : 'auto',                  // auto | 1x1 | 4x3 | 3x2 | 16x10 | 16x9 | 2x1 | 21x9 | 35x10 | 3x4 | 2x3 | 10x16 | 9x16 | 1x2
        'theme' : 'theme-black',
        'showTitle' : true,
        'icons' : {
            'close' : 'icon medium close-white linked'
        },
        'Com.Dialog' : {
            'width' : '700',
            'autoOpen' : false,
            'removeOnClose' : false,
            'titleOverflow' : true,
            'closeOnBackground' : true,
            'className' : 'com-gallery-popup'
        },
        'Com.Gallery' : {
            'showCaption' : false
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        setLogic();
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-gallery-preview bottom'},
            nodes['galleryContainer'] = cm.Node('div', {'class' : 'inner'})
        );
        // Set aspect ration
        if(that.params['aspectRatio'] != 'auto'){
            cm.addClass(nodes['container'], ['cm-aspect', that.params['aspectRatio']].join('-'))
        }
    };

    var setLogic = function(){
        // Dialogue
        components['dialog'] = new Com.Dialog(
                cm.merge(that.params['Com.Dialog'], {
                    'content' : nodes['container'],
                    'theme' : that.params['theme'],
                    'size' : that.params['size']
                })
            )
            .addEvent('onOpen', function(){
                that.triggerEvent('onOpen');
            })
            .addEvent('onClose', function(){
                that.triggerEvent('onClose');
            });
        // Gallery
        components['gallery'] = new Com.Gallery(
                cm.merge(that.params['Com.Gallery'], {
                    'node' : that.params['node'],
                    'container' : nodes['galleryContainer']
                })
            )
            .addEvent('onSet', components['dialog'].open)
            .addEvent('onChange', onChange);
    };

    var onChange = function(gallery, data){
        // Set caption
        if(that.params['showTitle']){
            components['dialog'].setTitle(data['current']['title']);
        }
        that.triggerEvent('onChange');
    };

    /* ******* MAIN ******* */

    that.open = function(){
        components['dialog'].open();
        return that;
    };

    that.close = function(){
        components['dialog'].close();
        return that;
    };

    that.set = function(i){
        components['gallery'].set(i);
        return that;
    };

    that.next = function(){
        components['gallery'].next();
        return that;
    };

    that.prev = function(){
        components['gallery'].prev();
        return that;
    };

    init();
});