import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';

// O Componente do Cubo Giratório
function RotatingBox() {
  const mesh = useRef<any>(null);
  
  // Faz girar a cada frame (animação)
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta;
      mesh.current.rotation.y += delta;
    }
  });

  return (
    <mesh ref={mesh} scale={2}>
      <boxGeometry />
      <meshStandardMaterial color="#00e676" />
    </mesh>
  );
}

export default function AvatarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simulação Corporal</Text>
      
      <View style={styles.canvasWrapper}>
        <Canvas>
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 0, 5]} intensity={1} />
          <RotatingBox />
        </Canvas>
      </View>

      <Text style={styles.info}>Gordura: 18% | Peso: 82kg</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', alignItems: 'center', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 40 },
  canvasWrapper: { width: 300, height: 400 },
  info: { color: '#a1a1aa', marginTop: 20, fontSize: 16 }
});