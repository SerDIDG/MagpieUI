Com.Elements['Glossary'] = {};

Com['GetGlossary'] = function(id){
    return Com.Elements.Glossary[id] || null;
};

Com['Glossary'] = function(o){
    var that = this,
        config = cm.merge({
            'glossary' : false
        }, o),
        nodes = {},
        components = {};

    var init = function(){
        // Collect nodes
        nodes['container'] = config['glossary'];
        nodes['title'] = cm.getByClass('com-glossary-title', nodes['container'])[0];
        nodes['popup'] = cm.getByClass('com-glossary-popup', nodes['container'])[0];

        if(nodes['popup'] && nodes['title']){
            // Tooltip Structure
            nodes['tooltip'] = cm.Node('div', {'class' : 'com-glossary-text'},
                cm.Node('p',
                    nodes['popup']
                )
            );
            // Init tooltip
            components['tooltip'] = new Com.Tooltip({
                'className' : 'com-glossary-tooltip',
                'target' : nodes['container'],
                'targetEvent' : 'hover',
                'top' : '-16',
                'left' : '-17',
                'title' : nodes['title'].cloneNode(true),
                'titleTag' : 'div',
                'content' : nodes['tooltip']
            });
        }
    };

    /* *** Main *** */

    that.remove = function(){
        if(components['tooltip']){
            components['tooltip'].remove();
            components['tooltip'] = null;
            nodes['container'].appendChild(nodes['popup']);
        }
        return that;
    };

    init();
};

Com['GlossaryCollector'] = function(node, attribute, value){
    var glossaries,
        id,
        glossary;

    var init = function(node){
        if(!node){
            render(document.body);
        }else if(node.constructor == Array){
            cm.forEach(node, render);
        }else{
            render(node);
        }
    };

    var render = function(node){
        value = attribute && value? value : 'true';
        attribute = attribute || 'data-com-glossary';
        glossaries = cm.clone((node.getAttribute(attribute) == value) ? [node] : cm.getByAttr(attribute, value, node));
        // Render glossaries
        cm.forEach(glossaries, function(item){
            glossary = new Com.Glossary({'glossary' : item});
            if(id = item.id){
                Com.Elements.Glossary[id] = glossary;
            }
        });
    };

    init(node);
};