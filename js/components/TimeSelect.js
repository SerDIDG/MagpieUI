cm.define('Com.TimeSelect', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange'
    ],
    'params' : {
        'container' : false,
        'input' : cm.Node('input', {'type' : 'text'}),
        'renderInBody' : true,
        'format' : cm._config['timeFormat'],
        'showTitleTag' : true,
        'title' : false,
        'minutesInterval' : 0,
        'selected' : 0,
        'langs' : {
            'separator' : ':',
            'Hours' : 'Hours',
            'Minutes' : 'Minutes'
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {},
        date = new Date();

    that.value = 0;
    that.previousValue = 0;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['input']);
        validateParams();
        render();
        setMiscEvents();
        // Set selected time
        if(that.params['selected']){
            that.set(that.params['selected'], that.params['format'], false);
        }else{
            that.set(that.params['input'].value, that.params['format'], false);
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['title'] = that.params['input'].getAttribute('title') || that.params['title'];
        }
        if(cm.isEmpty(that.params['minutesInterval'])){
            that.params['minutesInterval'] = 1;
        }
    };

    var render = function(){
        var minutes = 0;
        /* *** STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com-timeselect'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            cm.Node('div', {'class' : 'inner'},
                cm.Node('div', {'class' : 'field'},
                    nodes['selectHours'] = cm.Node('select', {'placeholder' : that.lang('Hours')})
                ),
                cm.Node('div', {'class' : 'sep'}, that.lang('separator')),
                cm.Node('div', {'class' : 'field'},
                    nodes['selectMinutes'] = cm.Node('select', {'placeholder' : that.lang('Minutes')})
                )
            )
        );
        /* *** ITEMS *** */
        // Hours
        cm.forEach(24, function(item){
            nodes['selectHours'].appendChild(
                cm.Node('option', {'value' : item}, cm.addLeadZero(item))
            );
        });
        // Minutes
        while(minutes < 60){
            nodes['selectMinutes'].appendChild(
                cm.Node('option', {'value' : minutes},cm.addLeadZero(minutes))
            );
            minutes += that.params['minutesInterval'];
        }
        /* *** ATTRIBUTES *** */
        // Title
        if(that.params['showTitleTag'] && that.params['title']){
            nodes['container'].title = that.params['title'];
        }
        // Set hidden input attributes
        if(that.params['input'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', that.params['input'].getAttribute('name'));
        }
        /* *** INSERT INTO DOM *** */
        if(that.params['container']){
            that.params['container'].appendChild(nodes['container']);
        }else if(that.params['input'].parentNode){
            cm.insertBefore(nodes['container'], that.params['input']);
        }
        cm.remove(that.params['input']);
    };

    var setMiscEvents = function(){
        // Hours select
        components['selectHours'] = new Com.Select({
                'select' : nodes['selectHours'],
                'renderInBody' : that.params['renderSelectsInBody']
            })
            .addEvent('onChange', function(){
                set(true);
            });
        // Minutes select
        components['selectMinutes'] = new Com.Select({
                'select' : nodes['selectMinutes'],
                'renderInBody' : that.params['renderSelectsInBody']
            })
            .addEvent('onChange', function(){
                set(true);
            });
        // Trigger onRender Event
        that.triggerEvent('onRender');
    };

    var set = function(triggerEvents){
        that.previousValue = that.value;
        date.setHours(components['selectHours'].get());
        date.setMinutes(components['selectMinutes'].get());
        that.value = cm.dateFormat(date, that.params['format']);
        nodes['hidden'].value = that.value;
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            onChange();
        }
    };

    var onChange = function(){
        if(!that.previousValue || (!that.value && that.previousValue) || (that.value != that.previousValue)){
            that.triggerEvent('onChange', that.value);
        }
    };

    /* ******* MAIN ******* */

    that.set = function(str, format, triggerEvents){
        if(!cm.isEmpty(str)){
            format = typeof format != 'undefined'? format : that.params['format'];
            triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;

            date = cm.parseDate(str, format);
            components['selectHours'].set(date.getHours(), false);
            components['selectMinutes'].set(date.getMinutes(), false);
            set(triggerEvents);
        }
        return that;
    };

    that.get = function(){
        return that.value;
    };

    init();
});