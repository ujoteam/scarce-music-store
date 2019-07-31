import React from 'react'
import jdenticon from 'jdenticon'


class Jdenticon extends React.Component
{
    render() {
        const { seed, size, style } = this.props

        const svg = jdenticon.toSvg(seed, size)
        return (
            <div style={style} dangerouslySetInnerHTML={{ __html: svg }} />
        )
    }
}

export default Jdenticon
