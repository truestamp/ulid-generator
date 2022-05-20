describe('handle', () => {
  beforeEach(() => {
    Object.assign(global)
    // console.log(global)
    jest.resetModules()
  })

  test('handle nothing', async () => {
    expect('foo').toEqual('foo')
  })
})
