import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useState, useEffect, Suspense } from 'react'
import { io, Socket } from 'socket.io-client'
import { GameWorld } from './GameWorld'
import { PlayerCar } from './PlayerCar'
import { RemoteCar } from './RemoteCar'
import { ChatBox } from './ChatBox'
import { Environment } from '@react-three/drei'


// Define types locally for now since we don't have a shared types file yet
interface PlayerState {
    id: string
    position: { x: number, y: number, z: number }
    rotation: { x: number, y: number, z: number, w: number }
    velocity: { x: number, y: number, z: number }
    color: string | null
    wrapTexture: string | null
}

interface GameProps {
    wrapTexture: string | null
    solidColor: string | null
    onCopyWrap: (wrap: string | null, color: string | null) => void
}

export function Game({ wrapTexture, solidColor, onCopyWrap }: GameProps) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [players, setPlayers] = useState<Record<string, PlayerState>>({})

    // Interaction State
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)


    useEffect(() => {
        // Connect to server
        // In dev: localhost:3000. In prod: same origin (relative path)
        const socketUrl = import.meta.env.DEV ? 'http://localhost:3000' : undefined;
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to server');
            newSocket.emit('join', {
                color: solidColor,
                wrapTexture: wrapTexture
            });
        });

        newSocket.on('current-players', (currentPlayers: Record<string, PlayerState>) => {
            setPlayers(currentPlayers);
        });

        newSocket.on('player-joined', (player: PlayerState) => {
            setPlayers(prev => ({ ...prev, [player.id]: player }));
        });

        newSocket.on('player-update', (data: { id: string } & Partial<PlayerState>) => {
            setPlayers(prev => {
                if (!prev[data.id]) return prev;
                return {
                    ...prev,
                    [data.id]: { ...prev[data.id], ...data }
                };
            });
        });

        newSocket.on('player-appearance-update', (data: { id: string, color: string | null, wrapTexture: string | null }) => {
            setPlayers(prev => {
                if (!prev[data.id]) return prev;
                return {
                    ...prev,
                    [data.id]: {
                        ...prev[data.id],
                        color: data.color,
                        wrapTexture: data.wrapTexture
                    }
                };
            });
        });

        newSocket.on('player-left', (id: string) => {
            setPlayers(prev => {
                const newPlayers = { ...prev };
                delete newPlayers[id];
                return newPlayers;
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Broadcast appearance changes
    useEffect(() => {
        if (socket) {
            socket.emit('update-appearance', {
                color: solidColor,
                wrapTexture: wrapTexture
            })
        }
    }, [socket, wrapTexture, solidColor])

    // Handle local updates
    const handlePositionUpdate = (state: { position: any, rotation: any, velocity: any }) => {
        if (socket) {
            socket.emit('update-state', state);
        }
    };

    const handleCarClick = (id: string) => {
        if (id === socket?.id) return;
        setSelectedPlayer(id);
        // We'll trust the click event propagation for now or implement a screen space menu
        // For simplicity, let's just toggle a menu UI state
        // In 3D click handler, we might want to project to screen coords? 
        // Or just show a HTML overlay on top of the car.
    };

    const [spawnPosition] = useState(() => {
        const points = [
            [0, 25, 0],
            [20, 25, 20],
            [-20, 25, -20],
            [20, 25, -20],
            [-20, 25, 20]
        ]
        return points[Math.floor(Math.random() * points.length)] as [number, number, number]
    })

    const remoteCars = Object.values(players).filter(p => p.id !== socket?.id);

    return (
        <div className="w-full h-full relative">
            <ChatBox socket={socket} />
            {/* 3D Scene */}
            {/* PERFORMANCE: Cap dpr at 1.5 to prevent massive lag on Retina/High-DPI screens */}
            <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 5, 10], fov: 50 }}>
                <Suspense fallback={null}>
                    {/* LIGHTING ENHANCEMENTS */}
                    {/* PBR Reflections - Key for "Tesla" look */}
                    <Environment preset="city" />

                    {/* Brighter base lighting */}
                    <ambientLight intensity={1.5} />
                    {/* Key light for shadows */}
                    <directionalLight
                        position={[100, 100, 50]}
                        intensity={2}
                        castShadow
                        shadow-mapSize={[1024, 1024]}
                    />

                    <Physics interpolate={true} timeStep={1 / 60}>
                        <GameWorld />
                        <PlayerCar
                            wrapTexture={wrapTexture}
                            solidColor={solidColor}
                            onPositionUpdate={handlePositionUpdate}
                            initialPosition={spawnPosition}
                        />
                        {remoteCars.map(car => (
                            <RemoteCar
                                key={car.id}
                                id={car.id}
                                position={car.position}
                                rotation={car.rotation}
                                velocity={car.velocity}
                                color={car.color}
                                wrapTexture={car.wrapTexture}
                                onClick={handleCarClick}
                            />
                        ))}
                    </Physics>

                    {/* Environment/Sky - Keep matching background */}
                    <color attach="background" args={['#87CEEB']} />
                    <fog attach="fog" args={['#87CEEB', 30, 200]} />
                </Suspense>
            </Canvas>

            {/* UI Overlays */}
            {selectedPlayer && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg z-50">
                    <h3 className="font-bold mb-2">Player {selectedPlayer.slice(0, 4)}</h3>
                    <div className="flex flex-col gap-2">
                        <button className="bg-blue-500 text-white px-4 py-2 rounded">Chat</button>
                        <button
                            className="bg-green-500 text-white px-4 py-2 rounded"
                            onClick={() => {
                                const target = players[selectedPlayer];
                                if (target) {
                                    onCopyWrap(target.wrapTexture, target.color);
                                }
                                setSelectedPlayer(null);
                            }}
                        >
                            Copy Wrap
                        </button>
                        <button
                            className="text-gray-500 text-sm mt-2"
                            onClick={() => setSelectedPlayer(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
