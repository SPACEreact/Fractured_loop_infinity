export type BuildType = {
  id: string;
  name: string;
  description: string;
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  builds?: BuildType[];
};

export type TagGroup = string[];

export type AssetTemplate = {
  type: 'character' | 'plot_point' | 'shot_card' | 'master_style' | 'scene' | 'variant_shot' | 'camera_settings' | 'depth_of_field' | 'lighting_setup' | 'color_grading' | 'audio_design' | 'vfx_compositing' | 'video_output' | 'image_output' | 'storyboard_output';
  name: string;
  description: string;
  defaultContent?: string;
  tags?: string[];
  category: 'primary' | 'secondary' | 'tertiary';
};

export const BUILDS: BuildType[] = [
  {
    id: 'basic',
    name: 'Basic Build',
    description: 'A basic build configuration',
  },
  {
    id: 'advanced',
    name: 'Advanced Build',
    description: 'An advanced build configuration',
  },
];

export const WORKFLOWS: Workflow[] = [
  {
    id: 'default',
    name: 'Default Workflow',
    description: 'The default workflow for the application',
    builds: BUILDS,
  },
];

export const TAG_GROUPS: Record<string, TagGroup> = {
  colors: ['red', 'blue', 'green'],
  shapes: ['circle', 'square', 'triangle'],
};

export const ASSET_TEMPLATES: Record<string, AssetTemplate> = {
  character: {
    type: 'character',
    name: 'Character Profile',
    description: 'Create a detailed character profile with traits, backstory, and appearance',
    defaultContent: 'Name: \nAge: \nAppearance: \nPersonality: \nBackground: \nGoals: ',
    tags: ['character'],
    category: 'secondary'
  },
  plot_point: {
    type: 'plot_point',
    name: 'Plot Point',
    description: 'Define a key event or turning point in your story',
    defaultContent: 'Event: \nImpact: \nTiming: \nCharacters involved: ',
    tags: ['plot'],
    category: 'secondary'
  },
  shot_card: {
    type: 'shot_card',
    name: 'Shot Card',
    description: 'Describe a specific camera shot with composition and mood',
    defaultContent: 'Shot type: \nSubject: \nAngle: \nLighting: \nMood: ',
    tags: ['shot', 'visual'],
    category: 'secondary'
  },
  master_style: {
    type: 'master_style',
    name: 'Master Style',
    description: 'Define the overall visual and narrative style for your project',
    defaultContent: 'Visual style: \nTone: \nColor palette: \nNarrative approach: ',
    tags: ['style', 'master'],
    category: 'secondary'
  },
  scene: {
    type: 'scene',
    name: 'Scene',
    description: 'Outline a complete scene with setting, action, and dialogue',
    defaultContent: 'Setting: \nCharacters: \nAction: \nDialogue: \nPurpose: ',
    tags: ['scene'],
    category: 'secondary'
  },
  variant_shot: {
    type: 'variant_shot',
    name: 'Variant Shot',
    description: 'Create variations of a shot with different parameters',
    defaultContent: 'Base shot: \nVariation: \nChanges: ',
    tags: ['shot', 'variant'],
    category: 'secondary'
  },
  // Technical Film Production Nodes
  camera_settings: {
    type: 'camera_settings',
    name: 'Camera Settings',
    description: 'Configure camera parameters like focal length, aperture, shutter speed',
    defaultContent: 'Focal Length: \nAperture: \nShutter Speed: \nISO: \nWhite Balance: ',
    tags: ['camera', 'technical'],
    category: 'tertiary'
  },
  depth_of_field: {
    type: 'depth_of_field',
    name: 'Depth of Field (DoF)',
    description: 'Control focus depth and bokeh effects',
    defaultContent: 'Focus Distance: \nAperture: \nFocal Length: \nSensor Size: \nBokeh Shape: ',
    tags: ['dof', 'focus', 'technical'],
    category: 'tertiary'
  },
  lighting_setup: {
    type: 'lighting_setup',
    name: 'Lighting Setup',
    description: 'Define lighting conditions and sources',
    defaultContent: 'Key Light: \nFill Light: \nBack Light: \nAmbient Light: \nColor Temperature: ',
    tags: ['lighting', 'technical'],
    category: 'tertiary'
  },
  color_grading: {
    type: 'color_grading',
    name: 'Color Grading',
    description: 'Set color correction and grading parameters',
    defaultContent: 'LUT: \nContrast: \nSaturation: \nBrightness: \nColor Balance: ',
    tags: ['color', 'grading', 'technical'],
    category: 'tertiary'
  },
  audio_design: {
    type: 'audio_design',
    name: 'Audio Design',
    description: 'Configure sound design and audio elements',
    defaultContent: 'Background Music: \nSound Effects: \nDialogue: \nMix Levels: \nReverb: ',
    tags: ['audio', 'sound', 'technical'],
    category: 'tertiary'
  },
  vfx_compositing: {
    type: 'vfx_compositing',
    name: 'VFX Compositing',
    description: 'Set up visual effects and compositing layers',
    defaultContent: 'Layers: \nBlending Modes: \nKeying: \nTracking: \nEffects: ',
    tags: ['vfx', 'compositing', 'technical'],
    category: 'tertiary'
  },
  // Output Nodes
  video_output: {
    type: 'video_output',
    name: 'Video Output',
    description: 'Generate final video output from connected assets',
    defaultContent: 'Resolution: \nFrame Rate: \nCodec: \nBitrate: \nFormat: ',
    tags: ['output', 'video', 'final'],
    category: 'primary'
  },
  image_output: {
    type: 'image_output',
    name: 'Image Output',
    description: 'Generate final image output from connected assets',
    defaultContent: 'Resolution: \nFormat: \nQuality: \nColor Space: \nMetadata: ',
    tags: ['output', 'image', 'final'],
    category: 'primary'
  },
  storyboard_output: {
    type: 'storyboard_output',
    name: 'Storyboard Output',
    description: 'Generate storyboard from scene and shot assets',
    defaultContent: 'Layout: \nStyle: \nAnnotations: \nFormat: \nPages: ',
    tags: ['output', 'storyboard', 'final'],
    category: 'primary'
  }
};

export const ALL_TAGS = Object.values(TAG_GROUPS).flat();

export const MASTER_PROMPT = `You are Fractured Loop Infinity, an advanced AI system for film production and creative storytelling. Your role is to generate high-quality, coherent content based on interconnected project assets and their relationships. Consider the harmony and tension between elements to create compelling narratives, visuals, and technical specifications. Always maintain creative integrity while respecting the user's artistic vision.`;

// Field options for smart UI components
export const FIELD_OPTIONS: Record<string, Record<string, string[]>> = {
  video_output: {
    resolution: ['720p', '1080p', '4K', '8K'],
    frame_rate: ['24fps', '25fps', '30fps', '60fps', '120fps'],
    codec: ['H.264', 'H.265', 'VP9', 'AV1', 'ProRes'],
    format: ['MP4', 'MOV', 'AVI', 'MKV', 'WebM'],
    bitrate: ['Low', 'Medium', 'High', 'Custom']
  },
  image_output: {
    resolution: ['720p', '1080p', '4K', '8K'],
    format: ['JPEG', 'PNG', 'TIFF', 'EXR', 'WebP'],
    quality: ['Low', 'Medium', 'High', 'Lossless'],
    color_space: ['sRGB', 'Adobe RGB', 'DCI-P3', 'Rec.709', 'Linear']
  },
  storyboard_output: {
    layout: ['Grid', 'Timeline', 'Freeform'],
    style: ['Simple', 'Detailed', 'Storyboard Pro', 'Custom'],
    annotations: ['None', 'Basic', 'Detailed', 'Technical'],
    format: ['PDF', 'PNG', 'JPG', 'SVG']
  },
  camera_settings: {
    focal_length: ['18mm', '24mm', '35mm', '50mm', '85mm', '100mm', '200mm'],
    aperture: ['f/1.4', 'f/2.0', 'f/2.8', 'f/4.0', 'f/5.6', 'f/8.0', 'f/11', 'f/16'],
    shutter_speed: ['1/8000', '1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/30'],
    iso: ['100', '200', '400', '800', '1600', '3200', '6400', '12800']
  },
  lighting_setup: {
    key_light: ['Soft', 'Hard', 'Rim', 'Back', 'Fill', 'Motivated'],
    color_temperature: ['2700K (Warm)', '3200K (Tungsten)', '4000K (Cool White)', '5000K (Daylight)', '6500K (Cool Daylight)'],
    intensity: ['Low', 'Medium', 'High', 'Very High']
  },
  color_grading: {
    lut: ['None', 'Film Look', 'Teal/Orange', 'Cool', 'Warm', 'Vintage', 'High Contrast', 'Custom'],
    contrast: ['Low', 'Medium', 'High', 'Very High'],
    saturation: ['Desaturated', 'Natural', 'Vibrant', 'Oversaturated']
  }
};

// Legacy NodeTemplate for backward compatibility
export type NodeTemplate = {
  type: string;
  nodeType: 'input' | 'output' | 'processing';
  name: string;
  description: string;
};

export const NODE_TEMPLATES: Record<string, NodeTemplate> = {
  color: {
    type: 'color',
    nodeType: 'input',
    name: 'Color Node',
    description: 'A node for selecting colors',
  },
  shape: {
    type: 'shape',
    nodeType: 'input',
    name: 'Shape Node',
    description: 'A node for selecting shapes',
  },
  output: {
    type: 'output',
    nodeType: 'output',
    name: 'Output Node',
    description: 'The final output node',
  },
};
