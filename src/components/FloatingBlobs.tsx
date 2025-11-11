import { cn } from "@/lib/utils";

const FloatingBlobs = ({ className }: { className?: string }) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Blob 1: Top Left (Primary Glow) */}
      <div
        className="absolute top-[10%] left-[5%] w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob-1"
        style={{ animationDelay: '0s' }}
      />
      {/* Blob 2: Center Right (Accent Glow) */}
      <div
        className="absolute top-[40%] right-[10%] w-80 h-80 bg-accent/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob-2"
        style={{ animationDelay: '4s' }}
      />
      {/* Blob 3: Bottom Center (Secondary Glow) */}
      <div
        className="absolute bottom-[5%] left-[30%] w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob-3"
        style={{ animationDelay: '8s' }}
      />
    </div>
  );
};

export default FloatingBlobs;