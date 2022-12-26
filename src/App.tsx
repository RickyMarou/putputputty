import "./App.css";
import { Canvas } from "@react-three/fiber";
import { Sphere, Box, OrbitControls } from "@react-three/drei";
import { BoxGeometry, BufferGeometry, Matrix4 } from "three";

function App() {
  return (
    <main>
      <h1>PutPutPutty</h1>
      <div className="canvas-container">
        <Canvas>
          <OrbitControls />
          <gridHelper />
          <axesHelper />
          <Sphere position={[0, 1, 0]}>
            <meshBasicMaterial color="hotpink" />
          </Sphere>
        </Canvas>
      </div>
    </main>
  );
}

export default App;
