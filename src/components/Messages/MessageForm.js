import React from 'react';
import uuidv4 from 'uuid/v4';
import { Segment, Input, Button } from 'semantic-ui-react';
import firebase from '../../firebase';

import FileModal from './FileModal';

class MessageForm extends React.Component {
  state = {
    storageRef: firebase.storage().ref(),
    uploadTask: null,
    uploadState: '',
    percentUploaded: 0,
    message: '',
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    loading: false,
    errors: [],
    modal: false,
  }

  openModal = () => this.setState({ modal: true });

  closeModal = () => this.setState({ modal: false });

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  }

  createMessage = (fileUrl = null) => {
    const { message, user } = this.state;

    const newMessage = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      user: {
        id: user.uid,
        name: user.displayName,
        avatar: user.photoURL,
      },
    };

    if (fileUrl !== null) {
      newMessage['image'] = fileUrl;
    } else {
      newMessage['content'] = message;
    }

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

  uploadFile = (file, metadata) => {
    const pathToUpload = this.state.channel.id;
    const ref = this.props.messagesRef;
    const filePath = `chat/public/${uuidv4()}.jpg`;

    this.setState({
      uploadState: 'uploading',
      uploadTask: this.state.storageRef.child(filePath).put(file, metadata),
    },
    () => {
      this.state.storageRef.on('state_changed', snap => {
        const percentUploaded = Math.round(snap.bytesTransferred / snap.totalBytes) * 100;
        this.setState({ percentUploaded });
      });
    },
    err => {
      console.error(err);
      this.setState({
        errors: this.state.errors.concat(err),
        uploadState: 'error',
        uploadTask: null,
      });
    },
    () => {
      this.state.uploadTask.snapshot.ref.getDownoloadURL().then(downoloadUrl => {
        this.sendFileMessage(downoloadUrl, ref, pathToUpload);
      },
      err => {
        console.error(err);
        this.setState({
          errors: this.state.errors.concat(err),
          uploadState: 'error',
          uploadTask: null,
        });
      });
    });
  }

  sendFileMessage = (fileUrl, ref, pathToUpload) => {
    ref
      .child(pathToUpload)
      .set(this.createMessage(fileUrl))
      .then(() => {
        this.setState({
          uploadState: 'done',
        });
      })
      .catch(err => {
        this.setState({
          errors: this.state.errors.concat(err),
        });
      });
  }

  render() {
    const { errors, message, loading, modal } = this.state;

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
            onClick={this.openModal}
          />
        </Button.Group>
        <FileModal
          modal={modal}
          closeModal={this.closeModal}
          uploadFile={this.uploadFile}
        />
      </Segment>
    );
  }
}

export default MessageForm;