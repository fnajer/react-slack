import React from 'react';
import uuidv4 from 'uuid/v4';
import { Segment, Input, Button } from 'semantic-ui-react';
import firebase from '../../firebase';
import { emojiIndex, Picker } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';

import FileModal from './FileModal';
import ProgressBar from './ProgressBar';

class MessageForm extends React.Component {
  state = {
    storageRef: firebase.storage().ref(),
    typingRef: firebase.database().ref('typing'),
    uploadTask: null,
    uploadState: '',
    percentUploaded: 0,
    message: '',
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    loading: false,
    errors: [],
    modal: false,
    emojiPicker: false,
  }

  componentWillUnmount() {
    if (this.state.uploadTask !== null) {
      this.state.uploadTask.cancel();
      this.setState({ uploadTask: null });
    }
  }

  openModal = () => this.setState({ modal: true });

  closeModal = () => this.setState({ modal: false });

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleKeyDown = event => {
    if (event.ctrlKey && event.keyCode === 13) {
      this.sendMessage();
    }
    
    const { message, typingRef, channel, user } = this.state;

    if (message) {
      typingRef
        .child(channel.id)
        .child(user.uid)
        .set(user.displayName);
    } else {
      typingRef
        .child(channel.id)
        .child(user.uid)
        .remove();
    }
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
    const { message, channel, errors, typingRef, user } = this.state;
    const { getMessagesRef } = this.props;

    if (message) {
      this.setState({ loading: true });

      getMessagesRef()
        .child(channel.id)
        .push()
        .set(this.createMessage())
        .then(() => {
          this.setState({ loading: false, message: '', errors: [] });
          typingRef
            .child(channel.id)
            .child(user.uid)
            .remove();
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

  getPath = () => {
    const { isPrivateChannel } = this.props;

    return isPrivateChannel ? `chat/private-${this.state.channel.id}` : 'chat/public';
  }

  uploadFile = (file, metadata) => {
    const pathToUpload = this.state.channel.id;
    const ref = this.props.getMessagesRef();
    const filePath = `${this.getPath()}/${uuidv4()}.jpg`;

    this.setState({
      uploadState: 'uploading',
      uploadTask: this.state.storageRef.child(filePath).put(file, metadata),
    },
    () => {
      this.state.uploadTask.on('state_changed', snap => {
        const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        this.props.isProgressBarVisible(percentUploaded);
        this.setState({ percentUploaded });
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
        this.state.uploadTask.snapshot.ref.getDownloadURL()
          .then(downloadUrl => {
            console.log(downloadUrl);
            this.sendFileMessage(downloadUrl, ref, pathToUpload);
          })
          .catch(err => {
            console.error(err);
            this.setState({
              errors: this.state.errors.concat(err),
              uploadState: 'error',
              uploadTask: null,
            });
          });
        }
     );
    });
  }

  sendFileMessage = (fileUrl, ref, pathToUpload) => {
    ref
      .child(pathToUpload)
      .push()
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

  handleTogglePicker = () => {
    this.setState({ emojiPicker: !this.state.emojiPicker });
  }

  handleAddEmoji = emoji => {
    const oldMessage = this.state.message;
    const newMessage = this.colonToUnicode(` ${oldMessage} ${emoji.colons} `);
    this.setState({ message: newMessage, emojiPicker: false });
    setTimeout(() => {
      this.messageInputRef.focus();
    }, 0);
  }

  colonToUnicode = message => {
    return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
      x = x.replace(/:/g, "");
      let emoji = emojiIndex.emojis[x];
      if (typeof emoji !== "undefined") {
        let unicode = emoji.native;
        if (typeof unicode !== "undefined") {
          return unicode;
        }
      }
      x = ":" + x + ":";
      return x;
    });
  }

  render() {
    // prettier-ignore
    const { errors, message, loading, modal, uploadState, percentUploaded, emojiPicker } = this.state;

    return (
      <Segment className="message__form">
        {
          emojiPicker && (
            <Picker
              set='apple'
              className='emojipicker'
              onSelect={this.handleAddEmoji}
              title="Pick your emoji"
              emoji="point_up"
            />
          )
        }
        <Input
          fluid
          name="message"
          value={message}
          style={{ marginBottom: '0.7em' }}
          ref={node => (this.messageInputRef = node)}
          label={
            <Button 
              icon={emojiPicker ? 'close' : 'add'}
              content={emojiPicker ? 'Close' : null}
              onClick={this.handleTogglePicker}
            />
          }
          labelPosition="left"
          placeholder="Write your message"
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
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
            disabled={uploadState === 'uploading'}
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
        <ProgressBar
          uploadState={uploadState}
          percentUploaded={percentUploaded}
        />
      </Segment>
    );
  }
}

export default MessageForm;