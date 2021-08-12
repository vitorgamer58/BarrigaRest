// Poderia o jest usar o modelo do mocha?
describe('Testes!', () => {
  it('Devo conhecer as principais assertivas do Jest', () => {
    let number = null;
    expect(number).toBeNull();
    number = 10;
    expect(number).not.toBeNull();
    expect(number).toBe(10);
    expect(number).toEqual(10);
    expect(number).toBeGreaterThan(9);
  });
  it('Devo saber trabalhar com objetos', () => {
    const obj = { name: 'John', email: 'jhon@notasdovitor.top' };
    expect(obj).toHaveProperty('name');
    // Chai possui o expect(obj).toHaveAllProperties()
    expect(obj).toHaveProperty('name', 'John');
    expect(obj.name).toBe('John');

    const obj2 = { name: 'John', email: 'jhon@notasdovitor.top' };
    // expect(obj).toBe(obj2)
    // Compared values have no visual difference.
    // Note that you are testing for equality with the stricter `toBe` matcher
    // using `Object.is`. For deep equality only, use `toEqual` instead.
    expect(obj).toEqual(obj2);
  });
});

// Funciona da mesma maneira!!
