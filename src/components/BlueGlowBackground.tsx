'use client';

export default function BlueGlowBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">

      {/* Blue Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 
        h-[600px] w-[600px] 
        bg-blue-600 
        opacity-30 
        rounded-full 
        blur-[120px]"
      />

      {/* Purple Glow */}
      <div
        className="absolute bottom-0 right-0 
        h-[500px] w-[500px] 
        bg-purple-600 
        opacity-25 
        rounded-full 
        blur-[100px]"
      />

    </div>
  );
}
