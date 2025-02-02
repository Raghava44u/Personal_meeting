document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed");

    // Check if we are on index.html before looking for the join button
    if (!document.getElementById("join-btn")) {
        console.warn("⚠️ This is not index.html, skipping join button logic.");
        return;  // Exit the script if we are not on index.html
    }

    const socket = io();
    let localStream;
    let peerConnection;
    const remoteVideos = document.getElementById("video-feed");

    // Ensure the join button is available before attaching the event listener
    const joinButton = document.getElementById("join-btn");

    if (joinButton) {
        console.log("✅ Join button found!");
        joinButton.addEventListener("click", () => {
            const username = document.getElementById("username").value;
            if (username) {
                console.log("Joining meeting with username:", username);
                socket.emit("join", { username });
                window.location.href = "meeting.html";
            }
        });
    } else {
        console.error("❌ ERROR: Join button not found! Check if the button exists in the HTML.");
    }
});
