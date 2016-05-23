cm.define('Com.Ajax', {
    'modules' : [
        'Params',
        'Events',
        'Callbacks'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'url' : '',
        'data' : {},
        'form' : false,                                         // Provide form node to send it as iframe
        'method' : 'post',                                      // delete | get | head | post | put
        'requestType' : 'default',                              // default | form-data | jsonp | iframe
        'responseType' : 'json',                                // text | xml | json
        'send' : true,
        'async' : true,
        'withCredentials' : false,
        'headers' : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'X-Requested-With' : 'XMLHttpRequest'
        },
        'xhr' : cm.createXmlHttpRequestObject()
    }
},
function(params){
    var that = this;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.callbacksProcess();
        validateParams();
        render();
        that.triggerEvent('onRender');
        that.params['send'] && that.send();
    };

    var validateParams = function(){
        that.params['responseType'] = that.params['responseType'].toLowerCase();
        that.params['requestType'] = that.params['requestType'].toLowerCase();
        that.params['method'] = that.params['method'].toLowerCase();
        // Convert data
        if(/delete|get|head/.test(that.params['method'])){
            that.params['data'] = convertData(that.params['data'], 'uri');
        }else{
            if(that.params['requestType'] == 'form-data'){
                that.params['data'] = convertData(that.params['data'], 'form-data');
            }else if(that.params['requestType'] == 'iframe'){
                that.params['data'] = convertData(that.params['data'], 'obj');
            }else{
                that.params['data'] = convertData(that.params['data'], 'uri');
            }
        }
        // Build request link
        if(/delete|get|head/.test(that.params['method'])){
            if(!cm.isEmpty(that.params['data'])){
                that.params['url'] = [that.params['url'], that.params['data']].join('?');
            }
        }
    };

    var convertData = function(data, type){
        switch(type){
            case 'form-data':
                if(data.constructor == FormData){
                    return data;
                }else{
                    return cm.obj2FormData(data);
                }
                break;
            case 'uri':
                if(data.constructor == FormData){
                    return cm.formData2URI(data);
                }else{
                    return cm.obj2URI(data);
                }
                break;
            case 'object':
                if(data.constructor == FormData){
                    return cm.formData2Obj(data);
                }else{
                    return data;
                }
                break;
            default:
                return data;
                break;
        }
    };

    var render = function(){
    };

    /* ******* PUBLIC ******* */

    that.send = function(){
        return that;
    };

    that.abort = function(){
        return that;
    };

    init();
});