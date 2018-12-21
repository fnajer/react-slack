import React from 'react';
import { Segment, Input, Button } from 'semantic-ui-react';
import firebase from '../../firebase';

class MessageForm extends React.Component {
  state = {
    message: '',
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    loading: false,
    errors: [],
  }

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  }

  createMessage = () => {
    const { message, user } = this.state;

    const newMessage = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      content: message,
      user: {
        id: user.uid,
        name: user.displayName,
        avatar: user.photoURL,
      },
    };

    return newMessage;
  }

  sendMessage = () => {
    const { message, channel, errors } = this.state;
    const { messagesRef } = this.props;

    if (message) {
      this.setState({ loading: true });

      messagesRef
        .child(channel.id)
        .push()
        .set(this.createMessage())
        .then(() => {
          this.setState({ loading: false, message: '', errors: [] });
        })
        .catch(err => {
          console.error(err);

          this.setState({ 
            loading: false,
            errors: errors.concat(err),
          });
        });
    } else {
      this.setState({ errors: errors.concat({ message: 'Add a message' })});
    }
  }

  render() {
    const { errors, message, loading } = this.state;

    return (
      <Segment className="message__form">
        <Input
          fluid
          name="message"
          value={message}
          style={{ marginBottom: '0.7em' }}
          label={<Button icon="add"/>}
          labelPosition="left"
          placeholder="Write your message"
          onChange={this.handleChange}
          className={errors.some(error => error.message.includes('message')) ? 'error' : ''}
        />

        <Button.Group icon widths="2">
          <Button
            color="orange"
            icon="edit"
            labelPosition="left"
            content="Add Reply"
            onClick={this.sendMessage}
            disabled={loading}
          />
          <Button
            color="teal"
            icon="cloud upload"
            labelPosition="right"
            content="Upload Media"
          />
        </Button.Group>
      </Segment>
    );
  }
}

export default MessageForm;