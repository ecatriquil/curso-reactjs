import axios from 'axios';

export const setFavorite = payload => ({
  type: 'SET_FAVORITE',
  payload,
});

export const deleteFavorite = payload => ({
  type: 'DELETE_FAVORITE',
  payload,
});

export const loginRequest = payload => ({
  type: 'LOGIN_REQUEST',
  payload,
});

export const logoutRequest = payload => ({
  type: 'LOGOUT_REQUEST',
  payload,
});

export const registerRequest = payload => ({
  type: 'REGISTER_REQUEST',
  payload,
});

export const getVideoSource = payload => ({
  type: 'GET_VIDEO_SOURCE',
  payload,
});

export const setError = payload => ({
  type: 'SET_ERROR',
  payload,
});

//retornamos una funcion que realiza el llamado a una api para el registro de usuarios
//cuando finaliza, retorna la data. Con thunk identificamos esta funcion dentro del action
//Si thunk identifica que no existe una funcion, no interviene
export const registerUser = (payload, redirectUrl) => {
  return (dispatch) => {
    axios.post('/auth/sign-up', payload)
      .then(({ data }) => dispatch(registerRequest(data)))
      .then(() => {
        window.location.href = redirectUrl;
      })
      .catch(error => dispatch(setError(error)));
  };
};

export const loginUser = ({ email, password }, redirectUrl) => {
  return (dispatch) => {
    axios({
      url: '/auth/sign-in',
      method: 'post',
      auth: {
        username: email,
        password,
      },
    })
      .then(({ data }) => {
        document.cookie = `email=${data.user.email}`;
        document.cookie = `name=${data.user.name}`;
        document.cookie = `id=${data.user.id}`;
        dispatch(loginRequest(data.user));
      })
      .then(() => {
        window.location.href = redirectUrl;
      })
      .catch(error => dispatch(setError(error)));
  };
};

export const addFavorite = (userMovie) => {
  const movieId = userMovie._id;

  return (dispatch) => {
    axios.post('/user-movies', { movieId })
      .then(() => dispatch(setFavorite(userMovie)))
      .catch(error => dispatch(setError(error)));
  };
};

export const removeFavorite = (userMovieId) => {
  return (dispatch) => {
    axios.delete(`/user-movies/${userMovieId}`)
      .then(() => dispatch(deleteFavorite(userMovieId)))
      .catch(error => dispatch(setError(error)));
  };
};

