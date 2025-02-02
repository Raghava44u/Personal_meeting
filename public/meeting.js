document.addEventListener("DOMContentLoaded", async function () {
  console.log("📢 Meeting Page Loaded");

  const socket = io();
  let localStream = null;
  let peerConnection;
  const remoteVideos = document.getElementById("video-feed");

  // Start Local Stream
  async function startLocalStream() {
      try {
          localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          console.log("✅ Local stream captured:", localStream);

          // 🔥 Ensure local video element is always added
          let localVideo = document.getElementById("local-video");
          if (!localVideo) {
              localVideo = document.createElement("video");
              localVideo.id = "local-video";
              remoteVideos.appendChild(localVideo);
          }

          localVideo.srcObject = localStream;
          localVideo.autoplay = true;
          localVideo.muted = true;
          console.log("📷 Local video added to DOM");

          return localStream;

      } catch (err) {
          console.error("❌ Camera Error:", err);
          alert("❌ Error accessing camera: " + err.message);
          return null;
      }
  }

  // Start video immediately when page loads
  await startLocalStream(); // Wait for the local stream to start

  // Handle user joining the meeting
  socket.on("user-joined", async (user) => {
      console.log(`${user.username} joined the meeting`);

      if (!localStream) {
          console.log("⏳ Waiting for local stream to start...");
          localStream = await startLocalStream();  // Wait for local stream to start
      }

      if (!localStream) {
          console.error("❌ Local stream is not available. Cannot proceed.");
          return;
      }

      peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      console.log("🔗 Creating peer connection");

      // Add local stream tracks to the peer connection
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

      // ICE Candidate Handling
      peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
              console.log("📡 Sending ICE candidate...");
              socket.emit("signal", { to: user.id, candidate: event.candidate });
          }
      };

      // Handle Remote Video Stream (when another user joins)
      peerConnection.ontrack = (event) => {
          console.log("📡 Received remote track:", event);

          // Create remote video element
          let remoteVideo = document.getElementById(`remote-video-${user.username}`);
          if (!remoteVideo) {
              remoteVideo = document.createElement("video");
              remoteVideo.id = `remote-video-${user.username}`;
              remoteVideos.appendChild(remoteVideo);
          }

          remoteVideo.srcObject = event.streams[0];
          remoteVideo.autoplay = true;
          remoteVideo.playsInline = true; // Ensure inline video on mobile
          console.log("📡 Remote video added to DOM");
      };

      // Create and send an offer to the remote user
      peerConnection.createOffer().then(offer => {
          console.log("📡 Sending offer...");
          peerConnection.setLocalDescription(offer);
          socket.emit("signal", { to: user.id, offer });
      }).catch(err => {
          console.error("❌ Error creating offer:", err);
      });
  });

  // Handle Signaling Data (Offer, Answer, ICE Candidates)
  socket.on("signal", async (data) => {
      console.log("📡 Received signaling data:", data);

      if (!localStream) {
          console.log("⏳ Waiting for local stream to start...");
          localStream = await startLocalStream();
      }

      if (data.offer) {
          console.log("📡 Received offer, creating answer...");
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          peerConnection.createAnswer().then(answer => {
              console.log("📡 Sending answer...");
              peerConnection.setLocalDescription(answer);
              socket.emit("signal", { to: data.from, answer });
          }).catch(err => {
              console.error("❌ Error creating answer:", err);
          });
      } else if (data.answer) {
          console.log("📡 Received answer, setting remote description...");
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.candidate) {
          console.log("📡 Received ICE candidate...");
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
  });
});
