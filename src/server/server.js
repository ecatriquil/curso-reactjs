/* eslint-disable react/jsx-indent */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
/* eslint-disable indent */
import express from 'express';
import dotenv from 'dotenv';
import webpack from 'webpack';
import helmet from 'helmet';

// necesarias para el server render
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { renderRoutes } from 'react-router-config';
import { StaticRouter } from 'react-router-dom';
import cookieParser from 'cookie-parser';
import boom from '@hapi/boom';
import passport from 'passport';
import axios from 'axios';
import serverRoutes from '../frontend/routes/serverRoutes';
import reducer from '../frontend/reducers';

import getManifest from './getManifest';

dotenv.config();

const { ENV, PORT } = process.env;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

require('./utils/auth/strategies/basic');

if (ENV === 'development') {
    console.log('Development config');
    //configuracion de webpack del proyecto
    const webpackConfig = require('../../webpack.config');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');

    //compila la configuracion de webpack
    const compiler = webpack(webpackConfig);
    const serverConfig = {
        port: PORT,
        hot: true,
    };

    app.use(webpackDevMiddleware(compiler, serverConfig));
    //hot module replecement de todo el proyecto
    app.use(webpackHotMiddleware(compiler));
} else {
    //configuraciones para produccion
    app.use((req, res, next) => {
        if (!req.hashManifest) req.hashManifest = getManifest();
        next();
    });
    app.use(express.static(`${__dirname}/public`));
    app.use(helmet());
    //se bloquean los cross domain policies
    app.use(helmet.permittedCrossDomainPolicies());
    //se deshabilita la cabecera de proveedor de server
    app.disable('x-powered-by');
}

const setResponse = (html, preloadedState, manifest) => {
    const mainStyles = manifest ? manifest['main.css'] : 'assets/app.css';
    const mainBuild = manifest ? manifest['main.js'] : 'assets/app.js';
    const vendorBuild = manifest ? manifest['vendors.js'] : 'assets/vendor.js';
    return (`
        <!DOCTYPE html>
        <html>
            <head>
                <link rel="stylesheet" href="${mainStyles}" type="text/css">
                <title>Platzi Video</title>
            </head>
            <body>
                <div id="app">${html}</div>
                <script>
                    window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
                </script>
                <script src="${mainBuild}" type="text/javascript"></script>
                <script src="${vendorBuild}" type="text/javascript"></script>
            </body>
        </html>    
    `);
};

//funcion que convierte componentes a string y renderiza la app
const renderApp = async (req, res) => {
    let initialState;
    const { token, email, name, id } = req.cookies;

    try {
        let movieList = await axios({
            url: `${process.env.API_URL}/api/movies`,
            headers: { Authorization: `Bearer ${token}` },
            method: 'get',
        });

        //obtener los datos que vuelven de axios
        movieList = movieList.data.data;

        const myList = [];

        //traer las peliculas del usuario
        const userMovies = await axios({
            url: `${process.env.API_URL}/api/user-movies`,
            headers: { Authorization: `Bearer ${token}` },
            method: 'get',
        });

        if (userMovies.data.data.length !== 0) {
            let aux = {};
            userMovies.data.data.forEach((userMovie) => {
                aux = movieList.find(movie => movie._id === userMovie.movieId);
                aux._id = userMovie._id;
                myList.push(aux);
            });
        }

        initialState = {
            user: {
                email, name, id,
            },
            myList,
            trends: movieList.filter(movie => movie.contentRating === 'PG' && movie._id),
            originals: movieList.filter(movie => movie.contentRating === 'G' && movie._id),
        };
    } catch (error) {
        initialState = {
            user: {},
            myList: [],
            trends: [],
            originals: [],
        };
    }

    const store = createStore(reducer, initialState);
    const preloadedState = store.getState();
    const isLogged = (initialState.user.id);
    const html = renderToString(
        <Provider store={store}>
            <StaticRouter location={req.url} context={{}}>
                {renderRoutes(serverRoutes(isLogged))}
            </StaticRouter>
        </Provider>,
    );

    res.send(setResponse(html, preloadedState, req.hashManifest));
};

app.post('/auth/sign-in', async (req, res, next) => {
    //obtenemos el atributo rememberMe desde el cuerpo del request
    // const { rememberMe } = req.body;

    //custom callback
    passport.authenticate('basic', (error, data) => {
        try {
            if (error || !data) {
                next(boom.unauthorized());
            }

            req.login(data, { session: false }, async (error) => {
                if (error) {
                    next(error);
                }

                const { token, ...user } = data;

                //Si el atributo rememberMe es verdadero la expiracion sera en 30 dias, de lo contrario sera de 2 horas

                //definimos una cookie en el objeto req. Luego cada nuevo request tendra la cookie asociada
                res.cookie('token', token, {
                    httpOnly: !(ENV === 'development'),
                    secure: !(ENV === 'development'),
                    // maxAge: rememberMe ? THIRTY_DAYS_IN_SEC : TWO_HOURS_IN_SEC
                });

                //se retorna el user a la spa para obtener la info del user y mostrarla
                res.status(200).json(user);
            });

        } catch (error) {
            next(error);
        }
    })(req, res, next);
});

app.post('/auth/sign-up', async (req, res, next) => {
    const { body: user } = req;

    try {
        const userData = await axios({
            url: `${process.env.API_URL}/api/auth/sign-up`,
            method: 'post',
            data: {
                'email': user.email,
                'name': user.name,
                'password': user.password,
            },
        });

        res.status(201).json({
            name: req.body.name,
            email: req.body.email,
            id: userData.data.id,
        });

    } catch (error) {
        next(error);
    }
});

app.post('/user-movies', async (req, res, next) => {
    try {
        //cuando se hace sign-in se genera un jwt y se almacena en una cookie.
        //A partir de ahi los requests nuevos, como el de peliculas de usuario,
        //van a tener la cookie en el req
        const { body: userMovie } = req;
        const { token, id } = req.cookies;

        //La estrategia jwt del api era de tipo Bearer Token, por esto hay que enviar el token en este header
        const resData = await axios({
            url: `${process.env.API_URL}/api/user-movies`,
            headers: { Authorization: `Bearer ${token}` },
            method: 'post',
            data: {
                'userId': id,
                'movieId': userMovie.movieId,
            },
        });

        // if (status !== 201) {
        //     return next(boom.badImplementation());
        // }

        res.status(201).json(resData.data.data);

    } catch (error) {
        next(error);
    }
});

app.delete('/user-movies/:userMovieId', async (req, res, next) => {
    try {
        //cuando se hace sign-in se genera un jwt y se almacena en una cookie.
        //A partir de ahi los requests nuevos, como el de peliculas de usuario,
        //van a tener la cookie en el req
        const { userMovieId } = req.params;
        const { token } = req.cookies;

        const { data, status } = await axios({
            url: `${process.env.API_URL}/api/user-movies/${userMovieId}`,
            //La estrategia jwt del api era de tipo Bearer Token, por esto hay que enviar el token en este header
            headers: { Authorization: `Bearer ${token}` },
            method: 'delete',
        });

        if (status !== 200) {
            return next(boom.badImplementation());
        }

        res.status(200).json(data);

    } catch (error) {
        next(error);
    }
});

app.get('*', renderApp);

app.listen(PORT, (err) => {
    if (err) console.log(err);
    else console.log(`Server running in port ${PORT}`);
});
