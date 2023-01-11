SariskaMediaTransport.init();
const conferenceName = 'dipak';
let connection = null;
let isJoined = false;
let room = null;

var videoElements = {};
let localTracks = [];
let remoteTracks = {};

function onLocalTracks(tracks) {
  localTracks = tracks;
  if (isJoined) {
    for (let i = 0; i < localTracks.length; i++) {
      room.addTrack(localTracks[i]);
    }
  }
  for(var i=0;i<tracks.length;i++){
    if (tracks[i].getType() == 'video') {
    const key = "local";
    window.videoElements[key] = document.createElement('video');
    window.videoElements[key].autoplay = true;
    tracks[i].attach(window.videoElements[key]);
    }
  }
  
}

function onRemoteTrack(track) {
  if (track.isLocal()) {
    return;
  }
  const participantId = track.getParticipantId();
  if (!remoteTracks[participantId]) {
    remoteTracks[participantId] = [];
  }
  remoteTracks[participantId].push(track);
  if (track.getType() == 'video') {
    // Video elements just get stored, they're accessed from Unity.
    
    const key = "participant-" + participantId;
    window.videoElements[key] = document.createElement('video');
    window.videoElements[key].autoplay = true;
    track.attach(window.videoElements[key]);
  }
  else {
    // Audio elements get added to the DOM (can be made invisible with CSS) so that the audio plays back.
    const audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    audioElement.id = "audio-" + participantId;
    document.body.appendChild(audioElement);
    track.attach(audioElement);
  }
  
}

function onConferenceJoined() {
  isJoined = true;
  for (let i = 0; i < localTracks.length; i++) {
    room.addTrack(localTracks[i]);
  }
}

function onUserLeft(id) {
  if (!remoteTracks[id]) {
    return;
  }
  const tracks = remoteTracks[id];
  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].getType() == 'video') {
      const key = "participant-" + id;
      const videoElement = window.videoElements[key];
      if (videoElement) {
        tracks[i].detach(videoElement);
        delete window.videoElements[key];
      }
    }
    else {
      const audioElement = document.getElementById('audio-' + id);
      if (audioElement) {
        tracks[i].detach(audioElement);
        audioElement.parentNode.removeChild(audioElement);
      }
    }
  }
}

function onConnectionSuccess() {
  room = connection.initJitsiConference();
  room.on(SariskaMediaTransport.events.conference.CONFERENCE_JOINED, onConferenceJoined);
  room.on(SariskaMediaTransport.events.conference.TRACK_ADDED, onRemoteTrack);
  room.on(SariskaMediaTransport.events.conference.USER_JOINED, id => { remoteTracks[id] = []; });
  room.on(SariskaMediaTransport.events.conference.USER_LEFT, onUserLeft);
  room.join();
}

function unload() {
  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].dispose();
  }
  room.leave();
  connection.disconnect();
}

async function connect() {

  let token;

    const body = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            apiKey: `249202aabed00b41363794b526eee6927bd35cbc9bac36cd3edcaa`,
            "user": {
              "id": "83hdmd6i",
              "name": "Dipak-2",
              "moderator": true,
              "email": "dipak@work.com",
              "avatar":"null"
          }
        })
    };

    try {
        const response = await fetch("https://api.sariska.io/api/v1/misc/generate-token", body);
        if (response.ok) {
            const json = await response.json();
            token =  json.token;
        } else {
          console.log("could not fetch token!!!");
          return; 
        }
    } catch (error) {
        console.log('error', error);
    }
    
  connection = new SariskaMediaTransport.JitsiConnection(token, "dipak");
  connection.addEventListener(SariskaMediaTransport.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
  connection.connect();
  SariskaMediaTransport.createLocalTracks({devices: ["audio", "video"]})
    .then(onLocalTracks);   
}

window.addEventListener('load', connect);
window.addEventListener('beforeunload', unload);
window.addEventListener('unload', unload);