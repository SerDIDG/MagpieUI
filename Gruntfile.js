module.exports = function(grunt) {
    // Custom config
    var config = {
        'less' : {
            'files' : [
                'src/less/variables/**/*.less',
                'src/less/variables.less',
                'src/less/mixins.less',
                'src/less/common.less',
                'src/less/common/Font.less',
                'src/less/common/Size.less',
                'src/less/common/Indent.less',
                'src/less/common/Colors.less',
                'src/less/common/Aspect.less',
                'src/less/common/Icons.less',
                'src/less/common/Tags.less',
                'src/less/common/Inputs.less',
                'src/less/common/Buttons.less',
                'src/less/common/List.less',
                'src/less/common/Form.less',
                'src/less/common/**/*.less',
                'src/less/parts/**/*.less',
                'src/less/layouts/**/*.less',
                'src/less/components/**/*.less',
                '!src/less/index.less',
                '!src/less/components/old/**/*.less'
            ]
        }
    };
    // Load all grunt tasks
    require('load-grunt-tasks')(grunt);
    // Display how match time it took to build each task
    require('time-grunt')(grunt);
    // Project configuration.
    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),

        clean: {
            build : [
                'build'
            ],
            docs : [
                'docs/build'
            ],
            post : [
                'temp'
            ]
        },

        bower : {
            install : {
                targetDir : './lib',
                cleanup : true,
                layout : 'byComponent',
                install : true
            }
        },

        less_imports: {
            source: {
                options: {
                    banner: '/* ************ MAGPIE UI: IMPORT ************ */'
                },
                src: config['less']['files'],
                dest: 'src/less/index.less'
            }
        },

        less : {
            build: {
                files: [{
                    src: ['src/less/index.less'],
                    dest: 'temp/build.css'
                }]
            },
            docs: {
                src: ['docs/src/less/index.less'],
                dest: 'temp/docs.css'
            }
        },

        concat: {
            build_scripts: {
                src: [
                    'src/js/polyfill.js',
                    'src/js/common.js',
                    'src/js/modules.js',
                    'src/js/parts.js',
                    'src/js/init.js',
                    'src/js/components/**/*.js',
                    '!src/js/components/dev/**/*.js',
                    '!src/js/components/old/**/*.js',
                    'lib/**/*.js'
                ],
                dest: 'build/js/<%= pkg.name %>.js'
            },
            build_styles: {
                files: [{
                    src: [
                        'src/css/**/*.css',
                        'temp/build.css',
                        'lib/**/*.css'
                    ],
                    dest: 'build/css/<%= pkg.name %>.css'
                },{
                    src: [
                        'lib/**/*.css',
                        'src/css/**/*.css',
                        config['less']['files']
                    ],
                    dest: 'build/less/<%= pkg.name %>.less'
                }]
            },
            docs_scripts: {
                src: [
                    'src/js/polyfill.js',
                    'src/js/common.js',
                    'src/js/modules.js',
                    'src/js/parts.js',
                    'src/js/init.js',
                    'src/js/components/**/*.js',
                    '!src/js/components/dev/**/*.js',
                    '!src/js/components/old/**/*.js',
                    'lib/**/*.js'
                ],
                dest: 'docs/build/js/<%= pkg.name %>.js'
            },
            docs_styles: {
                src: [
                    'docs/src/css/**/*.css',
                    'temp/docs.css',
                    'lib/**/*.css'
                ],
                dest: 'docs/build/css/<%= pkg.name %>.css'
            }
        },

        cssmin : {
            build : {
                files : {
                    'build/css/<%= pkg.name %>.min.css' : 'build/css/<%= pkg.name %>.css'
                }
            }
        },

        uglify : {
            build : {
                src : 'build/js/<%= pkg.name %>.js',
                dest : 'build/js/<%= pkg.name %>.min.js'
            }
        },

        imagemin: {
            build: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: 'src/img/',
                    src: ['**/*.*'],
                    dest: 'build/img/'
                }]
            }
        },

        copy: {
            build: {
                files: [{
                    expand: true,
                    cwd: 'src/fonts/',
                    src: [
                        '**/*.*',
                        '!**/*.json'
                    ],
                    dest: 'build/fonts/'
                }]
            },
            docs: {
                files: [{
                    expand: true,
                    cwd: 'docs/src/',
                    src: ['*.*'],
                    dest: 'docs/build/'
                },{
                    expand: true,
                    cwd: 'docs/src/content/',
                    src: ['**/*.*'],
                    dest: 'docs/build/content/'
                },{
                    expand: true,
                    cwd: 'docs/src/stuff/',
                    src: ['**/*.*'],
                    dest: 'docs/build/stuff/'
                },{
                    expand: true,
                    cwd: 'docs/src/img/',
                    src: ['**/*.*'],
                    dest: 'docs/build/img/'
                },{
                    expand: true,
                    cwd: 'build/fonts/',
                    src: ['**/*.*'],
                    dest: 'docs/build/fonts/magpieui/'
                },{
                    expand: true,
                    cwd: 'build/img/',
                    src: ['**/*.*'],
                    dest: 'docs/build/img/magpieui'
                }]
            }
        },

        watch: {
            development: {
                files: [
                    'src/js/**/*.js',
                    'src/css/**/*.css',
                    'src/less/**/*.less'
                ],
                tasks: ['dev'],
                options: {
                    spawn: false
                }
            },
            docs: {
                files: [
                    'src/js/**/*.js',
                    'src/css/**/*.css',
                    'src/less/**/*.less',
                    'docs/src/js/**/*.js',
                    'docs/src/css/**/*.css',
                    'docs/src/less/**/*.less',
                    'docs/src/content/**/*.*'
                ],
                tasks: ['docs'],
                options: {
                    spawn: false
                }
            }
        }
    });
    // Tasks
    grunt.registerTask('default', ['clean', 'bower', 'less_imports', 'less', 'concat', 'cssmin', 'uglify', 'imagemin', 'copy', 'clean:post']);
    grunt.registerTask('dev', ['less_imports', 'less:build', 'concat:build_styles', 'concat:build_scripts', 'clean:post']);
    grunt.registerTask('docs', ['less_imports', 'less:docs', 'concat:docs_styles', 'concat:docs_scripts', 'copy:docs', 'clean:post']);
};