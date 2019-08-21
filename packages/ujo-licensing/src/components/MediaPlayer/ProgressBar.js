import React, { Fragment } from 'react';
import Slider from 'react-rangeslider';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export default class ProgressBar extends React.PureComponent {
  // static propTypes = {
  //   className: PropTypes.string,
  //   total: PropTypes.number.isRequired,
  //   pos: PropTypes.number.isRequired,
  //   oneStepLength: PropTypes.number,
  //   onClick: PropTypes.func.isRequired,
  //   showHandle: PropTypes.bool,
  // }

  // static defaultProps = {
  //   className: '',
  //   showHandle: false,
  //   oneStepLength: 1,
  // }

  constructor(props) {
    super(props);

    this.state = {
      posPercent: null,
    };
  }

  onPositionChange(v) {
    this.setState({ posPercent: v });
  }

  onPositionComplete() {
    this.progressBarClick(this.state.posPercent / 100);
    this.setState({ posPercent: null });
  }

  progressBarClick(progressPercentage) {
    this.props.onClick(progressPercentage);
  }

  render() {
    const percentComplete = (this.props.pos < this.props.total)
    ? this.props.pos / this.props.total
    : 1;

    const positionValueDisplayed = this.state.posPercent
    ? this.state.posPercent
    : percentComplete * 100;

    const sliderClassNames = classNames(
      `progress-bar-container ${this.props.className}`,
      { showHandle: this.props.showHandle },
    );

    return (
      <Fragment>
        <div className={sliderClassNames} role="progressbar">
          <Slider
            min={0}
            max={100}
            step={this.props.oneStepLength}
            value={positionValueDisplayed}
            onChange={v => this.onPositionChange(v)}
            onChangeComplete={() => this.onPositionComplete()}
            tooltip={false}
          />
        </div>
      </Fragment>
    );
  }
}
