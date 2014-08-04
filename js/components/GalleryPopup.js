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
        'width' : 'contain',                            // number | percentage | contains
        'showTitle' : true,
        'aspectRatio' : '16x9',                         // auto | 1x1 | 4x3 | 3x2 | 16x10 | 16x9 | 2x1 | 21x9 | 35x10 | 3x4 | 2x3 | 10x16 | 9x16 | 1x2
        'icons' : {
            'close' : 'icon medium close-white linked'
        },
        'Com.Dialog' : {
            'autoOpen' : false,
            'removeOnClose' : false,
            'titleOverflow' : true,
            'closeOnBackground' : true
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
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-gallery-preview bottom'},
            nodes['galleryContainer'] = cm.Node('div', {'class' : 'inner'})
        );
        // Set aspect ration
        if(/^(1x1|4x3|3x2|16x10|16x9|2x1|21x9|35x10|3x4|2x3|10x16|9x16|1x2)$/.test(that.params['aspectRatio'])){
            cm.addClass(nodes['container'], ['cm-aspect', that.params['aspectRatio']].join('-'))
        }
        // Calculate dialog dimensions
        // Dialogue
        components['dialog'] = new Com.Dialog(
                cm.merge(that.params['Com.Dialog'], {
                    'content' : nodes['container']
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