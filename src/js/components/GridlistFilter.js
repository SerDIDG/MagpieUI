cm.define('Com.GridlistFilter', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onRenderContentStart',
        'onRenderContent',
        'onRenderContentProcess',
        'onRenderContentEnd'
    ],
    'params' : {
        'controllerEvents' : true,
        'renderStructure' : true,
        'renderStructureContent' : true,
        'embedStructureOnRender' : true,
        'embedStructure' : 'append',
        'controller' : null,
        'minLength' : 0,
        'delay' : 'cm._config.requestDelay',
        'action' : {}                             // Params object. Variables: %query%
    },
    'strings' : {
        'placeholder' : 'Type query...'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.GridlistFilter', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Variables
        that.requestDelay = null;
        // Binds
        that.inputEventHandler = that.inputEvent.bind(that);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    /******* VIEW MODEL *******/

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__gridlist__filter'});
        // Component content
        cm.appendChild(that.nodes['contentContainer'], that.nodes['container']);
        if(that.params['renderStructureContent']){
            that.nodes['contentContainer'] = that.renderContent();
            cm.appendChild(that.nodes['contentContainer'], that.nodes['container']);
        }
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Find Gridlist
        if(that.params['controller']){
            that.components['controller'] = that.params['controller'];
        }
        return that;
    };

    /******* FILTER *******/

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        // Structure
        that.triggerEvent('onRenderContentStart');
        nodes['container'] = cm.node('div', {'class' : 'pt__input'},
            nodes['input'] = cm.node('input', {'type' : 'search', 'autocomplete' : 'off', 'placeholder' : that.lang('placeholder')}),
            nodes['icon'] = cm.node('div', {'class' : 'icon icon svg__search'})
        );
        that.triggerEvent('onRenderContent');
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(nodes['input'], 'input', that.inputEventHandler);
        that.triggerEvent('onRenderContentEnd');
        // Export
        return nodes['container'];
    };

    classProto.inputEvent = function(){
        var that = this,
            query = that.nodes['content']['input'].value,
            config = cm.clone(that.params['action']);
        // Clear previous request
        that.requestDelay && clearTimeout(that.requestDelay);
        that.components['controller'] && that.components['controller'].abort();
        // Request
        if(query.length >= that.params['minLength']){
            that.requestDelay = setTimeout(function(){
                that.callbacks.request(that, {
                    'config' : config,
                    'query' : query
                });
            }, that.params['delay']);
        }
    };

    /******* CALLBACKS *******/

    classProto.callbacks.prepare = function(that, params){
        params['config'] = that.callbacks.beforePrepare(that, params);
        params['config'] = cm.objectReplace(params['config'], {
            '%query%' : params['query']
        });
        params['config'] = that.callbacks.afterPrepare(that, params);
        return params['config'];
    };

    classProto.callbacks.beforePrepare = function(that, params){
        return params['config'];
    };

    classProto.callbacks.afterPrepare = function(that, params){
        return params['config'];
    };

    classProto.callbacks.request = function(that, params){
        params = cm.merge({
            'response' : null,
            'data' : null,
            'config' : null,
            'query' : ''
        }, params);
        // Validate config
        params['config'] = that.callbacks.prepare(that, params);
        // Set new action to Gridlist
        that.components['controller'] && that.components['controller'].setAction({
            'params' : params['config']
        });
    };

    /******* PUBLIC *******/

    classProto.reset = function(){
        var that = this;
        that.nodes['content']['input'].value = '';
        that.inputEvent();
        return that;
    };

});