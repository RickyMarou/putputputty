import "./App.css";
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Physics, useSphere, usePlane, useBox } from "@react-three/cannon";
import {
  Sphere,
  Box,
  SpotLight,
  OrbitControls,
  useDepthBuffer,
  Plane,
  Line,
} from "@react-three/drei";

function Ball(props: any) {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    linearDamping: 0.5,
  }));

  const [linePositions, setLinePositions] = useAtom(linePositionsAtom);

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
  return (
    <>
      <mesh
        onPointerDown={(event) => {
          console.log("down", { event });
        }}
        onPointerUp={(event) => {
          console.log("up", { event });
        }}
        position={[0, 2.5, 0]}
      >
        <boxGeometry args={[10, 5, 10]} />
        <meshPhongMaterial color="#ff0000" opacity={0.5} transparent />
      </mesh>
      <Line
        position={[1, 0, 1]}
        points={[
          [1, 1, 0],
          [1, 1, 1],
        ]}
        lineWidth={10}
        color="red"
      />
    </>
  );
}

function PointerTracker({ children }) {
  // TODO: Instead of wrapping in a mesh
  // Use an invisible element and make sure that it
  // is double sided, that can be done by setting
  // the `side` property on the material
  return (
    <mesh
      onPointerDown={(e) => {
        console.log("down", e);
      }}
      onPointerUp={(e) => {
        console.log("up", e);
      }}
    >
      {children}
    </mesh>
  );
}

function Wall({ args = [3, 4, 0.2], color, ...props }) {
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
      <OrbitControls />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 5]} />
      <pointLight position={[-10, -10, -5]} />
      <axesHelper />
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
              <Wall color="hotpink" position={[-1, 2, 4]} />
              <GamePlane />
            </PointerTracker>
          </Physics>
        </Canvas>
      </div>
    </main>
  );
}

export default App;
