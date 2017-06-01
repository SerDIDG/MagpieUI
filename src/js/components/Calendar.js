cm.define('Com.Calendar', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onDayOver',
        'onDayOut',
        'onDayClick',
        'onMonthRender'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'className' : '',
        'startYear' : 1950,                                                 // number | current
        'endYear' : 'current + 10',                                         // number | current
        'renderMonthOnInit' : true,
        'startWeekDay' : 0,
        'renderSelectsInBody' : true
    },
    'strings' : {
        'daysAbbr' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        'days' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    }
},
function(params){
    var that = this,
        nodes = {
            'selects' : {}
        },
        selects = {},
        today = new Date(),
        current = {
            'year' : today.getFullYear(),
            'month' : today.getMonth()
        },
        previous = {},
        next = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setMiscEvents();
        that.params['renderMonthOnInit'] && renderView();
        that.addToStack(nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(/current/.test(that.params['startYear'])){
            that.params['startYear'] = eval(cm.strReplace(that.params['startYear'], {'current' : new Date().getFullYear()}));
        }
        if(/current/.test(that.params['endYear'])){
            that.params['endYear'] = eval(cm.strReplace(that.params['endYear'], {'current' : new Date().getFullYear()}));
        }
    };

    var render = function(){
        var weekday;
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__calendar'},
            cm.Node('div', {'class' : 'selects'},
                nodes['months'] = cm.Node('select', {'class' : 'select months'}),
                nodes['years'] = cm.Node('select', {'class' : 'select years'})
            ),
            cm.Node('table',
                cm.Node('thead',
                    nodes['days'] = cm.Node('tr')
                ),
                nodes['dates'] = cm.Node('tbody')
            )
        );
        // Add css class
        !cm.isEmpty(that.params['className']) && cm.addClass(nodes['container'], that.params['className']);
        // Render days
        cm.forEach(7, function(i){
            weekday = i + that.params['startWeekDay'];
            weekday = weekday > 6? Math.abs(6 - (weekday - 1)) : weekday;
            nodes['days'].appendChild(
                cm.Node('th', that.lang('daysAbbr')[weekday])
            );
        });
        // Render selects options
        that.lang('months').forEach(function(item, i){
            nodes['months'].appendChild(
                cm.Node('option', {'value' : i}, item)
            );
        });
        for(var i = that.params['endYear']; i >= that.params['startYear']; i--){
            nodes['years'].appendChild(
                cm.Node('option', {'value' : i}, i)
            );
        }
        // Insert into DOM
        that.params['node'].appendChild(nodes['container']);
    };

    var setMiscEvents = function(){
        // Init custom selects
        selects['years'] = new Com.Select({
                'node' : nodes['years'],
                'renderInBody' : that.params['renderSelectsInBody']
            })
            .set(current['year'])
            .addEvent('onChange', renderView);

        selects['months'] = new Com.Select({
                'node' : nodes['months'],
                'renderInBody' : that.params['renderSelectsInBody']
            })
            .set(current['month'])
            .addEvent('onChange', renderView);
    };

    var renderView = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        var date;
        // Get new today date
        today = new Date();
        // Get current month data
        date = new Date(selects['years'].get(), selects['months'].get(), 1);
        current = getMonthData(date);
        // Get previous month data
        date = new Date(current['year'], current['month'], 1);
        date.setMonth(current['month'] - 1);
        previous = getMonthData(date);
        // Get next month data
        date = new Date(current['year'], current['month'], 1);
        date.setMonth(current['month'] + 1);
        next = getMonthData(date);
        // Clear current table
        cm.clearNode(nodes['dates']);
        // Render rows
        cm.forEach(6, renderRow);
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onMonthRender', current);
        }
    };

    var renderRow = function(i){
        var startWeekDay = current['startWeekDay'] - that.params['startWeekDay'],
            day = ((i - 1) * 7) + 1 - (startWeekDay > 0? startWeekDay - 7 : startWeekDay),
            tr = nodes['dates'].appendChild(
                cm.Node('tr')
            );
        cm.forEach(7, function(){
            renderCell(tr, day);
            day++;
        });
    };

    var renderCell = function(tr, day){
        var td, div, params;
        tr.appendChild(
            td = cm.Node('td')
        );
        // Render day
        if(day <= 0){
            td.appendChild(
                div = cm.Node('div', (previous['dayCount'] + day))
            );
            cm.addClass(td, 'out');
            cm.addEvent(div, 'click', that.prevMonth);
        }else if(day > current['dayCount']){
            td.appendChild(
                div = cm.Node('div', (day - current['dayCount']))
            );
            cm.addClass(td, 'out');
            cm.addEvent(div, 'click', that.nextMonth);
        }else{
            td.appendChild(
                div = cm.Node('div', day)
            );
            cm.addClass(td, 'in');
            params = {
                'container' : td,
                'node' : div,
                'day' : day,
                'month' : current['month'],
                'year' : current['year'],
                'date' : new Date(current['year'], current['month'], day),
                'isWeekend' : false,
                'isToday' : false
            };
            if(today.getFullYear() == current['year'] && today.getMonth() == current['month'] && day == today.getDate()){
                params['isToday'] = true;
                cm.addClass(td, 'today');
            }
            if(/0|6/.test(new Date(current['year'], current['month'], day).getDay())){
                params['isWeekend'] = true;
                cm.addClass(td, 'weekend');
            }
            // Add events
            cm.addEvent(div, 'mouseover', function(){
                that.triggerEvent('onDayOver', params);
            });
            cm.addEvent(div, 'mouseout', function(){
                that.triggerEvent('onDayOut', params);
            });
            cm.addEvent(div, 'click', function(){
                that.triggerEvent('onDayClick', params);
            });
            // Add to array
            current['days'][day] = params;
        }
    };

    var getMonthData = function(date){
        var o = {
            'year' : date.getFullYear(),
            'month' : date.getMonth(),
            'days' : {},
            'startWeekDay' : date.getDay()
        };
        o['dayCount'] = 32 - new Date(o['year'], o['month'], 32).getDate();
        return o;
    };

    /* ******* PUBLIC ******* */

    that.getFullYear = function(){
        return current['year'];
    };

    that.getMonth = function(){
        return current['month'];
    };

    that.set = function(year, month, triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        if(
            year >= that.params['startYear'] && year <= that.params['endYear']
            && month >= 0 && month <= 11
        ){
            selects['years'].set(year, false);
            selects['months'].set(month, false);
            renderView(triggerEvents);
        }
        return that;
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        var date = new Date();
        selects['years'].set(date.getFullYear(), false);
        selects['months'].set(date.getMonth(), false);
        renderView(triggerEvents);
        return that;
    };

    that.renderMonth = function(){
        renderView();
        return that;
    };

    that.getCurrentMonth = function(){
        return current;
    };

    that.nextMonth = function(){
        if(next['year'] <= that.params['endYear']){
            selects['years'].set(next['year'], false);
            selects['months'].set(next['month'], false);
            renderView();
        }
        return that;
    };

    that.prevMonth = function(){
        if(previous['year'] >= that.params['startYear']){
            selects['years'].set(previous['year'], false);
            selects['months'].set(previous['month'], false);
            renderView();
        }
        return that;
    };

    that.selectDay = function(date){
        if(date && current['year'] == date.getFullYear() && current['month'] == date.getMonth()){
            cm.addClass(current['days'][date.getDate()]['container'], 'selected');
        }
    };

    that.unSelectDay = function(date){
        if(date && current['year'] == date.getFullYear() && current['month'] == date.getMonth()){
            cm.removeClass(current['days'][date.getDate()]['container'], 'selected');
        }
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});