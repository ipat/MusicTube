# MusicTube
MusicTube is the web application using for convert video on YouTube to a music file and automatically add song details from iTunes (it possible that the program add incorrect song details).
However it has lot of things to add in the future.

###Install
To install MusicTube, you have to clone this repo and run node module install using
<code>npm install</code> . Node package manager will install all of the module that will be used by the program.

###FFMpeg
MusicTube require ffmpeg to convert file. So in <code>app.js</code>, it has the line <code>proc.setFfmpegPath('./ffmpeg.exe');</code> to set the path of ffmpeg. If you using Linux and install ffmpeg as a global path you can comment this line.


###Running MusicTube
Using <code>node app</code> to run the program but if your platform has a limited memory I suggest to run using <code>node --max-old-space-size=128 app.js</code> which 128 is the number of memory that node will start a gabage collector to clean old memory.

###Run program forever
To run MusicTube forever you can install forever package using <code>npm -g install forever</code>. Running program uses command <code>forever start app.js</code> or <code>forever start --max-old-space-size=128 app.js</code> .

###Other
To pull the MusicTube if you have a conflict you can use "Use theirs" by

```
git fetch
git reset --hard origin/master
```

To terminate node process using command

```
ps aux | grep node
kill -9 PROCESS_ID
```

or

```
killall node
```




