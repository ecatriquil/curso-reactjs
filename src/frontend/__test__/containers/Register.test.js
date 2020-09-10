import React from 'react';
import { mount } from 'enzyme';
import Register from '../../containers/Register';
import ProviderMock from '../../__mocks__/ProviderMock';

describe('<Register />', () => {
    test('Register form', () => {
        //mock de jest
        const preventDefault = jest.fn();
        const register = mount(
            <ProviderMock>
                <Register />
            </ProviderMock>
        );

        //simulacion de submit al form
        register.find('form').simulate('submit', { preventDefault });
        expect(preventDefault).toHaveBeenCalledTimes(1);
        register.unmount()
    });
})