import * as THREE from "three"

const easeOutSine = (t, b, c, d) => {
    return c * Math.sin((t / d) * (Math.PI / 2)) + b
}

const easeOutQuad = (t, b, c, d) => {
    t /= d
    return -c * t * (t - 2) + b
}

export default class TouchTexture {
    constructor(parent) {
        this.size = 64
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.width = this.height = this.size

        this.maxAge = 64
        this.radius = 0.1 * this.size
        // this.radius = 0.15 * 1000;

        this.speed = 1 / this.maxAge
        // this.speed = 0.01;

        this.trail = []
        this.last = null

        this.initTexture()
    }

    initTexture() {
        this.canvas = document.createElement("canvas")
        this.canvas.width = this.width
        this.canvas.height = this.height
        this.ctx = this.canvas.getContext("2d")
        this.ctx.fillStyle = "black"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.texture = new THREE.Texture(this.canvas)
        this.canvas.id = "touchTexture"
        // this.canvas.style.width = this.canvas.style.height = `${
        //   this.canvas.width
        // }px`;
    }
    update(delta) {
        this.clear()
        let speed = this.speed
        this.trail.forEach((point, i) => {
            let f = point.force * speed * (1 - point.age / this.maxAge)
            let x = point.x
            let y = point.y

            point.x += point.vx * f
            point.y += point.vy * f
            point.age++
            if (point.age > this.maxAge) {
                this.trail.splice(i, 1)
            }
        })

        this.trail.forEach((point, i) => {
            this.drawPoint(point)
        })
        // this.drawPoints();

        // this.ctx.fillStyle = "rgba(255,0,0,0.5)";
        // this.ctx.fillRect(0, 0, 200, 200);
        // this.ctx.fillStyle = "rgba(0,255,0,0.5)";
        // this.ctx.fillRect(50, 0, 200, 200);
        // this.test();
        this.texture.needsUpdate = true
    }
    clear() {
        this.ctx.fillStyle = "black"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    addTouch(point) {
        let force = 0
        let vx = 0
        let vy = 0
        const last = this.last
        if (last) {
            const dx = point.x - last.x
            const dy = point.y - last.y
            if (dx === 0 && dy === 0) return
            const dd = dx * dx + dy * dy
            let d = Math.sqrt(dd)
            vx = dx / d
            vy = dy / d

            force = Math.min(dd * 10000, 1)
            // force = Math.sqrt(dd)* 50.;
            // force = 1;
        }
        this.last = {
            x: point.x,
            y: point.y
        }
        this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy })
    }
    drawPoint(point) {
        const ctx = this.ctx
        const pos = {
            x: point.x * this.width,
            y: (1 - point.y) * this.height
        }

        let intensity = 1

        if (point.age < this.maxAge * 0.3) {
            intensity = easeOutSine(point.age / (this.maxAge * 0.3), 0, 1, 1)
        } else {
            intensity = easeOutQuad(
                1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7),
                0,
                1,
                1
            )
        }
        intensity *= point.force

        const radius = this.radius
        let color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) *
            255}, ${intensity * 255}`

        let offset = this.size * 5
        ctx.shadowOffsetX = offset // (default 0)
        ctx.shadowOffsetY = offset // (default 0)
        ctx.shadowBlur = radius * 1 // (default 0)
        ctx.shadowColor = `rgba(${color},${0.2 * intensity})` // (default transparent black)

        this.ctx.beginPath()
        this.ctx.fillStyle = "rgba(255,0,0,1)"
        this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2)
        this.ctx.fill()
    }
}
