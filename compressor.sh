for file in static/app/scripts/controllers/*; do
echo '-------compressing------------'
echo '-->minified file'
echo ${file%.*}.min.js;
echo 'original file-->'
echo ${file##*/};

java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/app/scripts/controllers/${file##*/};  -o ${file%.*}.min.js;
done

for file in static/app/scripts/directives/*; do

echo '-------compressing------------'
echo '-->minified file'
echo ${file%.*}.min.js;
echo 'original file-->'
echo ${file##*/};

java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v static/app/scripts/directives/${file##*/};  -o ${file%.*}.min.js;
done

echo '-------compressing------------'
#java -jar /usr/share/yui-compressor/yui-compressor.jar --type js -v
#static/app/scripts/services/weberservice.js  -o static/app/scripts/services/weberservice.min.js;
done

