import React from 'react';
import firebase from '../../firebase';
import { Link } from "react-router-dom";
import { Grid, Header, Segment, Icon, Form, Message, Button } from 'semantic-ui-react';

class Login extends React.Component {
  state = {
    email: '',
    password: '',
    errors: [],
    loading: false,
  };

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value })
  }

  isFormValid = (email, password) => email && password;

  displayErrors = errors => {
    return errors.map((error, i) => <p key={i}>{error.message}</p>);
  }

  handleSubmit = event => {
    event.preventDefault();
    
    if (this.isFormValid(this.state)) {
      
    }
  }

  handleInputError = (errors, inputError) => {
    return errors.some(error => error.message.toLowerCase().includes(inputError)) ? 'error' : '';
  }

  render() {
    const { email, password, errors, loading } = this.state;

    return (
      <Grid textAlign="center" verticalAlign="middle" className="app">
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as="h1" icon color="violet" textAlign="center">
            <Icon name="code branch" color="violet"/>
            Login to DevChat
          </Header>
          <Form onSubmit={this.handleSubmit} size="large">
            <Segment stacked>
              <Form.Input fluid name="email" icon="mail" iconPosition="left"
              placeholder="Email Address" onChange={this.handleChange} type="email" value={email} 
              className={this.handleInputError(errors, 'email')}/>

              <Form.Input fluid name="password" icon="lock" iconPosition="left"
              placeholder="Password" onChange={this.handleChange} type="password" value={password}
              className={this.handleInputError(errors, 'password')}/>

              <Button disabled={loading} className={loading ? 'loading' : ''} color="violet" fluid size="large">Submit</Button>
            </Segment>
          </Form>
          {
            errors.length > 0 && (
              <Message error>
                <h3>Error</h3>
                { 
                  this.displayErrors(errors)
                }
              </Message>
            )
          }
          <Message>Don't have an account? <Link to="/register">Register</Link></Message>
        </Grid.Column>
      </Grid>
    );
  }
};

export default Login;