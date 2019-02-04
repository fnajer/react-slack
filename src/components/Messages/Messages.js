import React from "react";
import firebase from '../../firebase';
import { connect } from 'react-redux';
import { setUserPosts } from '../../actions';
import { Segment, Comment } from 'semantic-ui-react';
import MessagesHeader from './MessagesHeader';
import MessageForm from './MessageForm';
import Message from './Message';
import Typing from './Typing';
import Skeleton from "./Skeleton";

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
    typingUsers: [],
    typingRef: firebase.database().ref('typing'),
    connectedRef: firebase.database().ref('.info/connected'),
    listeners: [],
  }

  componentDidMount() {
    const { currentChannel, currentUser, listeners } = this.props;

    if (currentChannel && currentUser) {
      this.removeListeners(listeners);
      this.addListeners(currentChannel.id);
      this.addUserStarsListener(currentChannel.id, currentUser.uid);
    }
  }

  componentWillUnmount() {
    this.removeListeners(this.state.listeners);
    this.state.connectedRef.off();
  }

  removeListeners = listeners => {
    listeners.forEach(listener => {
      listener.ref.child(listener.id).off(listener.event);
    });
  }

  addToListeners = (id, ref, event) => {
    const index = this.state.listeners.findIndex(listener => {
      return listener.id === id && listener.ref === ref && listener.event === event;
    });

    if (index === -1) {
      const newListener = { id, ref, event };
      this.setState({ listeners: this.state.listeners.concat(newListener)});
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.messagesEnd) {
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
  }

  addUserStarsListener = (channelId, userId) => {
    this.state.usersRef
      .child(`${userId}/starred`)
      .once('value')
      .then(data => {
        if (data.val() !== null) {
          const channelIds = Object.keys(data.val());
          const prevStarred = channelIds.includes(channelId);
          this.setState({ isChannelStarred: prevStarred });
        }
      });
  }

  addListeners = channelId => {
    this.addMessageListener(channelId);
    this.addTypingListener(channelId);
  }

  addTypingListener = channelId => {
    let typingUsers = [];
    this.state.typingRef
      .child(channelId)
      .on('child_added', snap => {
        if (snap.key !== this.props.currentUser.uid) {
          typingUsers = typingUsers.concat({
            id: snap.key,
            name: snap.val()
          });
          this.setState({ typingUsers }); 
        }
      });
    this.addToListeners(channelId, this.state.typingRef ,'child_added');

    this.state.typingRef
      .child(channelId)
      .on('child_removed', snap => {
        const index = this.state.typingUsers.findIndex(user => user.id === snap.key);

        if (index !== -1) {
          typingUsers = typingUsers.filter(user => user.id !== snap.key);
          this.setState({ typingUsers });
        }
      });
    this.addToListeners(channelId, this.state.typingRef ,'child_removed');

    /* if current user leaves from this chat - delete typing info about him */
    this.state.connectedRef.on('value', snap => {
      if (snap.val() === true) {
        this.state.typingRef
          .child(channelId)
          .child(this.props.currentUser.uid)
          .onDisconnect()
          .remove(err => {
            if (err !== null) {
              console.error(err);
            }
          });
      }
    })
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

    this.addToListeners(channelId, ref,'child_added');
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

  displayTypingUsers = users => (
    users.length > 0 && users.map(user => (
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.2em' }}
        key={user.id}
      >
        <span className='user__typing'>{user.name} is typing</span> <Typing/>
      </div>
    ))
  )

  displayMessageSkeleton = loading => (
    loading ? (
      <React.Fragment>
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} />
        ))}
      </React.Fragment>
    ) : null
  )

  render() {
    // prettier-ignore
    const { messages, progressBar, numUniqueUsers, searchLoading, 
      searchTerm, searchResults, isPrivateChannel, isChannelStarred, 
      typingUsers, messagesLoading } = this.state;
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
            {this.displayMessageSkeleton(messagesLoading)}
            {searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
            {this.displayTypingUsers(typingUsers)}
            {<div ref={node => (this.messagesEnd = node)}></div>}
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