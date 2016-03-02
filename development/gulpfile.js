var gulp = require('gulp');
var babel = require("gulp-babel");
var rename = require("gulp-rename");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");


gulp.task('default', function(){
    gulp.watch('./babel.*.js', ['build'], {debounce: 2000});
    // gulp.watch('./babel.*.js', ['babel'], {debounce: 2000});
});

gulp.task('babel', function() {
    return gulp.src('./babel.*.js')
        .pipe(babel().on('error', handleErr))
        .pipe(rename(function(renamePath){
            renamePath.basename = renamePath.basename.replace("babel.", "");
        }))
        .pipe(gulp.dest('./'));
});

var buildFiles = [
    "./sift.js",
    "./lodash.custom.js",
    "./pluralize.js",
    "./persistent.js",
]

gulp.task('build', ["babel"], function() {
    return gulp.src(buildFiles)
        .pipe(concat("persistent.min.js"))
        // .pipe(uglify())
        .pipe(gulp.dest('../'));
});

function handleErr(err){
    console.log(err)
    console.log('')
    console.log('============= ERROR =============')
    console.log("Error: " + err.message);
    console.log("In file: " + err.fileName);
    console.log("At line: " + err.lineNumber);
    console.log('======================================')
    this.emit('end');
}