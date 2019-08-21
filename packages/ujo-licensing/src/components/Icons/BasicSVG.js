import React from 'react';
import PropTypes from 'prop-types';

import SVGIconContainer from './SVGIconContainer';

export default class BasicSVG extends React.PureComponent {
  // static propTypes = {
  //   w: PropTypes.number,
  //   h: PropTypes.number,
  //   activeColor: PropTypes.string,
  //   inactiveColor: PropTypes.string,
  //   active: PropTypes.bool,
  // }

  // static defaultProps = {
  //   w: 16,
  //   h: 16,
  //   activeColor: '',
  //   inactiveColor: '',
  //   active: false,
  // }

  render() {
    return <SVGIconContainer {...this.props} />;
  }
}
