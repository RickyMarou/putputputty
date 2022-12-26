import "./App.css";
import { Canvas } from "@react-three/fiber";

function App() {
  return (
    <main>
      <h1>PutPutPutty</h1>
      <div className="canvas-container">
        <Canvas>
          <ambientLight intensity={0.1} />
          <directionalLight color="white" position={[0, 0, 5]} />
          <mesh position={[0, 0, 0]}>
            <sphereGeometry />
            <meshBasicMaterial color="hotpink" />
          </mesh>
        </Canvas>
      </div>
    </main>
  );
}

export default App;
