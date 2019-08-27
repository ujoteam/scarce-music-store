/* eslint-disable react/prop-types */
import React, { useEffect, useState, useRef } from 'react';
import { Box, Form } from 'rimble-ui';


const TrackFields = ({ index, getFields }) => {
  const trackName = useRef();
  const songFile = useRef();
  const duration = useRef();

  const returnFields = () => {
    return { name: trackName.current.value, file: songFile.current.files[0], index, duration: duration.current.value };
  }

  const getDuration = async () => {
    const objectUrl = URL.createObjectURL(songFile.current.files[0]);
    return new Promise((res, rej) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        duration.current.value = audio.duration;
      };
      audio.onerror = () => rej('There was an error reading the file type to set track duration.');
      audio.src = objectUrl;
    });
  }

  useEffect(() => {
    getFields(returnFields.bind(this), index);
  }, [getFields]);

  return (
    <Box>
      <Box p={15} display="inline-block" width={1/4}>
        <Form.Field label={`Track ${index + 1} File`} width={1}>
          <Form.Input type="file" width={1} required ref={songFile} onChange={() => getDuration()} />
        </Form.Field>
      </Box>
      <Box p={15} display="inline-block" width={3/4}>
        <Form.Field label={`Track ${index + 1} Name`} width={1}>
          <Form.Input type="text" placeholder="Track Name" width={1} required ref={trackName} />
        </Form.Field>
      </Box>
      <Form.Input type="text" placeholder="Track Name" width={1} ref={duration} style={{ display: 'none' }} />
    </Box>
  );
};

export default TrackFields;
