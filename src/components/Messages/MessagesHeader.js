import React from 'react';
import { Header, Segment, Icon, Input } from 'semantic-ui-react';

class MessagesHeader extends React.Component {
  render() {
    const { channelName, numUniqueUsers, searchLoading, handleSearchChange, isPrivateChannel, handleStar, isChannelStarred } = this.props;

    return (
      <Segment clearing>
        {/* Channel Title */}
        <Header floated="left" fluid="true" as="h2" style={{ marginBottom: 0 }}>
          <span>
            {channelName} 
            {!isPrivateChannel && 
              <Icon 
                onClick={handleStar}
                name={isChannelStarred ? 'star' : "star outline"}
                color={isChannelStarred ? 'yellow' : "black"}
              />
            }
          </span>
          <Header.Subheader>{numUniqueUsers}</Header.Subheader>
        </Header>

        {/* Channel Search Input */}
        <Header floated="right">
          <Input
            loading={searchLoading}
            onChange={handleSearchChange}
            size="mini"
            icon="search"
            name="searchTerm"
            placeholder="Search Messages"
          />
        </Header>
      </Segment>
    );
  }
}

export default MessagesHeader;