import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import * as THREE from 'three';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements AfterViewInit, OnDestroy {

  private animationId: number = 0;

  ngAfterViewInit(): void {
    this.initThreeJs();
    this.initCursor();
    this.initMagnetButton();
    this.initAnimations();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initThreeJs(): void {
    const container = document.getElementById('webgl');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();

    const particleCount = window.innerWidth < 700 ? 3500 : 9000;
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    const geometry = new THREE.BufferGeometry();
    const knot = new THREE.TorusKnotGeometry(1.6, 0.55, 260, 24);
    const knotPos = knot.attributes['position'];

    const coral = new THREE.Color(0xff6b4a);
    const ivory = new THREE.Color(0xeef1f5);

    for (let i = 0; i < particleCount; i++) {
      const v = i % knotPos.count;
      const x = knotPos.getX(v), y = knotPos.getY(v), z = knotPos.getZ(v);
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
      originalPositions[i * 3] = x; originalPositions[i * 3 + 1] = y; originalPositions[i * 3 + 2] = z;

      const c = coral.clone().lerp(ivory, Math.random() * 0.55);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.position.x = 1.6;
    scene.add(points);

    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const mouseWorld = new THREE.Vector3();
    const tmpCurrent = new THREE.Vector3();
    const tmpOriginal = new THREE.Vector3();
    const tmpVel = new THREE.Vector3();
    const tmpDir = new THREE.Vector3();
    const tmpReturn = new THREE.Vector3();

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mouseWorld.set(mouse.x * 3 - points.position.x, mouse.y * 3, 0);

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
        tmpCurrent.set(positions[ix], positions[iy], positions[iz]);
        tmpOriginal.set(originalPositions[ix], originalPositions[iy], originalPositions[iz]);
        tmpVel.set(velocities[ix], velocities[iy], velocities[iz]);

        const dist = tmpCurrent.distanceTo(mouseWorld);
        if (dist < 1.3) {
          const force = (1.3 - dist) * 0.012;
          tmpDir.subVectors(tmpCurrent, mouseWorld).normalize();
          tmpVel.add(tmpDir.multiplyScalar(force));
        }
        tmpReturn.subVectors(tmpOriginal, tmpCurrent).multiplyScalar(0.012);
        tmpVel.add(tmpReturn);
        tmpVel.multiplyScalar(0.93);

        positions[ix] += tmpVel.x;
        positions[iy] += tmpVel.y;
        positions[iz] += tmpVel.z;
        velocities[ix] = tmpVel.x;
        velocities[iy] = tmpVel.y;
        velocities[iz] = tmpVel.z;
      }
      geometry.attributes['position'].needsUpdate = true;
      points.rotation.y = t * 0.06;
      points.rotation.x = Math.sin(t * 0.1) * 0.1;
      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private initCursor(): void {
    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('ring');

    window.addEventListener('mousemove', e => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: .05 });
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: .35, ease: 'power3.out' });
    });
  }

  private initMagnetButton(): void {
    const magnet = document.getElementById('magnet');
    const ring = document.getElementById('ring');
    if (!magnet) return;

    const btn = magnet.querySelector('a')!;

    magnet.addEventListener('mousemove', e => {
      const r = magnet.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(btn, { x: x * .4, y: y * .6, duration: .3, ease: 'power2.out' });
      if (ring) gsap.to(ring, { scale: 2.2, duration: .3 });
    });

    magnet.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: .5, ease: 'elastic.out(1,0.4)' });
      if (ring) gsap.to(ring, { scale: 1, duration: .3 });
    });
  }

  private initAnimations(): void {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to('.corner', { opacity: 1, duration: .8 }, 0)
      .to('.eyebrow', { opacity: 1, duration: .6 }, .2)
      .to('.word', { y: '0%', rotate: 0, duration: 1.1, stagger: .15 }, .3)
      .to('.role', { opacity: 1, duration: .6 }, 1.1)
      .to('.cta', { opacity: 1, duration: .6 }, 1.3)
      .to('.social', { opacity: 1, duration: .6 }, 1.4);

    gsap.to('h1', {
      y: -8, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 2
    });
  }
}
