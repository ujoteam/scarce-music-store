export function togglePlay() {
  return {
    type: 'TOGGLE_PLAY',
  };
}

export function setRelease(release, contractAddress, index = 0) {
  return {
    type: 'SET_RELEASE',
    release,
    contractAddress,
    index,
  };
}

// export function setPlaylist(orderedTracks, playlist) {
//   return {
//     type: 'SET_PLAYLIST',
//     orderedTracks,
//     playlist,
//   };
// }

export function setVolume(volume) {
  return {
    type: 'SET_VOLUME',
    volume,
  };
}

export function setCurrentTrackIndex(trackNumber) {
  return {
    type: 'SET_CURRENT_TRACK',
    newTrackIndex: trackNumber,
  };
}

export function nextTrack() {
  return {
    type: 'ADJUST_CURRENT_TRACK',
    offset: 1,
  };
}

export function prevTrack() {
  return {
    type: 'ADJUST_CURRENT_TRACK',
    offset: -1,
  };
}

// export function setLoading(loading) {
//   return {
//     type: SET_LOADING,
//     loading,
//   };
// }

// // ------ below is currently depricated until updates ------
export function seek(pos) {
  return {
    type: 'SEEK',
    pos,
  };
}

// export function updateTrack(trackNumber, updatedTrack) {
//   return {
//     type: UPDATE_TRACK,
//     trackNumber,
//     updatedTrack,
//   };
// }
