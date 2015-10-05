module.exports = function(grunt) {
    // Load all grunt tasks matching the `grunt-*` pattern.
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            dist: {
                src: [
                    'js/polyfill.js',
                    'js/common.js',
                    'js/modules.js',
                    'js/parts.js',
                    'js/init.js',
                    'js/components/**/*.js'
                ],
                dest: 'js/build/<%= pkg.name %>.js'
            }
        },

        less: {
            development: {
                options: {
                    paths : ["assets/css"]
                },
                files: {
                    "css/<%= pkg.name %>.css": "less/index.less"
                }
            }
        },

        uglify: {
            build: {
                src: 'js/build/<%= pkg.name %>.js',
                dest: 'js/build/<%= pkg.name %>.min.js'
            }
        },

        watch: {
            scripts: {
                files: [
                    'js/**/*.js',
                    'less/**/*.less'
                ],
                tasks: ['concat', 'less'],
                options: {
                    spawn: false
                }
            }
        }
    });

    // Default task(s).
    grunt.registerTask('default', ['concat', 'less', 'uglify']);
    grunt.registerTask('dev', ['concat', 'less']);

};