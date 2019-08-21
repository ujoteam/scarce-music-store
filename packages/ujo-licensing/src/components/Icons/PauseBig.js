import React from 'react';

import SVGIconContainer from './SVGIconContainer';
import BasicSVG from './BasicSVG';

export default class PauseBig extends BasicSVG {
  render() {
    return (
      <SVGIconContainer {...this.props}>
        <path
          d="M1.5,16 C0.675,16 0,15.1692308 0,14.1538462 L0,1.84615385 C0,0.830769231 0.675,0 1.5,0 C2.325,0 3,0.830769231 3,1.84615385 L3,14.1538462 C3,15.1692308 2.325,16 1.5,16 Z M8.16666667,16 C7.34166667,16 6.66666667,15.1692308 6.66666667,14.1538462 L6.66666667,1.84615385 C6.66666667,0.830769231 7.34166667,0 8.16666667,0 C8.99166667,0 9.66666667,0.830769231 9.66666667,1.84615385 L9.66666667,14.1538462 C9.66666667,15.1692308 8.99166667,16 8.16666667,16 Z"
          transform="translate(3.000000, 0.000000)"
        />
      </SVGIconContainer>
    );
  }
}
