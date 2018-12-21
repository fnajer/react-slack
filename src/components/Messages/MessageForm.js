import React from 'react';
import { Segment, Input, Button } from 'semantic-ui-react';

class MessageForm extends React.Component {
  render() {
    return (
      <Segment className="message__form">
        <Input
          fluid
          name="message"
          style={{ marginBottom: '0.7em' }}
          label={<Button icon="add"/>}
          labelPosition="left"
          placeholder="Write your message"
        />

        <Button.Group icon widths="2">
          <Button
            color="orange"
            icon="edit"
            labelPosition="left"
            content="Add Reply"
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