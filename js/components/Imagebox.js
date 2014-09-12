cm.define('Com.ImageBox', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'animated' : false,
        'effect' : 'none',
        'scrollNode' : 'document.window'
    }
},
function(params){
    var that = this,
        dimensions = {},
        pageDimensions = {};

    that.procced = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
    };

    var render = function(){
        if(that.params['animated']){
            cm.addClass(that.params['node'], ['pre', that.params['effect']].join('-'));
            cm.addEvent(that.params['scrollNode'], 'scroll', process);
            process();
        }
        that.triggerEvent('onRender');
    };

    var process = function(){
        if(!that.procced){
            getDimensions();
            getPageDimensions();
            // Rules for different block sizes.
            if(dimensions['height'] < pageDimensions['winHeight']){
                // Rules for block, which size is smaller than page's.
                if(
                    dimensions['y1'] >= 0 &&
                    dimensions['y2'] <= pageDimensions['winHeight']
                ){
                    doProcess();
                }
            }else{
                // Rules for block, which size is larger than page's.
                if(
                    (dimensions['y1'] < 0 && dimensions['y2'] >= pageDimensions['winHeight'] / 2) ||
                    (dimensions['y2'] > pageDimensions['winHeight'] && dimensions['y1'] <= pageDimensions['winHeight'] / 2)
                ){
                    doProcess();
                }
            }
        }
    };

    var doProcess = function(){
        that.procced = true;
        cm.addClass(that.params['node'], ['animated', that.params['effect']].join(' '));
    };
    
    var getDimensions = function(){
        dimensions['width'] = that.params['node'].offsetWidth;
        dimensions['height'] = that.params['node'].offsetHeight;
        dimensions['x1'] = cm.getRealX(that.params['node']);
        dimensions['y1'] = cm.getRealY(that.params['node']);
        dimensions['x2'] = dimensions['x1'] + dimensions['width'];
        dimensions['y2'] = dimensions['y1'] + dimensions['height'];
    };

    var getPageDimensions = function(){
        pageDimensions = cm.getPageSize();
    };

    /* ******* MAIN ******* */

    init();
});