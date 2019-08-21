import React, { useEffect } from 'react';

import Track from './TrackFields';

const TrackList = ({ trackCount, getFields }) => {
  const boundFieldCalls = [];

  const returnTrackValues = () => {
    const returnedValues = [];
    Array.from(new Array(trackCount)).map((item, index) => {
      const indexedFn = boundFieldCalls[index];
      returnedValues[index] = indexedFn();
    });
    return returnedValues;
  };

  // create new bounded
  const getAllFields = (getTrackFields, index) => {
    boundFieldCalls[index] = getTrackFields;
  };

  // bind returnTrackValues to parent fn
  useEffect(() => {
    getFields(returnTrackValues.bind(this));
  }, [getFields]);

  return Array.from(new Array(trackCount)).map((t, i) => <Track index={i} key={i} getFields={getAllFields} />);
}

export default TrackList;