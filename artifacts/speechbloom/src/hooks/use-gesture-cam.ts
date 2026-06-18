import { useRef, useState, useCallback, useEffect } from "react";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseGestureCamOptions {
  /** Called when a thumbs-up gesture is detected. Debounced — fires once per gesture. */
  onThumbsUp?: () => void;
  /** Cooldown in ms before the same gesture can fire again. Default: 2000ms */
  cooldownMs?: number;
}

interface GestureCamReturn {
  isActive: boolean;
  isLoading: boolean;
  gesture: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => Promise<void>;
  stop: () => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useGestureCam(options: UseGestureCamOptions = {}): GestureCamReturn {
  const { onThumbsUp, cooldownMs = 2000 } = options;

  const onThumbsUpRef = useRef(onThumbsUp);
  useEffect(() => { onThumbsUpRef.current = onThumbsUp; }, [onThumbsUp]);

  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gesture, setGesture] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastThumbsUpRef = useRef(0);
  const isActiveRef = useRef(false);

  // ─── Initialize MediaPipe GestureRecognizer ─────────────────────────────

  const initRecognizer = useCallback(async () => {
    if (recognizerRef.current) return recognizerRef.current;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    );

    const recognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });

    recognizerRef.current = recognizer;
    return recognizer;
  }, []);

  // ─── Detection loop ─────────────────────────────────────────────────────

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const recognizer = recognizerRef.current;

    if (!video || !recognizer || !isActiveRef.current) return;
    if (video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const result = recognizer.recognizeForVideo(video, performance.now());

      if (result.gestures.length > 0) {
        const topGesture = result.gestures[0][0];
        const name = topGesture.categoryName;
        const confidence = topGesture.score;

        setGesture(name);

        // Thumbs up with high confidence + cooldown
        if (
          name === "Thumb_Up" &&
          confidence > 0.7 &&
          Date.now() - lastThumbsUpRef.current > cooldownMs
        ) {
          lastThumbsUpRef.current = Date.now();
          onThumbsUpRef.current?.();
        }
      } else {
        setGesture(null);
      }
    } catch {
      // Frame processing error — skip
    }

    animFrameRef.current = requestAnimationFrame(detectLoop);
  }, [cooldownMs]);

  // ─── Start camera + detection ───────────────────────────────────────────

  const start = useCallback(async () => {
    if (isActiveRef.current) return;

    setIsLoading(true);
    try {
      // Get camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize recognizer
      await initRecognizer();

      isActiveRef.current = true;
      setIsActive(true);
      setIsLoading(false);

      // Start detection loop
      animFrameRef.current = requestAnimationFrame(detectLoop);
    } catch (e) {
      console.warn("[GestureCam] Could not start:", e);
      setIsLoading(false);
    }
  }, [initRecognizer, detectLoop]);

  // ─── Stop ───────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    setGesture(null);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ─── Cleanup on unmount ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (recognizerRef.current) recognizerRef.current.close();
    };
  }, []);

  return { isActive, isLoading, gesture, videoRef, start, stop };
}
