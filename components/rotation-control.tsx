import React from 'react';
import { Typography, Box, Slider } from '@mui/material';

export function RotationControl({
  rotation,
  handleRotationChange,
}) {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: '10px',
        borderRadius: '5px',
      }}
    >
      <Typography gutterBottom>Rotate X</Typography>
      <Slider
        value={rotation.x}
        onChange={handleRotationChange('x')}
        min={0}
        max={360}
        valueLabelDisplay='auto'
      />
      <Typography gutterBottom>Rotate Y</Typography>
      <Slider
        value={rotation.y}
        onChange={handleRotationChange('y')}
        min={0}
        max={360}
        valueLabelDisplay='auto'
      />
      <Typography gutterBottom>Rotate Z</Typography>
      <Slider
        value={rotation.z}
        onChange={handleRotationChange('z')}
        min={0}
        max={360}
        valueLabelDisplay='auto'
      />
    </Box>
  );
}
