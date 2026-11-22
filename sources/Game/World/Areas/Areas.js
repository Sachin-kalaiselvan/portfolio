import { Game } from '../../Game.js'
import { AltarArea } from './AltarArea.js'
import { CookieArea } from './CookieArea.js'
import { LandingArea } from './LandingArea.js'
import { ProjectsArea } from './ProjectsArea.js'
import { LabArea } from './LabArea.js'
import { CareerArea } from './CareerArea.js'
import { SocialArea } from './SocialArea.js'
import { ToiletArea } from './ToiletArea.js'
import { BowlingArea } from './BowlingArea.js'
import { CircuitArea } from './CircuitArea.js'
import { BehindTheSceneArea } from './BehindTheSceneArea.js'
import { AchievementsArea } from './AchievementsArea.js'
import { TimeMachineArea } from './TimeMachineArea.js'
import { EasterArea } from './EasterArea.js'
import * as THREE from 'three/webgpu'
import landingLetters from '../../../data/landingLetters.js'

export class Areas
{
    /**
     * Swap the landing's physical letters for "SACHIN", before the objects
     * (and their colliders) are created from the model.
     */
    replaceLandingLetters(model)
    {
        const landing = model.find((child) => child.name.startsWith('landing'))
        if(!landing)
            return

        const slots = []
        landing.traverse((child) =>
        {
            if(child.name.startsWith('refLettersPhysicalDynamic'))
                slots.push(child)
        })
        if(slots.length < landingLetters.length)
            return

        // The original letters run in a line from the first slot to the last
        const start = slots[0].position.clone()
        const end = slots[slots.length - 1].position.clone()
        // Read from the visitor's side: first letter at the far end of the original line
        const direction = start.clone().sub(end).normalize()
        const centre = start.clone().add(end).multiplyScalar(0.5)
        const gap = 0.32
        const total = landingLetters.reduce((sum, letter) => sum + letter.size[0], 0) + gap * (landingLetters.length - 1)
        let cursor = - total / 2

        landingLetters.forEach((letter, i) =>
        {
            const slot = slots[i]
            const oldGeometry = slot.geometry
            const uv = oldGeometry.attributes.uv

            const geometry = new THREE.BufferGeometry()
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(letter.position, 3))
            // Same palette colour as the original letter
            const count = letter.position.length / 3
            const uvs = new Float32Array(count * 2)
            for(let v = 0; v < count; v++)
            {
                uvs[v * 2] = uv.getX(0)
                uvs[v * 2 + 1] = uv.getY(0)
            }
            geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
            geometry.computeVertexNormals()
            slot.geometry = geometry
            oldGeometry.dispose()

            // Collider box sized to the new letter
            const collider = slot.children.find((child) => child.name.match(/^cuboid/i))
            if(collider)
            {
                collider.position.set(0, 0, 0)
                collider.scale.set(letter.size[0], letter.size[1], letter.size[2])
            }

            const offset = cursor + letter.size[0] / 2
            slot.position.copy(centre).addScaledVector(direction, offset)
            cursor += letter.size[0] + gap
        })

        // Unused original letters go
        for(const slot of slots.slice(landingLetters.length))
            slot.removeFromParent()
    }

    constructor()
    {
        this.game = Game.getInstance()

        const list = [
            [ 'achievements', AchievementsArea ],
            [ 'altar', AltarArea ],
            [ 'behindTheScene', BehindTheSceneArea ],
            [ 'bowling', BowlingArea ],
            [ 'career', CareerArea ],
            [ 'circuit', CircuitArea ],
            [ 'cookie', CookieArea ],
            [ 'lab', LabArea ],
            [ 'landing', LandingArea ],
            [ 'projects', ProjectsArea ],
            [ 'social', SocialArea ],
            [ 'toilet', ToiletArea ],
            [ 'timeMachine', TimeMachineArea ],
        ]

        const model = [...this.game.resources.areasModel.scene.children]

        this.replaceLandingLetters(model)
        
        for(const child of model)
        {
            for(const [ name, AreaClass ] of list)
            {
                if(child.name.startsWith(name))
                    this[name] = new AreaClass(child)
            }
        }

        // // Test how many areas are visible
        // this.game.ticker.events.on('tick', () =>
        // {
        //     let i = 0
        //     if(this.achievements.frustum.isIn)
        //         i++
        //     if(this.altar.frustum.isIn)
        //         i++
        //     if(this.behindTheScene.frustum.isIn)
        //         i++
        //     if(this.bowling.frustum.isIn)
        //         i++
        //     if(this.career.frustum.isIn)
        //         i++
        //     if(this.circuit.frustum.isIn)
        //         i++
        //     if(this.cookie.frustum.isIn)
        //         i++
        //     if(this.lab.frustum.isIn)
        //         i++
        //     if(this.landing.frustum.isIn)
        //         i++
        //     if(this.projects.frustum.isIn)
        //         i++
        //     if(this.social.frustum.isIn)
        //         i++
        //     if(this.toilet.frustum.isIn)
        //         i++

        //     console.log(i)
        // }, 6)
    }
}