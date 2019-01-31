import React from "react";
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { setUserPosts } from '../../actions';
import { Segment, Comment } from 'semantic-ui-react';
import MessagesHeader from './MessagesHeader';
import MessageForm from './MessageForm';
import Message from './Message';

class Messages extends React.Component {
  state={
    isPrivateChannel: this.props.isPrivateChannel,
    usersRef: firebase.database().ref('users'),
    privateMessagesRef: firebase.database().ref('privateMessages'),
    messagesRef: firebase.database().ref('messages'),
    messages: [],
    messagesLoading: true,
    progressBar: false,
    numUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    searchResults: [],
    isChannelStarred: false,
  }

  componentDidMount() {
    const { currentChannel, currentUser } = this.props;

    if (currentChannel && currentUser) {
      this.addListeners(currentChannel.id);
      this.addUserStarsListener(currentChannel.id, currentUser.uid);
    }
  }

  addUserStarsListener = (channelId, userId) => {
    this.state.usersRef
      .child(`${userId}/starred`)
      .once('value')
      .then(data => {
        if (data.val() !== null) {
          console.log(data.val());
          const channelIds = Object.keys(data.val());
          const prevStarred = channelIds.includes(channelId);
          this.setState({ isChannelStarred: prevStarred });
        }
      });
  }

  addListeners = channelId => {
    this.addMessageListener(channelId);
  }

  addMessageListener = channelId => {
    const loadedMessages = [];
    const ref = this.getMessagesRef();

    ref.child(channelId).on('child_added', snap => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false,
      });
      this.countUniqueUsers(loadedMessages);
      this.countUserPosts(loadedMessages);
    });
  }

  countUserPosts = messages => {
    const userPosts = messages.reduce((acc, message) => {
      if (acc[message.user.name]) {
        acc[message.user.name].count += 1;
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1,
        };
      }
      return acc;
    }, {});

    this.props.setUserPosts(userPosts);
  }

  getMessagesRef = () => {
    const { isPrivateChannel, privateMessagesRef, messagesRef } = this.state;
    return isPrivateChannel ? privateMessagesRef : messagesRef;
  }

  countUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.name)) {
        acc.push(message.name);
      }
      return acc;
    }, []);

    const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
    const numUniqueUsers = `${uniqueUsers.length} User${plural ? 's' : ''}`;
    this.setState({ numUniqueUsers });
  }

  displayMessages = (messages) => (
    messages.length > 0 && messages.map(message => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.props.currentUser}
      />
    ))
  )

  isProgressBarVisible = percent => {
    if (percent > 0) {
      this.setState({ progressBar: true });
    }
    if (percent === 100) {
      this.setState({ progressBar: false });
    }
  }

  displayChannelName = channel => {
    return channel ? `${this.state.isPrivateChannel ? '@' : '#'}${channel.name}` : '';
  }

  handleSearchChange = event => {
    this.setState({
      searchTerm: event.target.value,
      searchLoading: true,
    }, () => this.handleSearchMessages());
  }

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, 'gi');
    const searchResults = channelMessages.reduce((acc, message) => {
      if ((message.content && message.content.match(regex)) || message.user.name.match(regex)) {
        acc.push(message);
      }
      return acc;
    }, []);

    this.setState({ 
      searchResults,
      searchLoading: false,
    });
  }

  handleStar = () => {
    this.setState(prevState => ({
      isChannelStarred: !prevState.isChannelStarred,
    }), () => this.starChannel());
  }

  starChannel = () => {
    const { currentUser, currentChannel } = this.props;

    if (this.state.isChannelStarred) {
      this.state.usersRef
        .child(`${currentUser.uid}/starred`)
        .update({
          [currentChannel.id]: {
            name: currentChannel.name,
            details: currentChannel.details,
            createdBy: {
              name: currentChannel.createdBy.name,
              avatar: currentChannel.createdBy.avatar,
            },
          }
        });
    } else {
      this.state.usersRef
        .child(`${currentUser.uid}/starred`)
        .child(currentChannel.id)
        .remove(err => {
          if (err !== null) {
            console.log(err);
          }
        });
    }
  }

  render() {
    // prettier-ignore
    const { messages, progressBar, numUniqueUsers, searchLoading, searchTerm, searchResults, isPrivateChannel, isChannelStarred } = this.state;
    const { currentChannel, currentUser } = this.props;

    return (
      <React.Fragment>
        <MessagesHeader 
          channelName={this.displayChannelName(currentChannel)}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
          isPrivateChannel={isPrivateChannel}
          isChannelStarred={isChannelStarred}
          handleStar={this.handleStar}
        />

        <Segment>
          <Comment.Group className={progressBar ? 'messages__progress' : 'messages'}>
            {searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
          </Comment.Group>
        </Segment>

        <MessageForm
          getMessagesRef={this.getMessagesRef}
          isPrivateChannel={isPrivateChannel}
          currentChannel={currentChannel}
          currentUser={currentUser}
          isProgressBarVisible={this.isProgressBarVisible}
        />
      </React.Fragment>
    )
  }
}

export default connect(null, { setUserPosts })(Messages);