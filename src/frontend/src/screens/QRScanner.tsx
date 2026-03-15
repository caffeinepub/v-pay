import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onScan: (phone: string) => void;
  onBack: () => void;
}

export default function QRScanner({ onScan, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const scannedRef = useRef(false);

  const [status, setStatus] = useState<
    "loading" | "active" | "denied" | "error"
  >("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [jsqrReady, setJsqrReady] = useState(!!(window as any).jsQR);

  // Load jsQR from CDN
  useEffect(() => {
    if ((window as any).jsQR) {
      setJsqrReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    s.onload = () => {
      if (mountedRef.current) setJsqrReady(true);
    };
    s.onerror = () => {
      if (mountedRef.current) {
        setStatus("error");
        setErrorMsg("Scanner library load failed");
      }
    };
    document.head.appendChild(s);
  }, []);

  const stopStream = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus("loading");
    scannedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        for (const t of stream.getTracks()) t.stop();
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        setTimeout(() => resolve(), 3000);
      });

      try {
        await video.play();
      } catch (_) {
        /* autoplay may be blocked */
      }
      if (!mountedRef.current) return;
      setStatus("active");
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const e = err as { name?: string; message?: string };
      if (
        e?.name === "NotAllowedError" ||
        e?.name === "PermissionDeniedError"
      ) {
        setStatus("denied");
      } else {
        setStatus("error");
        setErrorMsg(e?.message || "Camera could not be started");
      }
    }
  }, []);

  // Scan loop
  useEffect(() => {
    if (status !== "active" || !jsqrReady) return;

    const jsQR = (window as any).jsQR as
      | ((
          data: Uint8ClampedArray,
          width: number,
          height: number,
        ) => { data: string } | null)
      | undefined;
    if (!jsQR) return;

    const scan = () => {
      if (!mountedRef.current || scannedRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imgData.data, imgData.width, imgData.height);
      if (result?.data) {
        scannedRef.current = true;
        stopStream();
        onScan(result.data);
        return;
      }
      rafRef.current = requestAnimationFrame(scan);
    };

    rafRef.current = requestAnimationFrame(scan);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, jsqrReady, stopStream, onScan]);

  // Start camera when jsQR is ready
  useEffect(() => {
    if (jsqrReady) startCamera();
  }, [jsqrReady, startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopStream();
    };
  }, [stopStream]);

  const handleBack = () => {
    stopStream();
    onBack();
  };

  return (
    <div className="vpay-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground"
          data-ocid="scanner.secondary_button"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-display font-bold">Scan & Pay</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div
            className="relative rounded-2xl overflow-hidden bg-black"
            style={{ aspectRatio: "4/3" }}
          >
            {/* Video always in DOM */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: status === "active" ? "block" : "none" }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Loading */}
            {status === "loading" && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-3"
                data-ocid="scanner.loading_state"
              >
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-white/70">Starting camera...</p>
              </div>
            )}

            {/* Scan frame overlay */}
            {status === "active" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 border-2 border-white/80 rounded-xl" />
              </div>
            )}

            {/* Permission denied */}
            {status === "denied" && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 gap-4 text-center"
                data-ocid="scanner.error_state"
              >
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Camera size={28} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base mb-1">
                    Camera Permission Required
                  </h3>
                  <p className="text-xs text-white/60">
                    Browser settings se camera permission allow karein, phir
                    retry karein.
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full vpay-btn-primary"
                  onClick={startCamera}
                  data-ocid="scanner.primary_button"
                >
                  <RefreshCw size={16} className="mr-2" /> Allow & Retry
                </Button>
              </div>
            )}

            {/* Generic error */}
            {status === "error" && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 gap-4 text-center"
                data-ocid="scanner.error_state"
              >
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Camera size={28} className="text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base mb-1">
                    Camera Error
                  </h3>
                  <p className="text-xs text-white/60">
                    {errorMsg || "Camera start nahi ho paaya"}
                  </p>
                </div>
                <Button
                  type="button"
                  className="w-full vpay-btn-primary"
                  onClick={startCamera}
                  data-ocid="scanner.primary_button"
                >
                  <RefreshCw size={16} className="mr-2" /> Try Again
                </Button>
              </div>
            )}
          </div>

          <p className="text-center text-muted-foreground text-sm mt-4">
            {status === "active"
              ? "QR code ke saamne camera rakho"
              : status === "loading"
                ? "Camera shuru ho raha hai..."
                : "Camera error"}
          </p>
        </div>
      </div>
    </div>
  );
}
