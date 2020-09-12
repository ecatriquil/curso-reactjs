import React from 'react';

import './styles.scss';

const LoginForm = ({ onSubmit, onChange }) => {
  return (
    <>
      <h2>Inicia Sesión</h2>
      <form className='login__container--form' onSubmit={onSubmit}>
        <input
          name='email'
          type='text'
          placeholder='Correo'
          onChange={onChange}
        />
        <input
          name='password'
          type='password'
          placeholder='Contraseña'
          onChange={onChange}
        />
        <button type='submit'>Iniciar sesión</button>
        <div className='login__container--remember-me'>
          <label htmlFor='cbox1'>
            <input type='checkbox' id='cbox1' value='first_checkbox' />
            {' '}
            Recuérdame
          </label>
          <a href='/'>Olvidé mi contraseña</a>
        </div>
      </form>
    </>
  );
};

export default LoginForm;
