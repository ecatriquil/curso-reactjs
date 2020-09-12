import React from 'react';

const SocialMediaContainer = ({ googleIcon, twitterIcon }) => {
  return (
    <section className='login__container--social-media'>
      <div>
        <img src={googleIcon} alt='Google icon' />
        {' '}
        Inicia sesión con Google
      </div>
      <div>
        <img src={twitterIcon} alt='Twitter icon' />
        {' '}
        Inicia sesión con Twitter
      </div>
    </section>
  );
};

export default SocialMediaContainer;
