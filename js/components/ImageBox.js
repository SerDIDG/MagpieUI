cm.define('Com.ImageBox', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'animated' : false,
        'effect' : 'none',
        'zoom' : false,
        'scrollNode' : window,
        'Com.GalleryPopup' : {}
    }
},
function(params){
    var that = this,
        dimensions = {},
        pageDimensions = {};

    that.nodes = {
        'items' : []
    };
    that.components = {};
    that.processed = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.getDataNodes(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['Com.GalleryPopup']['node'] = that.params['node'];
    };

    var render = function(){
        if(that.params['animated']){
            cm.addClass(that.params['node'], 'cm-animate');
            cm.addClass(that.params['node'], ['pre', that.params['effect']].join('-'));
            cm.addEvent(that.params['scrollNode'], 'scroll', process);
            process();
        }
        if(that.params['zoom']){
            cm.getConstructor('Com.GalleryPopup', function(classConstructor){
                that.components['popup'] = new classConstructor(that.params['Com.GalleryPopup']);
            });
        }
    };

    var process = function(){
        if(!that.processed){
            getDimensions();
            getPageDimensions();
            // Rules for different block sizes.
            if(dimensions['height'] < pageDimensions['winHeight']){
                // Rules for block, which size is smaller than page's.
                if(
                    dimensions['top'] >= 0 &&
                    dimensions['bottom'] <= pageDimensions['winHeight']
                ){
                    doProcess();
                }
            }else{
                // Rules for block, which size is larger than page's.
                if(
                    (dimensions['top'] < 0 && dimensions['bottom'] >= pageDimensions['winHeight'] / 2) ||
                    (dimensions['bottom'] > pageDimensions['winHeight'] && dimensions['top'] <= pageDimensions['winHeight'] / 2)
                ){
                    doProcess();
                }
            }
        }
    };

    var doProcess = function(){
        that.processed = true;
        cm.addClass(that.params['node'], ['animated', that.params['effect']].join(' '));
    };
    
    var getDimensions = function(){
        dimensions = cm.getRect(that.params['node']);
    };

    var getPageDimensions = function(){
        pageDimensions = cm.getPageSize();
    };

    /* ******* PUBLIC ******* */

    init();
});