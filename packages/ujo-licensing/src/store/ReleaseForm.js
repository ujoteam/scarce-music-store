/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { Button, Form, Box, Textarea, Flex } from 'rimble-ui';

import { createScarceRelease } from './storeActions';
import TrackList from './TrackList';

export class ReleaseForm extends React.Component {
  constructor(props) {
    super(props);
    // create a ref to store the textInput DOM element
    this.artistName = React.createRef();
    this.releaseName = React.createRef();
    this.price = React.createRef();
    this.inventory = React.createRef();
    this.date = React.createRef();
    this.description = React.createRef();
    this.recordLabel = React.createRef();
    this.releaseImage = React.createRef();

    this.state = { tracks: 1 };
  }

  getFields(getTrackFields) {
    this.getTrackFields = getTrackFields;
  }

  addTrack(e) {
    e.preventDefault();
    this.setState(({ tracks }) => ({ tracks: tracks + 1 }));
  }

  handleSubmit(e) {
    e.preventDefault();
    const tracks = this.getTrackFields();

    const releaseInfo = {
      // artist info
      artistName: this.artistName.current.value,

      // release info
      releaseImage: this.releaseImage.current.files[0],
      releaseName: this.releaseName.current.value,
      datePublished: this.date.current.value,
      description: this.description.current.value,
      recordLabel: this.recordLabel.current.value,

      // contract info
      inventory: this.inventory.current.value,
      price: this.price.current.value,

      // tracks
      tracks,
    };

    console.log('releaseInfo', releaseInfo);

    const { currentAccount, licensingContractAddress, currentStore, indexOfAccount } = this.props;

    this.props.createScarceRelease(releaseInfo, currentAccount, licensingContractAddress, currentStore, indexOfAccount);
  }

  render() {
    return (
      <Box>
        <Form onSubmit={e => this.handleSubmit(e)}>
          <Box p={15} display="inline-block" width={1/3}>
            <Form.Field label="Artist Name" width={1}>
              <Form.Input
                type="text"
                required
                ref={this.artistName}
                placeholder="Artist Name"
                width={1}
                onChange={this.handleValidation}
              />
            </Form.Field>
          </Box>
          <Box p={15} display="inline-block" width={1/3}>
            <Form.Field label="Release Name" width={1}>
              <Form.Input
                type="text"
                required
                ref={this.releaseName}
                placeholder="Release Name"
                width={1}
                onChange={this.handleValidation}
              />
            </Form.Field>
          </Box>
          <Box p={15} display="inline-block" width={1/3}>
            <Form.Field label="Release Image" width={1}>
              <Form.Input
                type="file"
                required
                ref={this.releaseImage}
                width={1}
                onChange={this.handleValidation}
              />
            </Form.Field>
          </Box>
          <Box p={15} display="inline-block" width={1/4}>
            <Form.Field label="Price" width={1}>
              <Form.Input
                type="text"
                required
                ref={this.price}
                placeholder="in USD"
                width={1}
                onChange={this.handleValidation}
              />
            </Form.Field>
          </Box>
          <Box p={15} display="inline-block" width={1/4}>
            <Form.Field label="Inventory" width={1}>
              <Form.Input
                type="number"
                required
                ref={this.inventory}
                placeholder="0 represents an infinite amount"
                width={1}
                onChange={this.handleValidation}
              />
            </Form.Field>
          </Box>
          <Box p={15} display="inline-block" width={1/4}>
            <Form.Field label="Record Label" width={1}>
              <Form.Input
                type="text"
                required
                ref={this.recordLabel}
                placeholder="Record Label"
                width={1}
                onChange={this.handleValidation}
              />
            </Form.Field>
          </Box>
          <Box p={15} display="inline-block" width={1/4}>
            <Form.Field label="Date Published" width={1}>
              <Form.Input
                type="date"
                required
                ref={this.date}
                width={1}
                onChange={this.handleValidation}
              />
            </Form.Field>
          </Box>
          <Box p={15} display="inline-block" width={1}>
            <Form.Field label="Description" width={1}>
              <Textarea
                type="text"
                placeholder="Describe the release..."
                ref={this.description}
                width={1}
                onChange={this.handleValidation}
              />
            </Form.Field>
          </Box>
          <Flex p={15} width={1} alignItems="baseline" justifyContent="space-between">
            <h3>Track List</h3>
            <Button onClick={e => this.addTrack(e)}>Add A Track</Button>
          </Flex>
          <Box display="inline-block" width={1}>
            <TrackList getFields={this.getFields.bind(this)} trackCount={this.state.tracks} />
          </Box>
          <Button type="submit" width={1}>
            Create Product
          </Button>
        </Form>
      </Box>
    );
  }
}

export default connect(
  state => ({
    currentAccount: state.store.get('currentAccount'),
    indexOfAccount: state.store.getIn(['web3', 'accounts']).indexOf(state.store.get('currentAccount')),
  }),
  {
    createScarceRelease,
  },
)(ReleaseForm);
