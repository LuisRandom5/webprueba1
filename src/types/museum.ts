export interface Artwork {
  id: string;
  title: string;
  artist: string;
  year: string;
  period: string;
  medium: string;
  dimensions: string;
  locationInGallery: {
    wall: 'left' | 'right';
    z: number; // Position along the hallway corridor (z axis)
    x: number; // Wall offset
    y: number; // Eye level
    width: number;
    height: number;
    rotationY: number; // Facing direction
  };
  palette: string[];
  summary: string;
  curatorialNotes: string;
  historicalContext: string;
  audioGuideTranscript: string;
  frameColor: string;
  matWidth: number;
  // Waypoint for camera when inspecting this painting
  cameraTarget: {
    pos: [number, number, number];
    lookAt: [number, number, number];
  };
}

export type LightingPreset = 'balanced' | 'dramatic' | 'evening';
