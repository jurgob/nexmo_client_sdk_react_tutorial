/* eslint max-classes-per-file: 0 */

import React from "react"
import axios from "axios"
import PropTypes from "prop-types"
// import {defaultState} from "appStateUtils"

import "./App.css"

const Me = ({me}) => {
  if (!me) return <div>Who am I?</div>
  return <div>{me.name}</div>
}

Me.propTypes = {
  me: PropTypes.shape({
    name: PropTypes.string,
  }),
}
Me.defaultProps = {
  me: null,
}

const initNexmoApp = async (token) => {
  const isServer = typeof window === "undefined"
  const NexmoClient = !isServer ? require("nexmo-client") : null // eslint-disable-line global-require
  let nexmoApp
  if (NexmoClient) {
    const nexmoClient = new NexmoClient({debug: false})
    nexmoApp = await nexmoClient.login(token)
    window.nexmoApp = nexmoApp
    // nexmoApp.on("*", (event, evt) => {
    //   // console.log("event: ", event, evt)
    //   // console.log("nexmoApp.activeStreams.length ", nexmoApp.activeStreams.length)
    // })
  }
  return nexmoApp
}

const LoginForm = ({onSubmit, onUserNameChange, username}) => {
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="username">
        user name:
        <input type="text" name="username" value={username} onChange={onUserNameChange} />
      </label>
      <input type="submit" value="Login" />
    </form>
  )
}
LoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onUserNameChange: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
}

/* state utils */
// const const initApp

/* */

export const defaultState = {
  token: "",
  username: "",
  errorMsg: "",
  me: null,
}

class AppContainer extends React.Component {
  constructor() {
    super()

    const initialState = defaultState
    this.state = initialState
    this.nexmoApp = null
  }

  componentDidMount() {
    try {
      const storedStateString = localStorage.getItem("myState")
      const storedState = JSON.parse(storedStateString)
      this.setState(storedState)
    } catch (err) {
      // error
    }
  }

  handleUserNameChange = (event) => {
    this.setState({username: event.target.value})
  }

  handleSubmit = async (event) => {
    event.preventDefault()
    let {token} = this.state
    const {username} = this.state
    if (!token) {
      const getTokenRes = await axios.post(`http://localhost:5000/tokens/${username}`)
      token = getTokenRes.data.token
    }
    try {
      this.setState({
        token,
        username: "",
        errorMsg: "",
      })
      const nexmoApp = await initNexmoApp(token)
      if (nexmoApp) {
        this.nexmoApp = nexmoApp
        const {id, name} = nexmoApp.me
        this.setState({
          me: {id, name},
        })
      }
    } catch (err) {
      this.setState({
        token: "",
        errorMsg: err,
      })
    }
  }

  render() {
    const {me, errorMsg, username} = this.state

    return (
      <div>
        {errorMsg && <div className="errorMsg"> errorMsg</div>}
        {!me && (
          <LoginForm
            onSubmit={this.handleSubmit}
            onUserNameChange={this.handleUserNameChange}
            username={username}
          />
        )}
        {me && <Me me={me} />}
      </div>
    )
  }
}

AppContainer.prototype.setStateReact = AppContainer.prototype.setState
AppContainer.prototype.setState = function setState(updateState) {
  if (typeof updateState === "object") {
    this.setStateReact.call(this, (prevstate) => {
      const newState = {
        ...prevstate,
        ...updateState,
      }
      try {
        const stateString = JSON.stringify(newState)
        localStorage.setItem("myState", stateString)
      } catch (err) {
        // no action
      }
      return newState
    })
  } else {
    this.setStateReact.apply(this, arguments) // eslint-disable-line prefer-spread,prefer-rest-params
  }
}

function App() {
  return (
    <div className="App">
      <AppContainer />
    </div>
  )
}

export default App
