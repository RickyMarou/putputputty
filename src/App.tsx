import "./App.css";
import { atom, useSetAtom, useAtom, useAtomValue } from "jotai";
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, useSphere, usePlane, useBox } from "@react-three/cannon";
import {
  Sphere,
  Box,
  SpotLight,
  OrbitControls,
  MapControls,
  OrthographicCamera,
  useDepthBuffer,
  Plane,
  Line,
} from "@react-three/drei";

const ballAtom = atom(undefined);
const lineStartAtom = atom(undefined);
const lineEndAtom = atom(undefined);
const mousePointsAtom = atom([]);

function Ball(props: any) {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    linearDamping: 0.5,
  }));

  const setBall = useSetAtom(ballAtom);
  setBall(ref);

  return (
    <Sphere
      ref={ref}
      onClick={() => {
        api.velocity.set(0, 0, 5);
      }}
      position={[0, 1, 0]}
      {...props}
    >
      <meshBasicMaterial color={"hotpink"} />
    </Sphere>
  );
}

function GamePlane() {
  const rotation = [-Math.PI / 2, 0, 0];
  const position = [0, 0, 0];
  const [ref] = usePlane(() => ({ rotation, position }));
  return (
    <Plane scale={10} rotation={rotation} ref={ref} position={position}>
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
  const setLineStart = useSetAtom(lineStartAtom);
  const setLineEnd = useSetAtom(lineEndAtom);
  const [mousePoints, setMousePoints] = useAtom(mousePointsAtom);

  return (
    <mesh
      onPointerDown={(e) => {
        console.log("down", e);
        console.log({ ball });
        const intersecting = e.intersections.some(
          (intersection) => intersection.object === ball.current
        );

        if (!intersecting) {
          console.log("not intersecting");
          return;
        }

        setLineStart([ball.current.position.x, 1, ball.current.position.z]);
        setLineEnd([e.point.x, 1, e.point.z]);
        console.log("intersecting");
      }}
      onPointerMove={(e) => {
        setLineEnd([e.point.x, 1, e.point.z]);
        // setMousePoints([...mousePoints, [e.point.x, e.point.y, 1]]);
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
  return (
    <>
      <MapControls />
      <OrthographicCamera position={[0, 10, 0]} zoom={40} makeDefault />
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
          <BaseScene />
          <Physics>
            <PointerTracker>
              <DrawLine />
              <Ball />
              <Wall color="hotpink" position={[-2, 1, 0]} />
              <Wall color="hotpink" position={[2, 1, 0]} />
              <GamePlane />
            </PointerTracker>
          </Physics>
        </Canvas>
      </div>
    </main>
  );
}

export default App;
