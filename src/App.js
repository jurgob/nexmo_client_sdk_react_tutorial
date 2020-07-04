import React from 'react';
import axios from 'axios';

import './App.css';

const Me = ({me}) => {
  if (!me)
    return <div>Who am I?</div>
 return <div>{me.name}</div>
}


class NexmoClientWidget extends React.Component {
  constructor(){
    super();
    this.state = {
      me: null,
      nexmoApp: null
    }
  }

  componentDidMount() {
    const isServer = typeof window === 'undefined'
    const NexmoClient = !isServer ? require('nexmo-client') : null
    if(NexmoClient){

      const nexmoClient = new NexmoClient({ debug: false , url: "wss://ws-us-1.nexmo.com"})

      nexmoClient
        .login(this.props.token)
        .then(nexmoApp => {
          console.log(`app: `, nexmoApp)
          window.nexmoApp = nexmoApp;
          this.setState((state, props) => {
            return {
              ...this.state,
              me: {
                name: nexmoApp.me.name,
                id: nexmoApp.me.id
              },
              nexmoApp: nexmoApp

            }
          })

          nexmoApp.on('*', (event, evt) => {
            console.log("event: ", event, evt)
            console.log('nexmoApp.activeStreams.length ', nexmoApp.activeStreams.length)
          }

            )

        })

    }
  }

  render() {
    const {nexmoApp} = this.state
    return (
      <div>
        <h2>ClientSDK Tutorial </h2>
        <Me me={this.state.me} />

      </div>
    );

  }
}



class LoggedArea extends React.Component {
  constructor(){
    super();
    this.state = {
      token: "",
      username: "",
      errorMsg: ""
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({username: event.target.value});
  }

   handleSubmit(event) {
    // alert('A name was submitted: ' + this.state.value);
    axios.post(`http://localhost:5000/tokens/${this.state.username}`)
      .then(getTokenRes => {
        this.setState({
          token: getTokenRes.data.token,
          username: "",
          errorMsg: ""
        })
      })
      .catch(err => {
        console.log(`err`, err)
        this.setState({
          token: "",
          errorMsg: err
        })
      })
    event.preventDefault();
  }

  render() {
    // return <div>cane</div>
    const {token, errorMsg} = this.state;
    const loginForm = (<form onSubmit={this.handleSubmit}>
        <label>
          user name:
          <input type="text" name="username" value={this.state.username} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Login" />
      </form>)

    return (
      <div>
        { errorMsg && <div className="errorMsg" > { "errorMsg" }</div> }
        { token ? <NexmoClientWidget token={token}  /> : loginForm }
      </div>
    )

  }

}



function App() {

  return (
    <div className="App">
      <LoggedArea />
    </div>
  );
}

export default App;
