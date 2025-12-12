import React from "react";
import { Edges, Text } from "@react-three/drei";
import { PlacedItem } from "../../types/item";

export const ItemMesh: React.FC<{ item: PlacedItem }> = ({ item }) => {
  const { width, depth, height } = item.dimensions;

  const getColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  };

  const baseColor = getColor(item.name);

  return (
    <group position={[item.position.x, item.position.y, item.position.z]} rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.1} />
        <Edges color="white" threshold={15} opacity={0.5} transparent />
      </mesh>

      <group position={[0, height / 2 + 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Text fontSize={12} color="black" anchorX="center" anchorY="middle" maxWidth={width * 0.9}>
          {item.name}
        </Text>
      </group>
    </group>
  );
};
