git add -A
git commit -m 'testing'
git pull origin  master


echo '---------compressing-------------'

find static/app/scripts/controllers/ static/app/scripts/services/ static/app/scripts/directives/ -name "*.js"  -exec cat {} + > static/app/scripts/servicectrls.js
#java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/app/scripts/servicectrls.js -o static/app/scripts/servicectrls.min.js

#cat static/bower_components/restangular/dist/restangular.min.js \
#    static/bower_components/satellizer/satellizer.min.js  \
#    static/bower_components/angular-local-storage/dist/angular-local-storage.min.js  \
#    static/bower_components/ngImgCrop/compile/minified/ng-img-crop.js \
#    static/bower_components/ng-tags-input/ng-tags-input.min.js \
#    static/bower_components/angular-busy/dist/angular-busy.min.s  > static/bower_components/allbower.min.js

cat static/app/styles/main.css \
    static/app/styles/chat_css.css \
    static/bower_components/ngImgCrop/compile/minified/ng-img-crop.css \
    static/bower_components/ng-tags-input/ng-tags-input.css \
    static/bower_components/ng-tags-input/ng-tags-input.bootstrap.css \
    static/bower_components/angular-busy/dist/angular-busy.min.css \
    static/bower_components/angucomplete/autocomplete.css \
    static/bower_components/angucomplete/style.css > static/bower_components/allcss.css

echo '-----------min all css file------------'
java -jar /usr/share/yui-compressor/yui-compressor.jar --type css -v static/bower_components/allcss.css -o static/bower_components/allcss.min.css



service weber restart


