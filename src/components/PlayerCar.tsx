import { useRef, useState, useEffect, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { CarModel } from './CarModel'
import { useCameraRig } from '../hooks/useCameraRig'
import { useVehicleAudio } from '../hooks/useVehicleAudio'
import { OrbitControls } from '@react-three/drei'

interface PlayerCarProps {
    wrapTexture: string | null
    solidColor: string | null
    onPositionUpdate: (pos: { position: THREE.Vector3, rotation: THREE.Quaternion, velocity: THREE.Vector3 }) => void
    initialPosition?: [number, number, number]
}

export function PlayerCar({ wrapTexture, solidColor, onPositionUpdate, initialPosition = [0, 2, 0] }: PlayerCarProps) {
    const rigidBodyRef = useRef<RapierRigidBody>(null)
    const visualMeshRef = useRef<THREE.Group>(null)
    const orbitControlsRef = useRef<any>(null)
    const lastActiveTime = useRef(0)
    const lastInputType = useRef<'ACTION' | 'REVERSE' | 'NONE'>('NONE') // Track sticky mode
    const hasParked = useRef(false) // Track if we have arrived at parking view
    const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false })
    const audio = useVehicleAudio()

    // Input listeners
    useFrame(() => {
        // Poll keys (or use useEffect for listeners, but polling assumes external state or we add listeners once)
        // Let's just add listeners in useEffect for cleaner approach
    })

    // Simple input handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'w' || e.key === 'ArrowUp') setKeys(k => ({ ...k, w: true }));
            if (e.key === 's' || e.key === 'ArrowDown') setKeys(k => ({ ...k, s: true }));
            if (e.key === 'a' || e.key === 'ArrowLeft') setKeys(k => ({ ...k, a: true }));
            if (e.key === 'd' || e.key === 'ArrowRight') setKeys(k => ({ ...k, d: true }));
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'w' || e.key === 'ArrowUp') setKeys(k => ({ ...k, w: false }));
            if (e.key === 's' || e.key === 'ArrowDown') setKeys(k => ({ ...k, s: false }));
            if (e.key === 'a' || e.key === 'ArrowLeft') setKeys(k => ({ ...k, a: false }));
            if (e.key === 'd' || e.key === 'ArrowRight') setKeys(k => ({ ...k, d: false }));
        }
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    useFrame((state) => {
        if (!rigidBodyRef.current) return;

        const impulse = { x: 0, y: 0, z: 0 };
        const torque = { x: 0, y: 0, z: 0 };
        const impulseStrength = 10; // Much lower acceleration for smooth control (was 20)
        const baseTorqueStrength = 8; // Reduced for fine control (was 15)

        const rot = rigidBodyRef.current.rotation();
        const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);

        // Control flags
        let applyForce = true;

        // Limit Top Speed
        const maxSpeed = 20; // Very slow, parking lot speed (approx 30km/h)
        const currentSpeed = rigidBodyRef.current.linvel().x ** 2 + rigidBodyRef.current.linvel().y ** 2 + rigidBodyRef.current.linvel().z ** 2;

        // Only apply impulse if below max speed, OR if impulse opposes velocity (breaking/reversing)
        // correct way: check dot product of impulse and velocity? 
        // Simple way: just clamp magnitude? No, that messes up physics.
        // Good way: Don't add force if it increases speed beyond max.

        let shouldApply = true;
        if (currentSpeed > maxSpeed ** 2) {
            // Check if we are trying to accelerate further
            // Dot product of velocity and forward direction
            const vel = rigidBodyRef.current.linvel();
            const velVec = new THREE.Vector3(vel.x, vel.y, vel.z);
            const movingForward = velVec.dot(forward) > 0;

            if (keys.w && movingForward) shouldApply = false;
            if (keys.s && !movingForward) shouldApply = false;
        }

        if (applyForce && shouldApply) {
            if (keys.w) {
                // W = Forward: Model is rotated 180°, so subtract physics forward = visual forward
                impulse.x -= forward.x * impulseStrength;
                impulse.z -= forward.z * impulseStrength;
            }
            if (keys.s) {
                // S = Reverse: Add physics forward = visual backward
                impulse.x += forward.x * impulseStrength;
                impulse.z += forward.z * impulseStrength;
            }
        }

        // Natural steering: scales with speed (can't spin in place)
        const currentVel = rigidBodyRef.current.linvel();
        const horizontalSpeed = Math.sqrt(currentVel.x ** 2 + currentVel.z ** 2);
        // Minimum 20% steering at stop, scales to 100% at speed 8+
        const steeringMultiplier = 0.2 + 0.8 * Math.min(horizontalSpeed / 8, 1);
        const torqueStrength = baseTorqueStrength * steeringMultiplier;

        if (keys.a) {
            // If reversing (S), invert steering to match intuitive reverse cam
            torque.y += keys.s ? -torqueStrength : torqueStrength;
        }
        if (keys.d) {
            torque.y -= keys.s ? -torqueStrength : torqueStrength;
        }

        // Only apply impulse if there's actual input (avoid waking body with zero impulse)
        if (impulse.x !== 0 || impulse.z !== 0) {
            rigidBodyRef.current.applyImpulse(impulse, true);
        }
        if (torque.y !== 0) {
            rigidBodyRef.current.applyTorqueImpulse(torque, true);
        }

        // Stabilize (angular damping is built-in but we can add linear drag if needed)
        // Also keep upright? Arcade physics might need "upright" force.

        // Camera Logic
        // CRITICAL FIX: Use the VISUAL MESH position, not the rigid body physics position.
        // Physics position is updated at fixed tick rate (e.g. 60Hz) and can be jittery between frames.
        // The visual mesh is interpolated by Rapier/Drei and is smooth for rendering.

        const carPosVec = new THREE.Vector3();
        const carQuat = new THREE.Quaternion();

        if (visualMeshRef.current) {
            visualMeshRef.current.getWorldPosition(carPosVec);
            visualMeshRef.current.getWorldQuaternion(carQuat);
        } else {
            const t = rigidBodyRef.current.translation();
            carPosVec.set(t.x, t.y, t.z);
            const r = rigidBodyRef.current.rotation();
            carQuat.set(r.x, r.y, r.z, r.w);
            carQuat.set(r.x, r.y, r.z, r.w);
        }

        // --- LATERAL FRICTION (TIRE GRIP) ---
        // This prevents the "swimming" or "drifting on ice" feeling.
        // We calculate the velocity sideways relative to the car, and apply a force to cancel it.

        if (rigidBodyRef.current) {
            const vel = rigidBodyRef.current.linvel()
            const velVec = new THREE.Vector3(vel.x, vel.y, vel.z)

            // Local Right Vector (Relative X axis)
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat)

            // Lateral Velocity Magnitude
            const lateralVel = velVec.dot(right)

            // Apply counter-impulse
            // Factor 0.0 = No Grip (Ice)
            // Factor 1.0 = Perfect Rails
            const gripFactor = 0.85
            const mass = rigidBodyRef.current.mass()

            // Correction impulse to cancel lateral velocity
            // We apply a fraction (acting like drag).
            const correctionImpulse = right.clone().multiplyScalar(-lateralVel * gripFactor * mass * 0.1)

            rigidBodyRef.current.applyImpulse(correctionImpulse, true)
        }

        // SMART CAMERA LOGIC
        // 1. Determine "Active" state (Driving/Recently driven)
        // 2. Determine "Parking" state (Stopped + Delay passed)

        const now = state.clock.elapsedTime;
        const hasInput = keys.w || keys.s || keys.a || keys.d;

        if (hasInput) {
            lastActiveTime.current = now;
            // Update sticky mode based on key press
            if (keys.s) lastInputType.current = 'REVERSE';
            else lastInputType.current = 'ACTION'; // W, A, D all treated as Forward/Action context
        }

        const timeSinceActive = now - lastActiveTime.current;
        const rigidBodySpeed = rigidBodyRef.current.linvel().x ** 2 + rigidBodyRef.current.linvel().y ** 2 + rigidBodyRef.current.linvel().z ** 2;

        // "Driving Period" covers active input AND the 2s delay
        const inDrivingPeriod = hasInput || rigidBodySpeed > 0.1 || timeSinceActive < 2.0;

        // Determine specific camera flags
        let effectiveIsAction = keys.w || keys.a || keys.d; // Steering also triggers "Action" view
        let effectiveIsReverse = keys.s;

        // Override if S is pressed (Reverse takes precedence over steering for camera)
        if (effectiveIsReverse) effectiveIsAction = false;

        if (!hasInput && inDrivingPeriod) {
            // Apply sticky logic during delay
            if (lastInputType.current === 'ACTION') effectiveIsAction = true;
            if (lastInputType.current === 'REVERSE') effectiveIsReverse = true;
        }

        const { targetOffset, targetLookAt, targetFov } = useCameraRig(
            inDrivingPeriod, // isDriving main flag
            effectiveIsAction,
            effectiveIsReverse
        );

        // AUDIO UPDATE
        // Pass current speed (magnitude of velocity)
        const speed = Math.sqrt(rigidBodySpeed);
        audio.update(speed);

        // LOGIC BRANCH: DRIVING vs PARKING
        if (inDrivingPeriod) {
            // --- DRIVING MODE ---
            hasParked.current = false; // Reset parking state

            if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;

            // Calculate world positions
            const relativeOffset = targetOffset.clone().applyQuaternion(carQuat);
            const desiredCamPos = carPosVec.clone().add(relativeOffset);

            // 1.0 = Rigid
            const posLerpSpeed = 1.0;
            state.camera.position.lerp(desiredCamPos, posLerpSpeed);

            // LookAt smoothing
            const relativeLookAt = targetLookAt.clone().applyQuaternion(carQuat);
            const desiredLookAt = carPosVec.clone().add(relativeLookAt);

            if (!state.camera.userData.currentLookAt) {
                state.camera.userData.currentLookAt = desiredLookAt.clone();
            }

            const lookLerpSpeed = 1.0;
            const smoothedLookAt = state.camera.userData.currentLookAt as THREE.Vector3;
            smoothedLookAt.lerp(desiredLookAt, lookLerpSpeed);
            state.camera.lookAt(smoothedLookAt);

        } else {
            // --- PARKING MODE (IDLE) ---

            // Sync OrbitControls target to car while NOT parked
            // This prevents the "Jump to (0,0,0)" when we enable controls
            if (!hasParked.current && orbitControlsRef.current) {
                orbitControlsRef.current.target.copy(carPosVec);
            }

            // Check if we have arrived at the "Parking View" yet
            const relativeOffset = targetOffset.clone().applyQuaternion(carQuat);
            const desiredCamPos = carPosVec.clone().add(relativeOffset);
            const dist = state.camera.position.distanceTo(desiredCamPos);

            // If we haven't parked yet, lerp to the spot
            if (!hasParked.current) {
                if (dist > 0.5) {
                    // AUTO-ZOOM OUT
                    state.camera.position.lerp(desiredCamPos, 0.05); // Slow, smooth zoom
                    state.camera.lookAt(carPosVec);
                    if (orbitControlsRef.current) orbitControlsRef.current.enabled = false;
                } else {
                    // ARRIVED
                    hasParked.current = true;
                    if (orbitControlsRef.current) orbitControlsRef.current.enabled = true;
                }
            } else {
                // ALREADY PARKED - Full User Control
                // We STOP updating target here to allow proper Panning (Right Click)
                if (orbitControlsRef.current) {
                    orbitControlsRef.current.enabled = true;
                }
            }
        }

        // Update FOV
        if (state.camera instanceof THREE.PerspectiveCamera) {
            state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, 0.05); // FOV can catch up slowly
            state.camera.updateProjectionMatrix();
        }

        // Network Sync
        onPositionUpdate({
            position: carPosVec,
            rotation: quat,
            velocity: new THREE.Vector3().copy(rigidBodyRef.current.linvel())
        })
    })

    return (
        <RigidBody
            ref={rigidBodyRef}
            position={initialPosition}
            colliders={false} // Use custom collider
            linearDamping={1.0}
            angularDamping={8}
        >
            <CuboidCollider args={[1, 0.5, 2.2]} position={[0, 0.5, 0]} />
            {/* CarModel expects y=0 to be bottom of wheels. box collider center is at 0.5 */}
            {/* Rotate model 180 to align +Z (Physics Forward) with Visual Forward */}
            <group ref={visualMeshRef} rotation={[0, Math.PI, 0]}>
                <Suspense fallback={null}>
                    <CarModel wrapTexture={wrapTexture} solidColor={solidColor} />
                </Suspense>
            </group>

            {/* Orbit Controls for Idle Mode - enabled controlled in useFrame */}
            <OrbitControls
                ref={orbitControlsRef}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                maxDistance={50}
                minDistance={5}
                maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going below horizon
            />
        </RigidBody>
    )
}

