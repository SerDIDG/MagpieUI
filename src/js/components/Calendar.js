cm.define('Com.Calendar', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRender',
        'onDayOver',
        'onDayOut',
        'onDayClick',
        'onDayRender',
        'onPrevMonthRequest',
        'onNextMonthRequest',
        'onMonthRender',
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'className' : '',
        'startYear' : 1950,                                                 // number | current
        'endYear' : 'current + 10',                                         // number | current
        'renderMonthOnInit' : true,
        'startWeekDay' : 0,
        'renderSelects' : true,
        'renderSelectsInBody' : true,
        'changeMonthOnClick' : true,
        'renderMonthOnRequest' : true,
    },
    'strings' : {
        'daysAbbr' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        'days' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'prev' : 'Previous month',
        'next' : 'Next month',
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
        nodes['container'] = cm.node('div', {'class' : 'com__calendar'},
            cm.node('table',
                cm.node('thead',
                    nodes['days'] = cm.node('tr')
                ),
                nodes['dates'] = cm.node('tbody')
            )
        );
        // Add css class
        !cm.isEmpty(that.params['className']) && cm.addClass(nodes['container'], that.params['className']);
        // Render selects
        nodes['selects'] = cm.node('div', {'class' : 'selects'},
            nodes['months'] = cm.node('select', {'class' : 'select months'}),
            nodes['years'] = cm.node('select', {'class' : 'select years'})
        );
        if(that.params['renderSelects']){
            cm.insertFirst(nodes['selects'], nodes['container']);
        }
        // Render days
        cm.forEach(7, function(i){
            weekday = i + that.params['startWeekDay'];
            weekday = weekday > 6? Math.abs(6 - (weekday - 1)) : weekday;
            nodes['days'].appendChild(
                cm.node('th', that.lang('daysAbbr')[weekday])
            );
        });
        // Render selects options
        that.lang('months').forEach(function(item, i){
            nodes['months'].appendChild(
                cm.node('option', {'value' : i}, item)
            );
        });
        for(var i = that.params['endYear']; i >= that.params['startYear']; i--){
            nodes['years'].appendChild(
                cm.node('option', {'value' : i}, i)
            );
        }
        // Append
        that.embedStructure(nodes['container']);
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
                cm.node('tr')
            );
        cm.forEach(7, function(){
            renderCell(tr, day);
            day++;
        });
    };

    var renderCell = function(row, day){
        var item = {
            row: row,
            day: day,
            month: current['month'],
            year: current['year'],
            date: new Date(current['year'], current['month'], day),
            nodes: {},
            isWeekend: false,
            isToday: false
        };

        // Structure
        item.container = item.nodes.container = cm.node('td');

        // Render day
        if(day <= 0){
            cm.addClass(item.container, 'out');
            item.node = item.nodes.holder = renderDay(previous['dayCount'] + day);
            if(that.params['changeMonthOnClick']){
                item.node.title = that.msg('prev');
                cm.addEvent(item.node, 'click', that.prevMonth.bind(that));
            }
        }else if(day > current['dayCount']){
            cm.addClass(item.container, 'out');
            item.node = item.nodes.holder = renderDay(day - current['dayCount']);
            if(that.params['changeMonthOnClick']){
                item.node.title = that.msg('next');
                cm.addEvent(item.node, 'click', that.nextMonth.bind(that));
            }
        }else{
            cm.addClass(item.container, 'in');
            item.node = item.nodes.holder = renderDay(day);

            // Today mark
            if(
                today.getFullYear() === current['year'] &&
                today.getMonth() === current['month'] &&
                today.getDate() === day
            ){
                item.isToday = true;
                cm.addClass(item.container, 'today');
            }

            // Add events
            cm.addEvent(item.node, 'mouseover', function(){
                that.triggerEvent('onDayOver', item);
            });
            cm.addEvent(item.node, 'mouseout', function(){
                that.triggerEvent('onDayOut', item);
            });
            cm.addEvent(item.node, 'click', function(){
                that.triggerEvent('onDayClick', item);
            });

            // Add to array
            current['days'][day] = item;
            that.triggerEvent('onDayRender', item);
        }

        // Weekend mark
        if(/0|6/.test(item.date.getDay())){
            item.isWeekend = true;
            cm.addClass(item.container, 'weekend');
        }

        // Append
        item.container.appendChild(item.node);
        item.row.appendChild(item.container);
        return item;
    };

    var renderDay = function(day){
        return cm.node('div', {'class' : 'day'},
            cm.node('div', {'class' : 'label'}, day)
        );
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

    that.prevMonth = function(){
        if(previous['year'] >= that.params['startYear']){
            selects['years'].set(previous['year'], false);
            selects['months'].set(previous['month'], false);
            if(that.params.renderMonthOnRequest) {
                renderView();
            }
            that.triggerEvent('onPrevMonthRequest');
        }
        return that;
    };

    that.nextMonth = function(){
        if(next['year'] <= that.params['endYear']){
            selects['years'].set(next['year'], false);
            selects['months'].set(next['month'], false);
            if(that.params.renderMonthOnRequest){
                renderView();
            }
            that.triggerEvent('onNextMonthRequest');
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
