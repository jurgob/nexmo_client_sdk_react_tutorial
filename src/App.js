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
    const nexmoClient = new NexmoClient({debug: true})
    nexmoApp = await nexmoClient.login(token)
    window.nexmoApp = nexmoApp
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

// class AudioStream extends React.Component {
//   constructor(props) {
//     super(props)
//     this.audioRef = React.createRef()
//     this.state = {playng: false}
//   }

//   componentDidMount() {
//     this.updateStream()
//   }

//   componentDidUpdate() {
//     this.updateStream()
//   }

//   updateStream() {
//     const {stream} = this.props
//     console.log("it's a stream!", stream)
//     if (stream && this.audioRef.current.srcObject !== stream) {
//       this.setState({playng: true})
//       this.audioRef.current.srcObject = stream
//     }
//   }

//   render() {
//     return (
//       <div>
//         {`playng: ${this.state.playng}`}
//         <audio ref={this.audioRef} controls volume="true" autoPlay />
//       </div>
//     )
//   }
// }

class AppContainer extends React.Component {
  constructor() {
    super()
    const defaultState = {
      token: "",
      username: "",
      errorMsg: "",
      me: null,
      currentStream: null,
    }

    const initialState = defaultState
    this.state = {
      ...initialState,
    }
    this.nexmoApp = null
    // this.currentStream = null
    this.nexmoAppRegistred = false
  }

  initNexmoApp = async (token) => {
    const nexmoApp = await initNexmoApp(token)
    this.nexmoApp = nexmoApp || null
    if (nexmoApp && nexmoApp.me && !this.nexmoAppRegistred) {
      this.nexmoAppRegistred = true
      nexmoApp.on("*", () => {
        // const firstActiveStream = nexmoApp.activeStreams[0]
      })

      const {id, name} = nexmoApp.me
      this.setState({
        me: {id, name},
      })
    }
  }

  componentDidMount = async () => {
    try {
      const storedStateString = localStorage.getItem("myState")
      const storedState = JSON.parse(storedStateString)
      this.setState(storedState)
      if (storedState.token) {
        this.initNexmoApp(storedState.token)
      }
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
      this.initNexmoApp(token)
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
        {me && (
          <div>
            <Me me={me} />
            <button
              type="button"
              onClick={async () => {
                await this.nexmoApp.callServer("ncco__talk__hello world")
              }}
            >
              Do A call
            </button>
          </div>
        )}
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
        const newStateToPersist = {...newState}
        const statePropsNotPersisted = ["currentStream"]
        statePropsNotPersisted.forEach((key) => {
          delete newStateToPersist[key]
        })
        const stateString = JSON.stringify(newStateToPersist)
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
