const ffmpeg = require('fluent-ffmpeg');
const ffmpegOnProgress = require('ffmpeg-on-progress')
const WebSocket = require('ws');

///////////////////// WS Server ///////////////////////////////

const wss = new WebSocket.Server({ port: 8080 });
 
wss.on('connection', (wsc, request) => {

  wsc.on('message', (message) => {
      const frames = 7;
      let result = JSON.parse(message);
      let imagesPath = result.tempDir + '/image-%d.jpg';
      let videoPath = result.videoPath;
      let durationEstimate = result.framesCount*(1/frames)*1000;

      ffmpeg()
        .addInput(imagesPath)
        .outputOptions([
          `-pix_fmt yuv420p`,
          `-s hd1080`,
          `-c:v libx264`,
        ])
        .inputFPS(frames)
        .outputFPS(frames)
        .on('progress', ffmpegOnProgress((progress, event)=>{
          wsc.send(JSON.stringify({ 
            status: 'processing',
            progressVal: (progress * 100).toFixed()
          }));
        }, durationEstimate))
        .on("error", err => {
          console.error("Error during processing", err);
        })
        .on("end", () => {
          wsc.send(JSON.stringify({status: "success"}));
        })
        .save(videoPath);
    });
});

  