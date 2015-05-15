var http = require('http');
var express = require('express');
var responseTime = require('response-time');
var errorHandler = require('errorhandler');
var logger = require('morgan');
var url = require('url');
var path = require('path');
var parseString = require('xml2js').parseString;
var Youtube = require("youtube-api");

Youtube.authenticate({
    type: "key",
    key: ""
});

var app = express();
var config = require('./config.json')[app.get('env')];


app.set('view engine', 'jade');
app.set('views', './views');
app.set('base', '/test');

// app.use(express.static(__dirname + './public'));
// app.use(express.static(__dirname + '/music'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'music')));

// app.use(app.router);
app.use(errorHandler());
app.use(responseTime());
app.use(logger('dev'));

http.createServer(app).listen(3000, function() {
	console.log('Express app started');
});

app.get('/', function(req, res){
    res.render('index', {title: "MusicTube"});
    // Youtube.videos.list({
    //     'part': "snippet",
    //     'id' : "xyJx9G65ilA"
    // }, function(err, res){
    //     // console.log(res['items'][0]['snippet']);
    // });
});

app.get('/url', function(req, res){
    var url_parts = url.parse(req.url, true);
    var videoUrl = url_parts.query['url'];
    var videoid = videoUrl.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    // console.log(videoid);
    if(videoid != null) {
        Youtube.videos.list({'part': "snippet", 'id' : videoid[1]}, function(err, response){
        // var request = http.get('http://gdata.youtube.com/feeds/api/videos/' + videoid[1], function(response){
            if(response['items'].length < 1) {
                res.render('index', {title: "MusicTube", message: "Invalid video link."});
            }
            var data = response['items'][0]['snippet'];
            console.log(data)
            var videoName = data['title'];
            var lastThumb;
            for(lastThumb in data['thumbnails']);
            var thumbnail = data['thumbnails'][lastThumb]['url'];
            res.render('getVideo', {videoName: videoName, thumbnail: thumbnail, videoUrl: videoUrl, title: videoName});
            // var xml = '';
            // response.on('data', function(chunk){
            //     xml += chunk;
            // });

            // response.on('end', function(){
            //     parseString(xml, function(err, result){
            //         if(result === undefined){
            //             res.render('index', {title: "MusicTube", message: "Something goes wrong! Try again."});
            //             return;
            //         }
            //         var videoName = result['entry']['title'][0]['_'];
            //         var thumbnail = result['entry']['media:group'][0]['media:thumbnail'][0]['$']['url'];
            //         res.render('getVideo', {videoName: videoName, thumbnail: thumbnail, videoUrl: videoUrl, title: videoName});
            //     });
                
            // });
        });

        req.on('error', function(err){
            console.log('it is error');
            res.render('index', {title: "MusicTube", message: "Something goes wrong! Try again."});
            console.log(err);
        });
    } else { 
        res.render('index', {title: "MusicTube", message: "Invalid video link."});
    }

	//res.render('getVideo', {title: videoUrl});
	// fail();
});




app.get('/confirm', function(req, res){
    var url_parts = url.parse(req.url, true);
    var videoUrl = url_parts.query['url'];
    var nameTemp = url_parts.query['name'];
    var thumbnail = url_parts.query['thumbnail'];
    var videoName = "./" + nameTemp.substr(0,nameTemp.indexOf(' ')) + ".mp3";
    videoName = videoName.replace(/ /g, '%20');
    videoName = videoName.replace(/["']/g, "");
    youtubedl = require('youtube-dl');
    ffmpeg = require('fluent-ffmpeg');
    fs = require('fs');

    var iTunesData = [];
    var keywords = [];

    // console.log(videoName);
    // url = 'https://www.youtube.com/watch?v=U-PQ2Zbf_Gc';
    // mp3 = './aaa.mp3';

    stream = youtubedl(videoUrl
                    , ['--format=18']);  // Set video quality here
    nameTemp = nameTemp.replace(/\[.*\] /g, "");
    nameTemp = nameTemp.replace(/\[.*\]/g, "");
    nameTemp = nameTemp.replace(/\(.*\) /g, "");
    nameTemp = nameTemp.replace(/\(.*\)/g, "");
    nameTemp = nameTemp.replace(/\{.*\} /g, "");
    nameTemp = nameTemp.replace(/\{.*\}/g, "");
    nameTemp = nameTemp.replace(/\「.*\」 /g, "");
    nameTemp = nameTemp.replace(/\「.*\」/g, "");
    nameTemp = nameTemp.replace("MV", "");
    nameTemp = nameTemp.replace("Official", "");
    nameTemp = nameTemp.replace("official", "");
    nameTemp = nameTemp.replace(/["']/g, "");
    nameTemp = nameTemp.split('.').join("");
    stringName = nameTemp.split(" ");
    for(var i = stringName.length -1; i >= 0; i--)
    {
        str = "";
        for(var j = 0; j < i; j++)
            str +=  stringName[j] + "+";
        str += stringName[i];
        console.log(str);
        keywords.push(str);
    }

    var maxFound = -1;
    var i = 0;

    function fetchITunes(arg, callback) {
        var request = http.get('http://itunes.apple.com/search?term=' + arg, function(response){
            var Data = '';
            response.on("data", function(chunk){
                Data += chunk;
            });

            response.on("end", function(){
                // console.log("i = " + i);
                // console.log(Data);
                var objData = JSON.parse(Data);

                // console.log(arg);
                // console.log(i);
                if(objData["resultCount"] !== 0 && maxFound == -1){
                    maxFound = i;
                }
                i++;
                callback(objData);
            });
        });
    }

    function seriesITunes(keyword) {
        var imageName;
        var songName;
        if(keyword) {
            fetchITunes(keyword, function(Data){
                iTunesData.push(Data);
                return seriesITunes(keywords.shift());
            });
        } else {
            proc = new ffmpeg({source:stream});
            proc.setFfmpegPath('./ffmpeg.exe');
            proc.on('end', function(){
                console.log('done');

                if(maxFound !== -1){
                var ffmetadata = require("ffmetadata");
                var selectedResult = 0;
                for(var a = 0; a < iTunesData[maxFound]["results"].length; a++){
                    if(iTunesData[maxFound]["results"][a]["collectionArtistName"] !== "Various Artists" && iTunesData[maxFound]["results"][a]["kind"] === "song"){
                        selectedResult = a;
                        break;
                    }
                }

                console.log("MaxFound = " + maxFound);
                console.log("Number = " + a);

                var useData = iTunesData[maxFound]["results"][selectedResult];

                useData["trackName"] = useData["trackName"].replace(/["']/g, "");
                


                
                // Rename the song
                fs.rename("./music/" + videoName, "./music/" + useData["trackName"] + ".mp3", function(){
                    if(useData["artworkUrl600"] !== undefined)
                        var albumArt = useData["artworkUrl600"];
                    else if(useData["artworkUrl100"] !== undefined)
                        var albumArt = useData["artworkUrl100"].replace("100x100", "600x600");
                    // Get AlbumArt
                    http.get(albumArt, function(resPic){
                        var imagedata = '';
                        resPic.setEncoding('binary');

                        resPic.on('data', function(chunk){
                            imagedata += chunk;
                        });

                        resPic.on('end', function(){

                            imageName = makeid();

                            // Write an albumart to file
                            fs.writeFile("./music/" + imageName + ".jpg", imagedata, 'binary', function(err){
                                if(err) throw err;
                                else {
                                    var options = {
                                      attachments: ["./music/" + imageName + ".jpg"],
                                    };
                                    options["id3v2.3"] = true;

                                    data = {
                                        artist: useData["artistName"].toString(),
                                        album: useData["collectionName"].toString(),
                                        title: useData["trackName"].toString(),
                                        date: useData["releaseDate"].toString(),
                                        track: useData["trackNumber"].toString(),
                                        disc: useData["discNumber"].toString()
                                    };
                                    // Add albumart to song metadata
                                    ffmetadata.write("./music/" + useData["trackName"] + ".mp3", data, options, function(err) {
                                        if (err) {console.error("Error writing cover art"); console.log(err);}
                                        songName = useData["trackName"] + ".mp3";
                                        // else console.log("Cover art added");
                                        console.log("DONE!!!!");
                                        res.render('download', {musicName: nameTemp, albumart: imageName+".jpg", songName: songName, title: nameTemp});
                                        // Write other metadata to song
                                        // ffmetadata.write("./music/" + useData["trackName"] + ".mp3", data, function(err) {
                                        //     if (err) console.error("Error writing metadata", err);
                                        //     else console.log("Data written");
                                        // });
                                    });
                                }
                            });
                        });
                    });
                });

                } else {
                    res.render('download', {musicName: nameTemp, albumart: thumbnail, songName: videoName, title: nameTemp});

                }
                // res.writeHead(302, {
                //     'Location': '/'
                // });
                // res.end();
                // res.render('download', {musicName: nameTemp, albumart: imageName+".jpg", songName: songName+".mp3"});
                
            });
            // res.render('download', {musicName: nameTemp, albumart: imageName+".jpg", songName: songName+".mp3"});
            proc.save("./music/" + videoName);

            // console.log("done" + maxFound);
            // console.log(iTunesData[maxFound]);

        }
    }

    seriesITunes(keywords.shift());


    
});

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}




module.exports = app;


