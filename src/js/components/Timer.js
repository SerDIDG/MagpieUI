cm.define('Com.Timer', {
    extend: 'Com.AbstractController',
    events: [
        'onRender',
        'onStart',
        'onTick',
        'onEnd'
    ],
    params: {
        renderStructure: false,
        embedStructureOnRender: false,
        count: 0, // ms
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.Timer', function(classConstructor, className, classProto, classInherit) {
    // Constants for time calculations
    const MS_PER_SECOND = 1000;
    const MS_PER_MINUTE = 60 * MS_PER_SECOND;
    const MS_PER_HOUR = 60 * MS_PER_MINUTE;
    const MS_PER_DAY = 24 * MS_PER_HOUR;

    classProto.onConstructStart = function() {
        // Variables
        this.left = 0;
        this.pass = 0;
        this.isProcess = false;
        this.animationFrameId = null;
    };

    classProto.onDestructStart = function() {
        this.stop();
    };

    classProto.renderViewModel = function() {
        this.left = this.params.count;
        this.start();
    };

    classProto.getLeftTime = function() {
        const totalMs = this.left;

        const d_total = Math.floor(totalMs / MS_PER_DAY);
        const h_total = Math.floor(totalMs / MS_PER_HOUR);
        const m_total = Math.floor(totalMs / MS_PER_MINUTE);
        const s_total = Math.floor(totalMs / MS_PER_SECOND);

        const d = d_total;
        const h = h_total % 24;
        const m = m_total % 60;
        const s = s_total % 60;

        return { d_total, h_total, m_total, s_total, d, h, m, s };
    };

    /******** PUBLIC ********/

    classProto.start = function() {
        const left = this.left;
        const startTime = Date.now();

        this.isProcess = true;
        this.triggerEvent('onStart', this.getLeftTime());

        // Process
        const process = () => {
            if (!this.isProcess) {
                return;
            }

            const currentTime = Date.now();
            this.left = Math.max(left - (currentTime - startTime), 0);
            this.pass = this.params.count - this.left;

            const timeData = this.getLeftTime();
            this.triggerEvent('onTick', timeData);

            if (this.left === 0) {
                this.stop();
                this.triggerEvent('onEnd', timeData);
            } else {
                this.animationFrameId = requestAnimationFrame(process);
            }
        };

        process();

        return this;
    };

    classProto.stop = function() {
        this.isProcess = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        return this;
    };
});
