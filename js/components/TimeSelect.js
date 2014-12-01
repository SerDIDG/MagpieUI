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
        'onChange',
        'onClear'
    ],
    'params' : {
        'container' : false,
        'input' : cm.Node('input', {'type' : 'text'}),
        'renderSelectsInBody' : true,
        'format' : 'cm._config.timeFormat',
        'showTitleTag' : true,
        'title' : false,
        'withHours' : true,
        'hoursInterval' : 0,
        'withMinutes' : true,
        'minutesInterval' : 0,
        'withSeconds' : false,
        'secondsInterval' : 0,
        'selected' : 0,
        'langs' : {
            'separator' : ':',
            'Hours' : 'HH',
            'Minutes' : 'MM',
            'Seconds' : 'SS',
            'HoursTitle' : 'Hours',
            'MinutesTitle' : 'Minutes',
            'SecondsTitle' : 'Seconds'
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {};

    that.date = new Date();
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
        if(cm.isEmpty(that.params['hoursInterval'])){
            that.params['hoursInterval'] = 1;
        }
        if(cm.isEmpty(that.params['minutesInterval'])){
            that.params['minutesInterval'] = 1;
        }
        if(cm.isEmpty(that.params['secondsInterval'])){
            that.params['secondsInterval'] = 1;
        }
    };

    var render = function(){
        var hours = 0,
            minutes = 0,
            seconds = 0;
        /* *** STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com-timeselect'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            nodes['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        /* *** ITEMS *** */
        // Hours
        if(that.params['withHours']){
            if(nodes['inner'].childNodes.length){
                nodes['inner'].appendChild(cm.Node('div', {'class' : 'sep'}, that.lang('separator')));
            }
            nodes['inner'].appendChild(cm.Node('div', {'class' : 'field'},
                nodes['selectHours'] = cm.Node('select', {'placeholder' : that.lang('Hours'), 'title' : that.lang('HoursTitle')})
            ));
            while(hours < 24){
                nodes['selectHours'].appendChild(
                    cm.Node('option', {'value' : hours},cm.addLeadZero(hours))
                );
                hours += that.params['hoursInterval'];
            }
        }
        // Minutes
        if(that.params['withMinutes']){
            if(nodes['inner'].childNodes.length){
                nodes['inner'].appendChild(cm.Node('div', {'class' : 'sep'}, that.lang('separator')));
            }
            nodes['inner'].appendChild(cm.Node('div', {'class' : 'field'},
                nodes['selectMinutes'] = cm.Node('select', {'placeholder' : that.lang('Minutes'), 'title' : that.lang('MinutesTitle')})
            ));
            while(minutes < 60){
                nodes['selectMinutes'].appendChild(
                    cm.Node('option', {'value' : minutes}, cm.addLeadZero(minutes))
                );
                minutes += that.params['minutesInterval'];
            }
        }
        // Seconds
        if(that.params['withSeconds']){
            if(nodes['inner'].childNodes.length){
                nodes['inner'].appendChild(cm.Node('div', {'class' : 'sep'}, that.lang('separator')));
            }
            nodes['inner'].appendChild(cm.Node('div', {'class' : 'field'},
                nodes['selectSeconds'] = cm.Node('select', {'placeholder' : that.lang('Seconds'), 'title' : that.lang('SecondsTitle')})
            ));
            while(seconds < 60){
                nodes['selectSeconds'].appendChild(
                    cm.Node('option', {'value' : seconds},cm.addLeadZero(seconds))
                );
                seconds += that.params['secondsInterval'];
            }
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
        if(that.params['withHours']){
            components['selectHours'] = new Com.Select({
                    'select' : nodes['selectHours'],
                    'renderInBody' : that.params['renderSelectsInBody']
                }).addEvent('onChange', function(){
                    set(true);
                });
        }
        // Minutes select
        if(that.params['withMinutes']){
            components['selectMinutes'] = new Com.Select({
                    'select' : nodes['selectMinutes'],
                    'renderInBody' : that.params['renderSelectsInBody']
                }).addEvent('onChange', function(){
                    set(true);
                });
        }
        // Seconds select
        if(that.params['withSeconds']){
            components['selectSeconds'] = new Com.Select({
                    'select' : nodes['selectSeconds'],
                    'renderInBody' : that.params['renderSelectsInBody']
                })
                .addEvent('onChange', function(){
                    set(true);
                });
        }
        // Trigger onRender Event
        that.triggerEvent('onRender');
    };

    var set = function(triggerEvents){
        that.previousValue = that.value;
        that.params['withHours'] && that.date.setHours(components['selectHours'].get());
        that.params['withMinutes'] && that.date.setMinutes(components['selectMinutes'].get());
        that.params['withSeconds'] && that.date.setSeconds(components['selectSeconds'].get());
        that.value = cm.dateFormat(that.date, that.params['format']);
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
        format = typeof format != 'undefined'? format : that.params['format'];
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Get time
        if(cm.isEmpty(str) || typeof str == 'string' && new RegExp(cm.dateFormat(false, that.params['format'])).test(str)){
            that.clear();
            return that;
        }else if(typeof str == 'object'){
            that.date = str;
        }else{
            that.date = cm.parseDate(str, format);
        }
        // Set components
        that.params['withHours'] && components['selectHours'].set(that.date.getHours(), false);
        that.params['withMinutes'] && components['selectMinutes'].set(that.date.getMinutes(), false);
        that.params['withSeconds'] && components['selectSeconds'].set(that.date.getSeconds(), false);
        // Set time
        set(triggerEvents);
        return that;
    };

    that.get = function(){
        return that.value;
    };

    that.getDate = function(){
        return that.date;
    };

    that.getHours = function(){
        return that.date.getHours();
    };

    that.getMinutes = function(){
        return that.date.getMinutes();
    };

    that.getSeconds = function(){
        return that.date.getSeconds();
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Clear time
        that.date.setHours(0);
        that.date.setMinutes(0);
        that.date.setSeconds(0);
        // Clear components
        that.params['withHours'] && components['selectHours'].set(that.date.getHours(), false);
        that.params['withMinutes'] && components['selectMinutes'].set(that.date.getMinutes(), false);
        that.params['withSeconds'] && components['selectSeconds'].set(that.date.getSeconds(), false);
        // Set time
        set(false);
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            onChange();
        }
        return that;
    };

    init();
});