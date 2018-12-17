import React from "react";
import { Menu } from 'semantic-ui-react'; 
import UserPanel from "./UserPanel";

class SidePanel extends React.Component {
  render() {
    return (
      <Menu
        size='large'
        fixed='left'
        inverted
        vertical
        style={{ background: '#4c3c4c'}}
      >
        <UserPanel />
      </Menu>
    )
  }
}

export default SidePanel;