Com.Elements['Datepicker'] = {};

Com['GetDatepicker'] = function(id){
    return Com.Elements.Datepicker[id] || null;
};

cm.define('Com.Datepicker', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Structure',
        'Langs',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange',
        'onClear',
        'onFocus',
        'onBlur'
    ],
    'params' : {
        'input' : null,                                                     // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'customEvents' : true,
        'renderInBody' : true,
        'format' : 'cm._config.dateFormat',
        'displayFormat' : 'cm._config.displayDateFormat',
        'isDateTime' : false,
        'dateTimeFormat' : 'cm._config.dateTimeFormat',
        'displayDateTimeFormat' : 'cm._config.displayDateTimeFormat',
        'setEmptyDateByFormat' : true,
        'minutesInterval' : 1,
        'startYear' : 1950,                                                 // number | current
        'endYear' : 'current + 10',                                         // number | current
        'startWeekDay' : 0,
        'showTodayButton' : true,
        'showClearButton' : false,
        'showTitleTooltip' : true,
        'showPlaceholder' : true,
        'title' : '',
        'placeholder' : '',
        'menuMargin' : 4,
        'value' : 0,
        'disabled' : false,
        'icons' : {
            'datepicker' : 'icon default linked',
            'clear' : 'icon default linked'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : false,
            'className' : 'com__datepicker__tooltip',
            'top' : cm._config.tooltipDown
        }
    },
    'strings' : {
        'daysAbbr' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        'days' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'Clear date' : 'Clear date',
        'Today' : 'Today',
        'Now' : 'Now',
        'Time' : 'Time:'
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {};

    that.date = null;
    that.previousDate = null;
    that.value = null;
    that.previousValue = null;
    that.format = null;
    that.displayFormat = null;
    that.disabled = false;
    that.isDestructed = null;

    var init = function(){
        that.destructHandler = that.destruct.bind(that);
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setLogic();
        setEvents();
        // Add to stack
        that.addToStack(nodes['container']);
        // Set selected date
        if(that.params['value']){
            that.set(that.params['value'], that.format, false);
        }else{
            that.set(that.params['node'].value, that.format, false);
        }
        // Trigger events
        that.triggerEvent('onRender', that.value);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['disabled'] = that.params['node'].disabled || that.params['disabled'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        if(that.params['value'] === 'now'){
            that.params['value'] = new Date();
        }
        if(/current/.test(that.params['startYear'])){
            that.params['startYear'] = eval(cm.strReplace(that.params['startYear'], {'current' : new Date().getFullYear()}));
        }
        if(/current/.test(that.params['endYear'])){
            that.params['endYear'] = eval(cm.strReplace(that.params['endYear'], {'current' : new Date().getFullYear()}));
        }
        that.format = that.params['isDateTime']? that.params['dateTimeFormat'] : that.params['format'];
        that.displayFormat = that.params['isDateTime']? that.params['displayDateTimeFormat'] : that.params['displayFormat'];
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com__datepicker-input'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            nodes['target'] = cm.Node('div', {'class' : 'pt__input has-icon-right'},
                nodes['input'] = cm.Node('input', {'type' : 'text'}),
                nodes['icon'] = cm.Node('div', {'class' : that.params['icons']['datepicker']})
            ),
            nodes['menuContainer'] = cm.Node('div', {'class' : 'form'},
                nodes['calendarContainer'] = cm.Node('div', {'class' : 'calendar-holder'})
            )
        );
        /* *** ATTRIBUTES *** */
        // Title
        if(that.params['showTitleTooltip'] && !cm.isEmpty(that.params['title'])){
            nodes['container'].title = that.params['title'];
        }
        // ID
        if(that.params['node'].id){
            nodes['container'].id = that.params['node'].id;
        }
        // Set hidden input attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Placeholder
        if(that.params['showPlaceholder'] && !cm.isEmpty(that.params['placeholder'])){
            nodes['input'].setAttribute('placeholder', that.params['placeholder']);
        }
        // Clear Button
        if(that.params['showClearButton']){
            cm.addClass(nodes['container'], 'has-clear-button');
            nodes['container'].appendChild(
                nodes['clearButton'] = cm.Node('div', {'class' : that.params['icons']['clear'], 'title' : that.lang('Clear date')})
            );
        }
        // Today / Now Button
        if(that.params['showTodayButton']){
            nodes['menuContainer'].appendChild(
                nodes['todayButton'] = cm.Node('div', {'class' : 'button today is-wide'}, that.lang(that.params['isDateTime']? 'Now' : 'Today'))
            );
        }
        // Time Select
        if(that.params['isDateTime']){
            nodes['timeHolder'] = cm.Node('div', {'class' : 'time-holder'},
                cm.Node('dl', {'class' : 'form-box'},
                    cm.Node('dt', that.lang('Time')),
                    nodes['timeContainer'] = cm.Node('dd')
                )
            );
            cm.insertAfter(nodes['timeHolder'], nodes['calendarContainer']);
        }
        /* *** INSERT INTO DOM *** */
        that.embedStructure(nodes['container']);
    };

    var setLogic = function(){
        cm.addEvent(nodes['input'], 'keypress', inputKeypressHandler);
        cm.addEvent(nodes['input'], 'keyup', inputKeyHandler);
        // Clear Button
        if(that.params['showClearButton']){
            cm.addEvent(nodes['clearButton'], 'click', function(){
                that.clear();
                components['menu'].hide(false);
            });
        }
        // Today / Now Button
        if(that.params['showTodayButton']){
            cm.addEvent(nodes['todayButton'], 'click', function(){
                that.set(new Date());
                components['menu'].hide(false);
            });
        }
        // Render tooltip
        components['menu'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['renderInBody'] ? document.body : nodes['container'],
                'content' : nodes['menuContainer'],
                'target' : nodes['target'],
                'events' : {
                    'onShowStart' : onShow,
                    'onHideStart' : onHide
                }
            })
        );
        // Render calendar
        components['calendar'] = new Com.Calendar({
            'node' : nodes['calendarContainer'],
            'renderSelectsInBody' : false,
            'className' : 'com__datepicker-calendar',
            'startYear' : that.params['startYear'],
            'endYear' : that.params['endYear'],
            'startWeekDay' : that.params['startWeekDay'],
            'langs' : that.params['langs'],
            'renderMonthOnInit' : false,
            'events' : {
                'onMonthRender' : function(){
                    if(that.date){
                        components['calendar'].selectDay(that.date);
                    }
                },
                'onDayClick' : function(calendar, params){
                    setDate(null, null, params['day']);
                    components['calendar'].unSelectDay(that.previousDate);
                    components['calendar'].selectDay(that.date);
                    set(true);
                    // Hide datepicker tooltip
                    if(!that.params['isDateTime']){
                        components['menu'].hide(false);
                    }
                }
            }
        });
        // Render Time Select
        if(that.params['isDateTime']){
            components['time'] = new Com.TimeSelect({
                'container' : nodes['timeContainer'],
                'renderSelectsInBody' : false,
                'minutesInterval' : that.params['minutesInterval']
            });
            components['time'].addEvent('onChange', function(){
                setDate();
                components['calendar'].set(that.date.getFullYear(), that.date.getMonth(), false);
                components['calendar'].selectDay(that.date);
                set(true);
            });
        }
        // Enable / Disable
        if(that.disabled){
            that.disable();
        }else{
            that.enable();
        }
    };

    var inputKeypressHandler = function(e){
        if(cm.isKey(e, 'enter')){
            cm.preventDefault(e);
        }
    };

    var inputKeyHandler = function(e){
        var value = nodes['input'].value;
        if(cm.isKey(e, 'enter')){
            cm.preventDefault(e);
            validateInputValue();
            components['menu'].hide(false);
        }
        if(cm.isKey(e, 'delete')){
            if(cm.isEmpty(value)){
                that.clear(true);
                //components['menu'].hide(false);
            }
        }
    };

    var setEvents = function(){
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(nodes['container'], 'destruct', that.destructHandler);
        }
    };

    var unsetEvents = function(){
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.remove(nodes['container'], 'destruct', that.destructHandler);
        }
    };

    var onShow = function(){
        renderCalendarMonth();
        // Set classes
        cm.addClass(nodes['container'], 'active');
        that.triggerEvent('onFocus', that.value);
    };

    var onHide = function(){
        //validateInputValue();
        setInputValues();
        nodes['input'].blur();
        cm.removeClass(nodes['container'], 'active');
        that.triggerEvent('onBlur', that.value);
    };

    var validateInputValue = function(){
        var value = nodes['input'].value,
            date = new Date(value);
        if(cm.isEmpty(value) || !cm.isDateValid(date)){
            that.clear(true);
        }else{
            that.set(date, null, true);
        }
    };

    var set = function(triggerEvents){
        that.previousValue = that.value;
        if(that.date){
            // Set date
            setDate();
            // Set value
            that.value = cm.dateFormat(that.date, that.format, that.lang());
        }else{
            that.value = cm.dateFormat(false, that.format, that.lang());
        }
        setInputValues();
        renderCalendarMonth();
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            onChange();
        }
    };

    var setDate = function(year, month, day, hours, minutes, seconds){
        if(!that.date){
            that.date = new Date();
            that.previousDate = null;
        }else{
            that.previousDate = cm.clone(that.date);
        }
        // Set date
        year = cm.isUndefined(year) ? components['calendar'].getFullYear() : year;
        month = cm.isUndefined(month) ? components['calendar'].getMonth() : month;
        !cm.isEmpty(year) && that.date.setFullYear(year);
        !cm.isEmpty(month) && that.date.setMonth(month);
        !cm.isEmpty(day) && that.date.setDate(day);
        // Set time
        if(that.params['isDateTime']){
            hours = cm.isUndefined(hours) ? components['time'].getHours() : hours;
            minutes = cm.isUndefined(minutes) ? components['time'].getMinutes() : minutes;
            seconds = cm.isUndefined(seconds) ? 0 : seconds;
            !cm.isEmpty(hours) && that.date.setHours(hours);
            !cm.isEmpty(minutes) && that.date.setMinutes(minutes);
            !cm.isEmpty(seconds) && that.date.setSeconds(seconds);
        }
    };

    var renderCalendarMonth = function(){
        // Render calendar month
        if(that.date){
            components['calendar'].set(that.date.getFullYear(), that.date.getMonth());
        }
        components['calendar'].renderMonth();
    };

    var setInputValues = function(){
        if(that.date){
            nodes['input'].value = cm.dateFormat(that.date, that.displayFormat, that.strings);
            nodes['hidden'].value = that.value;
        }else{
            nodes['input'].value = '';
            if(that.params['setEmptyDateByFormat']){
                nodes['hidden'].value = cm.dateFormat(false, that.format, that.strings);
            }else{
                nodes['hidden'].value = '';
            }
        }
    };
    
    var onChange = function(){
        if(!that.previousValue || (!that.value && that.previousValue) || (that.value !== that.previousValue)){
            that.triggerEvent('onChange', that.value);
        }
    };

    /* ******* MAIN ******* */

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            cm.customEvent.trigger(nodes['calendarContainer'], 'destruct', {
                'direction' : 'child',
                'self' : false
            });
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.get = function(format){
        format = !cm.isUndefined(format) ? format : that.format;
        if(that.date || that.params['setEmptyDateByFormat']){
            return cm.dateFormat(that.date, format, that.strings);
        }else{
            return '';
        }
    };

    that.getDate = function(){
        return that.date;
    };

    that.getFullYear = function(){
        return that.date? that.date.getFullYear() : null;
    };

    that.getMonth = function(){
        return that.date? that.date.getMonth() : null;
    };

    that.getDay = function(){
        return that.date? that.date.getDate() : null;
    };

    that.getHours = function(){
        return that.date? that.date.getHours() : null;
    };

    that.getMinutes = function(){
        return that.date? that.date.getMinutes() : null;
    };

    that.set = function(str, format, triggerEvents){
        format = !cm.isUndefined(format) ? format : that.format;
        triggerEvents = !cm.isUndefined(triggerEvents) ? triggerEvents : true;
        // Get date
        var pattern = cm.dateFormat(false, format, that.lang());
        if(cm.isEmpty(str) || str === pattern){
            that.clear();
            return that;
        }else if(cm.isDate(str)){
            that.date = str;
        }else{
            that.date = cm.parseDate(str, format);
        }
        // Set parameters into components
        components['calendar'].set(that.date.getFullYear(), that.date.getMonth(), false);
        if(that.params['isDateTime']){
            components['time'].set(that.date, null, false);
        }
        // Set date
        set(triggerEvents);
        return that;
    };

    that.clear = function(triggerEvents){
        triggerEvents = !cm.isUndefined(triggerEvents) ? triggerEvents : true;
        // Clear date
        that.date = null;
        // Clear components
        components['calendar'].clear(false);
        if(that.params['isDateTime']){
            components['time'].clear(false);
        }
        // Set date
        set(false);
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            onChange();
        }
        return that;
    };

    that.disable = function(){
        that.disabled = true;
        cm.addClass(nodes['container'], 'disabled');
        nodes['input'].disabled = true;
        components['menu'].disable();
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        cm.removeClass(nodes['container'], 'disabled');
        nodes['input'].disabled = false;
        components['menu'].enable();
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('date-picker', {
    'node' : cm.node('input', {'type' : 'text'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Datepicker'
});