cm.define('Com.Calendar', {
    'modules': [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Stack',
        'Structure'
    ],
    'events': [
        'onRender',
        'onDayOver',
        'onDayOut',
        'onDayClick',
        'onDayRender',
        'onPrevMonthRequest',
        'onNextMonthRequest',
        'onMonthRequest',
        'onMonthRender',
    ],
    'params': {
        'customEvents': true,
        'node': cm.node('div'),
        'name': '',
        'className': '',
        'startYear': 1950,                                                 // number | current
        'endYear': 'current + 10',                                         // number | current
        'startMonth': null,                                                // ToDo: implement
        'endMonth': null,                                                  // ToDo: implement
        'renderMonthOnInit': true,
        'startWeekDay': 0,
        'renderSelects': true,
        'renderArrows': false,
        'renderSelectsInBody': true,
        'changeMonthOnClick': true,
        'renderMonthOnRequest': true,
        'dayButtonRole': 'radio',
    },
    'strings': {
        'daysAbbr': ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        'days': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'prev': 'Previous month',
        'next': 'Next month',
    }
},
function(params) {
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

    that.isDestructed = null;

    var init = function() {
        that.destructHandler = that.destruct.bind(that);
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setMiscEvents();
        setEvents();
        that.params['renderMonthOnInit'] && renderView();
        that.addToStack(nodes.container);
        that.triggerEvent('onRender');
    };

    var validateParams = function() {
        if (/current/.test(that.params.startYear)) {
            that.params.startYear = eval(cm.strReplace(that.params.startYear, {current: new Date().getFullYear()}));
        }
        if (/current/.test(that.params.endYear)) {
            that.params.endYear = eval(cm.strReplace(that.params.endYear, {current: new Date().getFullYear()}));
        }
    };

    var render = function() {
        // Structure
        nodes.container = cm.node('div', {classes: 'com__calendar'},
            cm.node('table',
                cm.node('thead',
                    nodes.days = cm.node('tr')
                ),
                nodes.dates = cm.node('tbody')
            )
        );

        // Add css class
        cm.addClass(nodes.container, that.params['className']);

        // Render selects
        nodes.selects = cm.node('div', {classes: 'selects'},
            nodes.months = cm.node('select', {classes: 'select months'}),
            nodes.years = cm.node('select', {classes: 'select years'})
        );
        if(that.params.renderSelects){
            cm.insertFirst(nodes.selects, nodes.container);
        }

        // Render arrows
        if (that.params.renderArrows) {
            nodes.prev = cm.node('button', {classes: ['button-primary', 'arrow'], title: that.msg('prev')}, '<');
            cm.click.add(nodes.prev, that.prevMonth.bind(that));
            cm.insertFirst(nodes.prev, nodes.selects);
            nodes.next = cm.node('button', {classes: ['button-primary', 'arrow'], title: that.msg('next')}, '>');
            cm.click.add(nodes.next, that.nextMonth.bind(that));
            cm.insertLast(nodes.next, nodes.selects);
        }
        
        // Render days
        var weekday;
        cm.forEach(7, function(i) {
            weekday = i + that.params.startWeekDay;
            weekday = weekday > 6? Math.abs(6 - (weekday - 1)) : weekday;
            nodes.days.appendChild(
                cm.node('th', {title: that.msg('days')[weekday]}, that.msg('daysAbbr')[weekday])
            );
        });

        // Render selects options
        that.msg('months').forEach(function(item, i) {
            nodes.months.appendChild(
                cm.node('option', {value: i}, item)
            );
        });
        for (var i = that.params.endYear; i >= that.params.startYear; i--) {
            nodes.years.appendChild(
                cm.node('option', {value: i}, i)
            );
        }

        // Append
        that.embedStructure(nodes.container);
    };

    var setMiscEvents = function() {
        selects.years = new Com.Select({
                node: nodes.years,
                renderInBody: that.params.renderSelectsInBody
            })
            .set(current.year)
            .addEvent('onChange', renderView);

        selects.months = new Com.Select({
                node: nodes.months,
                renderInBody: that.params.renderSelectsInBody
            })
            .set(current.month)
            .addEvent('onChange', renderView);
    };

    var setEvents = function() {
        // Add custom event
        if (that.params['customEvents']) {
            cm.customEvent.add(nodes.container, 'destruct', that.destructHandler);
        }
    };

    var unsetEvents = function() {
        // Add custom event
        if (that.params['customEvents']) {
            cm.customEvent.remove(nodes.container, 'destruct', that.destructHandler);
        }
    };

    var renderView = function(params){
        params = cm.merge({
            render: that.params.renderMonthOnRequest,
            triggerEvents: true,
            event: null,
        }, params);

        // Get new today date
        var date;
        today = new Date();
        
        // Get current month data
        date = new Date(selects.years.get(), selects.months.get(), 1);
        current = getMonthData(date);
        
        // Get previous month data
        date = new Date(current.year, current.month, 1);
        date.setMonth(current.month - 1);
        previous = getMonthData(date);
        
        // Get next month data
        date = new Date(current.year, current.month, 1);
        date.setMonth(current.month + 1);
        next = getMonthData(date);

        // Trigger request events
        if (params.triggerEvents) {
            that.triggerEvent('onMonthRequest', current);
            params.event && that.triggerEvent(params.event, current);
        }

        // Render view
        if (params.render) {
            // Clear current table
            cm.clearNode(nodes.dates);

            // Render rows
            cm.forEach(6, renderRow);

            // Trigger render events
            if (params.triggerEvents) {
                that.triggerEvent('onMonthRender', current);
            }
        }
    };

    var renderRow = function(i) {
        var startWeekDay = current.startWeekDay - that.params.startWeekDay,
            day = ((i - 1) * 7) + 1 - (startWeekDay > 0? startWeekDay - 7 : startWeekDay),
            tr = nodes.dates.appendChild(
                cm.node('tr')
            );
        cm.forEach(7, function() {
            renderCell(tr, day);
            day++;
        });
    };

    var renderCell = function(row, day){
        var item = {
            row: row,
            day: day,
            month: current.month,
            year: current.year,
            date: new Date(current.year, current.month, day),
            nodes: {},
            isWeekend: false,
            isToday: false
        };

        // Structure
        item.container = item.nodes.container = cm.node('td');

        // Render day
        if (day <= 0) {
            cm.addClass(item.container, 'out');
            item.node = item.nodes.holder = renderDay(previous.dayCount + day);
            if (that.params.changeMonthOnClick) {
                item.node.title = that.msg('prev');
                cm.addEvent(item.node, 'click', that.prevMonth.bind(that));
            }
        } else if(day > current.dayCount) {
            cm.addClass(item.container, 'out');
            item.node = item.nodes.holder = renderDay(day - current.dayCount);
            if (that.params.changeMonthOnClick) {
                item.node.title = that.msg('next');
                cm.addEvent(item.node, 'click', that.nextMonth.bind(that));
            }
        } else {
            cm.addClass(item.container, 'in');
            item.node = item.nodes.holder = renderDay(day);
            item.node.setAttribute('role', that.params.dayButtonRole);
            item.node.setAttribute('tabindex', 0);
            item.node.setAttribute('aria-checked', false);

            // Today mark
            if (
                today.getFullYear() === current.year &&
                today.getMonth() === current.month &&
                today.getDate() === day
            ) {
                item.isToday = true;
                cm.addClass(item.container, 'today');
            }

            // Add events
            cm.addEvent(item.node, 'mouseover', function() {
                that.triggerEvent('onDayOver', item);
            });
            cm.addEvent(item.node, 'mouseout', function() {
                that.triggerEvent('onDayOut', item);
            });
            cm.addEvent(item.node, 'click', function() {
                that.triggerEvent('onDayClick', item);
            });

            // Add to array
            current.days[day] = item;
            that.triggerEvent('onDayRender', item);
        }

        // Weekend mark
        if (/[06]/.test(item.date.getDay())) {
            item.isWeekend = true;
            cm.addClass(item.container, 'weekend');
        }

        // Append
        item.container.appendChild(item.node);
        item.row.appendChild(item.container);
        return item;
    };

    var renderDay = function(day) {
        return cm.node('div', {classes: 'day'},
            cm.node('div', {classes: 'label'}, day)
        );
    };

    var getMonthData = function(date) {
        var data = {
            date: date,
            year: date.getFullYear(),
            month: date.getMonth(),
            days: {},
            startWeekDay: date.getDay()
        };
        data.dayCount = new Date(data.year, (data.month + 1), 0).getDate();
        return data;
    };

    /* ******* PUBLIC ******* */

    that.set = function(year, month, params) {
        if (
            year >= that.params.startYear && year <= that.params.endYear &&
            month >= 0 && month <= 11
        ) {
            selects.years.set(year, false);
            selects.months.set(month, false);
            renderView(params);
        }
        return that;
    };

    that.clear = function(params) {
        var date = new Date();
        selects.years.set(date.getFullYear(), false);
        selects.months.set(date.getMonth(), false);
        renderView(params);
        return that;
    };

    that.getCurrentMonth = function() {
        return current;
    };

    that.getFullYear = function() {
        return current.year;
    };

    that.getMonth = function() {
        return current.month;
    };

    that.getDays = function() {
        return current.days;
    };

    that.renderMonth = function(params) {
        renderView(params);
        return that;
    };

    that.prevMonth = function(params) {
        params = cm.merge(params, {
            event: 'onPrevMonthRequest',
        });
        if (previous.year >= that.params.startYear) {
            selects.years.set(previous.year, false);
            selects.months.set(previous.month, false);
            renderView(params);
        }
        return that;
    };

    that.nextMonth = function(params) {
        params = cm.merge(params, {
            event: 'onNextMonthRequest',
        });
        if (next.year <= that.params.endYear) {
            selects.years.set(next.year, false);
            selects.months.set(next.month, false);
            renderView(params);
        }
        return that;
    };

    that.selectDay = function(date) {
        if (date && current.year === date.getFullYear() && current.month === date.getMonth()) {
            var day = current.days[date.getDate()];
            cm.addClass(day.nodes.container, 'selected');
            day.nodes.holder('aria-checked', true);
        }
    };

    that.unSelectDay = function(date) {
        if (date && current.year === date.getFullYear() && current.month === date.getMonth()) {
            var day = current.days[date.getDate()];
            cm.removeClass(day.nodes.container, 'selected');
            day.nodes.holder('aria-checked', false);
        }
    };

    that.getNodes = function(key) {
        return nodes[key] || nodes;
    };

    that.destruct = function() {
        var that = this;
        if (!that.isDestructed) {
            that.isDestructed = true;
            selects.years.destruct();
            selects.months.destruct();
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    init();
});
