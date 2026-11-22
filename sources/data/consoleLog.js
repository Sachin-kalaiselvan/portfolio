import * as THREE from 'three/webgpu'

const text = `
╔═ Sachin Kalaiselvan ══╗
║ Founder, The Ingredient List, Bengaluru
║ Mail    ⇒ sachin@theingredientlist.co
║ GitHub  ⇒ https://github.com/Sachin-kalaiselvan
╚═══════════════════════╝
`
let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #D66FFF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]

    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'

        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]