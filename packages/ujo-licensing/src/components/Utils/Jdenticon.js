import React from 'react';
import jdenticon from 'jdenticon';

const Jdenticon = ({ seed, size, style }) => {
  return <div style={style} dangerouslySetInnerHTML={{ __html: jdenticon.toSvg(seed, size) }} />;
};
export default Jdenticon;
