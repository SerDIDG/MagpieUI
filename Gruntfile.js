module.exports = function(grunt) {

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

        uglify: {
            build: {
                src: 'js/build/<%= pkg.name %>.js',
                dest: 'js/build/<%= pkg.name %>.min.js'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify']);

};