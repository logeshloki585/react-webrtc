import { io } from "socket.io-client";
import { useRef, useEffect, useState } from "react";
import { FiVideo, FiVideoOff, FiMic, FiMicOff } from "react-icons/fi";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const socket = io("https://visible-marylou-adrig0-f6c34b2a.koyeb.app", { transports: ["websocket"] });
const roomId = "123"; // You can dynamically generate or assign this

let pc;
let localStream;
let startButton;
let hangupButton;
let muteAudButton;
let remoteVideo;
let localVideo;

// Join the room when the component loads
socket.emit("join-room", roomId);

socket.on("message", (e) => {
  if (!localStream) {
    console.log("Not ready yet");
    return;
  }
  console.log("Message received:", e);
  switch (e.type) {
    case "offer":
      handleOffer(e);
      break;
    case "answer":
      handleAnswer(e);
      break;
    case "candidate":
      handleCandidate(e);
      break;
    case "ready":
      if (pc) {
        console.log("Already in call, ignoring");
        return;
      }
      makeCall();
      break;
    case "bye":
      if (pc) {
        hangup();
      }
      break;
    default:
      console.log("Unhandled message:", e);
      break;
  }
});

async function makeCall() {
  try {
    pc = new RTCPeerConnection(configuration);
    pc.onicecandidate = (e) => {
      const message = {
        type: "candidate",
        candidate: null,
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      if (message.candidate !== null) {
        socket.emit("message", message, roomId); // Include roomId when emitting
      }
    };
    pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    const offer = await pc.createOffer();
    socket.emit("message", { type: "offer", sdp: offer.sdp }, roomId); // Include roomId when emitting
    await pc.setLocalDescription(offer);
  } catch (e) {
    console.log(e);
  }
}

async function handleOffer(offer) {
  if (pc) {
    console.error("Existing peer connection");
    return;
  }
  try {
    pc = new RTCPeerConnection(configuration);
    pc.onicecandidate = (e) => {
      const message = {
        type: "candidate",
        candidate: null,
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      if (message.candidate !== null) {
        socket.emit("message", message, roomId); // Include roomId when emitting
      }
    };
    pc.ontrack = (e) => (remoteVideo.current.srcObject = e.streams[0]);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    socket.emit("message", { type: "answer", sdp: answer.sdp }, roomId); // Include roomId when emitting
    await pc.setLocalDescription(answer);
  } catch (e) {
    console.log(e);
  }
}

async function handleAnswer(answer) {
  if (!pc) {
    console.error("No peer connection");
    return;
  }
  try {
    await pc.setRemoteDescription(answer);
  } catch (e) {
    console.log(e);
  }
}

async function handleCandidate(candidate) {
  try {
    if (!pc) {
      console.error("No peer connection");
      return;
    }
    if (!candidate || (!candidate.sdpMid && candidate.sdpMLineIndex === null)) {
      console.error("Candidate is missing sdpMid or sdpMLineIndex");
      return;
    }
    await pc.addIceCandidate(candidate);
  } catch (e) {
    console.log(e, candidate);
  }
}

async function hangup() {
  if (pc) {
    pc.close();
    pc = null;
  }
  localStream.getTracks().forEach((track) => track.stop());
  localStream = null;
  startButton.current.disabled = false;
  hangupButton.current.disabled = true;
  muteAudButton.current.disabled = true;
}

function NewConf() {
  startButton = useRef(null);
  hangupButton = useRef(null);
  muteAudButton = useRef(null);
  localVideo = useRef(null);
  remoteVideo = useRef(null);
  
  useEffect(() => {
    hangupButton.current.disabled = true;
    muteAudButton.current.disabled = true;
  }, []);
  
  const [audiostate, setAudio] = useState(false);

  const startB = async () => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true },
      });
      localVideo.current.srcObject = localStream;
    } catch (err) {
      console.log(err);
    }

    startButton.current.disabled = true;
    hangupButton.current.disabled = false;
    muteAudButton.current.disabled = false;

    socket.emit("message", { type: "ready" }, roomId); // Include roomId when emitting
  };

  const hangB = async () => {
    hangup();
    socket.emit("message", { type: "bye" }, roomId); // Include roomId when emitting
  };

  function muteAudio() {
    if (audiostate) {
      localVideo.current.muted = true;
      setAudio(false);
    } else {
      localVideo.current.muted = false;
      setAudio(true);
    }
  }

  return (
    <>
      <main className="container">
        <div className="video bg-main">
          <video
            ref={localVideo}
            className="video-item"
            autoPlay
            playsInline
          ></video>
          <video
            ref={remoteVideo}
            className="video-item"
            autoPlay
            playsInline
          ></video>
        </div>

        <div className="btn">
          <button
            className="btn-item btn-start"
            ref={startButton}
            onClick={startB}
          >
            <FiVideo />
          </button>
          <button
            className="btn-item btn-end"
            ref={hangupButton}
            onClick={hangB}
          >
            <FiVideoOff />
          </button>
          <button
            className="btn-item btn-start"
            ref={muteAudButton}
            onClick={muteAudio}
          >
            {audiostate ? <FiMic /> : <FiMicOff />}
          </button>
        </div>
      </main>
    </>
  );
}

export default NewConf;
