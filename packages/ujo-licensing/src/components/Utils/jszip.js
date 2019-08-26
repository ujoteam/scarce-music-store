import JSZip from 'jszip';

import getBinaryContent from './zipUtils';

const serverAddress = 'http://localhost:3001';

const getBinary = (url, jwt) =>
  new Promise((res, rej) => {
    getBinaryContent(url, jwt, (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });

const createZip = async (storeId, releaseId, artistName, releaseName, tracks, jwt) => {
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  console.log('????');

  try {
    const zip = new JSZip();
    // top level directory
    const releaseDir = zip.folder(`${artistName}-${releaseName}_mp3`.replace(/ /g, '_'));

    // create binaries
    const createBinary = tracks.map((track, i) =>
      getBinary(`${serverAddress}/content/${storeId}/${releaseId}/${i}?download=true`, jwt),
    );
    const binaries = await Promise.all(createBinary);

    // add files to directory in the zip
    binaries.map((bin, i) => {
      const track = tracks.get(i);
      const trackNumber = i + 1;
      // get filename
      const number = trackNumber < 10 ? `${0}${trackNumber}` : `${trackNumber}`;
      const filename = `${number}-${track.get('name')}.mp3`.replace(/ /g, '_');

      releaseDir.file(filename, bin, { binary: true });
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(blob);

    a.download = `${artistName}-${releaseName}_mp3`.replace(/ /g, '_');
    a.href = url;
    a.click();
    return;
  } catch (err) {
    throw new Error(err);
  }
};

export default createZip;
