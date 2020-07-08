/* eslint-disable camelcase */
/* eslint max-classes-per-file: 0 */

import React from "react"
import axios from "axios"
import PropTypes from "prop-types"
import LoginForm from "./components/LoginForm"
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

const CallForm = ({onSubmit, onUserNameChange, value}) => {
  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="username">
        user name:
        <input
          type="text"
          name="username"
          value={value}
          onChange={onUserNameChange}
          placeholder="Call a username or a phone"
        />
      </label>
      <input type="submit" value="Call" />
    </form>
  )
}
CallForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onUserNameChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
}

const EventsDisplay = ({callEvents}) => {
  return (
    <div>
      {callEvents.map((event, idx) => {
        // eslint-disable-next-line react/no-array-index-key
        return <pre key={idx}>{JSON.stringify(event, " ", " ")}</pre>
      })}
    </div>
  )
}

EventsDisplay.propTypes = {
  callEvents: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const CallDisplay = ({inboundCalls, outboundCalls}) => {
  return (
    <div>
      <h2>Calls</h2>
      <p>
        <span>inboundCalls: ${Object.keys(inboundCalls).length}</span>,{" "}
        <span>outboundCalls: ${Object.keys(outboundCalls).length}</span>
      </p>
      <div>
        <h2>Inbound</h2>
        {Object.entries(inboundCalls).map(([conv_id, nxCall]) => {
          // ANSWERED: "answered"
          // BUSY: "busy"
          // COMPLETED: "completed"
          // FAILED: "failed"
          // REJECTED: "rejected"
          // RINGING: "ringing"
          // STARTED: "started"
          // TIMEOUT: "timeout"
          // UNANSWERED: "unanswered"

          const {status} = nxCall
          return (
            <div key={conv_id}>
              <div>
                ${conv_id} / direction: {nxCall.direction} , status: {nxCall.status}
              </div>
              {status === "started" && (
                <div>
                  <button type="button" onClick={() => nxCall.answer()}>
                    Answer
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      nxCall.reject({reason_text: "I don't want to talk with you"})
                    }
                  >
                    {" "}
                    Reject
                  </button>
                </div>
              )}

              {status === "answered" && (
                <button type="button" onClick={() => nxCall.hangUp()}>
                  {" "}
                  Hang Up
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div>
        <h2>Outbound</h2>
        {Object.entries(outboundCalls).map(([conv_id, nxCall]) => {
          // ANSWERED: "answered"
          // BUSY: "busy"
          // COMPLETED: "completed"
          // FAILED: "failed"
          // REJECTED: "rejected"
          // RINGING: "ringing"
          // STARTED: "started"
          // TIMEOUT: "timeout"
          // UNANSWERED: "unanswered"

          const {status} = nxCall
          return (
            <div key={conv_id}>
              <div>
                ${conv_id} / direction: {nxCall.direction} , status: {nxCall.status}
              </div>
              {["ringing", "started", "answered"].includes(status) && (
                <button type="button" onClick={() => nxCall.hangUp()}>
                  {" "}
                  Hang Up
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
CallDisplay.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  inboundCalls: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  outboundCalls: PropTypes.object.isRequired,
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

class AppContainer extends React.Component {
  defaultState = {
    token: "",
    username: "",
    callTo: "",
    errorMsg: "",
    me: null,
    currentStream: null,
    callEvents: [],
    inboundCalls: {},
    outboundCalls: {},
  }

  constructor() {
    super()

    const initialState = this.defaultState
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

      nexmoApp.on("call:status:changed", (nxCall) => {
        this.addCall2State(nxCall)
      })

      nexmoApp.on("member:call", (member, nxCall) => {
        this.addCall2State(nxCall)
      })

      const {id, name} = nexmoApp.me
      this.setState({
        me: {id, name},
      })
    }
  }

  addCall2State = (nxCall) => {
    this.addCallEvent(nxCall)
    if (nxCall.conversation && nxCall.conversation.id) {
      if (nxCall.direction) {
        const stateProps = `${nxCall.direction}Calls`
        // eslint-disable-next-line react/destructuring-assignment
        const prevCallList = this.state[stateProps]
        this.setState({
          [stateProps]: {
            ...prevCallList,
            [nxCall.conversation.id]: nxCall,
          },
        })
      }
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

  // callStatus: "completed"
  // callbacks: {}
  // channel: {type: "app", id: "5c88f591-94fa-461d-819a-b1ab58d7880b", from: {…}, legs: Array(1), to: {…}, …}
  // client_ref: "96b5ec5c-9859-4128-b4e2-19fd05dd3118"
  // conversation: Conversation {log: Logger, application: Application, id: "CON-c9590568-a228-4bf5-a816-5c1990a438c8", name: "NAM-7254382e-24a0-4df6-9ced-4c6dc078e550", display_name: null, …}
  // display_name: undefined
  // id: "MEM-9d194399-ae0a-4c0a-b705-1c2bf55fba14"
  // initiator: {joined: {…}, left: {…}}
  // media: {audio: true, audio_settings: {…}}
  // reason: {}
  // state: "LEFT"
  // timestamp: {joined: "2020-07-07T19:47:31.622Z", left: "2020-07-07T19:47:32.930Z"}
  // user: {name: "jurgo", id: "USR-f4f93d6b-a0bd-46bb-bdee-1d3fce3c4b7e"}
  // __proto__: Object
  // id: "5c88f591-94fa-461d-819a-b1ab58d7880b"
  // log: Logger {name: "NXMCall", levels: {…}, methodFactory: ƒ, getLevel: ƒ, setLevel: ƒ, …}
  // status: "unanswered"
  // to: Map(0) {}
  addCallEvent(nxCall) {
    const {conversation, from, direction, id, status} = nxCall
    const {callEvents} = this.state

    const newEvent = {
      direction,
      id,
      status,
    }
    if (conversation) {
      const {name, sequence_number} = conversation
      newEvent.conversation = {id: conversation.id, name, sequence_number}
    }

    if (from) {
      const {callStatus, channel, client_ref, media, reason, state} = from
      newEvent.from = {callStatus, channel, client_ref, id: from.id, media, reason, state}
    }

    this.setState({callEvents: [...callEvents, newEvent]})
  }

  render() {
    const {
      me,
      errorMsg,
      username,
      callTo,
      callEvents,
      inboundCalls,
      outboundCalls,
    } = this.state
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
            <button
              type="button"
              onClick={() => {
                this.setState({...this.defaultState})
                // console.log(`nxCall: `, Object.keys(nxCall), nxCall)
              }}
            >
              Logout
            </button>
            <Me me={me} />
            <CallDisplay inboundCalls={inboundCalls} outboundCalls={outboundCalls} />
            <button
              type="button"
              onClick={async () => {
                const nxCall = await this.nexmoApp.callServer("ncco__talk__hello world")
                this.addCall2State(nxCall)
              }}
            >
              Do A call - talk ncco: hello world
            </button>
            <EventsDisplay callEvents={callEvents} />
            <CallForm
              onSubmit={async (event) => {
                event.preventDefault()
                const nxCall = await this.nexmoApp.callServer(callTo)
                this.addCall2State(nxCall)
              }}
              onUserNameChange={(event) => this.setState({callTo: event.target.value})}
              value={callTo}
            />
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
        const statePropsNotPersisted = [
          "currentStream",
          "callEvents",
          "inboundCalls",
          "outboundCalls",
        ]
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
