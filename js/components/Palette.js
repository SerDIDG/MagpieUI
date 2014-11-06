cm.define('Com.Palette', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'container' : cm.Node('div')
    }
},
function(params){
    var that = this,
        contextRange,
        contextPalette;

    that.nodes = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        afterRender();
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__palette'},
            that.nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                cm.Node('div', {'class' : 'b-palette'},
                    that.nodes['canvasPalette'] = cm.Node('canvas')
                ),
                cm.Node('div', {'class' : 'b-range'},
                    that.nodes['canvasRange'] = cm.Node('canvas', {'width' : '100%', 'height' : '100%'})
                )
            )
        );
        renderRange();
        // Embed
        that.params['container'].appendChild(that.nodes['container']);
    };

    var afterRender = function(){
        that.triggerEvent('onRender');
    };

    var renderRange = function(){
        contextRange = that.nodes['canvasRange'].getContext('2d');
        var gradient = contextRange.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, 'rgb(255, 0, 0)');
        gradient.addColorStop(1, 'rgb(255, 0, 255)');
        /*
        gradient.addColorStop(2, 'rgb(0, 0, 255)');
        gradient.addColorStop(3, 'rgb(0, 255, 255)');
        gradient.addColorStop(4, 'rgb(0, 255, 0)');
        gradient.addColorStop(5, 'rgb(255, 255, 0)');
        gradient.addColorStop(6, 'rgb(255, 0, 0)');
        */
        contextRange.fillStyle = gradient;
        contextRange.fillRect(0, 0, 100, 100);

    };

    /* ******* MAIN ******* */

    init();
});