import React from 'react';
import {
  Button,
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';

export function AppBar({
  handleUndo,
  handleRedo,
  saveFeatureList,
  clearSavedFeatureLists,
  clearPCDData,
  fileInputRef,
  historyIndex,
  history,
  handleFileUpload,
}) {
  return (
    <MuiAppBar position='static'>
      <Toolbar
        sx={{
          flexDirection: 'column',
          alignItems: 'stretch',
          py: 1,
        }}
      >
        <Typography
          variant='h6'
          component='div'
          sx={{ mb: 1 }}
        >
          Shapes
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Button
            color='inherit'
            onClick={handleUndo}
            disabled={historyIndex === 0}
            size='small'
          >
            <UndoIcon fontSize='small' />
          </Button>
          <Button
            color='inherit'
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            size='small'
          >
            <RedoIcon fontSize='small' />
          </Button>
          <Button
            color='inherit'
            onClick={saveFeatureList}
            size='small'
          >
            <SaveIcon fontSize='small' />
          </Button>
          <Button
            color='inherit'
            onClick={clearSavedFeatureLists}
            size='small'
          >
            <ClearIcon fontSize='small' />
          </Button>
        </Box>
        <Box sx={{ width: '100%', mt: 1 }}>
          <input
            type='file'
            accept='.laz,.las'
            onChange={handleFileUpload}
            style={{ width: '100%' }}
            ref={fileInputRef}
          />
          <button onClick={clearPCDData}>
            Clear PCD Data
          </button>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
}
