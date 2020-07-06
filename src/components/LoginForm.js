import React from "react"
import PropTypes from "prop-types"

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

export default LoginForm
