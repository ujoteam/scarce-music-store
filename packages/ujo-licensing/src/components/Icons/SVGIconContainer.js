import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SVGIconContainer = (props) => {
  const [active, changeActivity] = useState(false);

  function setActivity(bool) { changeActivity(bool); }

  return (
    <svg
      viewBox="0 0 16 16"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width={props.w}
      height={props.h}
      onMouseEnter={() => setActivity(true)}
      onMouseLeave={() => setActivity(false)}
      className={`${props.className} ${props.clickable && 'clickable'}`}
      onClick={props.onClick}
    >
      <g fillRule="evenodd" style={{ fill: (props.active || active) ? props.activeColor : props.inactiveColor }}>
        {props.children}
      </g>
    </svg>
  );
};

SVGIconContainer.propTypes = {
  w: PropTypes.number,
  h: PropTypes.number,
  activeColor: PropTypes.string,
  inactiveColor: PropTypes.string,
  active: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  clickable: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.arrayOf(PropTypes.node),
  ]),
};

SVGIconContainer.defaultProps = {
  w: 16,
  h: 16,
  activeColor: '',
  inactiveColor: '',
  active: false,
  className: '',
  children: <div />,
  onClick: () => {},
  clickable: false,
};

export default SVGIconContainer;