import React from 'react';
import './styles.scss';

const RegisterForm = ({ onSubmit, onChange }) => {
  return (
    <>
      <h2>Regístrate</h2>
      <form className='register__container--form' onSubmit={onSubmit}>
        <input
          name='name'
          type='text'
          placeholder='Nombre'
          onChange={onChange}
        />
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
        <button type='submit'>Registrarme</button>
      </form>
    </>
  );
};

export default RegisterForm;
