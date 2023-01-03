import "./App.css";
import { atom, useSetAtom, useAtom, useAtomValue } from "jotai";
import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, useSphere, usePlane, useBox } from "@react-three/cannon";
import {
  Center,
  Sphere,
  Box,
  SpotLight,
  OrbitControls,
  MapControls,
  OrthographicCamera,
  PerspectiveCamera,
  PointerLockControls,
  useDepthBuffer,
  Plane,
  Line,
} from "@react-three/drei";
import * as THREE from "three";

const ballAtom = atom(undefined);
const ballPosAtom = atom([0, 0, 0]);
const lineStartAtom = atom(undefined);
const lineEndAtom = atom(undefined);
const mousePointsAtom = atom([]);

function Ball(props: any) {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    linearDamping: 0.5,
  }));

  const setBall = useSetAtom(ballAtom);
  const setBallPos = useSetAtom(ballPosAtom);

  useEffect(() => {
    setBall(ref);
    api.position.subscribe((position) => setBallPos(position));
  }, []);

  return (
    <Sphere
      ref={ref}
      onClick={() => {
        api.velocity.set(0, 0, 5);
      }}
      position={[0, 1, 0]}
      {...props}
    >
      <meshPhongMaterial color="hotpink" opacity={0.5} transparent />
    </Sphere>
  );
}

function GamePlane() {
  const rotation = [-Math.PI / 2, 0, 0];
  const position = [0, 0, 0];
  const [ref] = usePlane(() => ({ rotation, position }));
  return (
    <Plane scale={80} rotation={rotation} ref={ref} position={position}>
      <meshPhongMaterial />
    </Plane>
  );
}

function DrawLine() {
  const lineStart = useAtomValue(lineStartAtom);
  const lineEnd = useAtomValue(lineEndAtom);

  if (!lineStart || !lineEnd) {
    return null;
  }

  return (
    <>
      <Line
        position={[0, 0, 1]}
        points={[lineStart, lineEnd]}
        lineWidth={10}
        color="red"
      />
    </>
  );
}

function PointerTracker({ children }) {
  const ball = useAtomValue(ballAtom);
  const ballPos = useAtomValue(ballPosAtom);
  const setLineStart = useSetAtom(lineStartAtom);
  const setLineEnd = useSetAtom(lineEndAtom);
  const [mousePoints, setMousePoints] = useAtom(mousePointsAtom);

  return (
    <mesh
      onPointerDown={(e) => {
        const intersecting = e.intersections.some(
          (intersection) => intersection.object === ball.current
        );

        if (!intersecting) {
          console.log("not intersecting");
          return;
        }

        console.log("ballPos", ballPos);
        console.log("event point", e.point);
        setLineStart([ballPos[0], 1, ballPos[2]]);
        setLineEnd([e.point.x, 1, e.point.z]);
        console.log("intersecting");
      }}
      onPointerMove={(e) => {
        setLineEnd([e.point.x, 1, e.point.z]);
      }}
      onPointerUp={(e) => {
        setLineStart(undefined);
        setLineEnd(undefined);
      }}
    >
      {children}
    </mesh>
  );
}

function Wall({ args = [0.2, 2, 10], color, ...props }) {
  const [ref] = useBox(() => ({ args, ...props }));
  return (
    <mesh ref={ref}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function BaseScene(props: any) {
  let currentPosition = new THREE.Vector3();
  let currentLookAt = new THREE.Vector3();

  const ballPos = useAtomValue(ballPosAtom);

  useFrame((state, delta) => {
    currentLookAt.set(ballPos[0], ballPos[1], ballPos[2]);
    state.camera.lookAt(currentLookAt);
    state.camera.updateProjectionMatrix();
  });

  return (
    <>
      <MapControls />
      <PerspectiveCamera makeDefault position={[0, 15, ballPos[2] - 15]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 5]} />
      <pointLight position={[-10, -10, -5]} />
    </>
  );
}

function App() {
  return (
    <main>
      <h1>PutPutPutty</h1>
      <div className="canvas-container">
        <Canvas>
          <PointerTracker>
            <BaseScene />
            <Physics>
              <DrawLine />
              <Ball />
              <Wall color="hotpink" position={[-2, 1, 0]} />
              <Wall color="hotpink" position={[2, 1, 0]} />
              <GamePlane />
            </Physics>
          </PointerTracker>
        </Canvas>
      </div>
    </main>
  );
}

export default App;
