import { Button } from "@/components/ui/button";
import { useQRScanner } from "@/qr-code/useQRScanner";
import { ArrowLeft, Camera, FlipHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Props {
  onScan: (phone: string) => void;
  onBack: () => void;
}

export default function QRScanner({ onScan, onBack }: Props) {
  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 200,
    maxResults: 1,
  });

  const handledRef = useRef(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: start on mount only
  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  // Detect permission denied error and keep retrying
  useEffect(() => {
    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (
        msg.includes("permission") ||
        msg.includes("denied") ||
        msg.includes("notallowed") ||
        msg.includes("not allowed")
      ) {
        setPermissionDenied(true);
      }
    } else {
      setPermissionDenied(false);
    }
  }, [error]);

  const handleRequestPermission = async () => {
    setRetrying(true);
    setPermissionDenied(false);
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      // permission still denied
    }
    await startScanning();
    setRetrying(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: handle scan once
  useEffect(() => {
    if (qrResults.length > 0 && !handledRef.current) {
      handledRef.current = true;
      const data = qrResults[0].data;
      stopScanning();
      onScan(data);
    }
  }, [qrResults]);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const isPermissionError =
    permissionDenied ||
    (!!error &&
      (() => {
        const msg = error.message?.toLowerCase() || "";
        return (
          msg.includes("permission") ||
          msg.includes("denied") ||
          msg.includes("notallowed") ||
          msg.includes("not allowed")
        );
      })());

  return (
    <div className="vpay-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-display font-bold">Scan QR Code</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {isSupported === false ? (
          <div className="text-center" data-ocid="scanner.error_state">
            <p className="text-destructive mb-4">
              Camera not supported on this device.
            </p>
            <Button type="button" onClick={onBack}>
              Go Back
            </Button>
          </div>
        ) : isPermissionError ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center"
            data-ocid="scanner.error_state"
          >
            <div className="flex flex-col items-center gap-5 p-6 rounded-2xl border border-border bg-muted/40">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Camera size={32} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Camera Permission Required
                </h3>
                <p className="text-muted-foreground text-sm">
                  V-PAY needs camera access to scan QR codes. Please allow
                  camera permission when prompted.
                </p>
              </div>
              <Button
                type="button"
                className="w-full vpay-btn-primary"
                onClick={handleRequestPermission}
                disabled={retrying}
                data-ocid="scanner.primary_button"
              >
                {retrying ? "Requesting..." : "Allow Camera Access"}
              </Button>
              <p className="text-xs text-muted-foreground">
                If the browser does not prompt, open your browser settings and
                enable camera permission for this site.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                  {isScanning && (
                    <motion.div
                      className="absolute left-2 right-2 h-0.5 bg-primary"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    />
                  )}
                </div>
              </div>

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {error && !isPermissionError && (
              <div
                className="mt-3 text-center text-destructive text-sm"
                data-ocid="scanner.error_state"
              >
                {error.message}
              </div>
            )}

            <p className="text-center text-muted-foreground text-sm mt-4">
              {isScanning ? "Scanning for QR code..." : "Camera ready"}
            </p>

            <div className="flex gap-3 mt-4">
              {!isActive && canStartScanning && (
                <Button
                  type="button"
                  className="flex-1 vpay-btn-primary"
                  onClick={startScanning}
                >
                  Start Camera
                </Button>
              )}
              {isActive && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={stopScanning}
                >
                  Stop
                </Button>
              )}
              {isMobile && isActive && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="border-border"
                  onClick={switchCamera}
                >
                  <FlipHorizontal size={18} />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
