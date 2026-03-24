// Adds (most) YouTube keyboard shortcuts (https://support.google.com/youtube/answer/7631406) to VideoJS
// see README for shortcuts

let framestep; // duration of 1 frame, in seconds.

function player() {
  return PluginApi.utils.InteractiveUtils.getPlayer();
}

function getFrameRate() {
  // get all candidates, find the one that contains "fps"
  return [...document.querySelectorAll(".scene-file-info dd")]
    .find((candidate) => candidate.innerText.includes("fps"))
    .textContent.split(" ")[0];
}

function toggleCaptions() {
  const track = player().textTracks()[0];
  track.mode = track.mode == "showing" ? "hidden" : "showing";
}

function navMarker(next = true) {
  const markersSeconds = player().markers().markers.map((marker) => marker.seconds);
  const curTime = player().currentTime();
  const newMarkerSeconds = next
    ? markersSeconds.find((marker) => marker > curTime)
    : markersSeconds.toReversed().find((marker) => marker < curTime - 5);
  if (newMarkerSeconds) player().currentTime(newMarkerSeconds);
};

function changePbRate(increase = true) {
  const availableRates = player().playbackRates();
  const curRateIdx = availableRates.findIndex((e) => e == player().playbackRate());
  const newRateIndex = increase ? (curRateIdx + 1) : (curRateIdx - 1);
  if (newRateIndex < 0 || newRateIndex >= availableRates.length){
    return;
  }
  player().playbackRate(availableRates[newRateIndex]);
};

function handleKey(evt) {
  const key = evt.key;
  // Home | 0 - Seek to start of video
  if (key == "Home" || key == "0") {
    player().currentTime(0);
    evt.preventDefault();
  }
  // End - Seek to end of video
  else if (key == "End") {
    player().currentTime(player().duration());
    evt.preventDefault();
  }
  // . - Step forward 1 frame
  else if (key == "." && player().paused()) {
    player().currentTime(player().currentTime() + framestep);
    evt.preventDefault();
  } // , - step backward 1 frame
  else if (key == "," && player().paused()) {
    player().currentTime(player().currentTime() - framestep);
    evt.preventDefault();
  }
  // Ctrl + ], [ - Jump to next/previous marker
  else if (key == "]" && evt.ctrlKey) navMarker(/* next= */ true);
  else if (key == "[" && evt.ctrlKey) navMarker(/* next= */ false);
  // speed up playback rate
  else if (key == ">") changePbRate(/* increase= */true);
  // slow down playback rate
  else if (key == "<") changePbRate(/* increase= */false);
  // c - toggle captions
  else if (key == "c") toggleCaptions();
  // Shift+N - Jump to next video
  else if (key == "N" && evt.shiftKey) player().skipButtons().onNext();
  // Shift+P - Jump to previous video
  else if (key == "P" && evt.shiftKey) player().skipButtons().onPrevious();
}

let isWaitingForVideoJs = false;
function initAfterVideoJsElementExists() {
  if (!isWaitingForVideoJs) {
    isWaitingForVideoJs = true;
    wfke("video-js", init);
  }
}

// Registers keydown listener if not already registered, preps to do framerate grab, and dispatches a "vjs-shortcut:ready" event.
function init() {
  isWaitingForVideoJs = false;
  const playerElement = player().el();
  if (!playerElement.dataset.vjsInitialized){
    player().on("keydown", handleKey);
    playerElement.dataset.vjsInitialized = true;
  }
  // once scene info is loaded, get framerate
  wfke(".scene-file-info", () => (framestep = 1 / getFrameRate()));
  document.dispatchEvent(
    new CustomEvent("vjs-shortcut:ready", { detail: { player: player() } }),
  );
}

// Init upon first video-js element existing
initAfterVideoJsElementExists();
// And upon a new video-js element existing after a location change
PluginApi.Event.addEventListener("stash:location", initAfterVideoJsElementExists);
