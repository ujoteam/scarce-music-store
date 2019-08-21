import React from 'react';

import SVGIconContainer from './SVGIconContainer';
import BasicSVG from './BasicSVG';

export default class Pause extends BasicSVG {
  render() {
    return (
      <SVGIconContainer {...this.props}>
        <path d="M4.5 14c-.83 0-1.5-.536-1.5-1.2V3.2C3 2.536 3.67 2 4.5 2S6 2.536 6 3.2v9.6c0 .664-.67 1.2-1.5 1.2zm7 0c-.83 0-1.5-.536-1.5-1.2V3.2c0-.664.67-1.2 1.5-1.2s1.5.536 1.5 1.2v9.6c0 .664-.67 1.2-1.5 1.2z" />
      </SVGIconContainer>
    );
  }
}
