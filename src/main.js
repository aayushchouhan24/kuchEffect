import './styles.css'

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import TouchTexture from './TouchTexture.js'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)



const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(1, 1, 1).normalize()
scene.add(directionalLight)

camera.position.z = 50

const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

const customShader = {
  uniforms: {
    tDiffuse: { value: null },
    touchTexture: { value: null }
  },
  vertexShader: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D touchTexture;
        #define PI 3.14159265359

        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            vec4 tex = texture2D(touchTexture , uv);
            float angle = -((tex.r) * (PI * 2.) - PI) ;
            float vx = -(tex.r *2. - 1.);
            float vy = -(tex.g *2. - 1.);
            float intensity = tex.b;
            uv.x += vx * 0.2 * intensity ;
            uv.y += vy * 0.2  *intensity;
            gl_FragColor = texture2D(tDiffuse, uv);
        }
    `
}

const shaderPass = new ShaderPass(customShader)
composer.addPass(shaderPass)

const touchTexture = new TouchTexture()


let lastTime = 0
const animate = (time) => {
  const delta = time - lastTime
  lastTime = time
  touchTexture.update(delta)
  shaderPass.uniforms.touchTexture.value = touchTexture.texture
  composer.render()
  requestAnimationFrame(animate)
}

renderer.domElement.addEventListener('mousemove', (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = 1 - (event.clientY - rect.top) / rect.height
  touchTexture.addTouch({ x, y })
})

scene.add(
  new THREE.Mesh(
    new THREE.PlaneGeometry(16 * 5, 9 * 5),
    new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('https://images.unsplash.com/photo-1730369624412-2e474536ee18?q=80&w=2532&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D') })
  )
)



window.addEventListener('resize', () => {
  touchTexture.width = window.innerWidth
  touchTexture.height = window.innerHeight
  touchTexture.initTexture()
  renderer.setSize(window.innerWidth, window.innerHeight)
})


animate()
