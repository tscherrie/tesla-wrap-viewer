import { useRef, useEffect, useCallback } from 'react'

export function useVehicleAudio() {
    const audioContextRef = useRef<AudioContext | null>(null)
    const motorOscillatorRef = useRef<OscillatorNode | null>(null)
    const motorGainRef = useRef<GainNode | null>(null)
    const roadSourceRef = useRef<AudioBufferSourceNode | null>(null)
    const roadGainRef = useRef<GainNode | null>(null)
    const isInitialized = useRef(false)

    const initAudio = useCallback(() => {
        if (isInitialized.current) return

        // Initialize Audio Context
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioContext()
        audioContextRef.current = ctx

        // --- MOTOR LAYER (Sine Wave) ---
        const oscillator = ctx.createOscillator()
        const motorGain = ctx.createGain()

        oscillator.type = 'sine'
        oscillator.frequency.value = 100 // Idle
        motorGain.gain.value = 0

        oscillator.connect(motorGain)
        motorGain.connect(ctx.destination)
        oscillator.start()

        motorOscillatorRef.current = oscillator
        motorGainRef.current = motorGain

        // --- ROAD LAYER (White Noise) ---
        const bufferSize = 2 * ctx.sampleRate
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1
        }

        const roadSource = ctx.createBufferSource()
        roadSource.buffer = noiseBuffer
        roadSource.loop = true

        const roadGain = ctx.createGain()
        roadGain.gain.value = 0

        // Lowpass filter to make it sound like road rumble, not static
        const roadFilter = ctx.createBiquadFilter()
        roadFilter.type = 'lowpass'
        roadFilter.frequency.value = 400

        roadSource.connect(roadFilter)
        roadFilter.connect(roadGain)
        roadGain.connect(ctx.destination)
        roadSource.start()

        roadSourceRef.current = roadSource
        roadGainRef.current = roadGain

        isInitialized.current = true
    }, [])

    const update = useCallback((speed: number) => {
        if (!audioContextRef.current) return

        // Resume context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume()
        }

        const now = audioContextRef.current.currentTime
        // Speed is typically 0-30...

        // --- MOTOR LOGIC ---
        // Pitch: 40Hz (deeper hum) -> slower rise
        const baseFreq = 40
        const pitch = baseFreq + (speed * 8)

        // Volume: Peaks at acceleration/mid-speed, tapers off slightly? 
        // Or just linear with a cap.
        // Let's make it audible but subtle.
        // Scale so we hit max volume (0.075) around speed 8
        const motorVolume = Math.min(speed / 8, 1.0) * 0.075

        if (motorOscillatorRef.current && motorGainRef.current) {
            motorOscillatorRef.current.frequency.setTargetAtTime(pitch, now, 0.1)
            motorGainRef.current.gain.setTargetAtTime(motorVolume, now, 0.1)
        }

        // --- ROAD LOGIC ---
        // Volume only. Starts kicking in at speed > 5
        const roadVolume = Math.max(0, Math.min((speed - 5) / 50, 0.4))

        if (roadGainRef.current) {
            roadGainRef.current.gain.setTargetAtTime(roadVolume, now, 0.1)
        }

    }, [])

    useEffect(() => {
        // Auto-init on first user interaction if possible, or just call update
        const handleInteraction = () => {
            if (!isInitialized.current) initAudio()
        }
        window.addEventListener('keydown', handleInteraction)
        window.addEventListener('click', handleInteraction)

        return () => {
            window.removeEventListener('keydown', handleInteraction)
            window.removeEventListener('click', handleInteraction)
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [initAudio])

    return { update }
}
