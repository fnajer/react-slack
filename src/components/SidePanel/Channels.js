import React from 'react';
import { connect } from 'react-redux';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
import firebase from '../../firebase';
import { Menu, Icon, Modal, Form, Input, Button, Label } from 'semantic-ui-react';

class Channels extends React.Component {
  state = {
    channels: [],
    channelName: '',
    channelDetails: '',
    channel: null,
    modal: false,
    channelsRef: firebase.database().ref('channels'),
    messagesRef: firebase.database().ref('messages'),
    typingRef: firebase.database().ref('typing'),
    notifications: [],
    firstLoad: true,
    activeChannel: null,
    user: this.props.currentUser,
  }

  componentDidMount() {
    this.addListeners();
  }

  componentWillUnmount() {
    this.removeListeners();
  }

  addListeners = () => {
    const loadedChannels = [];

    this.state.channelsRef.on('child_added', snap => {
      loadedChannels.push(snap.val());
      this.setState({ channels: loadedChannels }, this.setFirstChannel);
      this.addNotificationListener(snap.key);
    });
  }

  addNotificationListener = channelId => {
    this.state.messagesRef.child(channelId).on('value', snap => {
      if (this.state.channel) {
        this.handleNotifications(channelId, this.state.channel.id, this.state.notifications, snap);
      }
    });
  }

  handleNotifications = (channelId, currentChannelId, notifications, snap) => {
    let lastTotal = 0;

    const index = notifications.findIndex(notification => notification.id === channelId);

    if (index !== -1) {
      if (channelId !== currentChannelId) {
        lastTotal = notifications[index].total;

        if (snap.numChildren() - lastTotal > 0) {
          notifications[index].count = snap.numChildren() - lastTotal;
        }
      }
      notifications[index].lastKnownTotal = snap.numChildren();
    } else {
      notifications.push({
        id: channelId,
        total: snap.numChildren(),
        lastKnownTotal: snap.numChildren(),
        count: 0,
      });
    }

    this.setState({ notifications });
  }

  removeListeners = () => {
    this.state.channelsRef.off();
    this.state.channels.forEach(channel => {
      this.state.messagesRef.child(channel.id).off();
    });
  }

  setFirstChannel = () => {
    const firstChannel = this.state.channels[0];
    if (this.state.firstLoad && this.state.channels.length > 0) {
      this.setActiveChannel(firstChannel);
      this.props.setCurrentChannel(firstChannel);
      this.setState({ channel: firstChannel });
    }
    this.setState({ firstLoad: false });
  }

  changeChannel = channel => {
    this.setActiveChannel(channel);
    this.state.typingRef
        .child(this.state.channel.id)
        .child(this.state.user.uid)
        .remove();
    this.props.setCurrentChannel(channel);
    this.props.setPrivateChannel(false);
    this.setState({ channel });
    this.clearNotifications(channel);
  }

  clearNotifications = (channel) => {
    let index = this.state.notifications.findIndex(notification => notification.id === channel.id);
    console.log(this.state.notifications[index]);
    if (index !== -1) {
      let updatedNotifications = [...this.state.notifications];
      updatedNotifications[index].total = this.state.notifications[index].lastKnownTotal;
      updatedNotifications[index].count = 0;

      this.setState({ notifications: updatedNotifications });
    }
  }

  getNotificationCount = channel => {
    let count = 0;

    this.state.notifications.forEach(notification => {
      if (notification.id === channel.id) {
        count = notification.count;
      }
    });

    if (count > 0) {
      return count;
    }
  }

  setActiveChannel = channel => {
    this.setState({ activeChannel: channel.id });
  }

  displayChannels = channels => (
    channels.length > 0 && channels.map(channel => (
      <Menu.Item
        key={channel.id}
        onClick={() => this.changeChannel(channel)}
        name={channel.name}
        style={{ opacity: 0.7 }}
        active={channel.id === this.state.activeChannel}
      >
        {this.getNotificationCount(channel) &&
          <Label color='red'>{this.getNotificationCount(channel)}</Label>
        }
        # {channel.name}
      </Menu.Item>
    ))
  )

  openModal = () => this.setState({ modal: true })
  closeModal = () => this.setState({ modal: false })

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleSubmit = event => {
    event.preventDefault();
    if (this.isFormValid(this.state)) {
      const { channelsRef, channelName, channelDetails, user } = this.state;

      const key = channelsRef.push().key;

      const newChannel = {
        id: key,
        name: channelName,
        details: channelDetails,
        createdBy: {
          name: user.displayName,
          avatar: user.photoURL,
        },
      };

      channelsRef
        .child(key)
        .update(newChannel)
        .then(() => {
          this.setState({ channelName: '', channelDetails: '' });
          console.log('channel added');
          this.closeModal();
        })
        .catch(err => {
          console.error(err);
        });
    }
  }

  isFormValid = ({ channelName, channelDetails }) => channelName && channelDetails;

  render() {
    const { channels, modal } = this.state;

    return (
      <React.Fragment>
        <Menu.Menu className="menu">
          <Menu.Item>
            <span>
              <Icon name="exchange"/> CHANNELS
            </span>{' '}
            ({channels.length}) <Icon name="add" onClick={this.openModal}/>
          </Menu.Item>

          {/* CHANNELS */}
          {this.displayChannels(channels)}
        </Menu.Menu>

        {/* Add Channel Modal */}
        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header>
            Add a Channel
          </Modal.Header>
          <Modal.Content>
            <Form onSubmit={this.handleSubmit}>
              <Form.Field>
                <Input
                  fluid
                  label="Name of Channel"
                  name="channelName"
                  onChange={this.handleChange}
                />
              </Form.Field>
              <Form.Field>
                <Input
                  fluid
                  label="About the Channel"
                  name="channelDetails"
                  onChange={this.handleChange}
                />
              </Form.Field>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button color='green' inverted onClick={this.handleSubmit}>
              <Icon name='add'/> Add
            </Button>
            <Button color='red' inverted onClick={this.closeModal}>
              <Icon name='remove'/> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(Channels);