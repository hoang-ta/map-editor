import React, { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import {
  ViewMode,
  EditableGeoJsonLayer,
} from '@deck.gl-community/editable-layers';
import { Toolbox } from './toolbox/toolbox';
import StaticMap from 'react-map-gl/maplibre';
import { data } from './data';
import { PointCloudLayer } from '@deck.gl/layers';
import {
  LASLoader,
  LASWorkerLoader,
} from '@loaders.gl/las';
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import { parse } from '@loaders.gl/core';

// Add these new imports
import { Button } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

const initialViewState = {
  longitude: 139.7654711623127,
  latitude: 35.830900143089295,
  zoom: 17.8,
  // zoom: 5.5,
};

// Data source: kaarta.com
const LAZ_SAMPLE = 'http://127.0.0.1:5500/indoor.0.1.laz';
// 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/point-cloud-laz/indoor.0.1.laz';

type LASMesh = (typeof LASWorkerLoader)['dataType'];

export function Example() {
  const [geoJson, setGeoJson] = useState(data);
  const [pcd, setPcd] = useState(null);
  const [
    selectedFeatureIndexes,
    setSelectedFeatureIndexes,
  ] = useState([0]);
  const [mode, setMode] = useState(() => ViewMode);
  const [modeConfig, setModeConfig] = useState({});

  // Add these new state variables
  const [history, setHistory] = useState([data]);
  const [historyIndex, setHistoryIndex] = useState(0);
  // console.log('history', history);
  // console.log('historyIndex', historyIndex);

  const layer = new EditableGeoJsonLayer({
    data: geoJson,
    mode,
    modeConfig,
    selectedFeatureIndexes,
    onEdit: ({ updatedData, editType }) => {
      console.log('updatedData', updatedData, editType);
      setGeoJson(updatedData);

      // Only update history when the edit is finished
      if (editType === 'addFeature') {
        const newHistory = history.slice(
          0,
          historyIndex + 1
        );
        newHistory.push(updatedData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    },
  });

  const layers = [
    pcd &&
      new PointCloudLayer<LASMesh>({
        id: 'sample-pcd',
        data: pcd,
        pointSize: 2,
        coordinateOrigin: [
          139.7654711623127, 35.830900143089295, 0,
        ],
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      }),
  ];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const data = await parse(file, LASLoader);
      // console.log('Loaded data:', data);
      setPcd(data);
    }
  };

  const fetchData = async () => {
    const response = await fetch(LAZ_SAMPLE);
    const data = await parse(fetch(LAZ_SAMPLE), LASLoader);
    setPcd(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // console.log('pcd layer', layers[0]);

  // Add these new functions
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setGeoJson(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setGeoJson(history[historyIndex + 1]);
    }
  };

  return (
    <>
      <DeckGL
        initialViewState={initialViewState}
        controller={{
          doubleClickZoom: false,
          dragRotate: false,
          touchRotate: false,
        }}
        layers={[layer, ...layers]}
        getCursor={layer.getCursor.bind(layer)}
        onClick={(info) => {
          // console.log(info);
          if (mode === ViewMode)
            if (info) {
              setSelectedFeatureIndexes([info.index]);
            } else {
              setSelectedFeatureIndexes([]);
            }
        }}
        onViewStateChange={(info) => {
          // console.log(info);
        }}
      >
        <StaticMap
          mapStyle={
            'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
          }
        />
      </DeckGL>

      {/* Add undo/redo buttons */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
        }}
      >
        <Button
          onClick={handleUndo}
          disabled={historyIndex === 0}
        >
          <UndoIcon />
        </Button>
        <Button
          onClick={handleRedo}
          disabled={historyIndex === history.length - 1}
        >
          <RedoIcon />
        </Button>
      </div>

      <Toolbox
        left={true}
        geoJson={geoJson}
        mode={mode}
        modeConfig={modeConfig}
        onSetMode={setMode}
        onSetModeConfig={setModeConfig}
        onImport={(imported) =>
          setGeoJson({
            ...geoJson,
            features: [
              ...geoJson.features,
              ...imported.features,
            ],
          })
        }
        onSetGeoJson={setGeoJson}
      />

      <input
        type='file'
        accept='.laz,.las'
        onChange={handleFileUpload}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
        }}
      />
    </>
  );
}
