import gravatar from '../../utils/gravatar';

test('Gravatar function test', () => {
    const email = 'emacatriquil@gmail.com';
    const gravatarUrl = '';
    expect(gravatarUrl).toEqual(gravatar(email));
});