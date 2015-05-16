var http = require('http');
var https = require('https');
var express = require('express');
var responseTime = require('response-time');
var errorHandler = require('errorhandler');
var logger = require('morgan');
var url = require('url');
var path = require('path');
var parseString = require('xml2js').parseString;
var Youtube = require("youtube-api");
var searchitunes = require ('searchitunes');
var bodyParser = require('body-parser')

// INSERT YOUTUBE API SERVER KEY HERE!!!
Youtube.authenticate({
    type: "key",
    key: ""
});

var app = express();
var config = require('./config.json')[app.get('env')];


app.set('view engine', 'jade');
app.set('views', './views');
app.set('base', '/test');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

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
});

app.get('/url', function(req, res){
    var url_parts = url.parse(req.url, true);
    var videoUrl = url_parts.query['url'];
    var videoid = videoUrl.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    if(videoid != null) {
        Youtube.videos.list({'part': "snippet, contentDetails", 'id' : videoid[1]}, function(err, response){
            if(response['items'].length < 1) {
                res.render('index', {title: "MusicTube", message: "Invalid video link."});
            }
            var data = response['items'][0]['snippet'];
            console.log(response['items'][0]['contentDetails']);

            // HERE Limit Video duration
            var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
            var hours = 0, minutes = 0, seconds = 0, totalseconds;

            if (reptms.test(response['items'][0]['contentDetails']['duration'])) {
                var matches = reptms.exec(response['items'][0]['contentDetails']['duration']);
                if (matches[1]) hours = Number(matches[1]);
                if (matches[2]) minutes = Number(matches[2]);
                if (matches[3]) seconds = Number(matches[3]);
                totalseconds = hours * 3600  + minutes * 60 + seconds;

                if(totalseconds > 600)
                    res.render('index', {title: "MusicTube", message: "Video too long."});
            }
            var videoName = data['title'];
            var lastThumb;
            for(lastThumb in data['thumbnails']);
            var thumbnail = data['thumbnails'][lastThumb]['url'];

            var url_parts = url.parse(req.url, true);
            var nameTemp = videoName;;
            videoName = videoName.replace(/ /g, '%20');
            videoName = videoName.replace(/["']/g, "");
            youtubedl = require('youtube-dl');
            ffmpeg = require('fluent-ffmpeg');
            fs = require('fs');

            var iTunesData = [];
            var keywords = [];

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
            nameTemp = nameTemp.replace("【OFFICIAL MV】", "");
            nameTemp = nameTemp.replace("OFFICIAL", "");
            nameTemp = nameTemp.replace("【", "");
            nameTemp = nameTemp.replace("】", "");
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
                // console.log(arg.toString);
                arg = arg.toString();
                if(maxFound == -1){
                    searchitunes (
                        {
                            term: arg,
                            media: "music",

                        }, function(err, data) {
                            if(data !== null){
                                if(data["resultCount"] !== 0 && maxFound == -1){
                                    maxFound = i;
                                }
                            }
                            
                            i++;
                            callback(data);
                            
                        }
                    );
                } else {
                    i++;
                    callback({});

                }
                
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


                        if(maxFound !== -1){


                            console.log("MaxFound = " + maxFound);
                            var selectedResult = 0;
                            for(var a = 0; a < iTunesData[maxFound]["results"].length; a++){
                                if(iTunesData[maxFound]["results"][a]["collectionArtistName"] !== "Various Artists" && iTunesData[maxFound]["results"][a]["kind"] === "song"){
                                    selectedResult = a;
                                    break;
                                }
                            }


                            console.log("Number = " + a);


                            var useData = iTunesData[maxFound]["results"][selectedResult];

                            useData["trackName"] = useData["trackName"].replace(/["']/g, "");
                            


                            
                        if(useData["artworkUrl600"] !== undefined)
                            var albumArt = useData["artworkUrl600"];
                        else if(useData["artworkUrl100"] !== undefined)
                            var albumArt = useData["artworkUrl100"].replace("100x100", "600x600");


                            data = {
                                artist: useData["artistName"].toString(),
                                album: useData["collectionName"].toString(),
                                title: useData["trackName"].toString(),
                                date: useData["releaseDate"].toString(),
                                track: useData["trackNumber"].toString(),
                                disc: useData["discNumber"].toString(),
                                albumArt: albumArt,
                                old_albumArt: thumbnail
                            };
         
                            console.log("DONE!!!!");
                            res.render('getVideo', {title: "MusicTube | " + data.title, videoName: videoName, thumbnail: thumbnail, videoUrl: videoUrl, data: data});


                        } else {
                            console.log('HERE NOT FOUND');
                            videoName = videoName.replace(/%20/g, " ");
                            data = {
                                artist: "",
                                album: "",
                                title: videoName,
                                date: "",
                                track: "",
                                disc: "",
                                albumArt: "http://www.automation-drive.com/EX/05-14-06/Printable_CD_R_Disc.jpg",
                                old_albumArt: thumbnail
                            };
                            res.render('getVideo', {videoName: videoName, thumbnail: thumbnail, videoUrl: videoUrl, data: data});

                        }


                }
            }

            seriesITunes(keywords.shift());



            

        });

        req.on('error', function(err){
            console.log('it is error');
            res.render('index', {title: "MusicTube", message: "Something goes wrong! Try again."});
            console.log(err);
        });
    } else { 
        res.render('index', {title: "MusicTube", message: "Invalid video link."});
    }

});




app.post('/confirm', function(req, res){

    youtubedl = require('youtube-dl');
    ffmpeg = require('fluent-ffmpeg');
    fs = require('fs');



    stream = youtubedl(req.body.url
                    , ['--format=18']);  // Set video quality here


    function startDownload() {
        var imageName;
        var songName;
            var defaultSongName = req.body.title;
            req.body.title = req.body.title + " - " + req.body.artist;
            proc = new ffmpeg({source:stream});
            proc.setFfmpegPath('./ffmpeg.exe');

            proc.save("./music/" + req.body.title + ".mp3");



            proc.on('end', function(){
                console.log('done');
    

                var ffmetadata = require("ffmetadata");

                // Get AlbumArt
                req.body.albumArt = req.body.albumArt.replace("https", "http");

                http.get(req.body.albumArt, function(resPic){
                    console.log("GET PIC");
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

                                if(req.body.platform=="Windows")
                                    options["id3v2.3"] = true;

                                data = {
                                    artist: req.body.artist,
                                    album: req.body.album,
                                    title: defaultSongName,
                                    date: req.body.date,
                                    track: req.body.track,
                                    disc: req.body.disc
                                };
                                // Add albumart to song metadata
                                ffmetadata.write("./music/" + req.body.title + ".mp3", data, options, function(err) {
                                    if (err) {console.error("Error writing cover art"); console.log(err);}
                                    songName = req.body.title + ".mp3";
                                    console.log("DONE!!!!");
                                    res.render('download', {title: "MusicTube | " + req.body.title, musicName: req.body.title, albumart: req.body.albumArt, songName: songName});

                                });
                            }
                        });
                    });
                });
            });

    }

    startDownload();


    
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


