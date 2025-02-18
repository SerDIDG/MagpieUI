cm.define('Com.Notifications', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onAdd',
        'onRemove',
        'onClear'
    ],
    'params' : {
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'embedStructure' : 'append',
        'iconClasses' : ['icon', 'small', 'linked'],
        'closable' : true,
        'items': [],
        'Com.ToggleBox' : {
            'toggleTitle' : false,
            'className' : null,
            'duration' : 'cm._config.animDuration',
        }
    },
    'strings' : {
        'close' : 'Close',
        'more' : 'Read more'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.Notifications', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        that.items = [];
        // Call parent method - construct
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.renderView = function(){
        var that = this;

        // Structure
        that.nodes['container'] = cm.node('div', {'classes' : 'com__notifications is-hidden'},
            that.nodes['list'] = cm.node('ul')
        );

        // Render items
        cm.forEach(that.params.items, that.add.bind(that));
    };

    classProto.clear = function(){
        var that = this;
        while(that.items.length){
            that.remove(that.items[0]);
        }
        that.triggerEvent('onClear');
        return that;
    };

    classProto.add = function(item){
        var that = this;
        
        // Config
        item = cm.merge({
            'label' : '',
            'type' : 'warning',           // success | warning | danger
            'messages' : [],
            'collapsed' : true,
            'closable': that.params['closable'],
            'nodes' : {}
        }, item);
        
        // Structure
        item['nodes']['container'] = cm.node('li', {'classes' : item['type']},
            item['nodes']['descr'] = cm.node('div', {'classes' : 'descr'}),
            item['nodes']['messages'] = cm.node('div', {'classes' : 'messages'},
                item['nodes']['messagesList'] = cm.node('ul')
            )
        );
        
        // Close action
        if (item['closable']) {
            item.iconClasses = cm.clone(that.params.iconClasses);
            item.iconClasses.push(['svg__close', item['type']].join('-'));
            item['nodes']['close'] = cm.node('div', {'classes' : item.iconClasses, 'title' : that.lang('close'), 'role' : 'button', 'tabindex' : 0});
            cm.insertFirst(item['nodes']['close'], item['nodes']['container']);
            cm.click.add(item['nodes']['close'], function(){
                that.remove(item);
            });
        }
        
        // Label
        if(!cm.isNode(item['label']) && !cm.isTextNode(item['label'])){
            item['label'] = cm.node('div', {'innerHTML' : item['label']});
        }
        cm.appendChild(item['label'], item['nodes']['descr']);
        
        // Messages
        if(!cm.isEmpty(item['messages'])){
            // Button
            item['nodes']['button'] = cm.node('a', {'classes' : 'more'}, that.lang('more'));
            cm.insertFirst(item['nodes']['button'], item['nodes']['descr']);
            // List
            cm.forEach(item['messages'], function(message){
                cm.appendChild(cm.node('li', message), item['nodes']['messagesList']);
            });
            // Toggle
            cm.getConstructor('Com.ToggleBox', function(classConstructor){
                item['controller'] = new classConstructor(
                    cm.merge(that.params['Com.ToggleBox'], {
                        'nodes' : {
                            'container' : item['nodes']['container'],
                            'button' : item['nodes']['button'],
                            'target' : item['nodes']['messages']
                        }
                    })
                );
            });
        }
        
        // Embed
        cm.appendChild(item['nodes']['container'], that.nodes['list']);
        cm.removeClass(that.nodes['container'], 'is-hidden');
        
        // Push
        that.items.push(item);
        that.triggerEvent('onAdd', item);
        return that;
    };

    classProto.remove = function(item){
        var that = this;
        cm.remove(item['nodes']['container']);
        cm.arrayRemove(that.items, item);
        if(that.items.length === 0){
            cm.addClass(that.nodes['container'], 'is-hidden');
        }
        that.triggerEvent('onRemove', item);
        return that;
    };

    classProto.getLength = function(){
        var that = this;
        return that.items.length;
    };
});
