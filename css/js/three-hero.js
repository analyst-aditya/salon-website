/* ============================================================
   3D HERO — rotating barber pole + orbiting comb/scissors
   Built with three.js (loaded via CDN in index.html)
   ============================================================ */
(function () {
  "use strict";

  function init() {
    const canvas = document.getElementById("hero-canvas");
    const heroEl = document.getElementById("hero");
    if (!canvas || !window.THREE) return;

    const THREE = window.THREE;

    let width = heroEl.clientWidth;
    let height = heroEl.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 9);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // ---------- Lighting ----------
    const ambient = new THREE.AmbientLight(0xfff3df, 0.55);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(0xe7bd6c, 2.2, 30);
    keyLight.position.set(4, 4, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xb3475a, 1.4, 30);
    rimLight.position.set(-5, -2, 3);
    scene.add(rimLight);

    // ---------- Group everything so we can parallax-tilt as one ----------
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // ---------- Barber pole ----------
    const poleGroup = new THREE.Group();
    poleGroup.position.set(2.1, 0, 0);
    worldGroup.add(poleGroup);

    // striped texture, drawn on a canvas
    function makeStripeTexture() {
      const c = document.createElement("canvas");
      c.width = 128;
      c.height = 256;
      const ctx = c.getContext("2d");
      const stripeH = 40;
      const colors = ["#c79a44", "#8c2c3b", "#f4ecdd", "#8c2c3b"];
      let y = -stripeH;
      let i = 0;
      while (y < c.height + stripeH) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.save();
        ctx.translate(0, y);
        ctx.rotate((-28 * Math.PI) / 180);
        ctx.fillRect(-c.width, 0, c.width * 3, stripeH);
        ctx.restore();
        y += stripeH;
        i++;
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      return tex;
    }

    const stripeTex = makeStripeTexture();
    const poleMat = new THREE.MeshStandardMaterial({
      map: stripeTex,
      roughness: 0.35,
      metalness: 0.25,
    });

    const poleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 4.4, 48, 1, true),
      poleMat
    );
    poleGroup.add(poleBody);

    const capMat = new THREE.MeshStandardMaterial({
      color: 0xe7bd6c,
      metalness: 0.7,
      roughness: 0.25,
    });
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 32), capMat);
    capTop.position.y = 2.3;
    poleGroup.add(capTop);
    const capBottom = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 32), capMat);
    capBottom.position.y = -2.3;
    poleGroup.add(capBottom);

    // ---------- Floating scissors (built from primitives) ----------
    function buildScissors() {
      const g = new THREE.Group();
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xf4ecdd,
        metalness: 0.85,
        roughness: 0.2,
      });
      const handleMat = new THREE.MeshStandardMaterial({
        color: 0x8c2c3b,
        metalness: 0.2,
        roughness: 0.5,
      });

      [-1, 1].forEach((side) => {
        const arm = new THREE.Group();

        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.95, 0.05),
          bladeMat
        );
        blade.position.set(0, 0.55, 0);
        arm.add(blade);

        const handle = new THREE.Mesh(
          new THREE.TorusGeometry(0.22, 0.045, 12, 24),
          handleMat
        );
        handle.position.set(0, -0.45, 0);
        arm.add(handle);

        arm.rotation.z = side * 0.22;
        arm.position.x = side * 0.05;
        g.add(arm);
      });

      const pivot = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xe7bd6c, metalness: 0.8, roughness: 0.3 })
      );
      g.add(pivot);

      g.scale.setScalar(1.15);
      return g;
    }

    // ---------- Floating comb (built from primitives) ----------
    function buildComb() {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color: 0x231b16,
        roughness: 0.4,
        metalness: 0.1,
      });
      const spine = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.06), mat);
      g.add(spine);

      const teeth = 14;
      for (let i = 0; i < teeth; i++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.42, 0.05), mat);
        tooth.position.set(-0.7 + (i * 1.4) / (teeth - 1), -0.28, 0);
        g.add(tooth);
      }
      return g;
    }

    const scissors = buildScissors();
    scissors.position.set(-2.6, 1.1, 0.6);
    worldGroup.add(scissors);

    const comb = buildComb();
    comb.position.set(-2.3, -1.6, -0.4);
    comb.rotation.z = 0.35;
    worldGroup.add(comb);

    // a few ambient floating particles (soap-bubble / dust feel)
    const particles = new THREE.Group();
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xe7bd6c,
      metalness: 0.3,
      roughness: 0.6,
      transparent: true,
      opacity: 0.55,
    });
    const particleData = [];
    for (let i = 0; i < 18; i++) {
      const s = 0.025 + Math.random() * 0.05;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 10), particleMat);
      const x = (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * 5;
      const z = (Math.random() - 0.5) * 4;
      mesh.position.set(x, y, z);
      particles.add(mesh);
      particleData.push({ mesh, speed: 0.15 + Math.random() * 0.25, offset: Math.random() * Math.PI * 2 });
    }
    worldGroup.add(particles);

    // ---------- Mouse parallax (interactive!) ----------
    const mouse = { x: 0, y: 0 };
    const targetRot = { x: 0, y: 0 };

    function onPointerMove(e) {
      const rect = heroEl.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      mouse.x = px * 2 - 1;
      mouse.y = py * 2 - 1;
    }
    heroEl.addEventListener("mousemove", onPointerMove);
    heroEl.addEventListener(
      "touchmove",
      (e) => {
        if (!e.touches || !e.touches.length) return;
        onPointerMove(e.touches[0]);
      },
      { passive: true }
    );

    // ---------- Resize ----------
    function onResize() {
      width = heroEl.clientWidth;
      height = heroEl.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener("resize", onResize);

    // ---------- Animate ----------
    const clock = new THREE.Clock();

    function animate() {
      const t = clock.getElapsedTime();

      poleGroup.rotation.y = t * 0.6;
      stripeTex.offset.y = -t * 0.45;

      scissors.rotation.y = Math.sin(t * 0.5) * 0.6 + t * 0.15;
      scissors.position.y = 1.1 + Math.sin(t * 0.8) * 0.15;
      // gentle "snip" motion on the blades
      scissors.children.forEach((arm, idx) => {
        if (idx < 2) {
          const base = idx === 0 ? 0.22 : -0.22;
          arm.rotation.z = base + Math.sin(t * 2 + idx) * 0.05;
        }
      });

      comb.rotation.z = 0.35 + Math.sin(t * 0.6) * 0.08;
      comb.position.y = -1.6 + Math.cos(t * 0.7) * 0.15;

      particleData.forEach((p) => {
        p.mesh.position.y += Math.sin(t * p.speed + p.offset) * 0.0025;
        p.mesh.position.x += Math.cos(t * p.speed * 0.7 + p.offset) * 0.0018;
      });

      // smooth (lerp) parallax toward mouse target
      targetRot.x += (mouse.y * 0.18 - targetRot.x) * 0.04;
      targetRot.y += (mouse.x * 0.28 - targetRot.y) * 0.04;
      worldGroup.rotation.x = targetRot.x;
      worldGroup.rotation.y = targetRot.y;
      camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(init, 0);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
