const { cleanPath } = require('../index')

describe('cleanPath:', () => {

  it('should remove more than one consecutive slash', () => {
    let path = cleanPath('a///b//c/')
    expect(path).toEqual('a/b/c/')
  })

})