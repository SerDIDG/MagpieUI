cm.define('Com.FileStats', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'mfu' : 0,                                                    // Max files per upload
        'umf' : 0,                                                    // Max file size
        'quote' : 0,
        'usage' : 0
    },
    'strings' : {
        'stats' : 'Statistics',
        'mfu' : 'You can upload up to %mfu% files at a time.',
        'umf' : 'Max file size: %umf%.',
        'quote' : 'Total storage: %quote%.',
        'usage' : 'Storage used: %usage%.',
        'quote_unlimited' : 'Unlimited'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileStats', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.renderView = function(){
        var that = this,
            vars = {
                '%mfu%' : that.params['mfu'],
                '%umf%' : that.params['umf'],
                '%quote%' : that.params['quote'],
                '%usage%' : that.params['usage']
            };
        vars['%quote%'] = parseFloat(vars['%quote%']) === 0 ? that.lang('quote_unlimited') : vars['%quote%'] + ' Mb';
        vars['%usage%'] = vars['%usage%'] + ' Mb';
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-stats'},
            that.nodes['content'] = cm.node('div', {'class' : 'pt__line-info'},
                cm.node('div', {'class' : 'icon small info'}),
                cm.node('div', {'class' : 'item'}, that.lang('mfu', vars)),
                cm.node('div', {'class' : 'item'}, that.lang('umf', vars)),
                cm.node('div', {'class' : 'item'}, that.lang('quote', vars)),
                cm.node('div', {'class' : 'item'}, that.lang('usage', vars))
            )
        );
        // Events
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };
});