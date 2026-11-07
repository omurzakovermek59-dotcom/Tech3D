import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { CanvasTexture, Shape, ShapeGeometry, SRGBColorSpace } from 'three';

const appleMark = new Shape();
appleMark.moveTo(0, -0.12);
appleMark.bezierCurveTo(-0.1, -0.14, -0.17, -0.07, -0.16, 0.015);
appleMark.bezierCurveTo(-0.15, 0.09, -0.1, 0.15, -0.05, 0.145);
appleMark.bezierCurveTo(-0.02, 0.143, 0, 0.12, 0.025, 0.125);
appleMark.bezierCurveTo(0.055, 0.13, 0.085, 0.16, 0.12, 0.135);
appleMark.bezierCurveTo(0.16, 0.105, 0.165, 0.065, 0.145, 0.045);
appleMark.bezierCurveTo(0.105, 0.02, 0.11, -0.005, 0.15, -0.03);
appleMark.bezierCurveTo(0.13, -0.095, 0.075, -0.14, 0.02, -0.12);
appleMark.bezierCurveTo(0.01, -0.115, -0.005, -0.115, 0, -0.12);
const appleMarkGeometry = new ShapeGeometry(appleMark);

const appleLeaf = new Shape();
appleLeaf.moveTo(0, 0);
appleLeaf.bezierCurveTo(0.005, 0.055, 0.05, 0.08, 0.085, 0.075);
appleLeaf.bezierCurveTo(0.08, 0.035, 0.05, 0.005, 0, 0);
const appleLeafGeometry = new ShapeGeometry(appleLeaf);

function useScreenTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create the phone screen texture');

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#f3e7d4');
    gradient.addColorStop(0.24, '#526d89');
    gradient.addColorStop(0.51, '#101925');
    gradient.addColorStop(0.76, '#30445a');
    gradient.addColorStop(1, '#e8eef0');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const glow = context.createRadialGradient(128, 300, 10, 128, 300, 185);
    glow.addColorStop(0, 'rgba(27, 91, 137, .45)');
    glow.addColorStop(1, 'rgba(14, 25, 39, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
}

function CameraLens({ position }) {
  return <group position={position}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.094, 0.094, 0.018, 48]} />
      <meshStandardMaterial color="#ded8ca" metalness={0.9} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.078, 0.078, 0.006, 48]} />
      <meshStandardMaterial color="#11151d" metalness={0.42} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0, 0.014]}>
      <torusGeometry args={[0.071, 0.006, 10, 48]} />
      <meshStandardMaterial color="#c9c1ae" metalness={0.9} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.057, 0.057, 0.004, 40]} />
      <meshPhysicalMaterial color="#17263a" metalness={0.6} roughness={0.13} clearcoat={1} />
    </mesh>
    <mesh position={[-0.014, 0.016, 0.019]}>
      <sphereGeometry args={[0.008, 12, 12]} />
      <meshBasicMaterial color="#c6d9f3" />
    </mesh>
  </group>;
}

function PhoneModel() {
  const screenTexture = useScreenTexture();
  return <group rotation={[0.27, -0.32, -0.08]} scale={0.88}>
    <RoundedBox args={[1.28, 2.58, 0.14]} radius={0.145} smoothness={12}>
      <meshStandardMaterial color="#d5cfbf" metalness={0.88} roughness={0.22} />
    </RoundedBox>

    <RoundedBox args={[1.225, 2.525, 0.014]} radius={0.132} smoothness={12} position={[0, 0, 0.073]}>
      <meshStandardMaterial color="#eee9dc" metalness={0.18} roughness={0.34} />
    </RoundedBox>

    <RoundedBox args={[0.685, 0.755, 0.026]} radius={0.12} smoothness={12} position={[-0.22, 0.78, 0.093]}>
      <meshStandardMaterial color="#e7e1d3" metalness={0.4} roughness={0.26} />
    </RoundedBox>
    <CameraLens position={[-0.42, 1.01, 0.109]} />
    <CameraLens position={[-0.02, 1.01, 0.109]} />
    <CameraLens position={[-0.42, 0.58, 0.109]} />
    <mesh position={[-0.02, 0.59, 0.108]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.052, 0.052, 0.008, 32]} />
      <meshBasicMaterial color="#f7e9c6" />
    </mesh>
    <mesh position={[0.16, 0.59, 0.108]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.018, 0.018, 0.004, 20]} />
      <meshBasicMaterial color="#17191d" />
    </mesh>

    <mesh position={[0, -0.2, 0.081]}>
      <torusGeometry args={[0.405, 0.008, 12, 96]} />
      <meshStandardMaterial color="#b9b3a7" metalness={0.78} roughness={0.27} />
    </mesh>
    <mesh position={[0, -0.2, 0.082]}>
      <torusGeometry args={[0.382, 0.003, 8, 96]} />
      <meshStandardMaterial color="#f8f4e9" metalness={0.72} roughness={0.25} />
    </mesh>
    <mesh geometry={appleMarkGeometry} position={[0, -0.2, 0.084]}>
      <meshStandardMaterial color="#bdb7aa" metalness={0.48} roughness={0.3} />
    </mesh>
    <mesh geometry={appleLeafGeometry} position={[0.015, -0.015, 0.084]}>
      <meshStandardMaterial color="#bdb7aa" metalness={0.48} roughness={0.3} />
    </mesh>

    <RoundedBox args={[1.2, 2.48, 0.014]} radius={0.125} smoothness={12} position={[0, 0, -0.073]}>
      <meshStandardMaterial color="#080b12" metalness={0.25} roughness={0.18} />
    </RoundedBox>
    <RoundedBox args={[1.17, 2.44, 0.006]} radius={0.112} smoothness={12} position={[0, 0, -0.083]}>
      <meshPhysicalMaterial map={screenTexture} roughness={0.19} metalness={0.12} clearcoat={1} clearcoatRoughness={0.08} />
    </RoundedBox>
    <RoundedBox args={[0.28, 0.065, 0.008]} radius={0.032} smoothness={8} position={[0, 1.14, -0.088]}>
      <meshBasicMaterial color="#05070b" />
    </RoundedBox>

    <RoundedBox args={[0.045, 0.28, 0.055]} radius={0.02} smoothness={8} position={[-0.65, 0.63, 0]}>
      <meshStandardMaterial color="#c4bcae" metalness={0.82} roughness={0.2} />
    </RoundedBox>
    <RoundedBox args={[0.045, 0.36, 0.055]} radius={0.02} smoothness={8} position={[-0.65, 0.2, 0]}>
      <meshStandardMaterial color="#c4bcae" metalness={0.82} roughness={0.2} />
    </RoundedBox>
    <RoundedBox args={[0.045, 0.36, 0.055]} radius={0.02} smoothness={8} position={[-0.65, -0.22, 0]}>
      <meshStandardMaterial color="#c4bcae" metalness={0.82} roughness={0.2} />
    </RoundedBox>
    <RoundedBox args={[0.045, 0.52, 0.055]} radius={0.02} smoothness={8} position={[0.65, 0.37, 0]}>
      <meshStandardMaterial color="#c4bcae" metalness={0.82} roughness={0.2} />
    </RoundedBox>
  </group>;
}

export default function PhoneModelCanvas({ alt }) {
  return <div className="hero-model" role="img" aria-label={alt}>
    <Canvas camera={{ position: [0, 0, 4.5], fov: 36 }} dpr={[1, 2]}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 5, 6]} intensity={2.1} />
      <directionalLight position={[-4, 1, -3]} intensity={1.2} color="#a9c5ff" />
      <OrbitControls autoRotate autoRotateSpeed={0.8} enablePan={false} minDistance={3.5} maxDistance={6} minPolarAngle={0.45} maxPolarAngle={2.7} />
      <PhoneModel />
    </Canvas>
  </div>;
}
