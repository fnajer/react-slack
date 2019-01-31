import React from "react";
import { Sidebar, Menu, Divider, Button, Modal, Label, Icon, Segment } from 'semantic-ui-react';
import { SliderPicker } from 'react-color';

class ColorPanel extends React.Component {
  state={
    modal: false,
    primary: "#4040bf",
    secondary: "#4083bf",
  }

  openModal = () => this.setState({ modal: true });

  closeModal = () => this.setState({ modal: false });

  handleChangePrimary = color => this.setState({ primary: color.hex });

  handleChangeSecondary = color => this.setState({ secondary: color.hex });

  render() {
    const { modal, primary, secondary } = this.state;

    return (
      <Sidebar
        as={Menu}
        icon="labeled"
        vertical
        inverted
        visible
        width="very thin"
      >
        <Divider/>
        <Button icon='add' size='small' color='blue' onClick={this.openModal}/>

        {/* Color Picker Modal */}
        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header>Choose App Colors</Modal.Header>
          <Modal.Content>
            <Segment>
              <Label content="Primary Color"/>
              <SliderPicker color={primary} onChange={this.handleChangePrimary}/>
            </Segment>

            <Segment>
              <Label content="Secondary Color"/>
              <SliderPicker color={secondary} onChange={this.handleChangeSecondary}/>
            </Segment>
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" inverted>
              <Icon name="checkmark"/> Save Colors
            </Button>
            <Button color="red" inverted onClick={this.closeModal}>
              <Icon name="remove"/> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </Sidebar>
    )
  }
}

export default ColorPanel;