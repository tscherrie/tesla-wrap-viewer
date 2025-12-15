import { Vector3, Quaternion } from 'three'
import { useState, useRef, useEffect } from 'react'

export type CameraMode = 'IDLE' | 'DRIVING' | 'ACTION' | 'REVERSE'

interface CameraConfig {
    offset: Vector3
    lookAtOffset: Vector3
    fov: number
}

const CONFIGS: Record<CameraMode, CameraConfig> = {
    // High bird's eye view
    // High bird's eye view
    IDLE: {
        offset: new Vector3(0, 12, -12), // -Z is Behind (High Angle)
        lookAtOffset: new Vector3(0, 0, 0),
        fov: 50
    },
    // Low pursuit camera
    DRIVING: {
        offset: new Vector3(0, 3, -10), // -Z is Behind (Chase Cam)
        lookAtOffset: new Vector3(0, 0, 20), // +Z is Forward
        fov: 60
    },
    // First person / Action view (Interior/Hood)
    ACTION: {
        offset: new Vector3(0, 1.1, -0.2), // Interior
        lookAtOffset: new Vector3(0, 1, 20), // +Z is Forward (due to 180 rotation)
        fov: 75
    },
    // Reverse view (Looking back from INSIDE the car, BACKSEAT)
    REVERSE: {
        offset: new Vector3(0, 1.2, 1.5), // Backseat position to avoid front seat obstruction
        lookAtOffset: new Vector3(0, 1.0, -15), // -Z is Backward (due to 180 rotation)
        fov: 100 // Wide for better rear visibility
    }
}

export function useCameraRig(
    carPosition: Vector3,
    carRotation: Quaternion,
    isDriving: boolean,
    isAction: boolean,
    isReverse: boolean
) {
    const mode: CameraMode = isReverse ? 'REVERSE' : (isAction ? 'ACTION' : (isDriving ? 'DRIVING' : 'IDLE'))
    const config = CONFIGS[mode]

    return {
        targetOffset: config.offset,
        targetLookAt: config.lookAtOffset,
        targetFov: config.fov
    }
}
