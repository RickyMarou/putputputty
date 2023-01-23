import "./App.css";
import { atom, useSetAtom, useAtom, useAtomValue } from "jotai";
import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { SVGLoader } from "three-stdlib";
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
const shootAtom = atom([0, 0, 0]);

const SHOOT_MULTIPLIER = 2.4;

const Cell = ({ color, shape, fillOpacity }) => (
  <mesh>
    <meshBasicMaterial
      color={color}
      opacity={fillOpacity}
      depthWrite={false}
      transparent
    />
    <shapeGeometry args={[shape]} />
  </mesh>
);

function Svg() {
  const [center, setCenter] = React.useState(() => new THREE.Vector3(0, 0, 0));
  const ref = React.useRef<THREE.Group>(null!);

  const { paths } = useLoader(SVGLoader, "basic-lines.svg");

  const shapes = React.useMemo(
    () =>
      paths.flatMap((p) =>
        p.toShapes(true).map((shape) =>
          //@ts-expect-error this issue has been raised https://github.com/mrdoob/three.js/pull/21059
          ({ shape, color: p.color, fillOpacity: p.userData.style.fillOpacity })
        )
      ),
    [paths]
  );

  React.useEffect(() => {
    const box = new THREE.Box3().setFromObject(ref.current);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    setCenter((vec) => vec.set(-sphere.center.x, -sphere.center.y, 0));
  }, []);

  return (
    <group position={center} ref={ref}>
      {shapes.map((props) => (
        //@ts-expect-error this issue has been raised https://github.com/mrdoob/three.js/pull/21058
        <Cell key={props.shape.uuid} {...props} />
      ))}
    </group>
  );
}

function Ball(props: any) {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    linearDamping: 0.5,
  }));

  const setBall = useSetAtom(ballAtom);
  const setBallPos = useSetAtom(ballPosAtom);
  const shoot = useAtomValue(shootAtom);

  useEffect(() => {
    console.log({ ...shoot });
    api.velocity.set(
      shoot[0] * SHOOT_MULTIPLIER,
      shoot[1] * SHOOT_MULTIPLIER,
      shoot[2] * SHOOT_MULTIPLIER
    );
  }, shoot);

  useEffect(() => {
    setBall(ref);
    api.position.subscribe((position) => setBallPos(position));
    console.log(ref.current);
  }, []);

  return (
    <Sphere
      onPointerOver={() => {
        document.body.classList.add("can-grab");
      }}
      onPointerLeave={() => {
        document.body.classList.remove("can-grab");
      }}
      ref={ref}
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
  const [lineStart, setLineStart] = useAtom(lineStartAtom);
  const [lineEnd, setLineEnd] = useAtom(lineEndAtom);
  const ballPos = useAtomValue(ballPosAtom);

  useFrame((state) => {
    if (lineStart) {
      setLineStart([ballPos[0], 1, ballPos[2] - 1]);
    }

    // TODO: state.pointer.y is between [-1 and 1]
    // We have to instead get the y position
    // somehow.
    // console.log("pointer", state.pointer);
    // if (lineEnd) {
    //   setLineEnd([state.pointer.x, 1, state.pointer.y]);
    // }
  });

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
  const [lineStart, setLineStart] = useAtom(lineStartAtom);
  const [lineEnd, setLineEnd] = useAtom(lineEndAtom);
  const setShoot = useSetAtom(shootAtom);

  return (
    <mesh
      onPointerDown={(e) => {
        if (!ball) {
          console.error("no ball ref found T_T");
          return;
        }

        const intersecting = e.intersections.some(
          (intersection) => intersection.object === ball.current
        );

        if (!intersecting) {
          return;
        }

        document.body.classList.add("grabbing");
        setLineStart([ballPos[0], 1, ballPos[2] - 1]);
        setLineEnd([e.point.x, 1, e.point.z]);
      }}
      onPointerMove={(e) => {
        setLineEnd([e.point.x, 1, e.point.z]);
      }}
      onPointerUp={(e) => {
        document.body.classList.remove("grabbing");
        if (lineStart && lineEnd) {
          setShoot([lineStart[0] - lineEnd[0], 1, lineStart[2] - lineEnd[2]]);
        }

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
  const ballPos = useAtomValue(ballPosAtom);

  useFrame((state) => {
    // TODO: Set camera rotation once, not on every frame.
    state.camera.rotation.set(deg2rad(-80), deg2rad(0), deg2rad(0), "XYZ");
    state.camera.position.set(ballPos[0], 30, ballPos[2] + 10);
    state.camera.updateProjectionMatrix();
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 30, ballPos[2]]}
        onPointerDown={undefined}
      ></PerspectiveCamera>
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

// function App() {
//   return (
//     <main>
//       <h1>PutPutPutty</h1>
//       <div className="canvas-container">
//         <Canvas
//           orthographic
//           camera={{ position: [0, 0, 50], zoom: 10, up: [0, 0, 1], far: 10000 }}
//         >
//           <color attach="background" args={[243, 243, 243]} />
//           <React.Suspense fallback={null}>
//             <Svg />
//           </React.Suspense>
//           <MapControls />
//         </Canvas>
//       </div>
//     </main>
//   );
// }

export default App;

function deg2rad(degrees: number) {
  return degrees * (Math.PI / 180);
}
