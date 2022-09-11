const styledRegex = /styled/

const importStyled = `
import styled from 'styled-components'
`

module.exports = function (content, map, meta) {
  const callback = this.async()
  if (styledRegex.test(content)) {
    callback(null, importStyled + content, map, meta)
  } else callback(null, content, map, meta)
}
