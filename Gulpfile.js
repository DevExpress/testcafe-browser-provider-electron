var fs           = require('fs');
var path         = require('path');
var gulp         = require('gulp');
var babel        = require('gulp-babel');
var eslint       = require('gulp-eslint');
var del          = require('del');
var childProcess = require('child_process');
var OS           = require('os-family');
var asar         = require('asar');


var PACKAGE_PARENT_DIR  = path.join(__dirname, '../');
var PACKAGE_SEARCH_PATH = (process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '') + PACKAGE_PARENT_DIR;

process.env.NODE_PATH = PACKAGE_SEARCH_PATH;

var APP_DIR             = path.join(__dirname, 'test/test-app-regular');
var ASAR_ARCHIVE_PATH   = path.join(__dirname, 'test/test-app.asar');
var CONFIG_PATH_REGULAR = path.join(__dirname, 'test/app-config-regular');
var CONFIG_PATH_ASAR    = path.join(__dirname, 'test/app-config-asar');
var TESTCAFE_CMD        = path.join(__dirname, 'node_modules/.bin/testcafe') + (OS.win ? '.cmd' : '');

function clean () {
    return del(['lib', '.screenshots']);
}

function lint () {
    return gulp
        .src([
            'src/**/*.js',
            'test/**/*.js',
            'Gulpfile.js'
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

function build () {
    return gulp
        .src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
}

function testRegularApp () {
    delete process.env.ASAR_MODE;

    return childProcess.spawn(TESTCAFE_CMD, ['electron:' + CONFIG_PATH_REGULAR, 'test/fixtures/**/*-test.js', '-s', '.screenshots'], { stdio: 'inherit' });
}

gulp.task('pack-to-asar-archive', () => asar.createPackage(APP_DIR, ASAR_ARCHIVE_PATH));

function testAsarApp () {
    process.env.ASAR_MODE = 'true';

    return childProcess.spawn(TESTCAFE_CMD, ['electron:' + CONFIG_PATH_ASAR, 'test/fixtures/**/*-test.js', '-s', '.screenshots'], { stdio: 'inherit' });
}

gulp.task('remove-asar-archive', done => {
    if (fs.existsSync(ASAR_ARCHIVE_PATH))
        fs.unlinkSync(ASAR_ARCHIVE_PATH);

    done();
});

exports.lint  = lint;
exports.build = gulp.parallel(lint, gulp.series(clean, build));
exports.test  = gulp.series(
    exports.build,
    testRegularApp,
    'pack-to-asar-archive',
    testAsarApp,
    'remove-asar-archive'
);
