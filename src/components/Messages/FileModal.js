import React from 'react';
import { Modal, Input, Icon, Button } from 'semantic-ui-react';

class FileModal extends React.Component {
  render() {
    const { modal, closeModal } = this.props;
    return (
      <Modal open={modal} onClose={closeModal}>
        <Modal.Header>Select an Image File</Modal.Header>
        <Modal.Content>
          <Input
            fluid
            name="file"
            type="file"
            label="File types: jpg, png"
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            color='green'
            inverted
          >
            <Icon name='checkmark'/> Send
          </Button>
          <Button
            color='red'
            inverted
            onClick={closeModal}
          >
            <Icon name='remove'/> Cancel
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default FileModal;