import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useState, useEffect, Suspense, useRef, useMemo } from 'react'
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
    displayName?: string
}

interface GameProps {
    wrapTexture: string | null
    solidColor: string | null
    playerName: string
    onRename: (name: string) => void
    onCopyWrap: (wrap: string | null, color: string | null) => void
}

export function Game({ wrapTexture, solidColor, playerName, onRename, onCopyWrap }: GameProps) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [players, setPlayers] = useState<Record<string, PlayerState>>({})
    const localPlayerPosition = useRef<{ x: number, y: number, z: number }>({ x: 0, y: 0, z: 0 })
    const [cityOffset, setCityOffset] = useState<{ x: number, y: number, z: number }>({ x: 0, y: 0, z: 0 })

    // Interaction State
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
    const [activeChatTarget, setActiveChatTarget] = useState<string | null>(null)

    const MAX_CHAT_DISTANCE = 5 // meters in world units


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
                wrapTexture: wrapTexture,
                displayName: playerName
            });
        });

        newSocket.on('current-players', (currentPlayers: Record<string, PlayerState>) => {
            const hydrated: Record<string, PlayerState> = {}
            Object.values(currentPlayers).forEach(p => {
                hydrated[p.id] = { ...p, displayName: p.displayName || `Player ${p.id.slice(0, 4)}` }
            })
            setPlayers(hydrated);
        });

        newSocket.on('player-joined', (player: PlayerState) => {
            setPlayers(prev => ({ ...prev, [player.id]: { ...player, displayName: player.displayName || `Player ${player.id.slice(0, 4)}` } }));
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

        newSocket.on('player-name-update', (data: { id: string, displayName: string }) => {
            setPlayers(prev => {
                if (!prev[data.id]) return prev;
                return {
                    ...prev,
                    [data.id]: {
                        ...prev[data.id],
                        displayName: data.displayName
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
    }, [playerName]);

    // Broadcast appearance changes
    useEffect(() => {
        if (socket) {
            socket.emit('update-appearance', {
                color: solidColor,
                wrapTexture: wrapTexture
            })
        }
    }, [socket, wrapTexture, solidColor])

    // Broadcast name changes
    useEffect(() => {
        if (socket && playerName) {
            socket.emit('update-name', playerName)
            setPlayers(prev => {
                if (!socket.id || !prev[socket.id]) return prev;
                return { ...prev, [socket.id]: { ...prev[socket.id], displayName: playerName } }
            })
        }
    }, [socket, playerName])

    const addOffset = useMemo(() => {
        return (pos: { x: number, y: number, z: number }) => ({
            x: pos.x + cityOffset.x,
            y: pos.y + cityOffset.y,
            z: pos.z + cityOffset.z
        })
    }, [cityOffset])

    // Handle local updates
    const handlePositionUpdate = (state: { position: any, rotation: any, velocity: any }) => {
        if (socket) {
            // Normalize to city-centered coordinates for the network
            const netPos = {
                x: state.position.x - cityOffset.x,
                y: state.position.y - cityOffset.y,
                z: state.position.z - cityOffset.z
            }
            socket.emit('update-state', { ...state, position: netPos });
        }

        // Track local position for distance checks (cheap ref write)
        if (state.position) {
            localPlayerPosition.current = {
                x: state.position.x - cityOffset.x,
                y: state.position.y - cityOffset.y,
                z: state.position.z - cityOffset.z
            }
        }

        // Auto-close chat if the target moves out of range
        if (activeChatTarget) {
            const target = players[activeChatTarget];
            if (target) {
                const dx = localPlayerPosition.current.x - target.position.x;
                const dy = localPlayerPosition.current.y - target.position.y;
                const dz = localPlayerPosition.current.z - target.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (distance > MAX_CHAT_DISTANCE) {
                    setActiveChatTarget(null);
                }
            } else {
                setActiveChatTarget(null);
            }
        }
    };

    const handleCarClick = (id: string) => {
        if (id === socket?.id) return;
        setSelectedPlayer(id);

        const target = players[id];
        if (target) {
            const dx = localPlayerPosition.current.x - target.position.x;
            const dy = localPlayerPosition.current.y - target.position.y;
            const dz = localPlayerPosition.current.z - target.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (distance <= MAX_CHAT_DISTANCE) {
                setActiveChatTarget(id);
            } else {
                setActiveChatTarget(null);
            }
        } else {
            setActiveChatTarget(null);
        }
    };

    // Drop chat session if the remote player disconnects
    useEffect(() => {
        if (!activeChatTarget) return;
        const target = players[activeChatTarget];
        if (!target) {
            setActiveChatTarget(null);
            return;
        }

        const dx = localPlayerPosition.current.x - target.position.x;
        const dy = localPlayerPosition.current.y - target.position.y;
        const dz = localPlayerPosition.current.z - target.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance > MAX_CHAT_DISTANCE) {
            setActiveChatTarget(null);
        }
    }, [players, activeChatTarget]);

    const [spawnPosition] = useState(() => {
        const points = [
            [0, 5, 0], // Center (Safe)
            // [20, 5, 20], // Risk of clipping
            // [-20, 5, -20],
            // [20, 5, -20],
            // [-20, 5, 20]
        ]
        return points[Math.floor(Math.random() * points.length)] as [number, number, number]
    })

    useEffect(() => {
        localPlayerPosition.current = {
            x: spawnPosition[0],
            y: spawnPosition[1],
            z: spawnPosition[2]
        }
    }, [spawnPosition])

    const remoteCars = Object.values(players).filter(p => p.id !== socket?.id);

    return (
        <div className="w-full h-full relative">
            {activeChatTarget && (
                <ChatBox
                    socket={socket}
                    targetId={activeChatTarget}
                    targetLabel={players[activeChatTarget] ? `Player ${players[activeChatTarget].id.slice(0, 4)}` : undefined}
                    onClose={() => setActiveChatTarget(null)}
                />
            )}
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
                        <GameWorld onOffset={setCityOffset} />
                        <PlayerCar
                            wrapTexture={wrapTexture}
                            solidColor={solidColor}
                            onPositionUpdate={handlePositionUpdate}
                            initialPosition={spawnPosition}
                            displayName={players[socket?.id || '']?.displayName || playerName}
                            onRename={() => {
                                const next = window.prompt('Enter your display name', playerName || 'Player')?.trim()
                                if (next) onRename(next)
                            }}
                        />
                        {remoteCars.map(car => (
                            <RemoteCar
                                key={car.id}
                                id={car.id}
                                position={addOffset(car.position)}
                                rotation={car.rotation}
                                velocity={car.velocity}
                                color={car.color}
                                wrapTexture={car.wrapTexture}
                                displayName={car.displayName}
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
