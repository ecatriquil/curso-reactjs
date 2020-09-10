//le indica al server que ignore los llamados a css desde su lado ya que no hay forma de mostrar los resultados desde ahi
require('ignore-styles');

//dependencia que permite trabajar con async await
require('@babel/polyfill');

//babel register realiza un bind al entorno para utilizar presets de babel en el proyecto
require('@babel/register')({
    presets: ['@babel/preset-env', '@babel/preset-react'],
});

//permite cargar cualquier archivo alojado estaticamente en node
require('asset-require-hook')({
    extensions: ['jpg', 'png', 'gif'],
    name: '/assets/[hash].[ext]',
});

require('./server');
