import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { 
  Printer, 
  Link as LinkIcon, 
  Check, 
  AlertCircle,
  FileImage,
  Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

export const QRCodePage: React.FC = () => {
  const { restaurant } = useAuth();
  const [qrPng, setQrPng] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const flyerRef = useRef<HTMLDivElement>(null);

  // Generate public URL
  const publicMenuUrl = `${window.location.origin}/menu/${restaurant?.id}`;

  const themeColor = restaurant?.themeColor || "#8b5cf6";

  useEffect(() => {
    if (!restaurant) return;

    const generateQR = async () => {
      try {
        const options = {
          color: {
            dark: themeColor,
            light: "#ffffff",
          },
          width: 320,
          margin: 2,
        };
        const dataUrl = await QRCode.toDataURL(publicMenuUrl, options);
        setQrPng(dataUrl);
      } catch (err) {
        console.error("QR generation failed", err);
        setErrorMsg("Failed to generate QR Code preview.");
      }
    };

    generateQR();
  }, [restaurant, themeColor, publicMenuUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicMenuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = async () => {
    if (!restaurant) return;
    try {
      const options = {
        color: {
          dark: themeColor,
          light: "#ffffff",
        },
        width: 1024, // High-res for print layouts
        margin: 1,
      };
      const url = await QRCode.toDataURL(publicMenuUrl, options);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${restaurant.name.toLowerCase().replace(/\s+/g, "_")}_qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadSvg = async () => {
    if (!restaurant) return;
    try {
      const options = {
        color: {
          dark: themeColor,
          light: "#ffffff",
        },
        width: 512,
        margin: 1,
      };
      // Generating raw SVG string
      QRCode.toString(publicMenuUrl, { ...options, type: "svg" }, (err, svgString) => {
        if (err) throw err;
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${restaurant.name.toLowerCase().replace(/\s+/g, "_")}_qr.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintFlyer = () => {
    const printContent = flyerRef.current?.innerHTML;
    if (!printContent) return;

    // Create a temporary iframe for clean printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Print Menu Flyer</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body { font-family: system-ui, sans-serif; -webkit-print-color-adjust: exact; }
              @page { size: A5; margin: 0; }
              .flyer-card { width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem; box-sizing: border-box; }
            </style>
          </head>
          <body onload="window.print(); window.parent.document.body.removeChild(window.frameElement);">
            <div class="flyer-card bg-white text-center">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      doc.close();
    }
  };

  return (
    <div className="space-y-8 text-left max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black font-heading text-slate-900 dark:text-white">
          QR Code Generator
        </h1>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
          Download vector graphics and print table tent flyers for diners.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-premium text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: QR Configuration and downloads */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-premium-lg shadow-soft space-y-6">
            
            {/* QR Image Display */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-premium-lg border border-slate-100 dark:border-slate-850">
              <div className="bg-white p-4.5 rounded-premium shadow-md border border-slate-100/60 max-w-[240px] w-full aspect-square flex items-center justify-center relative overflow-hidden">
                {qrPng ? (
                  <img src={qrPng} alt="Menu QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="animate-pulse w-full h-full bg-slate-100 rounded-premium" />
                )}
              </div>
            </div>

            {/* Menu Link Details */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                Public Menu Link
              </span>
              <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-premium p-1.5 items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate pl-2">
                  {publicMenuUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 px-3 rounded-premium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-500 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5 text-slate-450" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Downloads Block */}
            <div className="grid grid-cols-2 gap-3.5">
              <Button
                variant="outline"
                onClick={handleDownloadPng}
                className="w-full flex items-center justify-center gap-2"
              >
                <FileImage className="w-4 h-4 text-slate-400" />
                <span>PNG Image</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadSvg}
                className="w-full flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>SVG Vector</span>
              </Button>
            </div>

          </div>
        </div>

        {/* Right Side: Flyer Print Layout Template */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-bold font-heading text-slate-800 dark:text-slate-200">
              Printable Flyer Mockup
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrintFlyer}
              className="shadow-sm border border-slate-200 dark:border-slate-750"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Table Flyer (A5)
            </Button>
          </div>

          {/* Flyer Mockup Frame */}
          <div className="border border-slate-100 dark:border-slate-850 rounded-premium-lg overflow-hidden bg-slate-300 dark:bg-slate-950 p-12 flex justify-center shadow-inner">
            
            {/* The printable card container */}
            <div 
              ref={flyerRef}
              className="bg-white text-slate-900 rounded-[24px] shadow-soft-lg w-[320px] min-h-[460px] p-8 flex flex-col items-center justify-between text-center select-none border border-slate-100"
            >
              {/* Restaurant Branding */}
              <div className="space-y-4 w-full">
                {restaurant?.logo ? (
                  <img 
                    src={restaurant.logo} 
                    alt="Logo" 
                    className="w-12 h-12 object-cover rounded-full mx-auto border-2 border-slate-100 shadow"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center font-bold text-slate-400 mx-auto">
                    {restaurant?.name?.substring(0, 1) || "R"}
                  </div>
                )}
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight font-heading text-slate-800">
                    {restaurant?.name || "Delicious Bistro"}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Scan to explore our menu
                  </p>
                </div>
              </div>

              {/* Styled QR Code Box */}
              <div className="relative p-5.5 rounded-premium bg-slate-50 border border-slate-100/50 shadow-sm max-w-[200px] w-full aspect-square flex items-center justify-center my-6">
                {qrPng ? (
                  <img src={qrPng} alt="Menu QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-premium animate-pulse" />
                )}
              </div>

              {/* Footer Instructions */}
              <div className="space-y-3 w-full">
                <div className="h-0.5 w-12 bg-slate-100 mx-auto" />
                <p className="text-[10px] text-slate-450 font-bold max-w-[190px] mx-auto leading-relaxed">
                  Open your camera, point at the code, and click the link!
                </p>
                <div 
                  className="text-[9px] font-extrabold uppercase tracking-widest text-white py-1 px-4 rounded-full mx-auto inline-block shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  Powered by MenuFlow
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
export default QRCodePage;
