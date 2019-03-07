cm.define('Com.HelpBubble', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'renderStructure' : false,
        'embedStructureOnRender' : false,
        'controllerEvents' : true,
        'title' : null,
        'content' : cm.node('span'),
        'type' : 'tooltip',                             // tooltip | container
        'showIcon' : true,
        'showLabel' : false,
        'tooltipConstructor' : 'Com.Tooltip',
        'tooltipParams' : {
            'className' : 'com__help-bubble__tooltip'
        },
        'containerConstructor' : 'Com.DialogContainer',
        'containerParams' : {
            'renderTitle' : true,
            'destructOnClose' : true
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct in current context
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.HelpBubble', function(classConstructor, className, classProto, classInherit){
    classProto.onDestruct = function(){
        var that = this;
        that.components['container'] && cm.isFunction(that.components['container'].destruct) && that.components['container'].destruct();
        that.components['tooltip'] && cm.isFunction(that.components['tooltip'].destruct) && that.components['tooltip'].destruct();
    };

    classProto.renderView = function(){
        var that = this;
        // Structure
        that.nodes['container'] = cm.node('span', {'class' : 'com__help-bubble'},
            that.nodes['button'] = cm.node('a', {'class' : 'com__help-bubble__title'}),
            that.nodes['content'] = cm.node('span', {'class' : 'com__help-bubble__content'})
        );
        // Icon
        if(that.params['showIcon']){
            that.nodes['icon'] = cm.node('span', {'class' : 'icon default linked'});
            cm.appendChild(that.nodes['icon'], that.nodes['button']);
        }
        // Label
        if(that.params['showLabel']){
            that.nodes['label'] = cm.node('span', {'class' : 'label'}, that.params['title']);
            cm.appendChild(that.nodes['label'], that.nodes['button']);
        }
        // Set Content
        that.set(that.params['content']);
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Init Placeholder
        switch(that.params['type']){
            case 'container':
                // Render container
                cm.getConstructor(that.params['containerConstructor'], function(classConstructor){
                    that.components['container'] = new classConstructor(
                        cm.merge(that.params['containerParams'], {
                            'node' : that.nodes['button'],
                            'title' : that.params['title'],
                            'content' : that.nodes['content']
                        })
                    );
                });
                break;

            default:
                // Render tooltip
                cm.getConstructor(that.params['tooltipConstructor'], function(classConstructor){
                    that.components['tooltip'] = new classConstructor(that.params['tooltipParams']);
                    that.components['tooltip']
                        .setTarget(that.nodes['button'])
                        .setContent(that.nodes['content']);
                });
                break;
        }
    };

    /* ******* PUBLIC ******* */

    classProto.set = function(node){
        var that = this;
        cm.clearNode(that.nodes['content']);
        if(cm.isString(node) || cm.isNumber(node)){
            that.nodes['content'].innerHTML = node;
        }else{
            cm.appendNodes(node, that.nodes['content']);
        }
        return that;
    };
});