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
                    that.nodes['canvasPalette'] = cm.Node('canvas', {'width' : '100%', 'height' : '100%'})
                ),
                cm.Node('div', {'class' : 'b-range'},
                    that.nodes['canvasRange'] = cm.Node('canvas', {'width' : '100%', 'height' : '100%'})
                )
            )
        );
        contextPalette = that.nodes['canvasPalette'].getContext('2d');
        contextRange = that.nodes['canvasRange'].getContext('2d');
        renderPalette('hsl(0, 100%, 50%)');
        renderRange();
        // Embed
        that.params['container'].appendChild(that.nodes['container']);
    };

    var afterRender = function(){
        that.triggerEvent('onRender');
    };

    var renderRange = function(){
        var gradient = contextRange.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, 'rgb(255, 0, 0)');
        gradient.addColorStop(1/6, 'rgb(255, 0, 255)');
        gradient.addColorStop(2/6, 'rgb(0, 0, 255)');
        gradient.addColorStop(3/6, 'rgb(0, 255, 255)');
        gradient.addColorStop(4/6, 'rgb(0, 255, 0)');
        gradient.addColorStop(5/6, 'rgb(255, 255, 0)');
        gradient.addColorStop(1, 'rgb(255, 0, 0)');
        contextRange.fillStyle = gradient;
        contextRange.fillRect(0, 0, 100, 100);
    };

    var renderPalette = function(color){
        var gradient;
        // Fill color
        contextPalette.rect(0, 0, 100, 100);
        contextPalette.fillStyle = color;
        contextPalette.fill();
        // Fill saturation
        gradient = contextPalette.createLinearGradient(0, 0, 100, 0);
        contextPalette.fillStyle = gradient;
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, 'transparent');
        contextPalette.fillRect(0, 0, 100, 100);
        // Fill brightness
        gradient = contextPalette.createLinearGradient(0, 0, 0, 100);
        contextPalette.fillStyle = gradient;
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'black');
        contextPalette.fillRect(0, 0, 100, 100);
    };

    /* ******* MAIN ******* */

    init();
});