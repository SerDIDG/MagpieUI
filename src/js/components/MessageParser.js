cm.define('Com.MessageParser', {
    params: {
        maxDepth: 10,
    },
},
function() {});

cm.getConstructor('Com.MessageParser', function(classConstructor, className, classProto) {

    /**
     * Registry of keyword handlers
     */
    classProto.handlers = {
        'msg': {
            handler: 'parseMessageReference',
            description: 'Message reference: {#msg:Component|key}'
        },
        'var': {
            handler: 'parseVariableReference',
            description: 'Variable reference: {#var:path.to.variable}'
        }
    };

    /**
     * Register a new keyword handler
     * @param {string} keyword - The keyword (without #)
     * @param {string} handlerMethod - Method name to handle this keyword
     * @param {string} description - Description for documentation
     */
    classProto.registerHandler = function(keyword, handlerMethod, description = '') {
        this.handlers[keyword] = {
            handler: handlerMethod,
            description: description
        };
    };

    /**
     * Find balanced braces in text
     */
    classProto.findBalancedBraces = function(text, startIndex = 0) {
        const matches = [];
        let i = startIndex;

        while (i < text.length) {
            if (text[i] === '{') {
                let braceCount = 1;
                let start = i;
                i++;

                while (i < text.length && braceCount > 0) {
                    if (text[i] === '{') braceCount++;
                    else if (text[i] === '}') braceCount--;
                    i++;
                }

                if (braceCount === 0) {
                    matches.push({
                        full: text.substring(start, i),
                        content: text.substring(start + 1, i - 1),
                        start: start,
                        end: i
                    });
                } else {
                    console.warn(`Unmatched opening brace at position ${start}`);
                }
            } else {
                i++;
            }
        }

        return matches;
    };

    /**
     * Parse keyword content and route to appropriate handler
     * @param {string} content - Content inside braces
     * @param {Object} variables - Variables for substitution
     * @param {number} depth - Current recursion depth
     * @returns {string} - Processed content
     */
    classProto.parseKeyword = function(content, variables, depth) {
        const that = this;

        // Check for special keywords (starting with #)
        if (content.startsWith('#')) {
            const colonIndex = content.indexOf(':');
            if (colonIndex === -1) {
                console.warn(`Invalid keyword format: ${content}`);
                return `{${content}}`;
            }

            const keyword = content.substring(1, colonIndex);
            const handlerInfo = that.handlers[keyword];

            if (!handlerInfo) {
                console.warn(`Unknown keyword: ${keyword}`);
                return `{${content}}`;
            }

            const handlerMethod = handlerInfo.handler;
            if (typeof that[handlerMethod] !== 'function') {
                console.error(`Handler method ${handlerMethod} not found for keyword: ${keyword}`);
                return `{${content}}`;
            }

            return that[handlerMethod](content, variables, depth);
        } else {
            // Regular variable reference
            return cm.reducePath(content, variables);
        }
    };

    /**
     * Main parse method
     */
    classProto.parse = function(text, variables = {}, depth = 0) {
        const that = this;
        if (typeof text !== 'string' || depth > that.params.maxDepth) {
            return text;
        }

        const matches = that.findBalancedBraces(text);
        if (matches.length === 0) {
            return text;
        }

        // Process matches from right to left to preserve indices
        let result = text;
        for (let i = matches.length - 1; i >= 0; i--) {
            const match = matches[i];
            const replacement = that.parseKeyword(match.content, variables, depth);
            result = result.substring(0, match.start) + replacement + result.substring(match.end);
        }

        return result;
    };

    /**
     * Message reference handler
     * Format: #msg:Component|key
     */
    classProto.parseMessageReference = function(content, variables, depth) {
        const that = this;
        try {
            const reference = content.substring(5); // Remove '#msg:'
            const parts = reference.split('|');

            if (parts.length !== 2) {
                console.warn(`Invalid message reference format: ${content}`);
                return `{${content}}`;
            }

            const [component, key] = parts;
            const message = cm.getMessage(component, key);

            if (message === undefined || message === null) {
                console.warn(`Message not found: ${component}|${key}`);
                return `{${content}}`;
            }

            return that.parse(message, variables, depth + 1);
        } catch (error) {
            console.error(`Error parsing message reference ${content}:`, error);
            return `{${content}}`;
        }
    };

    /**
     * Variable reference handler
     * Format: #var:path.to.variable
     */
    classProto.parseVariableReference = function(content, variables, depth) {
        const that = this;
        try {
            const reference = content.substring(5); // Remove '#var:'
            const message = cm.reducePath(reference, window);

            if (message === undefined || message === null) {
                console.warn(`Variable not found: ${reference}`);
                return `{${content}}`;
            }

            return that.parse(String(message), variables, depth + 1);
        } catch (error) {
            console.error(`Error parsing variable reference ${content}:`, error);
            return `{${content}}`;
        }
    };
});